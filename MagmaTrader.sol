// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MagmaTrader is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _listingIds;

    struct Listing {
        uint256 listingId;
        address seller;
        address tokenAddress;
        uint256 tokenId;
        uint256 price;
        bool isERC1155;
        uint256 amount; // For ERC1155 listings
    }

    mapping(uint256 => Listing) public listings;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed tokenAddress,
        uint256 tokenId,
        uint256 price,
        bool isERC1155,
        uint256 amount
    );

    event Sale(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed tokenAddress,
        uint256 tokenId,
        uint256 price
    );

    // List an NFT on the marketplace
    function listNFT(
        address tokenAddress,
        uint256 tokenId,
        uint256 price,
        bool isERC1155,
        uint256 amount
    ) external {
        require(price > 0, "Price must be greater than 0");

        _listingIds.increment();
        uint256 listingId = _listingIds.current();

        listings[listingId] = Listing(
            listingId,
            msg.sender,
            tokenAddress,
            tokenId,
            price,
            isERC1155,
            amount
        );

        emit Listed(
            listingId,
            msg.sender,
            tokenAddress,
            tokenId,
            price,
            isERC1155,
            amount
        );

        if (isERC1155) {
            IERC1155(tokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                tokenId,
                amount,
                ""
            );
        } else {
            IERC721(tokenAddress).transferFrom(
                msg.sender,
                address(this),
                tokenId
            );
        }
    }

    // Buy an NFT listed on the marketplace
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing memory listing = listings[listingId];
        require(msg.value == listing.price, "Please submit the asking price");

        if (listing.isERC1155) {
            IERC1155(listing.tokenAddress).safeTransferFrom(
                address(this),
                msg.sender,
                listing.tokenId,
                listing.amount,
                ""
            );
        } else {
            IERC721(listing.tokenAddress).transferFrom(
                address(this),
                msg.sender,
                listing.tokenId
            );
        }

        payable(listing.seller).transfer(msg.value);
        delete listings[listingId];

        emit Sale(
            listingId,
            msg.sender,
            listing.tokenAddress,
            listing.tokenId,
            listing.price
        );
    }

    // Cancel a listing
    function cancelListing(uint256 listingId) external {
        Listing memory listing = listings[listingId];
        require(msg.sender == listing.seller, "You are not the seller");

        if (listing.isERC1155) {
            IERC1155(listing.tokenAddress).safeTransferFrom(
                address(this),
                msg.sender,
                listing.tokenId,
                listing.amount,
                ""
            );
        } else {
            IERC721(listing.tokenAddress).transferFrom(
                address(this),
                msg.sender,
                listing.tokenId
            );
        }

        delete listings[listingId];
    }

    // Read-only function to get listing details by listingId
    function getListingDetails(uint256 listingId)
        public
        view
        returns (Listing memory)
    {
        require(listingId <= _listingIds.current(), "Listing does not exist");
        return listings[listingId];
    }

    // Read-only function to get the total number of listings
    function getTotalListings() public view returns (uint256) {
        return _listingIds.current();
    }

    // Read-only function to check if a token is listed
    function isTokenListed(address tokenAddress, uint256 tokenId)
        public
        view
        returns (bool)
    {
        for (uint256 i = 1; i <= _listingIds.current(); i++) {
            Listing memory listing = listings[i];
            if (
                listing.tokenAddress == tokenAddress &&
                listing.tokenId == tokenId
            ) {
                return true;
            }
        }
        return false;
    }

    // Read-only function to get the price of a listed token by listingId
    function getPriceOfToken(uint256 listingId) public view returns (uint256) {
        require(listingId <= _listingIds.current(), "Listing does not exist");
        return listings[listingId].price;
    }
}
