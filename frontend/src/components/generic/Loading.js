import React from 'react'

import './Loading.scss'


export const LoadingMetamask = () => {
  return <LoadingPage>Detecting Metamask...</LoadingPage>
}

export const LoadingRound = () => {
  return <LoadingPage>Loading Bet...</LoadingPage>
}

export const LoadingPage = ({ children }) => {
  return (
    <div className="is-fullwidth has-text-centered error-container">
      <SpinnerLarge />
      <p className="is-italic is-size-4">
        {children}
      </p>
    </div>
  )
}

const LoadingText = ({ children }) => {
  return (
    <p className="is-italic has-text-centered is-size-4">
      {children}
    </p>
  )
}

const SpinnerLarge = () => {
  return (
    <div className="container-large">
      <span className="loader-large is-large"></span>
    </div>
  )
}


