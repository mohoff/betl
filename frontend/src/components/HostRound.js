import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'
import BetState from './BetState'

class HostRound extends Component {

  constructor(props) {
  	super(props)
    let id = props.match.params.hostId
    this.state = {
      hostId: props.match.params.hostId,
      hostAddress: '0x123412341234124123412341234124124',
      hostName: 'le me',

      roundExists: true,
      roundId: props.match.params.roundId,
      status: 'OPEN',
      question: 'Will we win?',
      numOptions: 0,
      options: [],
      optionsBetPool: [],
      optionsBetNum: []
    }
  }

  componentDidMount = () => {
    // get host.address
    // get status, timeout
    // get question
    // get numOptions, options, optionsBetPool. optionsBetNum
  }
  
  render() {
    return (
      <div>       
        
          {this.state.host.exists && this.state.host.name !== '' &&
            <HostInfo name={this.state.host.name}/>
          }

          {this.state.host.exists && this.state.roundExists &&
            <div>
              <p className="label is-large">
                "{this.state.question}"
              </p>
              <BetState {...this.state} />
            </div>
          }

          {!this.state.host.exists && 
            <div className="is-italic has-text-centered">
              Host not found
            </div>
          }
          
          {this.state.host.exists && !this.state.roundExists && 
            <div className="is-italic has-text-centered">
              Round not found
            </div>
          }
  
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