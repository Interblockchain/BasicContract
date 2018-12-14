/**
 *  @file
 *  @copyright defined in eos/LICENSE.txt
 */

#include "basiccontract.hpp"

namespace eosio
{
void BasicToken::create(account_name issuer,
                        asset maximum_supply)
{
    require_auth(_self);

    auto sym = maximum_supply.symbol;
    eosio_assert(sym.is_valid(), "invalid symbol name");
    eosio_assert(sym.is_valid(), "invalid symbol name");
    eosio_assert(maximum_supply.is_valid(), "invalid supply");
    eosio_assert(maximum_supply.amount > 0, "max-supply must be positive");

    stats statstable(_self, sym.name());
    auto existing = statstable.find(sym.name());
    eosio_assert(existing == statstable.end(), "token with symbol already exists");

    statstable.emplace(_self, [&](auto &s) {
        s.supply.symbol = maximum_supply.symbol;
        s.max_supply = maximum_supply;
        s.issuer = issuer;
    });
}

void BasicToken::issue(account_name to, asset quantity, string memo)
{
    auto sym = quantity.symbol;
    eosio_assert(sym.is_valid(), "invalid symbol name");
    eosio_assert(memo.size() <= 256, "memo has more than 256 bytes");

    auto sym_name = sym.name();
    stats statstable(_self, sym_name);
    auto existing = statstable.find(sym_name);
    eosio_assert(existing != statstable.end(), "token with symbol does not exist, create token before issue");
    const auto &st = *existing;

    require_auth(st.issuer);
    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount > 0, "must issue positive quantity");

    eosio_assert(quantity.symbol == st.supply.symbol, "symbol precision mismatch");
    eosio_assert(quantity.amount <= st.max_supply.amount - st.supply.amount, "quantity exceeds available supply");

    statstable.modify(st, 0, [&](auto &s) {
        s.supply += quantity;
    });

    add_balance(st.issuer, quantity, st.issuer);

    if (to != st.issuer)
    {
        SEND_INLINE_ACTION(*this, transfer, {st.issuer, N(active)}, {st.issuer, to, quantity, memo});
    }
}

void BasicToken::transfer(account_name from,
                          account_name to,
                          asset quantity,
                          string memo)
{
    eosio_assert(from != to, "cannot transfer to self");
    require_auth(from);
    eosio_assert(is_account(to), "to account does not exist");
    auto sym = quantity.symbol.name();
    stats statstable(_self, sym);
    const auto &st = statstable.get(sym);

    require_recipient(from);
    require_recipient(to);

    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount > 0, "must transfer positive quantity");
    eosio_assert(quantity.symbol == st.supply.symbol, "symbol precision mismatch");
    eosio_assert(memo.size() <= 256, "memo has more than 256 bytes");

    sub_balance(from, quantity);
    add_balance(to, quantity, from);
}

void BasicToken::transferfrom(account_name from,
                              account_name to,
                              account_name spender,
                              asset quantity,
                              string memo)
{
    eosio_assert(from != to, "cannot transfer to self");
    eosio_assert(is_account(from), "from account does not exist");
    eosio_assert(is_account(to), "to account does not exist");

    auto sym = quantity.symbol.name();
    stats statstable(_self, sym);
    const auto &st = statstable.get(sym);

    // Notify both the sender and receiver upon action completion
    require_recipient(from);
    require_recipient(to);

    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount > 0, "must transfer positive quantity");
    eosio_assert(quantity.symbol == st.supply.symbol, "symbol precision mismatch");
    eosio_assert(memo.size() <= 256, "memo has more than 256 bytes");

    allowed allowedtable(_self, from);
    auto existing = allowedtable.find(spender + sym); //Find returns an iterator pointing to the found object
    eosio_assert(existing != allowedtable.end(), "spender not allowed");
    const auto &at = *existing;

    require_auth(at.spender);
    eosio_assert(at.quantity.is_valid(), "invalid allowed quantity");
    eosio_assert(at.quantity.amount > 0, "allowed must be a positive quantity");
    eosio_assert(at.quantity.symbol == st.supply.symbol, "symbol precision mismatch");
    eosio_assert(at.quantity.amount >= quantity.amount, "Allowed quantity < Transfer Quantity");

    sub_balancefrom(from, at.spender, quantity);
    add_balance(to, quantity, spender);
    allowedtable.modify(at, at.spender, [&](auto &a) {
        a.quantity -= quantity;
    });
}

void BasicToken::approve(account_name owner,
                         account_name spender,
                         asset quantity)
{
    eosio_assert(owner != spender, "cannot allow self");

    require_auth(owner);
    eosio_assert(is_account(spender), "spender account does not exist");

    auto sym = quantity.symbol.name();
    stats statstable(_self, sym);
    const auto &st = statstable.get(sym);

    // Notify both the sender and receiver upon action completion
    require_recipient(owner);
    require_recipient(spender);

    eosio_assert(quantity.is_valid(), "invalid quantity");
    eosio_assert(quantity.amount > 0, "must transfer positive quantity");
    eosio_assert(quantity.symbol == st.supply.symbol, "symbol precision mismatch");

    // Making changes to allowed in owner scope
    allowed allowedtable(_self, owner);
    auto existing = allowedtable.find(spender + sym); //Find returns an iterator pointing to the found object
    if (existing == allowedtable.end())
    {
        allowedtable.emplace(owner, [&](auto &a) {
            a.key = spender + sym;
            a.spender = spender;
            a.quantity = quantity;
        });
    }
    else
    {
        const auto &at = *existing;
        allowedtable.modify(at, owner, [&](auto &a) {
            a.quantity = quantity;
        });
    }
}

void BasicToken::sub_balance(account_name owner, asset value)
{
    accounts from_acnts(_self, owner);

    const auto &from = from_acnts.get(value.symbol.name(), "no balance object found");
    eosio_assert(from.balance.amount >= value.amount, "overdrawn balance");

    if (from.balance.amount == value.amount)
    {
        from_acnts.erase(from);
    }
    else
    {
        from_acnts.modify(from, owner, [&](auto &a) {
            a.balance -= value;
        });
    }
}

void BasicToken::sub_balancefrom(account_name owner, account_name spender, asset value)
{
    accounts from_acnts(_self, owner);

    const auto &from = from_acnts.get(value.symbol.name(), "no balance object found");
    eosio_assert(from.balance.amount >= value.amount, "overdrawn balance");

    if (from.balance.amount == value.amount)
    {
        from_acnts.erase(from);
    }
    else
    {
        from_acnts.modify(from, spender, [&](auto &a) {
            a.balance -= value;
        });
    }
}

void BasicToken::add_balance(account_name owner, asset value, account_name ram_payer)
{
    accounts to_acnts(_self, owner);
    auto to = to_acnts.find(value.symbol.name());
    if (to == to_acnts.end())
    {
        to_acnts.emplace(ram_payer, [&](auto &a) {
            a.balance = value;
        });
    }
    else
    {
        to_acnts.modify(to, 0, [&](auto &a) {
            a.balance += value;
        });
    }
}

} // namespace eosio

EOSIO_ABI(eosio::BasicToken, (create)(issue)(transfer)(approve)(transferfrom))
