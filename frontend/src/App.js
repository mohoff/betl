import React, { Component } from 'react'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from 'react-router-dom'
import { hot } from 'react-hot-loader'

import './App.css'

import Header from './components/sections/Header.js'
import Footer from './components/sections/Footer.js'
import Home from './components/Home.js'
import Create from './components/Create.js'
import Join from './components/Join.js'
import Host from './components/Host.js'
import HostRound from './components/HostRound.js'
import NotFound from './components/NotFound.js'

const App = () => (
  <div>
    <Header />
    <Router>
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
          component={Host}/>
        <Route component={NotFound} />
      </Switch>
    </Router>
    <Footer />
  </div>
)

export default hot(module)(App)