import React, { Fragment } from 'react'

import {
  InputTextStatic,
  Select
} from '../generic'

import './RoundOutcomesWithStats.scss'


export const RoundOutcomesWithStats = ({ status, numOutcomes, outcomes, winShares, stats, statsSum, selectedOutcome, handleSelect }) => {
  let outcomesArray = []
  status = 4
  const isDecided = status === 4

  for (let i=0; i<numOutcomes; i++) {
    const isPicked = winShares[i] > 0

    outcomesArray.push(
      <div key={String(i+1)} className="field">    
        <OutcomeContainer>
          <OutcomeLeft
            status={status}
            index={i}
            isPicked={isPicked}
            isSelected={true}
            winShare={winShares[i]}
            handleSelect={handleSelect} />
          <OutcomeText
            isPicked={isPicked}
            isBetDecided={isDecided}>
            {outcomes[i]}
          </OutcomeText>
          <OutcomeRight
            index={i}
            isPicked={isDecided && isPicked}
            value={stats[i]}
            maxValue={statsSum} />
        </OutcomeContainer>
      </div>
    )
  }

  return outcomesArray
}

const OutcomeLeft = ({ status, index, isPicked, isSelected, winShare, handleSelect }) => {
  status = 1

  switch (status) {
    case 1:
      return (
        <Fragment>
          <i className={'fas ' + (isPicked ? 'fa-check has-text-primary' : 'fa-times has-text-grey-light')}></i>
          {isPicked && 
            <div className="is-absolute is-monospace has-text-primary is-size-6 is-bold winshare">
              {winShare}%
            </div>
          }
        </Fragment>
      )
    case 2:
      return (
        <Select
          value={index}
          checked={isSelected}
          onChange={handleSelect}
        />
      )
    default:
      return null
  }
}

const OutcomeText = ({ children, isPicked, isBetDecided }) => {
  let extraStyle
  if (isBetDecided) {
    extraStyle = isPicked ? 'is-bold' : 'is-striked-through'
  }

  return children
    ? <InputTextStatic
        value={children}
        className={'outcome ' + extraStyle} />
    : null  
}

const OutcomeRight = ({ index, isPicked, value, maxValue }) => {
  return (
    <Fragment>
      <OutcomeRightStatBar value={value} maxValue={maxValue} />
      <OutcomeRightStatNumber value={value} isPicked={isPicked} />
    </Fragment>
  )
}

const OutcomeRightStatBar = ({ value, maxValue }) => {
  const width = {
    width: (value/maxValue)*100 + '%'
  }

  return <div style={width} className="stats-bars"></div>
}

const OutcomeRightStatNumber = ({ value, isPicked }) => {
  return (
    <div className="has-text-right is-monospace is-size-5 stats-numbers">
      <span className={(isPicked ? 'is-bold' : 'is-semi-bold')}>{value}</span>
    </div>
  )
}

const OutcomeContainer = ({ children }) => {
  return (
    <div className="field has-addons">
      <p className="control is-relative">
        <a className="button is-static is-large outcome-left">
          {children[0]}
        </a>
      </p>
      <div className="control is-expanded outcome-right">
        {children[2]}
        {children[1]}
      </div>
    </div>
  )
}