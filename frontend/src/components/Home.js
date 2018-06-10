import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import './Home.scss'

class Home extends Component {
  render() {
    return (
      <div className="has-text-centered main">
        <p>
          Betl let's you host and join bets<br/>
          on the Blockchain.
          Get some <a href="https://coinmarketcap.com/currencies/ethereum/" target="_blank">
          Ether</a><br/>
          and good luck!
        </p>
        
        {/*<p className="has-text-grey-light">Choose:</p>*/}

        <div className="select-box">
          <div className="columns">
            <div className="column is-6 border-right">
              <p className="has-text-grey-light">
                Create a bet and share an individual
                link to let others participate.
              </p>
              <Link to="/create">
                <button className="button is-primary is-large welcome-button">
                  Create
                </button>
              </Link>
            </div>
            <div className="column is-6">
              <p className="has-text-grey-light">
                Join a bet by searching for a host's name
                or visiting his invite link.
              </p>
              <Link to="/join">
                <button className="button is-primary is-large welcome-button">
                  Join
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Home