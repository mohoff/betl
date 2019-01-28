require('dotenv').config()
const HDWalletProvider = require('truffle-hdwallet-provider')

const getProvider = networkString => {
  return new HDWalletProvider(
    process.env.MNEMONIC,
    `https://${networkString}.infura.io/v3/${process.env.INFURA_API_KEY}`,
    0
  )
}

module.exports = {
  networks: {
    mainnet: {
      provider: getProvider('mainnet'),
      network_id: 3,
      gas: 7e6
    },
    ropsten: {
      provider: getProvider('ropsten'),
      network_id: 3,
      gas: 7e6
    },
    rinkeby: {
      provider: getProvider('rinkeby'),
      network_id: 4,
      gas: 7.6e6
    },
    kovan: {
      provider: getProvider('kovan'),
      network_id: 42,
      gas: 7.9e6
    },
    // ganache setup
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*',
      gas: 20e6
    }
  },

  /**
   * Advanced settings
   *   port: 8777,             // Custom port
   *   network_id: 1342,       // Custom network
   *   gas: 8500000,           // Gas sent with each transaction (default: ~6700000)
   *   gasPrice: 20000000000,  // 20 gwei (in wei) (default: 100 gwei)
   *   from: <address>,        // Account to send txs from (default: accounts[0])
   *   websockets: true        // Enable EventEmitter interface for web3 (default: false)
   *   confirmations: 2,    // # of confs to wait between deployments. (default: 0)
   *   timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
   *   skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
   */

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.5.3',
      docker: false,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      },
      evmVersion: 'byzantium'
    } //,
    // external: {
    //   command: './compile-contracts',
    //   targets: [
    //     {
    //       path: './path/to/artifacts/*.json'
    //     }
    //   ]
    // }
  }
}
