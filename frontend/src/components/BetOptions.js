import React, { Component } from 'react'
import { Web3Context } from './generic/Web3Wrapper'
//import './BetOptions.scss'

const BetOptions = (options) => {
  let optionArray = []
  console.log(options)
  for (let i=0; i<options.length; i++) {
    optionArray.push(
      <label className="radio">
        <input type="radio" name="rsvp"/>
        option {i}: {options[i]}
      </label>
    )
  }
  console.log(optionArray)
  return optionArray
}

export default BetOptions