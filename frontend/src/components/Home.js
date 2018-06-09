import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import MetaMaskError from './generic/MetaMaskError.js'
import './Home.scss'

class Home extends Component {
  render() {
    return (
      <div className="main">
        <p>
          Betl let's you host and join bets<br/>
          on the Blockchain.
          Get some <a href="https://coinmarketcap.com/currencies/ethereum/" target="_blank">
          Ether</a><br/>
          and good luck!
        </p>
        <MetaMaskError />
        
        {/*<p className="has-text-grey-light">Choose:</p>*/}

        <div className="columns">
          <div className="column is-5">
            <p>
              Create a bet and share an individual
              link to let others participate.
            </p>
            <button className="button is-primary is-large welcome-button">
              Create
            </button>
          </div>
          <div className="column is-5 is-offset-2">
            <p>
              Join a bet by searching for a host's name
              or visiting his invite link.
            </p>
            <button className="button is-primary is-large welcome-button">
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default Home