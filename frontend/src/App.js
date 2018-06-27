import React, { Component } from 'react'
import {
  BrowserRouter,
  Switch,
  Route
} from 'react-router-dom'
import { hot } from 'react-hot-loader'

import './App.css'

import Web3Wrapper from './components/Web3Wrapper.js'
import Header from './components/sections/Header.js'
import Footer from './components/sections/Footer.js'
import Home from './components/Home.js'
import Create from './components/Create.js'
import Join from './components/Join.js'
import Host from './components/Host.js'
import HostRound from './components/HostRound.js'
import NotFound from './components/NotFound.js'

class App extends Component {
  render = () => {
    return (
      <div>
        <Web3Wrapper>
          <BrowserRouter>
            <div>
              <Header />           
              <Switch>
                <Route exact path="/"
                  component={Home}/>
                <Route path="/create"
                  component={Create}/>
                <Route path="/join"
                  component={Join}/>
                <Route path="/:hostId/:roundId"
                  component={HostRound}/>
                <Route path="/:hostId"
                  render={Host}/>
                <Route component={NotFound} />
              </Switch>
              <Footer />
            </div>
          </BrowserRouter>
        </Web3Wrapper>
      </div>
    )
  }
}

export default hot(module)(App)