import React from 'react'

import './Error.scss'


export const MetamaskNotAvailable = () => {
  return (
    <ErrorPage subject="Metamask not installed!">
      Please install Metamask browser plugin to proceed
    </ErrorPage>
  )
}

export const MetamaskNotLoggedIn = () => {
  return (
    <ErrorPage subject="Not logged in!">
      Please log in Metamask browser plugin
    </ErrorPage>
  )
}

export const MetamaskWrongNetwork = ({ target, current }) => {
  return (
    <ErrorPage subject="Wrong network!">
      Please select the {target} network!
      Currently you're on the {current} network.
    </ErrorPage>
  )
}

const ErrorSymbol = () => {
  return <p className="has-text-centered has-text-primary has-font-primary is-size-1">!</p>
}

export const ErrorPage = ({ subject, children }) => {
  return (
    <div className="is-fullwidth has-text-centered error-container">
      <ErrorSymbol />
      <p className="is-size-4 error-subject">
        {subject}
      </p>
      <p className="is-italic is-size-6 error-text">  
        {children}
      </p>
    </div>
  )
}