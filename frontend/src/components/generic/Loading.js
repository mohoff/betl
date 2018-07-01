import React from 'react'
import './Loading.scss'


export const LoadingMetamask = () => {
  return <LoadingFullwidth>Detecting Metamask...</LoadingFullwidth>
}

export const LoadingRound = () => {
  return <LoadingFullwidth>Loading Bet...</LoadingFullwidth>
}

export const LoadingFullwidth = ({ children }) => {
  return (
    <div className="is-fullwidth">
      <SpinnerLarge />
      <LoadingText>{children}</LoadingText>
    </div>
  )
}

const LoadingText = ({ children }) => {
  return (
    <p className="is-italic has-text-centered is-size-5">
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


