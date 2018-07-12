import React from 'react'

import './Control.scss'

export const ToggleText = ({ theDefaultActive, theOther, toggled, handleToggle, alignLeft=true }) => {
  return (
    <div className={'has-text-weight-bold toggle ' +
        (alignLeft ? 'has-text-left' : 'has-text-right')}>
      <ToggleElement active={!toggled} handleClick={handleToggle}>
        {theDefaultActive}
      </ToggleElement>
      <ToggleElement active={toggled} handleClick={handleToggle}>
        {theOther}
      </ToggleElement>
    </div>
  )
}

export const ToggleElement = ({ active, handleClick, children }) => {
  return (
    <p>
      <a className={(active ? 'has-text-grey' : 'has-text-grey-light') + ' is-unselectable'}
        onClick={() => { return active ? null : handleClick() }}>
        {children}
      </a>
    </p>
  )
}

export const Select = ({ index, onChange, isSelected, ...other }) => {
  return <input type="radio" onChange={onChange} checked={isSelected} value={index} {...other} />
}