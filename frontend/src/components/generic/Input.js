import React from 'react'


export const InputText = (props) => {
  return <Input type="text" {...props} />
}

export const InputTextStatic = ({ value, className, ...other }) => {
  return <InputText className={['is-static', className].join(' ')} defaultValue={value} {...other} />
}

export const InputNumber = (props) => {
  return <Input type="number" {...props} />
}

// Not exported since not needed so far
const Input = ({ value, placeholder, onChange, className, ...other }) => {
  const style = [className, 'input', 'is-large'].join(' ')
  return (
    <input
      className={style}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      {...other}
    />
  )
}