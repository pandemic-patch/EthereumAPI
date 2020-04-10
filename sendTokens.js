const lib = require("./libs/library");
const fromExponential = require("from-exponential");
const fs = require("fs");
const path = require("path");
const Tx = require("ethereumjs-tx");
const Web3 = require("web3");
const ERC20Contract = require("erc20-contract-js");
const contractAbi=require('./libs/contractAbi')
const express= require('express');
const keys= require('./libs/keys');
const infura= require('./libs/infura');
const app = express()
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var web3 = new Web3(new Web3.providers.HttpProvider(infura));

web3.eth.defaultAccount = " **Wallet from which you are giving away tokens** ";

const contractAddr = " **Your Contaract Address Goes here** ";


const contract = web3.eth.contract(contractAbi);
const erc20Contract = contract.at(contractAddr);

  /*
    * @Author: sriharikapu
    * @Date: 10-04-2020 
    * @func check balance function
    */
app.post('/token/checkBalance', function(req, res){
    try {
      const wallet_address = req.body.walletAddress;
      erc20Contract.balanceOf.call(wallet_address, (err, balance) => {
        res.send({
          error: 0,
          returns: {
            balance: fromExponential(balance)
          }
        });
      });
    } catch (err) {
      res.status(500).send({
        error: 1,
        error_message: err.message
      });
    }
  })
  //,


  /*
    * @Author sriharikapu 
    * @date 10-04-2020
    * @func transfer token
    * @param -->
    * 1. from = address of the account sender
    * 2. to = address of the account receiver
    * 3. value = total token
    * 4. gasLimit = the gas limit used to compute the smart contract
    * 5. gasPrice = the price of gas used to compute the smart contract
    * 5. data (optional) = containing the data of the function call on a contract
    * 6. nonce (optional)
    */
app.post('/token/sendTransaction', function(req, res){
    try {
      console.log("req"+req.body)
      let count = web3.eth.getTransactionCount(web3.eth.defaultAccount);
      let from = web3.eth.defaultAccount;
      let to = req.body.toAddress;
      let paramValue = req.body.totalTokens;
      console.log("tokentotal: "+req.body.totalTokens)
      // Replace 0 in the line with the number of decimal places
      let value = paramValue*Math.pow(10, 0)
      console.log("value transfered: "+value)
      console.log("Contract Address: "+contractAddr);
      console.log("to address: "+to);

      const gasPrice = web3.eth.gasPrice.toNumber() * 2;
      const gasLimit = "100000";
      //const gasPrice = "20000000000";
      let rawTransaction = {
        from: from,
        nonce: web3.toHex(count),
        gasPrice: web3.toHex(gasPrice),
        gasLimit: web3.toHex(gasLimit),
        to: contractAddr,
        value: "0x0",
        data: erc20Contract.transfer.getData(to, value, {
          from: web3.eth.defaultAccount
        })
      };



          try {
            let privKey = new Buffer(keys, "hex");

            let tx = new Tx(rawTransaction);

            tx.sign(privKey);
            let serializedTx = tx.serialize();

            web3.eth.sendRawTransaction(
              "0x" + serializedTx.toString("hex"),
              (err, hash) => {
                try {
                  if (err) throw err;
                  res.send({
                    error: 0,
                    returns: {
                      txId: hash
                    }
                  });
                } catch (err) {
                  res.status(500).send({
                    error: 1,
                    error_message: err.message
                  });
                }
              }
            );
          } catch (err) {
            res.status(500).send({
              error: 1,
              error_message: err.message
            });
          }

    } catch (err) {
      res.status(500).send({
        error: 1,
        error_message: err.message
      });
    }
  })


app.listen(8888, function(err){
  if (!err) {
      console.log("Server is Running on port 8888");
  }
});
