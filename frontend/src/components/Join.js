import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { Web3Context } from './generic/Web3Wrapper'
import './Join.scss'

class Join extends Component {
  constructor(props) {
    super(props)
    this.state = {
      search: '',
      result: { name: 'le me', address: '0x1234567890123456789012345678901234567890'},
      isLoading: false,
      searchClicked: false,
    }
  }

  handleSearchChange = (event) => {
    console.log('handleSearchChange')
    this.setState({
      search: event.target.value,
      searchClicked: false
    })
  }

  handleSearchSubmit = (event) => {
    if (this.state.search === '') {
      // display: Please enter a name or address
      return
    }

    this.setState({
      searchClicked: true,
      isLoading: true
    })
    // do etehreum call

  }

  render = () => {
    return (
      <div>
        <div>
          <div className="field">
            <label className="label is-large">Search for a host</label>
            <div className="control has-icons-left">
              <input
                className="input is-large"
                type="text"
                placeholder="Username or 0x123..."
                value={this.state.search}
                onChange={this.handleSearchChange} />
              <span className="icon is-left">
                <i className="fas fa-search fa-sm"></i>
              </span>
            </div>
          </div>

          {this.state.searchClicked &&
            <SearchResult
              input={this.state.search}
              result={this.state.result}
              isLoading={this.state.isLoading}
              isAddress={this.isAddress} // pass isAddress() as prop
            /> }

          <div className="control has-text-centered">
            <button
              className="button is-large is-primary"
              disabled={this.state.search === ''}
              onClick={this.handleSearchSubmit}>
                Search
            </button>
          </div>
        </div>
      </div>
    )
  }
}

const SearchResult = (props) => {
  if (props.isLoading && props.result !== null) {
    return (
      <Link to={'/' + props.result.name}>
        <SearchResultContent {...props} />
      </Link>
    )
  }
  return <SearchResultContent {...props} />
}

const SearchResultContent = (props) => {
  let content
  let isClickable = false
  if (!props.isLoading) {
    content = <i>Loading...</i>
  } else if (props.result === null) {
    content = <span className="has-text-danger">Couldn't find user with {props.isAddress(props.input) ? 'address' : 'name'} {props.input}</span>
  } else {
    content = <p><b>{props.result.name}</b><br/><span>{props.result.address}</span></p>
    isClickable = true
  }
  return (
    <div className={'is-fullwidth has-background-light has-text-centered search-result ' + (isClickable ? 'clickable' : '')}>
      {content}
    </div>
  )
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Join {...props} context={context} />}
  </Web3Context.Consumer>
)