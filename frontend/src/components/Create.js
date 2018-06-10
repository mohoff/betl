import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'

class Create extends Component {
  constructor(props) {
    super(props)
    let numOptions = 2
    this.state = {
      question: '',
      numOptions: numOptions,
      maxOptions: Number(process.env.REACT_APP_MAX_OPTIONS),
      options: new Array(numOptions).fill(''),
      showAddOption: false,
    }
  }

  handleQuestionChange = (event) => {
    this.setState({ question: event.target.value})
  }

  handleOptionChange = (i, event) => {
    event.persist()
    event.preventDefault()
    this.setState(previousState => {
      console.log(previousState.options)
      let opts = previousState.options.slice()
      opts[i] = event.target.value
      console.log(opts)
      let showButton = this.getShowAddOption(opts)
      return {
        options: opts,
        showAddOption: showButton
      }
    })
  }

  handleAddOption = (event) => {
    this.setState(previousState => {
      let opts = previousState.options.slice()
      opts.push('')
      return {
        options: opts,
        numOptions: previousState.numOptions+1,
        showAddOption: false
      }
    })
  }

  isEmptyString = (str) => {
    return str === ''
  }

  getShowAddOption = (options) => {
    if (options.some(this.isEmptyString) ||
      (this.state.numOptions === this.state.maxOptions)) {
      return false
    }
    return true
  }

  handleSubmit(event) {
    console.log('submit button pressed')
    event.preventDefault();
    // this.props.web3.betl.create(...)
  }

  render() {
    let optionsArray = []
    for (let i=0; i<this.state.numOptions; i++) {
      //<label className="label">Option #{i+1}</label>
      optionsArray.push(
        
        <div key={String(i+1)} className="field">    
          <div className="field has-addons">
            <p className="control">
              <a className="button is-static is-large">
                {i+1}
              </a>
            </p>
            <p className="control is-expanded">
              <input className="input is-large" type="text" value={this.state.options[i]} onChange={(e) => this.handleOptionChange(i, e)} />
            </p>
          </div>
        </div>
      )
    }

    const getAddButton = () => {
      if (this.state.numOptions < this.state.maxOptions) {
        return (
            <button className="button" disabled={!this.state.showAddOption} onClick={this.handleAddOption} >
              Add option
            </button>
        )
      }
    }

    return (
      <div className="main">
        <p className="has-text-centered">
          Enter your bet data here
        </p>
        
        <div>
          
            <div className="field">
              <label className="label is-large">Question</label>
              <div className="control">
                <input className="input is-large" type="text" value={this.state.question} onChange={this.handleQuestionChange} />
              </div>
            </div>

            <div className="field">
              <label className="label is-large">Options</label>
              {optionsArray}
              {getAddButton()}
            </div>

            <br />
            <br />
            <div className="control has-text-centered">
              <button className="button is-primary">Create</button>
            </div>
          
        </div>
      </div>  
    );
  }
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Create {...this.props} context={context} />}
  </Web3Context.Consumer>
)