import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import { Web3Context } from './generic/Web3Wrapper'

class Host extends Component {

  constructor(props) {
    super(props)
    console.log(props)
    this.state = {
      host: {
        name: props.match.params.hostName,
        address: ''
      },
      rounds: []
    }
  }

  componentDidMount = () => {
    // async fetch host.address... so that host.name and host.address are populated.
  }

  handleRefresh = () => {
    // async fetch again host rounds.
  }
  
  render() {
    const getRounds = () => {
      if (this.state.rounds.length === 0) {
        return <div>Host has no bet rounds</div>
      }
      let rounds = []
      for(let i=0; i<this.state.rounds.length; i++) {
        rounds.push(
          <div key={i}>{i}</div>
        )
      }
    }

    return (
      <div className="main">
        <div>
          <div className="field">
            <label className="label is-large">{this.hostName}</label>
          </div>

          <div className="has-text-centered">
            {getRounds()}
          </div>

          <div className="control has-text-centered">
            <button
              className="button is-large is-primary"
              onClick={this.handleRefresh}>
                Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <Host {...props} context={context} />}
  </Web3Context.Consumer>
)