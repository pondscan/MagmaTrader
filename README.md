# Simple NFT Swap for Magma Testnet

This project outlines the setup for a simple NFT swap platform on the Magma testnet, supporting both ERC-721 and ERC-1155 standards. The platform enables users to buy and sell NFTs in a secure and user-friendly environment.

## 1. Smart Contracts

Smart contracts are the backbone of this platform, handling the trading logic for NFTs. These contracts are responsible for listing NFTs for sale, executing trades, and managing cancellations and royalties.

### Features:

- **Listing NFTs**: Users can list their NFTs for sale at specified prices.
- **Buying NFTs**: Facilitates the purchase of listed NFTs, ensuring secure transfers.
- **Canceling Listings**: Allows users to withdraw their listings.
- **Handling Royalties**: Implements EIP-2981 to support creator royalties on secondary sales.

Following [OpenZeppelin](https://openzeppelin.com/) contracts for secure implementations of ERC-721 and ERC-1155 standards.

## 2. Marketplace Logic

The marketplace smart contract includes functionality for:

- **Listing NFTs for Sale**: Users can list their NFTs with a set price.
- **Executing Trades**: Facilitates the secure exchange of NFTs and funds between buyers and sellers.
- **Royalties**: Supports royalty payments to original creators on secondary sales.

## 3. Front-end Interface

A user-friendly front-end interface allows users to interact with the smart contracts easily. It includes features for:

- **Viewing Listings**: Users can browse available NFTs for sale.
- **Listing NFTs**: Provides a simple process for users to list their NFTs on the marketplace.
- **Purchasing NFTs**: Users can buy NFTs through the platform, with transactions securely handled by the smart contracts.
- **Managing Owned NFTs**: Users can view and manage their NFT collection.

The interface utilizes web3.js or ethers.js libraries for blockchain interactions.

## 4. Backend (mainnet)

For more complex applications, a backend may be necessary to handle off-chain functionalities like NFT indexing, user authentication, and additional business logic.
