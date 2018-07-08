import React, { Component, Fragment } from 'react'

import { Web3Context } from './Web3Wrapper'
import BetState from './BetState'
import {
  HeadingPrimary,
  LoadingRound,
  RoundNotFound,
  InputTextStatic,
  Select,
  ToggleText,
  ButtonPrimary
} from './generic'
import * as TimeUtils from '../utils/TimeUtils'
import * as StringUtils from '../utils/StringUtils'
import './HostRound.scss'

class HostRound extends Component {
  constructor(props) {
  	super(props)
    this.state = {
      hostAddress: null,
      hostName: null,
      hostId: props.match.params.hostId.toLowerCase(),
      // contract expects byte parameters to be prefixed with '0x'
      roundId: '0x' + props.match.params.roundId.toLowerCase(),

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
      outcomesBetPool: [],
      outcomesBetNum: [],
      outcomesMyBet: [],
      outcomesWinShare: [],

      selectedOutcome: null,
      areOutcomeStatsToggled: false,
      arePoolUnitsToggled: false
    }
  }

  componentDidMount = async () => {
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

  getRound = async(hostAddress, roundId) => {
    const status = await this.getRoundInfo(hostAddress, roundId)
    if (this.isValidRound(status)) {
      await this.getRoundOutcomes(hostAddress, roundId)
      await this.getRoundOutcomePools(hostAddress, roundId)
      await this.getRoundOutcomeNumBets(hostAddress, roundId)
      await this.getMyRoundOutcomeBet(hostAddress, roundId)
      await this.getRoundOutcomeWinShare(hostAddress, roundId)
    } else {
      // TODO: rework this so this error is reflected in the UI properly
      throw new Error('Fetched round is not valid')
    }
    console.log(this.state)
  }

  getRoundInfo = async () => {
    return new Promise((resolve, reject) => {
      this.props.betl && this.props.betl.getRoundInfo(this.state.hostId, this.state.roundId).then(r => {
        let [status, createdAt, endedAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus, hostFee] = r
        if (Number(status) === 0) reject()

        console.log('Success: getRoundInfo for roundId: ' + this.state.roundId)
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

  isValidRound = (status) => {
    return status < 7
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
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomePool(
          this.state.hostId,
          this.state.roundId,
          outcomeId
        ).then(wei => {
          const ether = this.props.web3.utils.fromWei(String(wei))
          resolve(ether)
        })
      })
    })
    const outcomePools = await Promise.all(promises)
    this.setState({ outcomesBetPool: outcomePools })
  }

  getRoundOutcomeNumBets = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomeNumBets(
          this.state.hostId,
          this.state.roundId,
          outcomeId
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
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getMyRoundOutcomeBet(
          this.state.hostId,
          this.state.roundId,
          outcomeId
        ).then(wei => {
          const ether = this.props.web3.utils.fromWei(String(wei))
          resolve(ether)
        })
      })
    })
    const outcomesMyBet = await Promise.all(promises)
    this.setState({ outcomesMyBet: outcomesMyBet })
    console.log(this.state)
  }

  getRoundOutcomeWinShare = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getRoundOutcomeWinShare(
          this.state.hostId,
          this.state.roundId,
          outcomeId
        ).then(winShare => {
          resolve(Number(winShare))
        })
      })
    })
    const outcomesWinShare = await Promise.all(promises)
    this.setState({ outcomesWinShare: outcomesWinShare })
  }

  handleSelect = () => {
    console.log('handleSelect')
  }

  handleOutcomeStatsToggle = () => {
    this.setState({ areOutcomeStatsToggled: !this.state.areOutcomeStatsToggled })
  }

  handleUnitToggle = () => {
    this.setState({ arePoolUnitsToggled: !this.state.arePoolUnitsToggled })
  }
  
  render() {
    if (this.state.status === null) {
      return <LoadingRound />
    }
    if (this.state.status === 0) {
      return <RoundNotFound />
    }
    return (
      <div>
        <HostAsks
          hostAddress={this.state.hostAddress}
          hostName={this.state.hostName} />
        <Question>{this.state.question}</Question>
        <RoundTimes
          createdAt={this.state.createdAt}
          timeoutAt={this.state.timeoutAt} />

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

        <Outcomes
          numOutcomes={this.state.numOutcomes}
          outcomes={this.state.outcomes}
          selectedOutcome={this.state.selectedOutcome}
          handleSelect={this.handleSelect}
        />
       
        <ButtonPrimary>
          Vote
        </ButtonPrimary>
        <HostFee fee={this.state.hostFee} />
  
      </div>
    )
  }
}

const Question = ({ children }) => {
  return (
    <h2 className="has-text-primary is-bold is-italic question">
      "{children}"
    </h2>
  )
}

const HostAsks = ({ hostAddress, hostName }) => {
  return (
    <div className="field">
      {
        hostName
          ? <span className="host-name">
              {hostName}
            </span>
          : <span className="host-address is-monospace">
              {StringUtils.formatAddress(hostAddress)}
            </span>
      }
      &nbsp;asks:
    </div>
  )
}

const Outcomes = ({ numOutcomes, outcomes, selectedOutcome, handleSelect }) => {
  let outcomesArray = []

  for (let i=0; i<numOutcomes; i++) {
    outcomesArray.push(
      <div key={String(i+1)} className="field">    
        <div className="field has-addons">
          <p className="control">
            <a className="button is-static is-large select-outcome">
              <Select
                value={i}
                checked={selectedOutcome === i}
                onChange={handleSelect} />
            </a>
          </p>
          <div className="control is-expanded outcome-container">
            <OutcomeStats value={1000} maxValue={10000} />
            <Outcome value={outcomes[i]} />
          </div>
        </div>
      </div>
    )
  }

  return outcomesArray
}

const OutcomeStats = ({ value, maxValue }) => {
  return (
    <Fragment>
      <OutcomeStatBar value={value} maxValue={maxValue} />
      <OutcomeStatNumber value={value} />
    </Fragment>
  )
}

const OutcomeStatBar = ({ value, maxValue }) => {
  const width = {
    width: (value/maxValue)*100 + '%'
  }

  return <div style={width} className="stats-bars"></div>
}

const OutcomeStatNumber = ({ value }) => {
  return (
    <div className="has-text-right is-monospace is-semi-bold is-size-5 stats-numbers">
      {value}
    </div>
  )
}

const Outcome = ({ value }) => {
  return value
    ? <InputTextStatic value={value} className="outcome"/>
    : null  
}

const RoundTimes = ({ createdAt, endedAt, timeoutAt }) => {
  const getTimes = () => {
    if (endedAt) {
      return <p>ended {TimeUtils.getRelativeTime(endedAt)}</p>
    }
    if (timeoutAt && timeoutAt <= TimeUtils.NOW) {
      return <p>timed out {TimeUtils.getRelativeTime(timeoutAt)}</p>
    }
    return (
      <div>
        <p>created {TimeUtils.getRelativeTime(createdAt)}</p>
        {
          timeoutAt &&
          <p>timeout {TimeUtils.getRelativeTime(timeoutAt)}</p>
        }
      </div>
    )
  }

  return (
    <div className="has-text-right is-italic is-regular has-text-grey round-times is-size-7">
      {getTimes()}
    </div>
  )
}

const RoundStats = ({ bets, pool, bonus, unitToggled, handleUnitToggle }) => {
  if (!bets) {
    return (
      <div className="has-text-centered is-italic">
        Be the first to place a Bet!
      </div>
    )
  }

  return (
    <div className="columns">
      <div className="column has-text-centered">
        <div>
          <p className="heading">
            Pool
            { bonus !== 0 ? ' + Bonus' : '' }
          </p>
          <div className="is-relative">
            <span className="title is-monospace is-size-2">
              { unitToggled
                ? StringUtils.formatToMilliEth(pool)
                : StringUtils.formatToEth(pool) }
              { bonus !== 0 &&
                <span className="has-text-success bonus">
                  +
                  { unitToggled
                    ? StringUtils.formatToMilliEth(bonus)
                    : StringUtils.formatToEth(bonus)
                  }
                </span>
              }
            </span>
            <div className="unit-toggle">
              <ToggleText
                theDefaultActive="ETH"
                theOther="mETH"
                toggled={unitToggled} 
                handleToggle={handleUnitToggle} />
            </div>
          </div>
        </div>
      </div>
      <div className="column has-text-centered">
        <div>
          <p className="heading">Bets</p>
          <p className="title is-monospace is-size-2">{bets}</p>
        </div>
      </div>
    </div>
  )
}

const HostFee = ({ fee }) => {
  return fee
    ? <p class="help has-text-centered is-italic has-text-primary">
        Host charges a fee of {fee}%
      </p>
    : null
}


// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <HostRound {...props} {...context} />}
  </Web3Context.Consumer>
)