import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'
import './Create.scss'

class Create extends Component {
  constructor(props) {
    super(props)
    let numOptions = 2
    this.state = {
      host: {
        name: '',
        address: props.context.account
      },
      registration: {
        input: '',
        dismissed: false,
      },
      question: '',
      numOptions: numOptions,
      maxOptions: Number(process.env.REACT_APP_MAX_OPTIONS),
      options: new Array(numOptions).fill(''),
      showAddOption: false,
      showRemoveOption: false,
      isRegisterLoading: false
    }
  }

  componentDidMount = async () => {
    this.getHostName()
  }

  getHostName = async () => {
    let hexName = await this.props.context.betl.instance.hostNames(this.props.context.account)
    name = this.props.context.web3.utils.hexToUtf8(hexName)
    this.setState(prevState => {
      let hostObj = prevState.host
      hostObj.name = name
      console.log(hostObj)
      return {
        host: hostObj,
        isRegisterLoading: false
      }
    })
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

  handleRegisterNameChange = (event) => {
     event.persist()
     event.preventDefault()
     let registrationObj = this.state.registration
     registrationObj.input = event.target.value
     this.setState({
        registration: registrationObj
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
        showRemoveOption: true
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

  handleRegister = (event) => {
    this.setState({
      isRegisterLoading: true
    })
    const options = {
      from: this.props.context.account,
      gas: 90000,
      gasPrice: 10e9
    }
    this.props.context.betl.instance.registerRecord(this.state.registration.input, options).then(r => {
      this.getHostName()
    }).catch(err => {
      this.getHostName()
    })
  }

  handleRegisterDismiss = (event) => {
    let registrationObj = this.state.registration
    registrationObj.dismissed = true
    this.setState({
      registration: registrationObj
    })
  }

  handleSubmit = (event) => {
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
        <button
          className="button is-large"
          disabled={!this.state.showAddOption}
          onClick={this.handleAddOption} >
            Add one
        </button>
      )
    }

    const getRemoveButton = () => {
      return (
        <button
          className="button is-large is-expanded"
          disabled={!this.state.showRemoveOption}
          onClick={this.handleRemoveOption} >
            Remove one
        </button>
      )
    }

    const getRegisterName = () => {
      if (this.state.host.name === '') {
        return (
          <div className={'message is-info ' + (this.state.registration.dismissed ? 'is-hidden' : '')}>
            <div className="message-header">
              Link your address to a username so your audience can find you easier!
              <button
                className="delete is-large"
                onClick={this.handleRegisterDismiss}>
              </button>
            </div>
            <div className="message-body field is-grouped is-fullwidth">  
              <p className="control is-expanded">
                <input
                  className="input is-large"
                  type="text"
                  placeholder="Your username"
                  value={this.state.registration.input}
                  onChange={this.handleRegisterNameChange} />
              </p>
              <p className="control">
                <button
                  className={'button is-large ' + (this.state.isRegisterLoading ? 'is-loading' : '')}
                  disabled={!this.state.registration.input}
                  onClick={this.handleRegister} >
                    Link
                </button>
              </p>
            </div>
          </div>
        )
      } else {
        return (
          <div className="title">Hi {this.state.host.name}!</div>
        )
      }
    }

    return (
      <div className="main">
        {getRegisterName()}
        <div>
          <div className="field">
            <label className="label is-large">Question</label>
            <div className="control">
              <input
                className="input is-large"
                type="text"
                placeholder="Winning this match?"
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
    {context => <Create {...props} context={context} />}
  </Web3Context.Consumer>
)