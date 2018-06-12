import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'

class Host extends Component {

  constructor(props) {
    super(props)
    let id = props.match.params.hostId
    this.state = {
      host: {
        name: props.context.isAddress(id) ? '' : id,
        address: props.context.isAddress(id) ? id : '',
        numBetsCreated: 0,
        numBetsFinished: 0,
        numBetsCancelled: 0,
        totalBetPool: 0,
        totalBetNum: 0
        // more here for stats?
      },
      rounds: []
    }
  }

  componentDidMount = () => {
    // async fetch host.address/host.name... so that host.name and host.address are populated.
  }

  handleRefresh = () => {
    // async fetch again host rounds.
  }
  
  render() {
    const getRounds = () => {
      if (this.state.rounds.length === 0) {
        return <div className="is-italic has-text-grey-light">Host has no bet rounds</div>
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
          <section className="section">
            <div className="field">
              <label className="label is-large">Open Rounds</label>
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
          </section>

          <section className="section">
            <div className="field">
              <label className="label is-large">Stats</label>
            </div>
            <div className="level is-mobile">
              <div className="level-item has-text-centered">
                <div>
                  <p className="heading">Rounds</p>
                  <p className="title">{this.state.host.numBetsFinished}</p>
                </div>
              </div>
              <div className="level-item has-text-centered">
                <div>
                  <p className="heading">Total Pool</p>
                  <span className="title">{this.state.host.totalBetPool}</span> ETH
                </div>
              </div>
              <div className="level-item has-text-centered">
                <div>
                  <p className="heading">Total Bets</p>
                  <p className="title">{this.state.host.totalBetNum}</p>
                </div>
              </div>
            </div>
          </section>
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