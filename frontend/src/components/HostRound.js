import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'
import BetState from './BetState'

const ZERO_ADDRESS = '0x00000000000000000000000000000000'

class HostRound extends Component {

  constructor(props) {
  	super(props)
    this.state = {
      hostId: props.match.params.hostId.toLowerCase(),
      roundId: props.match.params.roundId.toLowerCase(),

      roundExists: true,
      status: 'OPEN',
      question: 'Will we win?',
      numOptions: 0,
      options: [],
      optionsBetPool: [],
      optionsBetNum: []
    }
  }

  componentDidMount = async () => {
    //this.getHostInfo(this.state.hostId)
    // if (this.state.hostAddress === ZERO_ADDRESS) {
    //   this.setState({ roundExists: false })
    // }
    this.props.betl.getRound(this.state.hostId, this.state.roundId).then(r => {
      console.log('Success: getRound')
      console.log(r)
      let [id, status, createdAt, timeoutAt, question, numOptions, numBets, poolSize] = r
      console.log(Number(id) + ', ' + String(id))
      console.log(Number(status))
      console.log(Number(createdAt))
      console.log(Number(timeoutAt))
    }).catch(err => {
      console.log('Error: getRound')
      console.log(err)
    })
    // get host.address
    // get status, timeout
    // get question
    // get numOptions, options, optionsBetPool. optionsBetNum
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

const HostInfo = ({name}) => {
  return <div>{name}:</div>
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