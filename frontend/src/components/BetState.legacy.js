import React, { Component } from 'react'

import { Web3Context } from './Web3Wrapper'
import BetOutcomes from './BetOutcomes'
import { ButtonPrimary } from './generic'
//import './BetState.scss'

class BetState extends Component {
  constructor(props) {
    super(props)
  }
  render() {
    switch(this.props.status) {
      case '':
        return <BetStateLoading />
      case 'INACTIVE':
        return <BetStateInactive />
      case 'TIMEOUT':
        return <BetStateTimeout />
      case 'CANCELLED':
        return <BetStateCancelled />
      case 'OPEN':
        return <BetStateOpen {...this.props} />
      case 'CLOSED':
        return <BetStateClosed />
      case 'FINISHED':
        return <BetStateFinished />
      default:
        return <BetStateUnknown />
    }
  }
}

const BetStateLoading = () => {
  return <BetStateInfo className="is-italic">Loading...</BetStateInfo>
}
const BetStateInactive = () => {
  return <BetStateInfo>Round is inactive Please come back later</BetStateInfo>
}
const BetStateTimeout = () => {
  return <BetStateInfo>Round timed out! Claim your refund now</BetStateInfo>
  // show bet results here?
}
const BetStateCancelled = () => {
  return <BetStateInfo>Round is cancelled! Claim your refund now</BetStateInfo>
}
const BetStateOpen = (props) => {
  let outcomes = ['Yes!', 'No', 'Maybe']
  return (
    <div>
      <BetStateInfo>Round is open! Place your bets now</BetStateInfo>
      <BetOutcomes outcomes={outcomes} />
      <div className="control has-text-centered">
        <ButtonPrimary onClick={this.handleBet}>
            Bet
        </ButtonPrimary>
      </div>
    </div>
  )
}
const BetStateClosed = () => {
  return (
    <BetStateInfo>Round is closed! Host has to pick a winner now</BetStateInfo>
    // show betting results
  )
}
const BetStateFinished = () => {
  return (
    <div>
      <BetStateInfo>Round is finished! Claim your reward now!</BetStateInfo>
      <div className="control has-text-centered">
        <ButtonPrimary onClick={this.handleClaim}>
            Claim reward
        </ButtonPrimary>
      </div>
    </div>
  )
}
const BetStateUnknown = () => {
  return <BetStateInfo>Round status unknown</BetStateInfo>
}

const BetStateInfo = (props) => {
  return (
    <div className="has-text-centered">
      {props.children}
    </div>
  )
}

// Wrap with React context consumer to provide web3 context
export default (props) => (
  <Web3Context.Consumer>
    {context => <BetState {...props} context={context} />}
  </Web3Context.Consumer>
)