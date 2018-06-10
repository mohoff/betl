import React, { Component } from 'react'

class Host extends Component {

  constructor(props) {
    super(props)
    this.hostId = props.match.params.hostId
  }
  
  render() {
    return (
      <div>
        {this.hostId}<br/>
        
      </div>

    );
  }
}

//<Route exact path={round} render={() => (
 //     <h3>Please select a round.</h3>
//    )}/>
export default Host