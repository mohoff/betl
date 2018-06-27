import React from 'react'
import './Loader.sass'



export const LoadingMetamask = () => {
  return <LoadingFullwidth>Detecting Metamask...</LoadingFullwidth>
}

export const LoadingFullwidth = ({ children }) => {
  return (
    <div className="is-fullwidth">
      <Loading className="loader-page">
        {children}
      </Loading>
    </div>
  )
}

const Loading = ({ className, children }) => {
  return (
    <div>
      <span className={className}></span>
      {children && 
        <p className="is-italic has-text-centered">
          {children}
        </p>
      }
    </div>
  )
}


