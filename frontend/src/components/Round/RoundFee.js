import React from 'react'


export const RoundFee = ({ fee }) => {
  return fee
    ? <p class="help has-text-centered is-italic has-text-primary">
        Host charges a fee of {fee}%
      </p>
    : null
}