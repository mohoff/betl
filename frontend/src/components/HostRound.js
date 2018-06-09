import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Route,
  Link
} from 'react-router-dom'


class HostRound extends Component {

  constructor(props) {
  	super(props)
    this.hostId = props.match.params.hostId
    this.roundId = props.match.params.roundId
  }
  
  render() {
    return (
      <div>
        {this.hostId}<br/>
        {this.roundId}
      </div>

    );
  }
}

//<Route exact path={round} render={() => (
 //     <h3>Please select a round.</h3>
//    )}/>
export default HostRound