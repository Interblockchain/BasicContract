/* ==================================================
(c) 2019 Copyright Transledger inc. All rights reserved 
================================================== */

const BigNumber = require('bignumber.js');
const axios = require('axios');

class transeos {
    constructor(params) {
        this.contractAddress = params.contractAddress;
        this.exchangeAddress = params.exchangeAddress;
        this.network = params.network;
    }

    /*
    This method is used to sign and send actions to the EOS network.
    Arguments:
        actions: array of actions
    An action is an object of the form:
        {   account: account of the contract,
            name: name of the function to run on the contract,
            authorization: [ { actor: account taking the action, permission: permission level (usually "active") } ],
            data: { the arguments of the function call of the contract}
        }
    Returns:
        result: the result from the blockchain for the action
    */
    async sendAction(wallet, actions) {
        try {
            let result = await wallet.eosApi.transact({ actions: actions }, { broadcast: true, blocksBehind: 3, expireSeconds: 60 });
            console.log('Transaction success!', result);
            return result;
        } catch (error) {
            console.error('Transaction error :(', error);
            throw error;
        }
    }

    /*=========================================================================================
      BASIC CONTRACT ACTIONS
      =========================================================================================
    */

    /*
    This method is used for creating new currencies with the Transledger Basic Contract.
    The arguments are:
        issuer: account which will be able to issue tokens of this currency and transfer initial amounts 
        max_supply: maximum supply which can be issued for this currency
        decimals: number of decimals to use for this currency,
        symbol: symbol used to identify this currency (ex: TBTC).
    NOTE: 
        Only works for Transledger, since we require the auth for the basicContract.
        Other users will not be able to access this!!!!
    Returns:
        result: the result from the blockchain for the action
    */
    async create(wallet, issuer, max_supply, decimals, symbol) {
        //Validation
        if (!wallet) { throw { name: "No wallet has been passed", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!wallet.auth) { throw { name: "No auth information has been passed with wallet", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!issuer || typeof (issuer) != "string") { throw { name: "No issuer has been passed or it is not of type string", statusCode: "400", message: "Please provide an issuer for the currency." } }
        if (!max_supply) { throw { name: "No maximum supply has been passed", statusCode: "400", message: "Please provide a maximum supply for the currency." } }
        if (!decimals) { throw { name: "No decimals has been passed", statusCode: "400", message: "Please provide a number of decimal for this currency." } }
        if (!symbol || typeof (symbol) != "string") { throw { name: "No symbol has been passed or it is not of type string", statusCode: "400", message: "Please provide a token symbol." } }

        BigNumber.set({ DECIMAL_PLACES: decimals, ROUNDING_MODE: BigNumber.ROUND_DOWN });
        let value = new BigNumber(max_supply, 10);
        let result = await this.sendAction(wallet, [{
            account: this.contractAddress,
            name: 'create',
            authorization: [{ actor: this.contractAddress, permission: "active" }],
            data: {
                issuer: issuer,
                max_supply: `${value.toString()} ${symbol}`
            }
        }]);
        return result;
    }

    /*
    This method is used for actually issuing tokens up to max_supply
    The arguments are:
        wallet: transit-eos wallet object which provide keys for the account performing the action (in this case, the issuer of the currency)
        to: account which will receive the issued tokens
        quantity: amount of tokens issued
        decimals: number of decimals used for the currency
        symbol: symbol of the currency
        memo: a memo
    Returns:
        result: the result from the blockchain for the action
    */
    async issue(wallet, to, quantity, decimals, symbol, memo) {
        //Validation
        if (!wallet) { throw { name: "No wallet has been passed", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!wallet.auth) { throw { name: "No auth information has been passed with wallet", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!to || typeof (to) != "string") { throw { name: "No destination has been passed or it is not of type string", statusCode: "400", message: "Please provide a destination (to) for the issuance." } }
        if (!quantity) { throw { name: "No quantity has been passed", statusCode: "400", message: "Please provide a quantity for the issuance." } }
        if (!decimals) { throw { name: "No decimals has been passed", statusCode: "400", message: "Please provide a number of decimal for this currency." } }
        if (!symbol || typeof (symbol) != "string") { throw { name: "No symbol has been passed or it is not of type string", statusCode: "400", message: "Please provide a token symbol." } }

        let _memo = (memo) ? memo : `Issue ${symbol}`;
        BigNumber.set({ DECIMAL_PLACES: decimals, ROUNDING_MODE: BigNumber.ROUND_DOWN });
        let value = new BigNumber(quantity, 10);
        let result = await this.sendAction(wallet, [{
            account: this.contractAddress,
            name: 'issue',
            authorization: [{ actor: wallet.auth.accountName, permission: wallet.auth.permission }],
            data: {
                to: to,
                quantity: `${value.toString()} ${symbol}`,
                memo: _memo
            }
        }]);
        return result;
    }

    /*
    This method is used for transferring tokens between two accounts, using the authority of the 'from' account.
    The arguments are:
        wallet: transit-eos wallet object which provide keys for the account performing the action
        from: account sending the funds (authorization for this account must be provided in wallet)
        to: account which will receive the tokens
        quantity: amount of tokens transferred
        decimals: number of decimals used for the currency
        symbol: symbol of the currency
        memo: a memo
    Returns:
        result: the result from the blockchain for the action
    */
    async transfer(wallet, from, to, quantity, decimals, symbol, memo) {
        //Validation
        if (!wallet) { throw { name: "No wallet has been passed", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!wallet.auth) { throw { name: "No auth information has been passed with wallet", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!from || typeof (from) != "string") { throw { name: "No source account has been passed or it is not of type string", statusCode: "400", message: "Please provide a source (from) for the transaction." } }
        if (!to || typeof (to) != "string") { throw { name: "No destination has been passed or it is not of type string", statusCode: "400", message: "Please provide a destination (to) for the transaction." } }
        if (!quantity) { throw { name: "No quantity has been passed", statusCode: "400", message: "Please provide a quantity for the transaction." } }
        if (!decimals) { throw { name: "No decimals has been passed", statusCode: "400", message: "Please provide a number of decimal for this currency." } }
        if (!symbol || typeof (symbol) != "string") { throw { name: "No symbol has been passed or it is not of type string", statusCode: "400", message: "Please provide a token symbol." } }

        let _memo = (memo) ? memo : `Issue ${symbol}`;
        BigNumber.set({ DECIMAL_PLACES: decimals, ROUNDING_MODE: BigNumber.ROUND_DOWN });
        let value = new BigNumber(quantity, 10);
        let result = await this.sendAction(wallet, [{
            account: this.contractAddress,
            name: 'transfer',
            authorization: [{ actor: from, permission: wallet.auth.permission }],
            data: {
                from: from,
                to: to,
                quantity: `${value.toString()} ${symbol}`,
                memo: _memo
            }
        }]);
        return result;
    }

    /*
    This method is used for transferring tokens between two accounts, using the authority of the 'spender' account.
    In order to do so, the 'from' account must have approved 'spender' before hand.
    The arguments are:
        wallet: transit-eos wallet object which provide keys for the action
        from: account sending the funds
        to: account which will receive the tokens
        spender: account which has authority to make the transfer (authorization for this account must be provided in wallet)
        quantity: amount of tokens transferred
        decimals: number of decimals used for the currency
        symbol: symbol of the currency
        memo: a memo
    Returns:
        result: the result from the blockchain for the action
    */
    async transferfrom(wallet, from, to, spender, quantity, decimals, symbol, memo) {
        //Validation
        if (!wallet) { throw { name: "No wallet has been passed", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!wallet.auth) { throw { name: "No auth information has been passed with wallet", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!from || typeof (from) != "string") { throw { name: "No source account has been passed or it is not of type string", statusCode: "400", message: "Please provide a source (from) for the transaction." } }
        if (!to || typeof (to) != "string") { throw { name: "No destination has been passed or it is not of type string", statusCode: "400", message: "Please provide a destination (to) for the transaction." } }
        if (!spender || typeof (spender) != "string") { throw { name: "No spender has been passed or it is not of type string", statusCode: "400", message: "Please provide a spender for the transaction." } }
        if (!quantity) { throw { name: "No quantity has been passed", statusCode: "400", message: "Please provide a quantity for the transaction." } }
        if (!decimals) { throw { name: "No decimals has been passed", statusCode: "400", message: "Please provide a number of decimal for this currency." } }
        if (!symbol || typeof (symbol) != "string") { throw { name: "No symbol has been passed or it is not of type string", statusCode: "400", message: "Please provide a token symbol." } }

        let _memo = (memo) ? memo : `Issue ${symbol}`;
        BigNumber.set({ DECIMAL_PLACES: decimals, ROUNDING_MODE: BigNumber.ROUND_DOWN });
        let value = new BigNumber(quantity, 10);
        let result = this.sendAction(wallet, [{
            account: this.contractAddress,
            name: 'transferfrom',
            authorization: [{ actor: spender, permission: wallet.auth.permission }],
            data: {
                from: from,
                to: to,
                spender: spender,
                quantity: `${value.toString()} ${symbol}`,
                memo: _memo
            }
        }]);
        return result;
    }

    /*
    This method is used for pre-approving a 'spender' account, allowing them to spend a fix quantity of tokens on your behalf.
    The arguments are:
        wallet: transit-eos wallet object which provide keys for the action
        owner: account possessing the tokens (authorization for this account must be provided in wallet)
        spender: account to give authority to 
        quantity: amount of tokens 'spender' can transfer
        decimals: number of decimals used for the currency
        symbol: symbol of the currency
    Returns:
        result: the result from the blockchain for the action
    */
    async approve(wallet, owner, spender, quantity, decimals, symbol) {
        //Validation
        if (!wallet) { throw { name: "No wallet has been passed", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!wallet.auth) { throw { name: "No auth information has been passed with wallet", statusCode: "400", message: "Please provide an authenticated wallet." } }
        if (!owner || typeof (owner) != "string") { throw { name: "No owner has been passed or it is not of type string", statusCode: "400", message: "Please provide an owner for the approval." } }
        if (!spender || typeof (spender) != "string") { throw { name: "No spender has been passed or it is not of type string", statusCode: "400", message: "Please provide a spender for the approval." } }
        if (!quantity) { throw { name: "No quantity has been passed", statusCode: "400", message: "Please provide a quantity for the approval." } }
        if (!decimals) { throw { name: "No decimals has been passed", statusCode: "400", message: "Please provide a number of decimal for this currency." } }
        if (!symbol || typeof (symbol) != "string") { throw { name: "No symbol has been passed or it is not of type string", statusCode: "400", message: "Please provide a token symbol." } }

        BigNumber.set({ DECIMAL_PLACES: decimals, ROUNDING_MODE: BigNumber.ROUND_DOWN });
        let value = new BigNumber(quantity, 10);
        let result = await this.sendAction(wallet, [{
            account: this.contractAddress,
            name: 'approve',
            authorization: [{ actor: owner, permission: wallet.auth.permission }],
            data: {
                owner: owner,
                spender: spender,
                quantity: `${value.toString()} ${symbol}`
            }
        }]);
        return result;
    }

    /*
    This method allows to check the balance of an account for a currency.
    The arguments are:
        account: account possessing the tokens
        symbol:  symbol of the currency (optional)
    Returns:
        balances: array of strings containing the relevant balances
    */
    async getBalance(account, symbol, page, limit) {
        if (!account) { throw { name: "Missing arguments", statusCode: "400", message: 'Account name is not provided!' } }
        try {
            let result = await axios({
                method: 'POST',
                url: (this.network.port) ? `${this.network.protocol}://${this.network.host}:${this.network.port}/v1/chain/get_currency_balance` : `${this.network.protocol}://${this.network.host}/v1/chain/get_currency_balance`,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                data: {
                    code: this.contractAddress,
                    account: account,
                    symbol: symbol
                }
            });
            let balances = result.data;
            if (symbol && Array.isArray(balances)) balances = balances.filter(element => element.split(" ")[1] == symbol);
            let total = balances.length;
            if (page && limit && Array.isArray(rows)) balances = this.paginateArray(rows, page, limit);
            return {
                docs: balances,
                total: total,
                limit: (limit) ? parseInt(limit) : total,
                page: (page) ? parseInt(page) : 1,
                pages: (limit) ? Math.ceil(total / parseInt(limit)) : 1
            };
        } catch (error) {
            throw { name: error.name, statusCode: "500", message: error.message }
        }
    }

    /*
    This method allows to check the allowance table of an account.
    The arguments are:
        account: account possessing the table
        spender: account which has permission to spend (optional)
        symbol: symbol of the currency (optional) 
    Returns:
        rows: array of objects containing the relevant permissions
    */
    async getAllowance(account, spender, symbol, page, limit) {
        if (!account) { throw { name: "Missing arguments", statusCode: "400", message: 'Account name is not provided!' } }
        try {
            let result = await axios({
                method: 'POST',
                url: (this.network.port) ? `${this.network.protocol}://${this.network.host}:${this.network.port}/v1/chain/get_table_rows` : `${this.network.protocol}://${this.network.host}/v1/chain/get_table_rows`,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                data: {
                    code: this.contractAddress,
                    scope: account,
                    table: "allowed",
                    json: true
                }
            });
            let rows = result.data.rows;
            if (spender && Array.isArray(rows)) rows = rows.filter(element => element.spender == spender);
            if (symbol && Array.isArray(rows)) rows = rows.filter(element => element.quantity.split(" ")[1] == symbol);
            let total = rows.length;
            if (page && limit && Array.isArray(rows)) rows = this.paginateArray(rows, page, limit);
            return {
                docs: rows,
                total: total,
                limit: (limit) ? parseInt(limit) : total,
                page: (page) ? parseInt(page) : 1,
                pages: (limit) ? Math.ceil(total / parseInt(limit)) : 1
            };
        } catch (error) {
            throw { name: error.name, statusCode: "500", message: error.message }
        }
    }

    /*=========================================================================================
        PRIVATE METHODS
    =========================================================================================*/
    paginateArray(array, page_number, page_size) {
        --page_number; // because pages logically start with 1, but technically with 0
        return array.slice(page_number * page_size, (page_number + 1) * page_size);
    }
}

module.exports = transeos;