var Web3 = require('web3')
var TruffleContract = require('truffle-contract')
var HDWalletProvider = require('truffle-hdwallet-provider')
var fs = require('fs')

const mnemonic = fs.readFileSync('./mnemonic.txt', 'utf8', function(err, data) {
  if (err) throw err
  console.log(data)
})

const provider = new HDWalletProvider(mnemonic, 'http://localhost:8545', 0, 5)
const web3 = new Web3(provider)

const owner = '0x4f3e7B7900e1352a43EA1a6aA8fc7F1FC03EfAc9'.toLowerCase() //acc1

function fixTruffleContractCompatibilityIssue(contract) {
  if (typeof contract.currentProvider.sendAsync !== 'function') {
    contract.currentProvider.sendAsync = function() {
      return contract.currentProvider.send.apply(
        contract.currentProvider,
        arguments
      )
    }
  }
  return contract
}

var jsonBlob = require('../build/contracts/Betl.json')
var Betl = TruffleContract(jsonBlob)
Betl.setProvider(provider)
Betl.defaults({
  gasPrice: 6e9,
  from: owner
})
fixTruffleContractCompatibilityIssue(Betl)

const BETL_ADDRESS = '0x0b99C29F10F0D48808218292c24e39f6cF64d8e6'

runScript = async () => {
  // Unlock owner account
  //console.log('Unlock owner account: ' + await web3.eth.personal.unlockAccount(owner, 'test'))

  var instance = Betl.at(BETL_ADDRESS)

  const options = ['asdf', 'baerhrth']
  const configData = [60 * 5, 1e10, 0]
  const payoutTiers = []
  const hasFlexOption = true

  console.log('calling function')
  var result = await instance.createRound(
    options,
    configData,
    payoutTiers,
    hasFlexOption
  )
  console.log('Finished!')
}

runScript().catch(err => console.log(err))
