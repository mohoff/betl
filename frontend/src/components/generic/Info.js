import React from 'react'


export const ActionResult = ({ isSuccess, children }) => {
  if (!children) return null

  return isSuccess
    ? <InfoSuccess>{children}</InfoSuccess>
    : <InfoError>{children}</InfoError>
}

export const InfoSuccess = ({ children }) => {
  return <Info className="has-text-success">{children}</Info>
}

export const InfoError = ({ children }) => {
  return <Info className="has-text-danger">{children}</Info>
}

const Info = ({ className, children }) => {
  return (
    <p
      className={['has-text-centered is-bold', className].join(' ')} >
      {children}
    </p>
  )
}