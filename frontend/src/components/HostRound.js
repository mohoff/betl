import React, { Component } from 'react'

import { Web3Context } from './Web3Wrapper'
import BetState from './BetState'
import {
  HeadingPrimary,
  LoadingRound,
  RoundNotFound,
  InputTextStatic,
  Select
} from './generic'
import * as TimeUtils from '../utils/TimeUtils'
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
      areStatsToggled: false
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

  handleStatsToggle = () => {
    this.setState({ areStatsToggled: !this.state.areStatsToggled })
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
        <RoundTimes
          createdAt={this.state.createdAt}
          timeoutAt={this.state.timeoutAt} />
        <RoundStats
          bets={this.state.numBets}
          pool={this.state.poolSize}
          bonus={this.state.hostBonus} />
       
        <HostAsks hostName={this.state.hostName} />
        <HeadingPrimary>"{this.state.question}"</HeadingPrimary>

        <RoundStatsSwitch
          toggled={this.state.areStatsToggled} 
          handleToggle={this.handleStatsToggle} />

        <RoundOutcomes
          numOutcomes={this.state.numOutcomes}
          outcomes={this.state.outcomes}
          selectedOutcome={this.state.selectedOutcome}
          handleSelect={this.handleSelect}
        />
       
        Note: Host charges a fee of {this.state.hostFee}<br />
  
      </div>
    )
  }
}

const HostAsks = ({ hostName }) => {
  return hostName
    ? <h2>{hostName} asks:</h2>
    : null
}

const RoundStatsSwitch = ({ toggled , handleToggle }) => {
  return (
    <div className="has-text-right has-text-weight-bold stats-switch">
      <SwitchElement active={!toggled} handleClick={handleToggle}>
        BET
      </SwitchElement>
      <SwitchElement active={toggled} handleClick={handleToggle}>
        #PLAYERS
      </SwitchElement>
    </div>
  )
}

const SwitchElement = ({ active, handleClick, children }) => {
  return (
    <p>
      <a className={(active ? 'has-text-grey' : 'has-text-grey-light') + ' is-unselectable'}
        onClick={() => { active ? null : handleClick() }}>
        {children}
      </a>
    </p>
  )
}

const RoundOutcomes = ({ numOutcomes, outcomes, selectedOutcome, handleSelect }) => {
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
            <div className="stats-bars"></div>
            <Outcome value={outcomes[i]} />
            <div className="has-text-right has-text-weight-bold is-size-5 stats-numbers">1000</div>

          </div>
        </div>
      </div>
    )
  }

  return outcomesArray
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
    <div className="has-text-right is-italic">
      {getTimes()}
    </div>
  )
}

const RoundStats = ({ bets, pool, bonus }) => {
  return (
    <div className="level is-mobile">
      <div className="level-item has-text-centered">
        <div>
          <p className="heading">Bets</p>
          <p className="title">{bets}</p>
        </div>
      </div>
      <div className="level-item has-text-centered">
        <div>
          <p className="heading">
            Pool
            { bonus !== 0 ? ' + Bonus' : '' }
          </p>
          <span className="title">
            {pool}
            { bonus !== 0 &&
              <span className="has-text-success">+{bonus}</span> 
            }
          </span> ETH
        </div>
      </div>
    </div>
  )
}


// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <HostRound {...props} {...context} />}
  </Web3Context.Consumer>
)