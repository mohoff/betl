import React, { Fragment } from 'react'

import {
  InputTextStatic,
  Select
} from '../generic'

import './RoundOutcomesWithStats.scss'


export const RoundOutcomesWithStats = ({ status, numOutcomes, outcomes, winShares, stats, statsSum, selectedIndex, handleSelect }) => {
  let outcomesArray = []
  const isDecided = status === 4

  for (let i=0; i<numOutcomes; i++) {
    const isHostPicked = winShares[i] > 0
    const isUserSelected = selectedIndex === i

    outcomesArray.push(
      <div key={String(i+1)} className="field">    
        <OutcomeContainer>
          <OutcomeLeft
            status={status}
            index={i}
            isPicked={isHostPicked}
            isSelected={isUserSelected}
            winShare={winShares[i]}
            handleSelect={handleSelect} />
          <OutcomeText
            isPicked={isHostPicked}
            isBetDecided={isDecided}>
            {outcomes[i]}
          </OutcomeText>
          <OutcomeRight
            index={i}
            isPicked={isDecided && isHostPicked}
            value={stats[i]}
            maxValue={statsSum} />
        </OutcomeContainer>
      </div>
    )
  }

  return outcomesArray
}

const OutcomeLeft = ({ status, index, isHostPicked, isUserSelected, winShare, handleSelect }) => {
  switch (status) {
    case 1:
      return (
        <Fragment>
          <i className={'fas ' + (isHostPicked ? 'fa-check has-text-primary' : 'fa-times has-text-grey-light')}></i>
          {isHostPicked && 
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
          onChange={handleSelect}
          isSelected={isUserSelected} />
      )
    default:
      return null
  }
}

const OutcomeText = ({ children, isHostPicked, isBetDecided }) => {
  let extraStyle
  if (isBetDecided) {
    extraStyle = isHostPicked
      ? 'is-bold'
      : 'is-striked-through'
  }

  return children
    ? <InputTextStatic
        value={children}
        className={'outcome ' + extraStyle} />
    : null  
}

const OutcomeRight = ({ index, isHostPicked, value, maxValue }) => {
  return (
    <Fragment>
      <OutcomeRightStatBar value={value} maxValue={maxValue} />
      <OutcomeRightStatNumber value={value} isPicked={isHostPicked} />
    </Fragment>
  )
}

const OutcomeRightStatBar = ({ value, maxValue }) => {
  const width = {
    width: maxValue > 0
      ? (value/maxValue)*100 + '%'
      : 0 + '%'
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
        <a className="button is-large outcome-left">
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