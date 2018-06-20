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
      outcomes: [],
      outcomesBetPool: [],
      outcomesBetNum: []
    }
  }

  componentDidMount = async () => {
    // Try to fetch basic round data.
    // If round exists, fetch full round data
    this.getRound().then(() => {
      this.getRoundOutcomes()
      this.getRoundOutcomePools()
      this.getRoundOutcomeNumBets()
    }).catch(err => {
      this.setState({ status: 0 })
      console.log('Error: Round is invalid')
    })
  }

  getRound = async () => {
    return new Promise((resolve, reject) => {
      this.props.betl.getRound(this.state.hostId, this.state.roundId).then(r => {
        let [roundNumber, status, createdAt, timeoutAt, question, numOutcomes, numBets, poolSize] = r
        if (Number(status) === 0) reject()

        console.log('Success: getRound (id: ' + this.state.roundId + ')')

        this.setState({
          roundNumber: Number(roundNumber),
          status: Number(status),
          createdAt: Number(createdAt),
          timeoutAt: Number(timeoutAt),
          question: this.props.web3.utils.hexToUtf8(question),
          numOutcomes: Number(numOutcomes),
          numBets: Number(numBets),
          poolSize: Number(poolSize),
        })
        resolve()
      }).catch(err => {
        reject()
      })
    })
  }

  getRoundOutcomes = async () => {
    this.props.betl.getRoundOutcomes(this.state.hostId, this.state.roundId).then(r => {
      console.log('getRoundCoutcomes')
      console.log(r)
    })
  }

  getRoundOutcomePools = async () => {
   // TODO: implement 
  }

  getRoundOutcomeNumBets = async () => {
    // TODO: implement
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