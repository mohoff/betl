class Contract {
    constructor(abi) {
        this.abi = abi
        this.bytecode = ''
        this.libraries = []
        this.constructorArgs = []
        this.options = {}

        this.wrapper = {}
        this.txHash = ''
    }
    static link(bytecode, libraries) {
        for (let lib of libraries) {
            var regex = new RegExp("__" + lib.name + "_+", "g");
            bytecode = bytecode.replace(regex, lib.address.replace("0x", ""));
        }
        return String(bytecode)
    }
    deploy(web3) {
        this.bytecode = Contract.link(this.bytecode, this.libraries)
        this.wrapper = new web3.eth.Contract(this.abi)

        console.log('...deploying with options: \n' + this.options)

        return new Promise((resolve, reject) => {
            this.wrapper.deploy({
                data: this.bytecode,
                arguments: this.constructorArgs
            }).send(this.options)
            .on('transactionHash', (txHash) => {
                this.txHash = txHash
                console.log(' > Transaction submitted! TxHash: ' + txHash)
                resolve(txHash)
            }).catch(err => {
                console.log('...Error. Okay if you\'re using Infura and get a txHash back')
            })
        });
    }
    deployRemix(web3) {
        this.wrapper = web3.eth.contract(this.abi);
        return new Promise((resolve, reject) => {
            var betfactory = this.wrapper.new(
                {
                  from: this.options.from, 
                  data: this.bytecode, 
                  gas: this.options.gas
                }, function (e, contract){
                    resolve(contract.transactionHash)
                }
            )
        })
    }
    atAddress(address) {
        this.wrapper.options.address = address
    }
}

class ContractDeployer {
    static async successfullyMinedContract(web3Wrapper, txHash, pollingMS) {
        return new Promise(async (resolve, reject) => {
            let result = await web3Wrapper.awaitTransactionMinedAsync(txHash, pollingMS)
            if(result.status == 1) {
                console.log(' > Transaction successfully mined! TxHash: ' + txHash)
                resolve(result.contractAddress)
            } else {
                console.log('...Transaction failed! TxHash: ' + txHash)
                reject()
            }
        })
    }

    constructor(abi, pollingMillis = 500) {
        this.contract = new Contract(abi)
        this.POLLING_MS = pollingMillis
    }
    atAddress(address) {
        this.contract.wrapper.options.address = address.toLowerCase()
    }
    withBytecode(bytecode) {
        this.contract.bytecode = bytecode
        return this
    }
    withFrom(address) {
        this.contract.options.from = address.toLowerCase()
        return this
    }
    withGas(gas) {
        this.contract.options.gas = gas
        return this
    }
    withGasPrice(gasPrice) {
        this.contract.options.gasPrice = gasPrice
        return this
    }
    withOptions(options) {
        this.contract.options = options
        return this
    }
    withLibrary(library) {
        this.contract.libraries.push(library)
        return this
    }
    withLibraries(libraries) {
        this.contract.libraries = libraries
        return this
    }
    withConstructorArgs(args) {
        this.contract.constructorArgs = args
        return this
    }
    deployAsync(web3) {
        return this.contract.deploy(web3)
    }
    async awaitAddress(web3, web3Wrapper) {
        const txHash = await this.deployAsync(web3)
        return ContractDeployer.successfullyMinedContract(web3Wrapper, txHash, this.POLLING_MS)
    }
    async awaitInstance(web3, web3Wrapper) {
        let address = await this.awaitAddress(web3, web3Wrapper)
        this.contract.wrapper.options.address = address.toLowerCase();
        return this.contract.wrapper
    }
    async awaitInstanceRemix(web3, web3Wrapper) {
        var txHash = await this.contract.deployRemix(web3)
        let address = await ContractDeployer.successfullyMinedContract(web3Wrapper, txHash, this.POLLING_MS)
        return this.contract.wrapper.at(address.toLowerCase());
    }
}

module.exports = ContractDeployer;