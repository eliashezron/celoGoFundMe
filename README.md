# Celo Marketplace Dapp

![](img/fundme.png)

## Description

This is a GoFundMe Page built on the celo Blockchain:

- Recieves Contribution from Well Wishers;
- Once the Amount To Be Funded is reached, The Contribute Button is De-activated;
- Tracks the Number of People Who have Contributed;
- You can contibute Multiple times but the funders List is only updated Once;
- Keeps track of the Balance remaining to be contributed;

The concept here is the ability to be able to keep track of the funders and once the target has been reached, the fundme won't be able to recieve any more funds. Also, the Contribute button is taken down. The Novelty is the choice for a person to be able to fund a project with any amount. nothing is too little.

## Smart Contract Functionality Added

- Included a Mapping with in a struct
- Included an Array within a Struct
- Keeping Track of Funders
- Included Modifiers to Check for where or Not the Project Has been Funded
- Storage vs Memory when Using Structs, Where and When

## Front End Functionality Added

- Included a Modal for the Input of the amount You Intead to contribute
- Conditional Display of the Contribute Button Depending on the Balance remaining
- A Tag to show projects that are being Funded Against those that Are already Funded
- Display Number of Funders
- Center align of the GoFundMe Button

## TODO

- beautify the layout
- create admin pages
- include an option for a person to live a note.

## Live Demo

[GoFundMe](https://eliashezron.github.io//)

## Usage

### Requirements

1. Install the Metamask wallet
2. Create a wallet.
3. Go to [https://celo.org/developers/faucet](https://celo.org/developers/faucet) and get tokens for the alfajores testnet.
4. Switch to the alfajores testnet in the Metamask.

### Test

1. connect your celo Wallet on the Alfajores Testnet
2. Create a FundMe, Prefarably you use an Imageurl on ipfs
3. Fund a Project

## Project Setup

### Install

```
npm install
```

### Start

```
npm run dev
```

### Build

```
npm run build
```
