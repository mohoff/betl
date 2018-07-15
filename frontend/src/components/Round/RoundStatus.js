import React from 'react'

import { ButtonPrimary } from '../generic'


export const UNDEFINED = 0
export const SCHEDULED = 1
export const OPEN = 2
export const CLOSED = 3
export const FINISHED = 4
export const CANCELLED = 5
export const TIMEOUT = 6

export const RoundStatus = ({ status, handleClaim }) => {
  switch(status) {
    case null:
      return <RoundStatusLoading />
    case SCHEDULED:
      return <RoundStatusScheduled />
    case OPEN:
      return <RoundStatusOpen />
    case CLOSED:
      return <RoundStatusClosed />
    case FINISHED:
      return <RoundStatusFinished handleClaim={handleClaim} />
    case CANCELLED:
      return <RoundStatusCancelled handleClaim={handleClaim} />
    case TIMEOUT:
      return <RoundStatusTimeout handleClaim={handleClaim} />
    default:
      // also applies for `case UNDEFINED`
      return <RoundStatusUndefined />
  }
}


const RoundStatusLoading = () => {
  return <RoundStatusInfo className="is-italic">Loading...</RoundStatusInfo>
}

const RoundStatusScheduled = () => {
  return <RoundStatusInfo>Round will open at TIME</RoundStatusInfo>
}

const RoundStatusOpen = () => {
  return <RoundStatusInfo>Place your bets!</RoundStatusInfo>
}

const RoundStatusClosed = () => {
  return <RoundStatusInfo>Round is closed! Host has to pick a winner now</RoundStatusInfo>
}

const RoundStatusFinished = ({ handleClaim }) => {
  return (
    <RoundStatusInfo>
      Round is finished! Claim your reward now!
      <div className="control">
        <ButtonPrimary onClick={handleClaim}>
            Claim reward
        </ButtonPrimary>
      </div>
    </RoundStatusInfo>
  )
}

const RoundStatusTimeout = () => {
  return <RoundStatusInfo>Round timed out! Claim your refund now</RoundStatusInfo>
}

const RoundStatusCancelled = () => {
  return <RoundStatusInfo>Round is cancelled! Claim your refund now</RoundStatusInfo>
}

const RoundStatusUndefined = () => {
  return <RoundStatusInfo>Round is inactive Please come back later</RoundStatusInfo>
}

const RoundStatusInfo = (props) => {
  return (
    <div className="has-text-centered">
      {props.children}
    </div>
  )
}