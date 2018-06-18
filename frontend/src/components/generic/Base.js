import React from 'react'

export const Heading = ({ children }) => {
  return (
    <div className="field headline">
      <label className="label is-large">{children}</label>
    </div>
  )
}

export const InputText = (props) => {
  return <Input type="text" {...props} />
}

export const InputNumber = (props) => {
  return <Input type="number" {...props} />
}

const Input = ({ value, placeholder, onChange, ...other }) => {
  return (
    <input
      className="input is-large"
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      {...other}
    />
  )
}

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

export const WelcomeHost = ({ children, isDeletable, ...other }) => {
  if (!children) {
    return null
  }

  return (
    <div>
      <div className="title">
        Welcome back <span className="has-text-primary">{children}</span>
        {isDeletable && <DeleteInline {...other} />}
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
        {isDeletable && <DeleteInline {...other} />}
      </div>
      <hr />
    </div>
  )
}

const DeleteInline = ({ isLoading, handleDelete }) => {
  return (
    <a
      className={(isLoading ? 'dismiss-spinner' : 'delete')}
      onClick={handleDelete}
    >&nbsp;</a>
  )
}

