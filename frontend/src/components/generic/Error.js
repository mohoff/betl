import React from 'react'

import './Error.scss'

const ErrorSymbol = () => {
  return <p className="has-text-centered has-text-primary has-font-primary is-size-1">!</p>
}

export const ErrorPage = ({ subject, children }) => {
  return (
    <div className="is-fullwidth has-text-centered error-container">
      <ErrorSymbol />
      <p className="is-size-4 error-subject">
        {subject}
      </p>
      <p className="is-italic is-size-6 error-text">  
        {children}
      </p>
    </div>
  )
}