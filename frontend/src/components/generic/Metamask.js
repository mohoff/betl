import React from 'react'

import { ErrorPage } from './Error.js'


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