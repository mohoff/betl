import React from 'react'


export const ButtonDelete = ({ onClick, children, ...other }) => {
  return (
    <button
      className="delete is-large"
      onClick={onClick}
      {...other} >
        {children}
    </button>
  )
}

export const ButtonDeleteInline = ({ onClick, isLoading }) => {
  return (
    <a
      className={(isLoading ? 'dismiss-spinner' : 'delete')}
      onClick={onClick}
    >&nbsp;</a>
  )
}

export const Button = ({ isLoading, isDisabled, onClick, className, children, ...other }) => {
  return (
    <button
      className={['button is-large', className].join(' ') + (isLoading ? ' is-loading' : '')}
      disabled={isDisabled}
      onClick={onClick}
      {...other} >
        {children}
    </button>
  )
}

export const ButtonPrimary = (props) => {
  return (
    <div className="control has-text-centered">
      <Button {...props} className="is-primary is-outlined" />
    </div>
  )
}