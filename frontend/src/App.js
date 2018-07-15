import React, { Component } from 'react'
import {
  BrowserRouter,
  Switch,
  Route
} from 'react-router-dom'
import { hot } from 'react-hot-loader'

import Web3Wrapper from './components/Web3Wrapper.js'
import {
  Header,
  Footer
} from './components/sections'
import {
  Create,
  Home,
  Host,
  Join,
  Round,
  NotFound
} from './components'


class App extends Component {
  render = () => {
    return (
      <div>
        <BrowserRouter>
          <div>
            <Header />  
            <Web3Wrapper>
              <Switch>
                <Route exact path="/"
                  component={Home}/>
                <Route path="/create"
                  component={Create}/>
                <Route path="/join"
                  component={Join}/>
                <Route path="/:hostId/:roundId"
                  component={Round}/>
                <Route path="/:hostId"
                  render={Host}/>
                <Route component={NotFound} />
              </Switch>
            </Web3Wrapper>
            <Footer />
          </div>
        </BrowserRouter>
      </div>
    )
  }
}

export default hot(module)(App)