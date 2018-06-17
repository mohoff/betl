const MnemonicWalletSubprovider = require('@0xproject/subproviders').MnemonicWalletSubprovider
const RPCSubprovider = require('web3-provider-engine/subproviders/rpc')
const Web3ProviderEngine = require('web3-provider-engine')
const Web3Wrapper = require('@0xproject/web3-wrapper').Web3Wrapper
const Web3 = require('web3')
const ContractDeployer = require('./contract-builder.js')
const fs = require('fs')

const NETWORK_ID = 4
const INFURA_API_KEY = fs.readFileSync('./infura.txt', 'utf8')
const MNEMONIC = fs.readFileSync('./mnemonic.txt', 'utf8')
const POLLING_MS = 500

const networkNames = new Map([
    [ 1, 'mainnet' ],
    [ 3, 'ropsten' ],
    [ 4, 'rinkeby' ],
    [ 42, 'kovan' ]
]);


const mnemonicWalletSubprovider = new MnemonicWalletSubprovider({ mnemonic: MNEMONIC})
//const injectedWeb3Subprovider = new InjectedWeb3Subprovider(window.web3.currentProvider) // browser
const localRpcSubprovider = new RPCSubprovider({
    rpcUrl: 'http://localhost:8545'
})
const infuraRpcSubprovider = new RPCSubprovider({
    rpcUrl: 'https://' + networkNames.get(NETWORK_ID) + '.infura.io/' + INFURA_API_KEY
})


const providerEngine = new Web3ProviderEngine()
providerEngine.addProvider(mnemonicWalletSubprovider)
providerEngine.addProvider(infuraRpcSubprovider)
providerEngine.start();


const web3Wrapper = new Web3Wrapper(providerEngine)
const web3 = new Web3(providerEngine)


main = async () => {
    // Init
    console.log('Using network: ' + networkNames.get(NETWORK_ID))
    console.log('Running with Mnemonic path: ' + mnemonicWalletSubprovider.getPath())
    const addresses = await mnemonicWalletSubprovider.getAccountsAsync(1)
    const owner = addresses[0]

    // Deploy contract
    var artifact = require('../build/contracts/Betl.json')
    var instance = await new ContractDeployer(artifact.abi)
        .withBytecode(artifact.bytecode)
        // .withLibrary({
        //     name: 'oraclizeLib',
        //     address: '0xa8756f50c2069dEb913feEecf9abC68850f82C2c'.toLowerCase()
        // })
        .withFrom(owner)
        .withGas(4000000)
        .withGasPrice(10e9)
        .awaitInstance(web3, web3Wrapper)
    console.log('Contract deployed!' + instance.address)
    console.log(instance)
    process.exit()
}
main().catch(console.error)