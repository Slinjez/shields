import React from 'react'
import PropTypes from 'prop-types'
import Meta from './meta'
import Header from './header'
import SuggestionAndSearch from './suggestion-and-search'
import MarkupModal from './markup-modal'
import Usage from './usage'
import Footer from './footer'
import { CategoryHeading, CategoryHeadings } from './category-headings'
import {
  categories,
  findCategory,
  services,
  getDefinitionsForCategory,
} from '../lib/service-definitions'
import BadgeExamples from './badge-examples'
import { baseUrl, longCache } from '../constants'
import ServiceDefinitionSetHelper from '../lib/service-definitions/service-definition-set-helper'
import groupBy from 'lodash.groupby'

export default class Main extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      isSearchInProgress: false,
      isQueryTooShort: false,
      searchResults: undefined,
      selectedExample: undefined,
    }

    this.searchTimeout = 0

    this.handleExampleSelected = this.handleExampleSelected.bind(this)
    this.dismissMarkupModal = this.dismissMarkupModal.bind(this)
    this.searchQueryChanged = this.searchQueryChanged.bind(this)
  }

  static propTypes = {
    match: PropTypes.object.isRequired,
  }

  get category() {
    return this.props.match.params.category
  }

  performSearch(query) {
    const isQueryTooShort = query.length === 1

    let searchResults
    if (query.length >= 2) {
      const flat = (searchResults = ServiceDefinitionSetHelper.create(services)
        .notDeprecated()
        .search(query)
        .asNative())
      searchResults = groupBy(flat, 'category')
    }

    this.setState({
      isSearchInProgress: false,
      isQueryTooShort,
      searchResults,
    })
  }

  searchQueryChanged(query) {
    /*
    Add a small delay before showing search results
    so that we wait until the user has stipped typing
    before we start loading stuff.

    This
    a) reduces the amount of badges we will load and
    b) stops the page from 'flashing' as the user types, like this:
    https://user-images.githubusercontent.com/7288322/42600206-9b278470-85b5-11e8-9f63-eb4a0c31cb4a.gif
    */
    this.setState({ isSearchInProgress: true })
    window.clearTimeout(this.searchTimeout)
    this.searchTimeout = window.setTimeout(() => this.performSearch(query), 500)
  }

  handleExampleSelected(example) {
    this.setState({ selectedExample: example })
  }

  dismissMarkupModal() {
    this.setState({ selectedExample: undefined })
  }

  renderCategory(category, definitions) {
    const { id } = category

    return (
      <div key={id}>
        <CategoryHeading category={category} />
        <BadgeExamples
          definitions={definitions}
          onClick={this.handleExampleSelected}
          baseUrl={baseUrl}
          longCache={longCache}
        />
      </div>
    )
  }

  renderMain() {
    const { category: categoryId } = this
    const { isSearchInProgress, isQueryTooShort, searchResults } = this.state

    const category = findCategory(categoryId)

    if (isSearchInProgress) {
      return <div>searching...</div>
    } else if (isQueryTooShort) {
      return <div>Search term must have 2 or more characters</div>
    } else if (searchResults) {
      return Object.entries(searchResults).map(([categoryId, definitions]) =>
        this.renderCategory(findCategory(categoryId), definitions)
      )
    } else if (category) {
      const definitions = ServiceDefinitionSetHelper.create(
        getDefinitionsForCategory(categoryId)
      )
        .notDeprecated()
        .asNative()
      return this.renderCategory(category, definitions)
    } else if (categoryId) {
      return (
        <div>
          Unknown category <b>{categoryId}</b>
        </div>
      )
    } else {
      return <CategoryHeadings categories={categories} />
    }
  }

  render() {
    const { selectedExample = {} } = this.state

    return (
      <div id="app">
        <Meta />
        <Header />
        <MarkupModal
          example={selectedExample.example}
          onRequestClose={this.dismissMarkupModal}
          baseUrl={baseUrl}
          key={selectedExample}
        />
        <section>
          <SuggestionAndSearch
            queryChanged={this.searchQueryChanged}
            onBadgeClick={this.handleExampleSelected}
            baseUrl={baseUrl}
            longCache={longCache}
          />
          <a className="donate" href="https://opencollective.com/shields">
            donate
          </a>
        </section>
        {this.renderMain()}
        <Usage baseUrl={baseUrl} longCache={longCache} />
        <Footer baseUrl={baseUrl} />
        <style jsx>{`
          .donate {
            text-decoration: none;
            color: rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    )
  }
}
