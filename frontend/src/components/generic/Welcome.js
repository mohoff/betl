import React from 'react'

import { ButtonDeleteInline } from './Button'


export const WelcomeHost = ({ children, isDeletable, ...other }) => {
  if (!children) {
    return null
  }

  return (
    <div>
      <div className="title">
        Welcome back <span className="has-text-primary">{children}</span>
        {isDeletable && <ButtonDeleteInline {...other} />}
      </div>
      <hr />
    </div>
  )
}

// use for betting page
export const WelcomeUser = ({ isDeletable, children, ...other }) => {
  if (!children) {
    return null
  }
  return (
    <div>
      <div className="title">
        Hi {children}
        {isDeletable && <ButtonDeleteInline {...other} />}
      </div>
      <hr />
    </div>
  )
}

