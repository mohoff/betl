import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'
import BetState from './BetState'

class HostRound extends Component {

  constructor(props) {
  	super(props)
    let id = props.match.params.hostId
    this.state = {
      host: {
        exists: false,
        name: props.context.isAddress(id) ? '' : id,
        address: props.context.isAddress(id) ? id : '',
      },
      roundExists: false,
      roundId: props.match.params.roundId,
      status: '',
      question: '',
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
      <div className="main">       
        <section className="section">
          {this.state.host.exists && this.state.host.name !== '' &&
            <HostInfo name={this.state.host.name}/>
          }

          {this.state.host.exists && this.state.roundExists &&
            <BetState {...this.state} />
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
        </section>
      </div>
    );
  }
}

const HostInfo = () => {
  return (
    <div>
      Round by {this.state.host.name}
    </div>
  )
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <HostRound {...props} context={context} />}
  </Web3Context.Consumer>
)