import React from 'react'


export const HeadingSection = ({ children }) => {
  return <Heading>{children}</Heading>
}

export const Heading = ({ containerClassNames, headingClassNames, children }) => {
  const containerStyle = ['field', containerClassNames].join(' ')
  const headingStyle = ['label', 'is-large', headingClassNames].join(' ')

  return (
    <div className={containerStyle}>
      <label className={headingStyle}>{children}</label>
    </div>
  )
}

export const HeadingPrimary = ({ children }) => {
  return <Heading headingClassNames="has-text-primary">{children}</Heading>
}