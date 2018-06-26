import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'
import BetState from './BetState'

const ZERO_ADDRESS = '0x00000000000000000000000000000000'

class HostRound extends Component {

  constructor(props) {
  	super(props)
    this.state = {
      hostId: props.match.params.hostId.toLowerCase(),

      // contract expects byte parameters to be prefixed with '0x'
      roundId: '0x' + props.match.params.roundId.toLowerCase(),
      roundNumber: 0,
      status: 0,
      createdAt: 0,
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
    }
  }

  componentDidMount = async () => {
    //this.getRoundBasic()
    //this.getRoundExtended()
    const status = await this.getRoundInfo()
    if (this.isValidRound(status)) {
      await this.getRoundOutcomes()
      this.getRoundOutcomePools()
      this.getRoundOutcomeNumBets()
      this.getMyRoundOutcomeBet()
      this.getRoundOutcomeWinShare()
    } else {
      // TODO: rework this so this error is reflected in the UI properly
      throw new Error('Fetched round is not valid')
    }
    
    // Try to fetch basic round data.
    // If round exists, fetch full round data
    // this.getRoundBasic().then(() => {
    //   this.getRoundExtended()
    //   this.getRoundOutcomes()
    //   //this.getRoundOutcomePools()
    //   //this.getRoundOutcomeNumBets()
    // }).catch(err => {
    //   this.setState({ status: 0 })
    //   console.log('Error: Round is invalid')
    // })
  
  }

  getRoundInfo = async () => {
    return new Promise((resolve, reject) => {
      this.props.betl.getRoundInfo(this.state.hostId, this.state.roundId).then(r => {
        let [roundNumber, status, createdAt, timeoutAt, question, numOutcomes, numBets, poolSize, hostBonus, hostFee] = r
        //if (Number(status) === 0) reject()

        console.log('Success: getRound (id: ' + this.state.roundId + ')')
        console.log(JSON.stringify(r))
        this.setState({
          roundNumber: Number(roundNumber),
          status: Number(status),
          createdAt: Number(createdAt),
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
        ).then(r => {
          resolve(this.props.web3.utils.hexToUtf8(r))
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

  // FIX: it's broken. returns corrupted data
  getMyRoundOutcomeBet = async () => {
    let promises = Array(this.state.numOutcomes).fill().map((_, i) => {
      const outcomeId = this.getOutcomeId(this.state.outcomes[i])
      return new Promise((resolve, reject) => {
        this.props.betl.getMyRoundOutcomeBet(
          this.state.hostId,
          this.state.roundId,
          outcomeId
        ).then(wei => {
          console.log(Number(wei))
          //const ether = this.props.web3.utils.fromWei(String(wei))
          //resolve(ether)
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

  getHostInfo = async (hostId) => {
    let hostAddress, hostName
    if (this.props.isAddress(hostId)) {
      hostAddress = hostId
      hostName = await this.props.getUserName(hostAddress)
    } else {
      hostName = hostId
      hostAddress = await this.props.getUserAddress(hostName)
    }

    this.setState({
      hostAddress: hostAddress.toLowerCase(),
      hostName: hostName
    })
  }
  
  render() {
    return (
      <div>       
        
         
  
      </div>
    );
  }
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <HostRound {...props} {...context} />}
  </Web3Context.Consumer>
)

 // {this.state.host.exists && this.state.host.name !== '' &&
 //            <HostInfo name={this.state.host.name}/>
 //          }

 //          {this.state.host.exists && this.state.roundExists &&
 //            <div>
 //              <p className="label is-large">
 //                "{this.state.question}"
 //              </p>
 //              <BetState {...this.state} />
 //            </div>
 //          }

 //          {!this.state.host.exists && 
 //            <div className="is-italic has-text-centered">
 //              Host not found
 //            </div>
 //          }
          
 //          {this.state.host.exists && !this.state.roundExists && 
 //            <div className="is-italic has-text-centered">
 //              Round not found
 //            </div>
 //          }