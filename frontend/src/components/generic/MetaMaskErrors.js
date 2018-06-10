import React, { Component } from 'react'

export const MetaMaskNotAvailable = () => {
  return (
    <MetaMaskError
      text="Please install Metamask browser plugin" />
  )
}

export const MetaMaskNotLoggedIn = () => {
  return (
    <MetaMaskError
      text="Please log in Metamask browser plugin" />
  )
}

export const MetaMaskWrongNetwork = (props) => {
  const text = 'Please select the ' + props.target + ' network! ' + 
              'Currently you\'re on the ' + props.current + ' network.'
  return (
    <MetaMaskError
      text={text} />
  )
}

const MetaMaskError = (props) => {
  return (
    <div>
      <p className="is-italic has-text-danger has-text-centered">{props.text}</p>
    </div>
  )
}