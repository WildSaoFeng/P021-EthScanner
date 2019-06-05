// Part 1 Import Related Package
var Web3 = require('web3');
var mongoose = require('mongoose');
var moment = require('moment');

const maxBlock = 100000;

// Part  Setting Up DB Model
const ethContractSchema = mongoose.Schema({
  address: String,
  code: String,
  storage: String,
});

const EthContract = mongoose.model('eth_contract', ethContractSchema);

EthContract.addContract = function(newContract, callback) {
  newContract.save(callback);
};

EthContract.updateContract = function(contractAddress, newCode, newStorage) {
  EthContract.update({address: contractAddress}, { $set: {
    "code": newCode,
    "storage": newStorage,
    }}, (err, suc) => {});
}

EthContract.checkUnique = function(contractAddress) {
  EthContract.find({address: contractAddress}, (err, res) => {
    if(res) return false;
    return true;
  });
};

// Part  Connection to Local RPC

async function connectWeb3() {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  global.web3 = web3;
}

async function connectDB() {
  mongoose.connect('mongodb://localhost:27017/ethscanner');
  mongoose.connection.on('connected', () => {
   console.log('MongoDB has started successfully.');
  });
  mongoose.connection.on('error', (err) => {
   console.log('Database error' + err);
  });
}

// Part Functions
function checkIfIsContract(newAddress) {
  var code = web3.eth.getCode(newAddress);
  if(code === '0x')
    return false;
  else return true;
}

async function uniqueAddAddress(newAddress) {
  if(!checkIfIsContract(newAddress))
    return;
  if(EthContract.checkUnique(newAddress)){
    EthContract.addContract(new ethContractSchema({
      address: newAddress,
    }));
  }
}

// Part  Scan the Whole Chain

async function scanTheChain() {
  for(let i = 1; i <= maxBlock; i++) {
    console.log("[ " + moment().format('MMMM Do YYYY, h:mm:ss a') + " ] " + "Scanning Block " + i);
    var blockTxes = web3.eth.getBlock(i).transactions;
    var blockTxCnt = web3.eth.getBlockTransactionCount(i);
    for(let j = 1; j <= blockTxCnt; j++) {
      var thisTx = web3.eth.getTransaction(blockTxes[j]);
      const txFrom = thisTx.from;
      console.log('txFrom');
      uniqueAddAddress(txFrom);
      const txTo = thisTx.to;
      uniqueAddAddress(txTo);

    }
  }
}

// Part Main Function
(function main(){
  moment.locale('zh-cn');
  connectDB();
  connectWeb3();
  scanTheChain();
})();

