import React, { Component } from 'react'
import { MetaMaskNotAvailable, MetaMaskWrongNetwork, MetaMaskNotLoggedIn } from './MetaMaskErrors'
import MetaMaskLoading from './MetaMaskLoading'
import Web3 from 'web3'
import TruffleContract from 'truffle-contract'

const POLLING_INTERVAL_MS = 500
export const Web3Context = React.createContext();

class Web3Wrapper extends Component {
  constructor(props) {
    super(props)
    this.state = {
      betl: {
        address: process.env.REACT_APP_BETL_ADDRESS,
        instance: null
      }
      web3: null,
      provider: null,
      currentNetwork: null,
      targetNetwork: Number(process.env.REACT_APP_TARGET_NETWORK_ID),
      account: null,
      balance: null
    }
  }

  componentWillMount = async () => {
    this.initWeb3()
    this.initBetl()
    this.startPollingMetaMaskStatus()
  }

  initBetl = async () => {
    const registryArtifact = require('../../../smart-contract/build/contracts/BetRegistry.json')
    let contract = TruffleContract(registryArtifact)
    contract.setProvider(this.state.state.provider)

    const instance = contract.at(context.state.registry.address)

    this.setState(prevState => {
      const initedBetl = prevState.betl
      initedBetl.instance = instance
      return {
        betl: initedBetl
      }
    })
  }

  startPollingMetaMaskStatus = () => {
    if (!this.pollingInterval) {
      this.pollingInterval = setInterval(this.updateMetaMaskStatus, POLLING_INTERVAL_MS);
    }
  }

  updateMetaMaskStatus = () => {
    this.updateAccounts()
     this.updateCurrentNetwork()
  }

  updateAccounts = () => {
    this.state.web3 && this.state.web3.eth && this.state.web3.eth.getAccounts().then((accounts) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        const acc = accounts[0].toLowerCase()
        if (this.state.account !== acc) {
          this.setState({ account: acc })
          this.updateBalance()
        }
      } else {
        this.setState({ account: '' })
      }
    }).catch(err => {
      this.setState({ account: '' })
    })
  }

  updateBalance = () => {
    if(this.state.account !== '') {
      this.state.web3 && this.state.web3.eth && this.state.web3.eth.getBalance(this.state.account).then(balance => {
        this.setState({
          balance: Number(this.state.web3.utils.fromWei(balance)).toFixed(3)
        })
      }).catch(err => {
        console.warn("Failed to read account balance.")
        this.setState({ balance: '' })
      })
    } else {
      this.setState({ balance: '' })
    }
  }

  updateCurrentNetwork = () => {
    this.state.web3 && this.state.web3.eth && this.state.web3.eth.net.getId().then((network) => {
      if (this.state.currentNetwork !== network) {
        this.setState({ currentNetwork: network })
        this.updateBalance()  
      }
    }).catch(err => {
      console.warn('Failed to read current network from Metamask.')
      this.setState({ currentNetwork: '' })
    })
  }

  initWeb3 = () => {
    if (typeof window.web3 !== 'undefined') {
      this.setState({
            provider: window.web3.currentProvider,
            web3: new Web3(window.web3.currentProvider)
      })
    } else {
      console.warn('No Web3 provider detected. Is MetaMask browser installed?')
    }
  }

  isInitialMetaMaskCheckDone = () => {
    return this.state.web3 !== null && this.state.account !== null &&  this.state.currentNetwork !== null
  }

  render = () => {
    if (this.isInitialMetaMaskCheckDone()) {
      if (this.state.web3 === '') {
        return ( <MetaMaskNotAvailable /> )
      }

      if (this.state.account === '') {
        return ( <MetaMaskNotLoggedIn /> )
      }
      if (this.state.currentNetwork === '' || this.state.currentNetwork !== this.state.targetNetwork) {
        return ( <MetaMaskWrongNetwork
                    target={this.state.targetNetwork}
                    current={this.state.currentNetwork} /> )
      }

      const context = {
        ...this.state,
        isAddress: this.isAddress,
        getNameFromAddress: this.getNameFromAddress
      }

      return (
        <Web3Context.Provider value={context}>
          {this.props.children}
        </Web3Context.Provider>
      )
    } else {
      return ( <MetaMaskLoading />)
    }
  }

  isAddress = (str) => {
    return this.state.web3.utils.isAddress(str)
  }

  getNameFromAddress = (address) => {
    return new Promise((resolve, reject) => {
      // betlInstance.names(address).then(r => {
      //   if (r == '') {
      //     reject()
      //   }
      //   resolve(r)
      // })
      resolve('')
    })
  }

}


export default Web3Wrapper