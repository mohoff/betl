import React, { Fragment } from 'react'

export const RoundHeader = (props) => {
  return (
    <Fragment>
      <HostAsks
        hostAddress={props.hostAddress}
        hostName={props.hostName} />
      <Question>{props.question}</Question>
      <RoundTimes
        createdAt={props.createdAt}
        timeoutAt={props.timeoutAt} />
    </Fragment>
  )
}