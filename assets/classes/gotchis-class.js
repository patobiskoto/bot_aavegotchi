let contractPet, contractGotchi, operatorWallet, ethers;

module.exports = (_contractPet, _contractGotchi, _operatorWallet, _ethers) => {
    contractPet = _contractPet;
    contractGotchi = _contractGotchi;
    operatorWallet = _operatorWallet;
    ethers = _ethers;
    return Gotchis;
}

let Gotchis = class {
    
    static process(address) {
        Gotchis.isPetOperatorForAll(address)
            .then(Gotchis.getGotchis)
            .then(Gotchis.needToBePet)
            .then(Gotchis.fillTx)
            .then(Gotchis.pet)
            .then(console.log)
            .catch((err) => console.log(err.message));
    }

    static isPetOperatorForAll(address) {
        return new Promise((resolve, reject) => {
            if (address) {
                contractGotchi.functions.isPetOperatorForAll(address, operatorWallet.address).then((result) => {
                    if (result[0] == true) {
                        resolve(address);
                    } else {
                        reject(new Error(operatorWallet.address + ' is not set as operator for address ' + address));
                    }
                })
            } else {
                reject(new Error('wrong address : ' + address));
            }
        });
    }

    static getGotchis(address) {
        return new Promise((resolve, reject) => {
            if (address) {
                contractGotchi.functions.allAavegotchisOfOwner(address).then((result) => {
                    if (result[0].length > 0) {
                        resolve({
                            address: address,
                            gotchis: result[0]
                        });
                    } else {
                        reject(new Error('No Gotchis found on ' + address))
                    }
                    
                }).catch((err) => reject(err));
            } else {
                reject(new Error('wrong address : ' + address));
            }
        });
    }

    static needToBePet(result) {
        return new Promise((resolve, reject) => {
            var gotchiToPet = []
            for (let i = 0; i < result.gotchis.length; i++) {
                let lastInteracted = result.gotchis[i]['lastInteracted'] * 1000;
                let timeRemaining = lastInteracted + 43200000 - Date.now();

                timeRemaining < 0 ? (
                    console.log(result.address + ' : gotchi named ' + result.gotchis[i]['name'] + ' need to be pet !'),
                    gotchiToPet.push(parseInt(result.gotchis[i].tokenId))
                 ) : (
                    console.log(result.address + ' : gotchi named ' + result.gotchis[i]['name'] + ' is already happy fren =)')
                    // debug : remove when prod
                    // gotchiToPet.push(parseInt(result.gotchis[i].tokenId))
                 );
            }
            result.toPet = gotchiToPet;
            result.toPet.length > 0 ? resolve(result) : reject(new Error('No gotchi need to be pet'));
        });
    }

    static pet(result) {
        return new Promise((resolve, reject) => {
            contractPet.interact(result.toPet, result.tx).then((txResponse) => {
                txResponse.wait().then((txReceipt) => {
                    resolve(result.address + ' : your gotchis are pet ! Well done ser <3 <3 <3');
                })
            }).catch((err) => reject(new Error('Error during the TX : ' + err.message)));
        });
    }

    static fillTx(result) {
        return new Promise((resolve, reject) => {
            contractPet.estimateGas.interact(result.toPet).then((estimatedGas) => {
                contractPet.provider.getGasPrice().then((currentGasPrice) => {
                    operatorWallet.getTransactionCount().then((nonce) => {
                        result.tx = {
                            type: 2,
                            nonce: nonce,
                            maxFeePerGas: currentGasPrice.add(10),
                            maxPriorityFeePerGas: currentGasPrice.add(10),
                            gasLimit: estimatedGas.add(10000)
                        }
                        resolve(result);
                    });
                });
            }).catch((err) => reject(err.message));
        });
    }

}
