import React from 'react'

export const InputText = (props) => {
  return <Input type="text" {...props} />
}

export const InputNumber = (props) => {
  return <Input type="number" {...props} />
}

// Not exported since not needed so far
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