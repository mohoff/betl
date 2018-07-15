import React from 'react'

import { ToggleText } from '../generic'
import { StringUtils } from '../../utils'


export const RoundStats = ({ bets, pool, bonus, unitToggled, handleUnitToggle }) => {
  if (!bets) {
    return (
      <div className="has-text-centered is-italic">
        Be the first to place a Bet!
      </div>
    )
  }

  return (
    <div className="columns">
      <div className="column has-text-centered">
        <div>
          <p className="heading">
            Pool
            { bonus !== 0 ? ' + Bonus' : '' }
          </p>
          <div className="is-relative">
            <span className="title is-monospace is-size-2">
              { unitToggled
                ? StringUtils.formatToMilliEth(pool)
                : StringUtils.formatToEth(pool) }
              { bonus !== 0 &&
                <span className="has-text-success bonus">
                  +
                  { unitToggled
                    ? StringUtils.formatToMilliEth(bonus)
                    : StringUtils.formatToEth(bonus)
                  }
                </span>
              }
            </span>
            <div className="unit-toggle">
              <ToggleText
                theDefaultActive="ETH"
                theOther="mETH"
                toggled={unitToggled} 
                handleToggle={handleUnitToggle} />
            </div>
          </div>
        </div>
      </div>
      <div className="column has-text-centered">
        <div>
          <p className="heading">Bets</p>
          <p className="title is-monospace is-size-2">{bets}</p>
        </div>
      </div>
    </div>
  )
}