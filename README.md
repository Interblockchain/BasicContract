# Motivation
The basic  standard API for tokens within smart contracts on the WORBLI network, eosio.token, does not allow practical implementations of non-custodian peer-to-peer applications. The following smart contract, closely inspired from the ERC-20 Ethereum standard, allows tokenspre-approved other on-chain third parties to spend the specified tokens. To do so, we must include two new actions (transferFrom and approve) and one multi_index table (allowed) which includes the allowed spenders and their spending limit. 

#Installation
Clone the directory into WORKDIR:

`git clone https://gitlab.com/Interblockchain/eos-erc20-contract.git`

Move into the directory and compile the code with eosio-cpp from the [EOSIO Contract Development Toolkit](https://github.com/EOSIO/eosio.cdt):

`eosio-cpp basiccontract.cpp -o basiccontract.wasm`

You can now deploy the contract on a [EOS node](https://github.com/EOSIO/eos) (first create a corresponding basiccontract account):

`cleos set contract basiccontract WORKDIR/basiccontract`

# Use Case
The smart contract defines five actions : create, issue, transfer, approve and transferfrom. The first three correspond to the standard eosio.token smart contract already in use on the EOS networks. 

#### `cleos push action basiccontract create '["issuer", "maxsupply SYM"]' -p basiccontract@active`

The create action is used to define the token with an issuer, a symbol and a maximum supply. This action must be performed with the authority of the account on which the smart contract is deployed (i.e. basiccontract). Use the maximum supply to specify the number of required decimals (e.g. "1000.00 XPB" which will create a token with a maximum supply of a thousand, with two decimal places and the symbol XPB). Please see the [EOS documentation](https://developers.eos.io/eosio-cpp/docs/introduction) for more information. This action can be performed as: 

#### `cleos push action basiccontract issue '["account", "quantity SYM"]' -p issuer@active`

The issue action issues a certain amount of tokens to an account. Each time this action is performed, it raises the supply of the token. When the maximum supply is reached, it is impossible to issue more tokens. This action must be performed with the authority of the issuer account specified when the token was created. This action can be performed as: 

####`cleos push action basiccontract transfer '["from", "to", "quantity SYM", "memo]' -p from@active`

The transfer action transfers tokens from account "from" to account "to". This action must be performed with the authority of account "from". Notice that if account "to" does not possess any of these tokens, this action creates a corresponding accounts table in the scope of "to". the RAM allocation for this table is payed by "from". 

#### `cleos push action basiccontract approve '["owner", "spender", "quantity SYM"]' -p owner@active`
The approve action is invoked when an account owner wishes to give spending privileges to another account, called spender here. This allows the spender to withdraw from the owner's account, multiple times, up to the quantity specified. 

This action creates a new table, called allowed, in the scope of the owner. All RAM allocation costs are payed by the owner. This table can be viewed using the command:

`cleos get table basiccontract owner allowed`

#### `cleos push action basiccontract transferfrom '["from", "to", "spender", "quantity SYM", "memo"]' -p spender@active`

Finally the last action, transferfrom, is used for a withdraw workflow, allowing contracts or other accounts to send tokens on your behalf. For example to make a non-custodian exhange contract which can "deposit" to a contract address on your behalf and/or to charge fees in sub-currencies. The command fails unless the "from" account has deliberately authorized the "spender" via the approve method. Note that if account "to" does not already possess a balance in the specified tokens, an accounts table must be created in its scope. In this case, the RAM allocation costs are payed by the spender.

# Prerequisite
* EOSIO Contract Development Toolkit: install from [here](https://github.com/EOSIO/eosio.cdt)
* An EOS node: install from [here](https://github.com/EOSIO/eos)
