import React, { Component } from 'react'

import { Web3Context } from '../Web3Wrapper'

import { 
  RoundStatus,
  OPEN
} from './RoundStatus'
import { RoundOutcomesWithStats } from './RoundOutcomesWithStats'
import { RoundStats } from './RoundStats'
import { RoundHost } from './RoundHost'
import { RoundQuestion } from './RoundQuestion'
import { RoundTimes } from './RoundTimes'
import { RoundFee } from './RoundFee'
import {
  LoadingRound,
  ToggleText,
  ButtonPrimary,
  InputNumber,
  ActionResult,
  ErrorPage
} from '../generic'

import { StringUtils } from '../../utils'

import './Round.scss'


class Round extends Component {
  constructor(props) {
  	super(props)
    this.pollingInterval = null

    this.state = {
      hostId: props.match.params.hostId.toLowerCase(),
      // contract expects byte parameters to be prefixed with '0x'
      roundId: '0x' + props.match.params.roundId.toLowerCase(),

      // Host data
      hostAddress: null,
      hostName: null,

      // Round data
      status: null,
      createdAt: 0,
      endedAt: 0,
      timeoutAt: 0,
      question: '',
      numOutcomes: 0,
      numBets: 0,
      poolSize: 0,
      hostBonus: 0,
      hostFee: 0,
      outcomes: [],
      outcomesBetPool: [0.01, 1.2, 0.77777],
      outcomesBetNum: [23, 56, 11],
      outcomesMyBet: [500000000000000, 0, 5000000],
      outcomesWinShare: [0, 10, 90],

      // UI controls
      selectedOutcome: null,
      inputBet: 0,
      inputBetFiat: 0,
      isBetLoading: false,
      betResultText: '',
      betSuccess: null,
      areOutcomeStatsToggled: false,
      arePoolUnitsToggled: false,
      ethFiatRate: 0
    }
  }

  componentDidMount = async () => {
    this.getEthFiatRate()

    if(this.props.isAddress(this.state.hostId)) {
      this.setState({ hostAddress: this.state.hostId })
      this.props.getUserName(this.state.hostId).then(hostName => {
        this.setState({ hostName: hostName })
      })
    } else {
      this.setState({ hostName: this.state.hostId })
      const hostAddress = await this.props.getUserAddress(this.state.hostId)
      this.setState({ hostAddress: hostAddress })
    }
    this.getRound(this.state.hostAddress, this.state.roundId)
  }

  componentWillUnmount = () => {
    clearInterval(this.pollingInterval)
  }

  getEthFiatRate = async () => {
    fetch(process.env.REACT_APP_ETH_PRICE_API)
    .then(response => response.json())
    .then(json => json.data.quotes[process.env.REACT_APP_FIAT_CURRENCY].price)
    .then(fiatRate => {
      this.setState({ ethFiatRate: Number(fiatRate) })
    })
  }

  getRound = async (hostAddress, roundId) => {
    this.getRoundInfo(hostAddress, roundId).then(async (status) => {
      await this.getRoundOutcomes(hostAddress, roundId)
      this.getRoundOutcomeWinShare(hostAddress, roundId)
      this.getMyRoundOutcomeBet(hostAddress, roundId)
      this.startPollingRoundUpdates(hostAddress, roundId)
    }).catch(err => {
      // `render()` takes care of displaying an error message
      console.error('Failed to fetch Bet')
    }).finally(() => {
      console.log(this.state)  
    })
  }

  startPollingRoundUpdates = (hostAddress, roundId) => {
    // Periodically fetch round data that can be changed by other users
    this.pollingInterval = setInterval(() => {
      this.updateRound(hostAddress, roundId)
    }, Number(process.env.REACT_APP_POLLING_INTERVAL_MS_BET))
  }

  updateRound = () => {
    const hostAddress = this.state.hostAddress
    const roundId = this.state.roundId

    console.info('...Updating Round')

    this.getRoundInfoChanges(hostAddress, roundId)
    this.getRoundOutcomePools(hostAddress, roundId)
    this.getRoundOutcomeNumBets(hostAddress, roundId)
  }

  getRoundInfo = async () => {
    return new Promise((resolve, reject) => {
      this.props.betl && this.props.betl.getRoundInfo(this.state.hostId, this.state.roundId).then(r => {
        let [status, createdAt, endedAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus, hostFee] = r
        if (Number(status) === 0) reject()

        //console.log('Fetched Bet with id: ' + this.state.roundId)
        this.setState({
          status: Number(status),
          createdAt: Number(createdAt),
          endedAt: Number(endedAt),
          timeoutAt: Number(timeoutAt),
          question: this.props.web3.utils.hexToUtf8(question),
          numOutcomes: Number(numOutcomes),
          numBets: Number(numBets),
          poolSize: Number(poolSize),
          hostBonus: Number(hostBonus),
          hostFee: Number(hostFee),
        })
        resolve(Number(status))
      }).catch(err => {
        reject()
      })
    })
  }

  getRoundInfoChanges = async () => {
    this.props.betl && this.props.betl.getRoundInfoChanges(this.state.hostId, this.state.roundId).then(r => {
      let [status, endedAt, numBets, poolSize] = r

      this.setState({
        status: Number(status),
        endedAt: Number(endedAt),
        numBets: Number(numBets),
        poolSize: Number(poolSize)
      })
    }).catch(err => {
      console.error('Failed to get round changes!', err)
    })
  }

  getRoundOutcomes = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcome(
          this.state.hostId,
          this.state.roundId,
          i
        ).then(outcomeInHex => {
          resolve(this.props.web3.utils.hexToUtf8(outcomeInHex))
        })
      })
    })
    const outcomes = await Promise.all(promises)
    this.setState({ outcomes: outcomes })
  }

  getOutcomeId = (outcome) => {
    return this.props.web3.utils.sha3(outcome)
  }

  getRoundOutcomePools = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomePool(
          this.state.hostId,
          this.state.roundId,
          i
        ).then(wei => {
          const ether = this.props.web3.utils.fromWei(String(wei))
          resolve(Number(ether))
        })
      })
    })
    const outcomePools = await Promise.all(promises)
    this.setState({ outcomesBetPool: outcomePools })
  }

  getRoundOutcomeNumBets = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomeNumBets(
          this.state.hostId,
          this.state.roundId,
          i
        ).then(r => {
          resolve(Number(r))
        })
      })
    })
    const outcomeNumBets = await Promise.all(promises)
    this.setState({ outcomesBetNum: outcomeNumBets })
  }

  getMyRoundOutcomeBet = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      return new Promise((resolve, reject) => {
        this.props.betl.getMyRoundOutcomeBet(
          this.state.hostId,
          this.state.roundId,
          i
        ).then(wei => {
          const ether = this.props.web3.utils.fromWei(String(wei))
          resolve(Number(ether))
        })
      })
    })
    const outcomesMyBet = await Promise.all(promises)
    this.setState({ outcomesMyBet: outcomesMyBet })
  }

  getRoundOutcomeWinShare = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomeWinShare(
          this.state.hostId,
          this.state.roundId,
          i
        ).then(winShare => {
          resolve(Number(winShare))
        })
      })
    })
    const outcomesWinShare = await Promise.all(promises)
    this.setState({ outcomesWinShare: outcomesWinShare })
  }

  handleSelect = (e) => {
    this.resetBetResult()
    this.setState({ selectedOutcome: Number(e.target.value) })
  }

  handleBetChange = (e) => {
    this.resetBetResult()

    const inputBet = Number(e.target.value)
    this.setState({
      inputBet: inputBet,
      inputBetFiat: inputBet * this.state.ethFiatRate
    })
  }

  handleBet = () => {
    this.setState({ isBetLoading: true })

    // Input validation
    if (this.state.selectedOutcome === null || this.state.selectedOutcome >= this.state.outcomes.length) {
      this.showBetResult('Please select a valid outcome', false)
    }
    if (!this.state.inputBet) {
      this.showBetResult('Please enter a valid bet amount', false)
    }

    // Place bet via transaction
    const betAmount = this.props.web3.utils.toWei(String(this.state.inputBet))
    this.props.betl.bet(
      this.state.hostAddress,
      this.state.roundId,
      this.state.selectedOutcome,
      this.props.getOptions(betAmount)
    ).then(result => {
      this.updateRound()
      this.showBetResult('Successfully placed bet!', true)
    }).catch(err => {
      this.showBetResult('Transaction failed!', false, err)
    }).finally(() => {
      this.setState({ isBetLoading: false })
    })
  }

  showBetResult = (message, isSuccess, error) => {
    isSuccess
      ? console.log('Success! ' + message)
      : console.error('Error! ' + message, error)
   
    isSuccess
      ? this.setState({ betResultText: message, betSuccess: true })
      : this.setState({ betResultText: message, betSuccess: false })
  }

  resetBetResult = () => {
    this.setState({ betResultText: '' })
  }

  handleOutcomeStatsToggle = () => {
    this.setState({ areOutcomeStatsToggled: !this.state.areOutcomeStatsToggled })
  }

  handleUnitToggle = () => {
    this.setState({ arePoolUnitsToggled: !this.state.arePoolUnitsToggled })
  }

  isValidRoundId = (roundId) => {
    return roundId.length === 10 && 
        this.props.web3.utils.isHexStrict(roundId)
  }
  
  render() {
    if (!this.isValidRoundId(this.state.roundId)) {
      return <RoundInvalid />
    }
    if (this.state.status === null) {
      return <LoadingRound />
    }
    if (this.state.status === 0) {
      return <RoundNotFound />
    }

    return (
      <div>
        <RoundHost
          hostAddress={this.state.hostAddress}
          hostName={this.state.hostName} />

        <RoundQuestion>
          {this.state.question}
        </RoundQuestion>

        <RoundTimes
          createdAt={this.state.createdAt}
          timeoutAt={this.state.timeoutAt} />

        <RoundStatus
          status={this.state.status} />

        <RoundStats
          bets={this.state.numBets}
          pool={this.state.poolSize}
          bonus={this.state.hostBonus}
          unitToggled={this.state.arePoolUnitsToggled}
          handleUnitToggle={this.handleUnitToggle} />
       
        <ToggleText
          theDefaultActive="BETS"
          theOther="#PLAYERS"
          toggled={this.state.areOutcomeStatsToggled} 
          handleToggle={this.handleOutcomeStatsToggle}
          alignLeft={false} />

        <RoundOutcomesWithStats
          status={this.state.status}
          numOutcomes={this.state.numOutcomes}
          outcomes={this.state.outcomes}
          winShares={this.state.outcomesWinShare}
          stats={this.state.areOutcomeStatsToggled
            ? this.state.outcomesBetNum
            : this.state.outcomesBetPool}
          statsSum={this.state.areOutcomeStatsToggled
            ? this.state.outcomesBetNum.reduce((a, b) => a + b, 0)
            : this.state.outcomesBetPool.reduce((a, b) => a + b, 0)}
          selectedIndex={this.state.selectedOutcome}
          handleSelect={this.handleSelect} />
       

        { // Special case: Render action controls below outcomes in case Round is in RoundStatus.OPEN
          this.state.status === OPEN &&

          <RoundStatusOpenBottom>
            <BetNumberInput
              min="0"
              step="0.001"
              fiat={StringUtils.formatFiatWithCurrency(this.state.inputBetFiat)}
              onChange={this.handleBetChange}
              value={this.state.inputBet} />

            <ButtonPrimary
              isLoading={this.state.isBetLoading}
              isDisabled={this.state.selectedOutcome === null || !this.state.inputBet || this.state.isBetLoading}
              onClick={this.handleBet}
              className="is-fullwidth">
              Betl!
            </ButtonPrimary>

            <ActionResult
              isSuccess={this.state.betSuccess}>
              {this.state.betResultText}
            </ActionResult>

            <RoundFee
              fee={this.state.hostFee} />
          </RoundStatusOpenBottom>
        }
      </div>
    )
  }
}

const RoundStatusOpenBottom = ({ children }) => {
  return (
    <div className="columns is-mobile round-open-bottom">
      <div className="column is-8 is-offset-2">
        {children}
      </div>
    </div>
  )
}

const BetNumberInput = ({ min, step, fiat, onChange, value }) => {
  return (
    <div className="field has-addons">
      <p className="control is-expanded">
        <InputNumber
          value={value}
          onChange={onChange}
          min={min}
          step={step}
        />
      </p>
      <p className="control">
        <a className="button is-monospace is-large is-static fiat">
          {fiat}
        </a>
      </p>
    </div>
  )
}

const RoundInvalid = () => {
  return (
    <ErrorPage subject="Invalid Bet!">
      Please make sure the URL is<br />in a correct format
    </ErrorPage>
  )
}

const RoundNotFound = () => {
  return (
    <ErrorPage subject="Bet not found!">
      Bet doesn't exist
    </ErrorPage>
  )
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Round {...props} {...context} />}
  </Web3Context.Consumer>
)