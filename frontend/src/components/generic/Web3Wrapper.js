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
        address: process.env.REACT_APP_BETL_ADDRESS.toLowerCase(),
        instance: null
      },
      web3: null,
      provider: null,
      currentNetwork: null,
      targetNetwork: Number(process.env.REACT_APP_TARGET_NETWORK_ID),

      userAddress: null,
      userBalance: null,
      userName: null,

      ethPrices: {
        USD: null,
        EUR: null
      }
    }
  }

  componentWillMount = async () => {
    await this.initWeb3()
    this.initBetl()
    this.startPollingMetaMaskStatus()
  }

  componentDidMount = () => {
    this.fetchPrice('USD')
    this.fetchPrice('EUR')
  }

  fetchPrice = (currency) => {
    fetch(process.env.REACT_APP_ETH_PRICE_API).then(r => {
      return r.json()
    }).then(json => {
      return json.data.quotes[currency]
    }).then(fiat => {
      this.setState(prevState => {
        let ethPrices = prevState.ethPrices
        ethPrices[currency] = fiat
        return ethPrices
      })
    })
  }

  initWeb3 = () => {
    return new Promise((resolve, reject) => {
      if (typeof window.web3 !== 'undefined') {
        this.setState({
              provider: window.web3.currentProvider,
              web3: new Web3(window.web3.currentProvider)
        })
        resolve()
      } else {
        console.warn('No Web3 provider detected. Is MetaMask browser installed?')
        reject()
      }
    })
  }

  initBetl = () => {
    const registryArtifact = require('./Betl.json')
    let contract = TruffleContract(registryArtifact)
    contract.setProvider(this.state.provider)
    const instance = contract.at(this.state.betl.address)

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
    this.updateUserAddress()
    this.updateCurrentNetwork()
  }

  updateUserAddress = () => {
    this.state.web3 && this.state.web3.eth && this.state.web3.eth.getAccounts().then((accounts) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        const address = accounts[0].toLowerCase()
        if (this.state.userAddress !== address) {
          this.setState({ userAddress: address })
          this.updateUserBalance(address)
          this.updateUserName(address)
        }
      } else {
        this.setState({ userAddress: '' })
      }
    }).catch(err => {
      this.setState({ userAddress: '' })
    })
  }

  updateUserBalance = (address) => {
    if (address !== '') {
      this.state.web3 && this.state.web3.eth && this.state.web3.eth.getBalance(address).then(balance => {
        this.setState({
          userBalance: Number(this.state.web3.utils.fromWei(balance)).toFixed(3)
        })
      }).catch(err => {
        console.warn("Failed to read user balance.")
        this.setState({ userBalance: '' })
      })
    } else {
      this.setState({ userBalance: '' })
    }
  }

  updateCurrentNetwork = () => {
    this.state.web3 && this.state.web3.eth && this.state.web3.eth.net && 
        this.state.web3.eth.net.getId().then((network) => {
      if (this.state.currentNetwork !== network) {
        this.setState({ currentNetwork: network })
        this.updateUserBalance(this.state.userAddress)
        this.updateUserName(this.state.userAddress)  
      }
    }).catch(err => {
      console.warn('Failed to read current network from Metamask.')
      this.setState({ currentNetwork: '' })
    })
  }

  updateUserName = async (address) => {
    if (address !== '') {
      const userName = await this.getUserName(address)
      this.setState({ userName: userName })
    } else {
      this.setState({ userName: '' })
    }
  }

  getUserName = (address) => {
    return new Promise((resolve, reject) => {
      this.state.betl.instance.hostNames(address).then(hexName => {
        let name = this.state.web3.utils.hexToUtf8(hexName)
        this.setState({ userName: name })
        resolve(name)
      }).catch(err => {
        console.warn("Failed to read user name.")
        this.setState({ userName: '' })
        resolve('')
      })
    })
  }

  getUserAddress = (name) => {
    return new Promise((resolve, reject) => {
      this.state.betl.instance.hostAddresses(name).then(address => {
        resolve(address)
      }).catch(err => {
        console.warn("Failed to read user address.")
        resolve('')
      })
    })
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
        web3: this.state.web3,
        betl: this.state.betl.instance,
        userAddress: this.state.userAddress,
        userBalance: this.state.userBalance,
        userName: this.state.userName,
        ethPrices: this.state.ethPrices,
        isAddress: this.isAddress,
        updateUserName: this.updateUserName,
        getUserName: this.getUserName,
        getUserAddress: this.getUserAddress,
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

  getGas = (txName) => {
    switch (txName) {
      case 'deleteRecord':
        return 90000
      default:
        return 100000
    }
  }

  getGasPrice = (txName) => {
    switch (txName) {
      case 'bet':
        return 20e9
      default:
        return 8e9
    }
  }

  getOptions = (txName) => {
    return {
      from: this.account,
      gas: this.getGas(txName),
      gasPrice: this.getGasPrice(txName)
    }
  }

}


export default Web3Wrapper