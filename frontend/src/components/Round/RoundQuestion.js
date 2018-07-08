import React from 'react'


export const RoundQuestion = ({ children }) => {
  return (
    <h2 className="has-text-primary is-bold is-italic question">
      "{children}"
    </h2>
  )
}