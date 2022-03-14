require("dotenv").config();
const express = require('express');
const schedule  = require('node-schedule');
const { ethers } = require("ethers");

const app = express();

const provider = new ethers.providers.JsonRpcProvider(process.env.JSON_RPC_PROVIDER);


const privateKey = (process.env.PK).toString('hex');
const operatorWallet = new ethers.Wallet(privateKey, provider);

const contractPet = new ethers.Contract(process.env.DIAMOND_ADDRESS,  require('./assets/abi/pet')['petABI'], operatorWallet);
const contractGotchi = new ethers.Contract(process.env.DIAMOND_ADDRESS,  require('./assets/abi/gotchiFacet')['gotchiFacetABI'], operatorWallet);

let Gotchis = require('./assets/classes/gotchis-class')(contractPet, contractGotchi, operatorWallet, ethers);

schedule.scheduleJob(process.env.CRON_PATTERN, async () => {
    let addresses = process.env.ADDRESSES_TO_CHECK.split(',');
    for (let address of addresses) {
        Gotchis.process(address);
    }
});

app.listen(process.env.APP_PORT, () => {console.log('Server started at port ' + process.env.APP_PORT)});