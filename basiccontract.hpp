#pragma once

#include <eosiolib/asset.hpp>
#include <eosiolib/eosio.hpp>

#include <string>

namespace eosiosystem {
   class system_contract;
}

namespace eosio
{
using std::string;
class BasicToken : public eosio::contract
{
  public:
    BasicToken(account_name self) : contract(self) {}

    void create(account_name issuer,
                asset maximum_supply);

    void issue(account_name to, asset quantity, string memo);

    void transfer(account_name from,
                  account_name to,
                  asset quantity,
                  string memo);

    void transferfrom(account_name from,
                  account_name to,
                  account_name spender,
                  asset quantity,
                  string memo);
    
    void approve(account_name owner,
                 account_name spender,
                 asset quantity);

    inline asset get_supply(symbol_name sym) const;
    inline asset get_maxsupply(symbol_name sym) const;

    inline asset get_balance(account_name owner, symbol_name sym) const;

  private:
    struct account
    {
        asset balance;

        uint64_t primary_key() const { return balance.symbol.name(); }
    };

    struct currency_stats
    {
        asset supply;
        asset max_supply;
        account_name issuer;

        uint64_t primary_key() const { return supply.symbol.name(); }
    };

    struct allowed_struct
    {
        uint64_t key;
        account_name spender;
        asset quantity;

        uint64_t primary_key() const {return key;}
    };

    typedef eosio::multi_index<N(accounts), account> accounts;
    typedef eosio::multi_index<N(stat), currency_stats> stats;
    typedef eosio::multi_index<N(allowed), allowed_struct> allowed;

    void sub_balance(account_name owner, asset value);
    void sub_balancefrom(account_name owner, account_name spender, asset value);
    void add_balance(account_name owner, asset value, account_name ram_payer);

  public:
    struct transfer_args
    {
        account_name from;
        account_name to;
        asset quantity;
        string memo;
    };
};

asset BasicToken::get_supply(symbol_name sym) const
{
    stats statstable(_self, sym);
    const auto &st = statstable.get(sym);
    return st.supply;
}

asset BasicToken::get_maxsupply(symbol_name sym) const
{
    stats statstable(_self, sym);
    const auto &st = statstable.get(sym);
    return st.max_supply;
}

asset BasicToken::get_balance(account_name owner, symbol_name sym) const
{
    accounts accountstable(_self, owner);
    const auto &ac = accountstable.get(sym);
    return ac.balance;
}

} // namespace eosio