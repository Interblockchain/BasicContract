# EOSPlus
A small library which interfaces the actions of the basic Transledger C++ contract deployed on various EOS chains.
In order to do so, we must first login into a wallet using the [eos-transit package](https://github.com/eosnewyork/eos-transit/tree/master/packages/eos-transit#basic-usage-example) and gain the required authorities for teh accounts performing the actions. 
They are all bunched here for easy access, easy modification and to give a uniform convention for the different recurrent quantities.

#Installation
In the working directory, simply issue:

`npm install --save EOSPlus`

# Usage

Simply import the module and construct a new instance by passing the connection parameters to the constructor.

```javascript
const EOSPlus = require("EOSPlus");

let params = {
    contractAddress: "ibclcontract",  //Account where the Transledger contract is deployed (usually: ibclcontract) 
    network: {
        host: "jungleapi.eossweden.se",   // RPC API Endpoint for the EOS chain
        port: null,                       // Port of the API Endpoint
        protocol: 'https',                // HTTP Connection protocol to the API Endpoint
        chainId: "e70aaab8997e1dfce58fbfac80cbbb8fecec7b99cf982a9444273cbc64c41473"  // ChainId of the EOS chain (this example is for JUNGLE)
    }
};
const eosplus = new EOSPlus(params);
```

Then you can invoke the methods, like for example:

```javascript
let value = eosplus.transferfrom(wallet, from, to, spender, amount, decimals, symbol, memo);
```

# Methods

```javascript
create(wallet: Wallet, issuer: string, max_supply: string, decimals, symbol: string) 
```
This method is used for creating new cryptocurrencies on the blockchain. As of now, it can only be called by the owner of the
account on which the contract is deployed (that is to say: it can only be called by Transledger).

### Parameters:
* wallet: transit-eos wallet object which provide keys for the account performing the action (in this case, the account that deployed the contract)
* issuer: account which will be able to issue tokens of this currency and transfer initial amounts 
* max_supply: maximum supply which can be issued for this currency
* decimals: number of decimals to use for this currency,
* symbol: symbol used to identify this currency (ex: TBTC).

```javascript
issue(wallet: Wallet, to: string, quantity, decimals, symbol: string, memo: string)
```

This method is used for issuing currency. Once the cryptocurrency is created, the specified issuer can use this method to mint a specified amount of tokens and send them to an account. 

### Parameters:
* wallet: transit-eos wallet object which provide keys for the account performing the action (in this case, the issuer of the currency)
* to: account which will receive the issued tokens
* quantity: amount of tokens issued
* decimals: number of decimals used for the currency
* symbol: symbol of the currency
* memo: a memo

```javascript
transfer(wallet: Wallet, from: string, to: string, quantity, decimals, symbol: string, memo: string)
```
Transfer funds from one account to another. 

### Parameters:
* wallet: transit-eos wallet object which provide keys for the account performing the action
* from: account sending the funds (authorization for this account must be provided in wallet)
* to: account which will receive the tokens
* quantity: amount of tokens transferred
* decimals: number of decimals used for the currency
* symbol: symbol of the currency
* memo: a memo

```javascript
transferfrom(wallet: Wallet, from: string, to: string, spender: string, quantity, decimals, symbol: string, memo: string)
```
Third party can use this method to transfer funds in the name of the owner. To be able to use this method, the owner of the funds must have previously approved the spender using the approve method.

### Parameters:
* wallet: transit-eos wallet object which provide keys for the action
* from: account sending the funds
* to: account which will receive the tokens
* spender: account which has authority to make the transfer (authorization for this account must be provided in wallet)
* quantity: amount of tokens transferred
* decimals: number of decimals used for the currency
* symbol: symbol of the currency
* memo: a memo

```javascript
approve(wallet: Wallet, owner: string, spender: string, quantity, decimals, symbol: string)
```
Preapprove a spender to transfer up to a specified amount of funds in your name.

### Parameters:
* wallet: transit-eos wallet object which provide keys for the action
* owner: account possessing the tokens (authorization for this account must be provided in wallet)
* spender: account to give authority to 
* quantity: amount of tokens 'spender' can transfer
* decimals: number of decimals used for the currency
* symbol: symbol of the currency

```javascript
getBalance(account: string, symbol: string)
```
Returns all the balances of the account. If a symbol is passed, returns only the balance in the specified cryptocurrency.

### Parameters:
* account: account possessing the tokens
* symbol:  symbol of the currency (optional)

```javascript
getAllowance(account: string, spender: string, symbol: string)
```
Returns all the allowances of the account. If a spender is passed, returns only the allowances for this spender.
If a symbol is passed, returns only the allowances in the specified cryptocurrency.

### Parameters:
* account: account possessing the table
* spender: account which has permission to spend (optional)
* symbol: symbol of the currency (optional) 

# Prerequisite
* node: install node from [here](https://nodejs.org/en/download/)

Prior to run, install all dependencies with `npm install`. To view dependencies, please refer to the package.json file.