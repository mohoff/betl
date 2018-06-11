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
      showRemoveOption: false
    }
  }

  handleQuestionChange = (event) => {
    this.setState({ question: event.target.value})
  }

  handleOptionChange = (i, event) => {
    event.persist()
    event.preventDefault()
    this.setState(previousState => {
      let opts = previousState.options.slice()
      opts[i] = event.target.value
      return {
        options: opts,
        showAddOption: this.shouldShowAddOption(opts)
      }
    })
  }

  handleAddOption = (event) => {
    this.setState(prevState => {
      let opts = prevState.options.slice()
      opts.push('')
      return {
        options: opts,
        numOptions: prevState.numOptions+1,
        showAddOption: false,
        showRemoveOption: true,
      }
    })
  }

  handleRemoveOption = (event) => {
    this.setState(prevState => {
      let opts = prevState.options.slice(0, prevState.options.length-1)
      return {
        options: opts,
        numOptions: prevState.numOptions-1,
        showAddOption: opts.length < this.state.maxOptions,
        showRemoveOption: opts.length > 2,
      }
    })
  }

  isEmptyString = (str) => {
    return str === ''
  }

  shouldShowAddOption = (options) => {
    if (options.some(this.isEmptyString) ||
      (this.state.numOptions === this.state.maxOptions)) {
      return false
    }
    return true
  }

  handleSubmit(event) {
    console.log('submit button pressed')
    event.preventDefault()
    // this.props.web3.betl.create(...)
  }

  render() {
    let optionsArray = []
    for (let i=0; i<this.state.numOptions; i++) {
      let isFirstElement = (i === 0)
      let isSecondElement = (i === 1)
      let isLastElement = (i === this.state.numOptions-1)
      let isNotMaxElement = (i < this.state.maxOptions-1)
      let isNoOptionEmpty = !this.state.options.some(this.isEmptyString)
      
      optionsArray.push(
        <div key={String(i+1)} className="field">    
          <div className="field has-addons">
            <p className="control">
              <a className="button is-static is-large">
                {i+1}
              </a>
            </p>
            <p className="control is-expanded">
              <input
                className="input is-large"
                type="text"
                placeholder={isFirstElement ? 'Yes! Kappa' : isSecondElement? 'No.. FailFish' : ''}
                value={this.state.options[i]}
                autoFocus={isLastElement}
                onChange={(e) => this.handleOptionChange(i, e)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' &&
                    isLastElement && isNotMaxElement && isNoOptionEmpty) {
                    this.handleAddOption()
                  }
                }}
              />
            </p>
          </div>
        </div>
      )
    }

    const getAddButton = () => {
      return (
        <button className="button is-large" disabled={!this.state.showAddOption} onClick={this.handleAddOption} >
          Add one
        </button>
      )
    }

    const getRemoveButton = () => {
      return (
        <button className="button is-large is-expanded" disabled={!this.state.showRemoveOption} onClick={this.handleRemoveOption} >
          Remove one
        </button>
      )
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
                <input
                  className="input is-large"
                  type="text"
                  placeholder="Can I has first place? PogChamp"
                  value={this.state.question}
                  onChange={this.handleQuestionChange} />
              </div>
            </div>

            <div className="field">
              <label className="label is-large">Options</label>
              {optionsArray}
              {getAddButton()} {getRemoveButton()}
            </div>

            <br />
            <br />
            <div className="control has-text-centered">
              <button className="button is-large is-primary">Create</button>
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