import React from 'react'

export const Heading = ({ children }) => {
  return (
    <div className="field headline">
      <label className="label is-large">{children}</label>
    </div>
  )
}