import React from 'react'

export const MetamaskNotAvailable = () => {
  return (
    <ErrorMessage subject="Metamask not installed!">
      Please install Metamask browser plugin to proceed
    </ErrorMessage>
  )
}

export const MetamaskNotLoggedIn = () => {
  return (
    <ErrorMessage subject="Not logged in!">
      Please log in Metamask browser plugin
    </ErrorMessage>
  )
}

export const MetamaskWrongNetwork = ({ target, current }) => {
  return (
    <ErrorMessage subject="Wrong network!">
      Please select the {target} network!
      Currently you're on the {current} network.
    </ErrorMessage>
  )
}

export const RoundNotFound = () => {
  return <ErrorMessage subject="Invalid Bet!">Round not found</ErrorMessage>
}

const ErrorMessage = ({ subject, children }) => {
  return (
    <div className="is-fullwidth">
      <div className="message is-danger">
        <div className="message-header">
          {subject}
        </div>
        <div className="message-body field is-fullwidth">  
          <p className="is-italic has-text-centered is-size-5">
            {children}
          </p>
        </div>
      </div>
    </div>
  )
}