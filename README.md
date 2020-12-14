# `betl`

_Warning: This source code is unaudited_

_Note: Operating BETL can require an online gambling license depending on your jurisdiction_

`betl` is a smart contract for the Ethereum blockchain that allows hosts to create betting rounds for their audience.A round is represented by a question and an exhaustive set of possible answers or outcomes. Players, which form the audience, participate by placing their bets while the round is open. After a round is decided by the host, players can claim pending payouts. Depending on the round mode, a round can have multiple winning outcomes with different payout allocations.

For example: _"Will I rank top5 by end of this competitive season?"_ associates a binary round with the outcomes _Yes_ and _No_. Both outcomes are mutually exclusive and exhaust the outcome space. The payout allocation in percent is denoted as (100,0), where the first number represents the allocation of the winning outcome. In comparison, _"What is my rank by the end of this season?"_ likely represents a non-binary round. Considering the outcomes _1st_, _2nd_, _3rd_, and _4th or lower_, the host can decide payout distributions like `(100,0,0,0)`. This means the winning outcome allocates 100% of the pool. Alternatively, "close bets" can be rewarded as well with tiers such as `(80,20,0,0)` or `(50,25,15,10)`.

By using a name registry, hosts can register human-readable names with their Ethereum address. This allows easier host discoverability by players.

## Setup

Installing the dependencies with a package manager, e.g. via

```sh
yarn
```

Compiling contracts with Truffle requires the compiler as docker image. You can pull this image with the following command:

```sh
docker pull ethereum/solc:0.5.3
```

Now, the smart contracts can be compiled with:

```sh
truffle compile
```
