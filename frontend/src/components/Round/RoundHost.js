import React from 'react'

import * as StringUtils from '../../utils/StringUtils'


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