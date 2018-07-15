import React from 'react'

import { StringUtils } from '../../utils'


export const RoundHost = ({ hostAddress, hostName }) => {
  return (
    <div className="field">
      {
        hostName
          ? <span className="host-name">
              {hostName}
            </span>
          : <span className="host-address is-monospace">
              {StringUtils.formatAddress(hostAddress)}
            </span>
      }
      &nbsp;asks:
    </div>
  )
}