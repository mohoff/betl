import React, { Component } from 'react'
import BetState from './BetState'

class HostRound extends Component {

  constructor(props) {
  	super(props)
    this.state = {
      host: {
        name: props.match.params.hostName,
        address: ''
      },
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

    const BetState = (props) => {
      
    }

    return (
      <div className="main">
       
          <section className="section">
            <div className="field">
              <label className="label is-large">{this.state.host.name}:</label>
            </div>

            <BetState status={this.state.status} />

          </section>

      </div>
    );
  }
}

//<Route exact path={round} render={() => (
 //     <h3>Please select a round.</h3>
//    )}/>
export default HostRound