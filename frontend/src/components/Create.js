import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'
import Utils from '../utils/utils.js'
import './Create.scss'

class Create extends Component {
  constructor(props) {
    super(props)
    let numOutcomes = 2
    this.state = {
      host: {
        name: '',
        address: props.account
      },
      registration: {
        input: '',
        dismissed: false,
      },
      question: '',
      numOutcomes: numOutcomes,
      maxOutcomes: Number(process.env.REACT_APP_MAX_OPTIONS),
      outcomes: new Array(numOutcomes).fill(''),
      isButtonAddOutcomeDisabled: true,
      isButtonRemoveOutcomeDisabled: true,
      isRegisterLoading: false,
      isLoadingDeleteInline: false,

      timeoutMin: Number(process.env.REACT_APP_DEFAULT_TIMEOUT_MIN),
      timeoutSec: Number(process.env.REACT_APP_DEFAULT_TIMEOUT_SEC),
      minBet: Number(process.env.REACT_APP_DEFAULT_MINBET),
      hostFee: Number(process.env.REACT_APP_DEFAULT_HOSTFEE)
    }
  }

  componentDidMount = async () => {
    this.getHostName()
  }

  getHostName = async () => {
    let hexName = await this.props.betl.hostNames(this.props.account)
    let name = this.props.web3.utils.hexToUtf8(hexName)
    this.setState(prevState => {
      let hostObj = prevState.host
      hostObj.name = name
      return {
        host: hostObj,
        isRegisterLoading: false
      }
    })
  }

  handleQuestionChange = (event) => {
    this.setState({ question: event.target.value})
  }

  handleOutcomeChange = (i, event) => {
    event.persist()
    event.preventDefault()
    this.setState(previousState => {
      let opts = previousState.outcomes.slice()
      opts[i] = event.target.value
      return {
        outcomes: opts,
        isButtonAddOutcomeDisabled: this.shouldDisableAddOutcome(opts)
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

  handleOutcomeAdd = (event) => {
    this.setState(prevState => {
      let opts = prevState.outcomes.slice()
      opts.push('')
      return {
        outcomes: opts,
        numOutcomes: prevState.numOutcomes+1,
        isButtonAddOutcomeDisabled: true,
        isButtonRemoveOutcomeDisabled: false
      }
    })
  }

  handleOutcomeRemove = (event) => {
    this.setState(prevState => {
      let opts = prevState.outcomes.slice(0, prevState.outcomes.length-1)
      return {
        outcomes: opts,
        numOutcomes: prevState.numOutcomes-1,
        isButtonAddOutcomeDisabled: opts.length == this.state.maxOutcomes,
        isButtonRemoveOutcomeDisabled: opts.length <= 2
      }
    })
  }

  handleMinChange = (event) => {
    this.setState({ timeoutMin: event.target.value })
  }
  handleSecChange = (event) => {
    this.setState({ timeoutSec: event.target.value })
  }
  handleBetChange = (event) => {
    this.setState({ minBet: event.target.value })
  }
  handleFeeChange = (event) => {
    this.setState({ hostFee: event.target.value })
  }

  shouldDisableAddOutcome = (outcomes) => {
    if (outcomes.some(Utils.isEmptyString) ||
      (this.state.numOutcomes === this.state.maxOutcomes)) {
      return true
    }
    return false
  }

  handleRegisterName = () => {
    this.setState({
      isRegisterLoading: true
    })
    const outcomes = {
      from: this.props.account,
      gas: 90000,
      gasPrice: 10e9
    }
    this.props.betl.registerRecord(this.state.registration.input, outcomes).then(r => {
      this.getHostName()
    }).catch(err => {
      this.getHostName()
    })
  }

  handleRegisterNameDismiss = () => {
    let registrationObj = this.state.registration
    registrationObj.dismissed = true
    this.setState({
      registration: registrationObj
    })
  }

  handleDeleteInline = () => {
    this.setState({ isLoadingDeleteInline: true })

    const outcomes = {
      from: this.props.account,
      gas: 90000,
      gasPrice: 10e9
    }

    this.props.betl.deleteRecord(outcomes).then(r => {
      this.setState(prevState => {
        let hostObj = prevState.host
        hostObj.name = ''
        let registrationObj = prevState.registration
        registrationObj.input = ''
        return {
          host: hostObj,
          registration: registrationObj
        }
      }, () => {
        console.log('Success: Name deleted')
      })
    }).catch(err => {
      console.error('Error: Couldn\'t delete name')
    }).finally(() => {
      this.setState({ isLoadingDeleteInline: false })
    })
  }

  handleCreate = (event) => {
    console.log('Create button pressed')
    event.preventDefault()
    // this.props.web3.betl.create(...)
  }

  render() {
    return (
      <div className="main">
        {this.state.host.name === ''
          ? <RegisterName
              isDismissed={this.state.registration.dismissed}
              isLoading={this.state.isRegisterLoading}
              inputValue={this.state.registration.input}
              handleDismiss={this.handleRegisterNameDismiss}
              handleChange={this.handleRegisterNameChange}
              handleLink={this.handleRegisterName} />
          : <WelcomeName
              isLoading={this.state.isLoadingDeleteInline}
              handleDelete={this.handleDeleteInline}>
              {this.state.host.name}
            </WelcomeName>
        }
      
        <div className="field">
          <label className="label is-large">Question</label>
          <div className="control">
            <Input
              placeholder="Winning this match?"
              value={this.state.question}
              onChange={this.handleQuestionChange}
              autoFocus="true"/>
          </div>
        </div>

        <div className="field">
          <label className="label is-large">Outcomes</label>
          <OutcomesCreate 
            numOutcomes={this.state.numOutcomes}
            maxOutcomes={this.state.maxOutcomes}
            outcomes={this.state.outcomes}
            shouldHaveFocus={this.state.question !== ''}
            handleChange={this.handleOutcomeChange}
            handleAdd={this.handleOutcomeAdd}
            handleRemove={this.handleOutcomeRemove} />
          <div className="level">
            <div className="level-left">
              <div className="level-item">
                <ButtonAddOutcome
                  isDisabled={this.state.isButtonAddOutcomeDisabled}
                  onClick={this.handleOutcomeAdd} />
              </div>
            </div>
            <div className="level-right">
              <div className="level-left">
                <ButtonRemoveOutcome
                  isDisabled={this.state.isButtonRemoveOutcomeDisabled}
                  onClick={this.handleOutcomeRemove}
                  className="is-expanded" />
              </div>
            </div>
          </div>
        </div>

        <div className="field">
          <label className="label is-large">Options</label>
          <Options
            handleMinChange={this.handleMinChange}
            handleSecChange={this.handleSecChange}
            handleBetChange={this.handleBetChange}
            handleFeeChange={this.handleFeeChange}
            valueMin={this.state.timeoutMin}
            valueSec={this.state.timeoutSec}
            valueBet={this.state.minBet}
            valueFee={this.state.hostFee} />
        </div>

        <br />
        <br />

        <div className="control has-text-centered">
          <ButtonPrimary
            isLoading={this.state.isCreateLoading}
            isDisabled={this.state.isCreateLoading} // TODO: && if outcomes pass sanity check
            onClick={this.handleCreate}>
            Create
          </ButtonPrimary>
        </div>
      </div>
    )
  }
}

const RegisterName = (props) => {
  if (props.isDismissed) {
    return null
  }

  return (
    <div className="message is-info">
      <div className="message-header">
        Link your address to a username so your audience can find you easier!
        <ButtonDelete
          onClick={props.handleDismiss}>
        </ButtonDelete>
      </div>
      <div className="message-body field is-grouped is-fullwidth">  
        <p className="control is-expanded">
          <Input
            placeholder="Your username"
            value={props.inputValue}
            onChange={props.handleChange} />
        </p>
        <p className="control">
          <Button
            isLoading={props.isLoading}
            isDisabled={props.isLoading || !props.inputValue}
            onClick={props.handleLink}>
            Link
          </Button>
        </p>
      </div>
    </div>
  )
}

const WelcomeName = (props) => {
  return (
    <div className="title">
      Hi {props.children}
      <DeleteInline {...props} />
    </div>
  )
}

const DeleteInline = ({ isLoading, handleDelete }) => {
  return (
    <a
      className={(isLoading ? 'dismiss-spinner' : 'delete')}
      onClick={handleDelete}
    ></a>
  )
}

const Input = ({ value, placeholder, onChange, ...other }) => {
  return (
    <input
      className="input is-large"
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      {...other}
    />
  )
}

const ButtonPrimary = (props) => {
  return <Button {...props} className="is-primary" />
}

const ButtonDismiss = (props) => {
  return <Button {...props} className="delete" />
}

const ButtonDelete = ({ onClick, ...other }) => {
  return (
    <button
      className="delete is-large"
      onClick={onClick} >
        {other.children}
    </button>
  )
}

const Button = ({ isLoading, isDisabled, onClick, className, ...other }) => {
  return (
    <button
      className={['button is-large', className].join(' ') + (isLoading ? ' is-loading' : '')}
      disabled={isDisabled}
      onClick={onClick} >
        {other.children}
    </button>
  )
}

const ButtonAddOutcome = (props) => {
  return (
    <Button {...props} >
      Add one
    </Button>
  )
}

const ButtonRemoveOutcome = (props) => {
  return (
    <Button {...props} >
      Remove one
    </Button>
  )
}

const OutcomesCreate = ({ numOutcomes, maxOutcomes, outcomes, shouldHaveFocus, handleChange, handleAdd, handleRemove }) => {
  let outcomesArray = []
  let isFocusKnown = false

  for (let i=0; i<numOutcomes; i++) {
    let isFirstElement = (i === 0)
    let isSecondElement = (i === 1)
    let isLastElement = (i === numOutcomes-1)
    let isNotMaxElement = (i < maxOutcomes-1)
    let isNoOutcomeEmpty = !outcomes.some(Utils.isEmptyString)
    let hasFocus = shouldHaveFocus && 
        (((outcomes[i] === '') || isLastElement) && !isFocusKnown) ? true : false
    isFocusKnown = hasFocus ? true : isFocusKnown
    
    outcomesArray.push(
      <div key={String(i+1)} className="field">    
        <div className="field has-addons">
          <p className="control">
            <a className="button is-static is-large">
              {i+1}
            </a>
          </p>
          <p className="control is-expanded">
            <Input
              placeholder={isFirstElement ? 'Yes! Kappa' : isSecondElement ? 'No.. FailFish' : ''}
              value={outcomes[i]}
              autoFocus={hasFocus}
              onChange={(e) => handleChange(i, e)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' &&
                  isLastElement && isNotMaxElement && isNoOutcomeEmpty) {
                  handleAdd()
                }
              }}
              // // Questionable UX
              // onKeyDown={(e) => {
              //   if (e.keyCode === 8 &&
              //     isLastElement && numOutcomes > 2 && outcomes[i] === '') {
              //     handleRemove() 
              //   }
              // }}
            />
          </p>
        </div>
      </div>
    )
  }

  return outcomesArray
}

const Options = (props) => {
  return (
    <div>
      <OptionTime
        label="Timeout"
        minMin="0"
        maxMin="1000"
        stepMin="1"
        placeholderMin="5"
        unitMin="min"
        onChangeMin={props.handleMinChange}
        valueMin={props.valueMin}
        minSec="0"
        maxSec="45"
        stepSec="15"
        placeholderSec="0"
        unitSec="s"
        onChangeSec={props.handleSecChange}
        valueSec={props.valueSec} />
      <OptionNumber
        label="Min Bet"
        min="0"
        max="1000"
        step="10"
        placeholder="0"
        unit="mEther"
        onChange={props.handleBetChange}
        value={props.valueBet} />
      <OptionNumber
        label="Your fee"
        min="0"
        max="100"
        step="1"
        placeholder="0"
        unit="%"
        onChange={props.handleFeeChange}
        value={props.valueFee} />
    </div>
  )
}

const OptionTime = ({ label, minMin, maxMin, stepMin, placeholderMin, unitMin, onChangeMin, valueMin, minSec, maxSec, stepSec, placeholderSec, unitSec, onChangeSec, valueSec }) => {
  return (
    <div className="field is-horizontal">
      <OptionLabel>{label}</OptionLabel>
      <div className="field-body">
        <OptionNumberInput
          min={minMin}
          max={maxMin}
          step={stepMin}
          placeholder={placeholderMin}
          unit={unitMin}
          onChange={onChangeMin}
          value={valueMin} />
        <OptionNumberInput
          min={minSec}
          max={maxSec}
          step={stepSec}
          placeholder={placeholderSec}
          unit={unitSec}
          onChange={onChangeSec}
          value={valueSec} />
      </div>
    </div>
  )
}

const OptionNumber = ({ label, min, max, step, placeholder, unit, onChange, value }) => {
  return (
    <div className="field is-horizontal">
      <OptionLabel>{label}</OptionLabel>
      <div className="field-body">
        <OptionNumberInput
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          unit={unit}
          onChange={onChange}
          value={value} />
      </div>
    </div>
  )
}

const OptionLabel = (props) => {
  return (
    <div className="field-label is-medium">
      <label className="label">{props.children}</label>
    </div>
  )
}

const OptionNumberInput = ({ min, max, step, placeholder, unit, onChange, value }) => {
  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <input
          className="input is-large"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={onChange} />
      </p>
      <p className="control">
        <a className="button is-large is-static">
          {unit}
        </a>
      </p>
    </div>
  )
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Create {...props} {...context} />}
  </Web3Context.Consumer>
)