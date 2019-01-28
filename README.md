# Betl

A betting platform consisting of a backend (smart contracts runnning on the Ethereum blockchain) and later on a frontend.

Users can host bets by creating a bet on the blockchain and distributing the bet identifier. Players can use this identifier to place their bets on various predefined or suggested outcomes. The host is able to announce a winning outcome of a bet or cancel it. Once the bet result is determined by the host, players can claim their payouts. If the bet is cancelled, players can claim refunds.

## Setup

Comiling contracts with Truffle's `truffle compile` requires the compiler as docker image. You can pull this image with the following command:

```sh
docker pull ethereum/solc:0.5.2
```

