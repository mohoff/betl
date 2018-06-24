import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { Web3Context } from './generic/Web3Wrapper'
import Utils from '../utils/utils.js'
import './Create.scss'
import {
  InputText,
  InputNumber,
  Heading,
  Button,
  ButtonPrimary,
  WelcomeHost
} from './generic/Base.js'

class Create extends Component {
  constructor(props) {
    super(props)
    let numOutcomes = 2

    this.state = {
      question: '',
      numOutcomes: numOutcomes,
      maxOutcomes: Number(process.env.REACT_APP_MAX_OPTIONS),
      outcomes: new Array(numOutcomes).fill(''),
      isButtonAddOutcomeDisabled: true,
      isButtonRemoveOutcomeDisabled: true,

      isCreateLoading: false,
      nextRoundId: '',
      createdRoundId: '',

      timeoutMin: Number(process.env.REACT_APP_DEFAULT_TIMEOUT_MIN),
      timeoutSec: Number(process.env.REACT_APP_DEFAULT_TIMEOUT_SEC),
      minBet: Number(process.env.REACT_APP_DEFAULT_MINBET),
      hostFee: Number(process.env.REACT_APP_DEFAULT_HOSTFEE)
    }
  }

  componentDidMount = async () => {
    //this.getHostName()
    this.props.betl.getNextRoundId(this.props.userAddress).then(r => {
      this.setState({ nextRoundId: r.substring(2)})
    }).catch(err => {
      console.error('Couldn\'nt fetch nextRoundId')
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
        isButtonAddOutcomeDisabled: opts.length === this.state.maxOutcomes,
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

  handleCreate = async (event) => {
    console.log('Create button pressed')
    this.setState({ isCreateLoading: true })
    // TODO: input validation, make sure we have seconds below
    const timeoutAt = (new Date() / 1000 | 0) + this.state.timeoutMin*60 + this.state.timeoutSec
    this.props.betl.createRound(
      this.state.question,   // TODO: toHex                   // question
      this.state.outcomes,   // TODO: toHex                   // outcomes
      [0, timeoutAt, this.state.minBet, this.state.hostFee],  // configData
      [100],                                                  // payout tiers
      this.props.getOptions()
    ).then(async (r) => {
      console.log('Success: createRound')
      const roundInfo = await this.props.betl.getRoundInfo(this.props.userAddress, this.state.nextRoundId)
      //console.log('roundInfo: ' + roundInfo[1])
      if (roundInfo[1] !== 0) {
        this.setState({ createdRoundId: this.state.nextRoundId })
      } else {
        console.error('Something went wrong while creating the round. Expected non-zero roundId but got: ' + roundInfo[1])
      }
    }).catch(err => {
      console.log('Error')
      console.error(err)
    }).finally(() => {
      this.setState({ isCreateLoading: false })
    })
  }

  render() {
    if (this.state.createdRoundId !== '') {
      return (
        <div>
          <WelcomeHost>
            {this.props.userName}
          </WelcomeHost>

          <RoundCreated
            hostId={(this.props.userName !== '' ? this.props.userName : this.props.userAddress)}
            roundId={this.state.createdRoundId} />
        </div>
      )
    }

    return (
      <div>
        <WelcomeHost>
          {this.props.userName}
        </WelcomeHost>
        
        <div className="field">
          <Heading>Question</Heading>
          <div className="control">
            <InputText
              placeholder="Winning this match?"
              value={this.state.question}
              onChange={this.handleQuestionChange}
              autoFocus="true"/>
          </div>
        </div>

        <div className="field">
          <Heading>Outcomes</Heading>
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
          <Heading>Options</Heading>
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

        <ButtonPrimary
          isLoading={this.state.isCreateLoading}
          isDisabled={this.state.isCreateLoading} // TODO: && if outcomes pass sanity check
          onClick={this.handleCreate}>
          Create
        </ButtonPrimary>
      </div>
    )
  }
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
            <InputText
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
        <InputNumber
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
        />
      </p>
      <p className="control">
        <a className="button is-large is-static">
          {unit}
        </a>
      </p>
    </div>
  )
}

class RoundCreated extends Component {
  constructor(props) {
    super(props)
    this.roundPath = '/' + props.hostId + '/' + props.roundId
    this.roundURL = process.env.REACT_APP_DOMAIN + this.roundPath
  }

  copyToClipboard = () => {
    const tmp = document.createElement('textarea')
    tmp.value = this.roundURL
    document.body.appendChild(tmp)
    tmp.select()
    document.execCommand('copy')
    document.body.removeChild(tmp)
  }

  render = () => {
    return (
      <div className="message is-primary">
        <div className="message-header">
          Success!
        </div>
        <div className="message-body field is-grouped is-fullwidth">  
          <div className="control is-expanded">
            Invite your community with this link:<br />
            <br />

            <div className="has-text-centered is-large">
              <Link to={this.roundPath}>
                <span className="monotype">
                  betl.github.io/
                    <span className="has-text-grey">...</span>/
                    <b>{this.props.roundId}</b>
                </span>
              </Link>
            </div>

            <div className="has-text-centered copy-button">
              <a className="button is-large is-primary is-outlined"
                  onClick={this.copyToClipboard}>
                <span className="icon">
                  <i className="fas fa-copy"></i>
                </span>
              </a>
            </div>

          </div>
        </div>
      </div>
    )
  }
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Create {...props} {...context} />}
  </Web3Context.Consumer>
)