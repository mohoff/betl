import React, { Component } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

class Header extends Component {
  render = () => {
    return (
      <div className="header">
        <Link to="/">
          <h1>betl</h1>
        </Link>
        <div className="content has-text-centered">
          <p className="subheader has-text-primary">
            Play and bet in your online community
          </p>
        </div>
      </div>
    )
  }
}


export default Header