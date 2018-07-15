import React from 'react'

import { TimeUtils } from '../../utils'


export const RoundTimes = ({ createdAt, endedAt, timeoutAt }) => {
  const getTimes = () => {
    if (endedAt) {
      return <p>ended {TimeUtils.getRelativeTime(endedAt)}</p>
    }
    if (timeoutAt && timeoutAt <= TimeUtils.NOW) {
      return <p>timed out {TimeUtils.getRelativeTime(timeoutAt)}</p>
    }
    return (
      <div>
        <p>created {TimeUtils.getRelativeTime(createdAt)}</p>
        {
          timeoutAt &&
          <p>timeout {TimeUtils.getRelativeTime(timeoutAt)}</p>
        }
      </div>
    )
  }

  return (
    <div className="has-text-right is-italic is-regular has-text-grey round-times is-size-7">
      {getTimes()}
    </div>
  )
}