import React, { Component } from 'react'
import { Web3Context } from './Web3Wrapper'
//import './BetOptions.scss'

const BetOutcomes = (outcomes) => {
  let outcomeArray = []
  console.log(outcomes)
  for (let i=0; i<outcomes.length; i++) {
    outcomeArray.push(
      <label className="radio">
        <input type="radio" name="rsvp"/>
        outcome {i}: {outcomes[i]}
      </label>
    )
  }
  console.log(outcomeArray)
  return outcomeArray
}

export default BetOutcomes