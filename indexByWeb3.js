// Part 1 Import Related Package
var Web3 = require('web3');
var mongoose = require('mongoose');
var moment = require('moment');

const startBlock = 5000000
const endBlock = 6000000;

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
  let res = EthContract.find({address: contractAddress});
  console.log(res);
  if(res) return false;
  return true;

};

// Part  Connection to Local RPC

async function connectWeb3() {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  global.web3 = web3;
}

async function connectDB() {
  mongoose.connect('mongodb://localhost:27017/unique_eth_data');
  mongoose.connection.on('connected', () => {
   console.log('MongoDB has started successfully.');
  });
  mongoose.connection.on('error', (err) => {
   console.log('Database error' + err);
  });
}

// Part Functions
async function checkIfIsContract(newAddress) {
  if(newAddress == null)
    return false;
  var code = await web3.eth.getCode(newAddress);
  // console.log(" ** CODE ** " + code);
  if(code == '0x') {
    // console.log('NOT CONTRACT');
    return false;
  }
  else return true;
}

async function uniqueAddAddress(newAddress) {
  let result = await checkIfIsContract(newAddress);
  if(!result)
    return;
  // console.log(" RESULT " + result);
 
  // let result2 = await EthContract.checkUnique(newAddress);
  // console.log(" RESULT " + result2);
  // if(!result2)
  //   return ;
 
  {
    // console.log(" *** [NEW CONTRACT] *** " + newAddress);
    var newCode = await web3.eth.getCode(newAddress);
    var newStorage = await web3.eth.getStorageAt(newAddress);
    // console.log('[NEW CONTRACT FOUNDED!]' + newAddress + ' = '+ newCode + ' = '+ newStorage);
    console.log('[NEW CONTRACT FOUNDED!]' + newAddress );
    EthContract.addContract(new EthContract({
      address: newAddress,
      code: newCode,
      storage: newStorage,
    }));
  }
}

// Part  Scan the Whole Chain

async function scanTheChain() {
  for(let i = startBlock; i <= endBlock; i++) {
    console.log("[ " + moment().format('MMMM Do YYYY, h:mm:ss a') + " ] " + "Scanning Block " + i);

    // TRY C: AWAIT # This one finally work!
    var blockInfo = await web3.eth.getBlock(i);
    // BUG FIXED: Notice that in this place you must split up and down sentence.
    var blockTxes = blockInfo.transactions;
    var blockTxCnt = await web3.eth.getBlockTransactionCount(i);
    // console.log("CNT => " + blockTxCnt);
    // console.log(blockTxes);

    for(let j = 0; j < blockTxCnt; j++) {
      var thisTx = await web3.eth.getTransaction(blockTxes[j]);
      const txFrom = thisTx.from;
      uniqueAddAddress(txFrom);
      const txTo = thisTx.to;
      uniqueAddAddress(txTo);
      // console.log('*** tx *** ' + txFrom + ' - ' + txTo);

    }
    // # PLACE A #
  }
}

// Part Main Function
(async function main(){
  moment.locale('zh-cn');
  await connectDB();
  await connectWeb3();
  await scanTheChain();
})();

// # PLACE A #

// TRY A: SYNC
    // var blockTxes = web3.eth.getBlock(i).transactions;
    // var blockTxCnt = web3.eth.getBlockTransactionCount(i);
    // console.log("CNT => " + blockTxCnt);
    // for(let j = 1; j <= blockTxCnt; j++) {
    //   var thisTx = web3.eth.getTransaction(blockTxes[j]);
    //   const txFrom = thisTx.from;
    //   console.log('*** txFrom *** ' + txFrom);
    //   uniqueAddAddress(txFrom);
    //   const txTo = thisTx.to;
    //   uniqueAddAddress(txTo);
    // }

    // TRY B: ASYNC
    // web3.eth.getBlock(i, (err, theBlock) => {
    //   var blockTxes = theBlock.transactions;
    //   // console.log(blockTxes);
    //   var txCnt = blockTxes.length;
    //   for(let j = 1; j <= blockTxCnt; j++) {
    //     web3.eth.getTransaction(blockTxes[j], (err, thisTx) => {
    //       const txFrom = thisTx.from;
    //       console.log('*** txFrom *** ' + txFrom);
    //       // uniqueAddAddress(txFrom);
    //       const txTo = thisTx.to;
    //       // uniqueAddAddress(txTo);
    //     });  
    //   }
    // });