import React from 'react'

export const MetamaskNotAvailable = () => {
  return (
    <MetamaskError>
      Please install Metamask browser plugin
    </MetamaskError>
  )
}

export const MetamaskNotLoggedIn = () => {
  return (
    <MetamaskError>
      Please log in Metamask browser plugin
    </MetamaskError>
  )
}

export const MetamaskWrongNetwork = ({ target, current }) => {
  return (
    <MetamaskError>
      Please select the {target} network! 
      Currently you're on the {current} network.
    </MetamaskError>
  )
}

const MetamaskError = ({ children }) => {
  return (
    <div className="is-fullwidth">
      <p className="is-italic has-text-danger has-text-centered">
        {children}
      </p>
    </div>
  )
}