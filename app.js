let contract;
let web3;
const contractAddress = "0x2d03544dc31f1dfaedc5082d26ee4b77b66b2458";
let userAccount = null; // To store the connected user's account
const ERC721ABI = [
    // Minimal ABI to interact with ERC721's approve function
    {
        "constant": false,
        "inputs": [
            {
                "name": "to",
                "type": "address"
            },
            {
                "name": "tokenId",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];


async function initWeb3() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            userAccount = accounts[0]; // Storing the connected account
            console.log(`Connected account: ${userAccount}`); // Logging the connected account

            contract = new web3.eth.Contract(contractABI, contractAddress);
            // After initializing and connecting, you can load NFT listings or other initial data
            loadNFTListings();
            // Display connected account on the webpage
            document.getElementById('connectedAccount').innerText = `Connected as: ${userAccount}`;
        } catch (error) {
            console.error("User denied account access or an error occurred:", error);
        }
    } else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
        contract = new web3.eth.Contract(contractABI, contractAddress);
        loadNFTListings();
    } else {
        console.error("Non-Ethereum browser detected. You should consider trying MetaMask or another Web3 wallet.");
    }
}

async function loadNFTListings() {
    const totalListings = await contract.methods.getTotalListings().call();
    const listingsContainer = document.getElementById('nft-listings');
    listingsContainer.innerHTML = ''; // Clear existing listings

    for (let i = 1; i <= totalListings; i++) {
        const listing = await contract.methods.getListingDetails(i).call();

        // Skip listing if it's sold or not valid
        if (!listing.price || listing.price === '0' || !listing.tokenAddress) {
            continue; // Skip to the next iteration if the listing is sold or invalid
        }

        fetch(`https://magmascan.org/api/v2/tokens/${listing.tokenAddress}/instances/${listing.tokenId}`)
            .then(response => response.json())
            .then(data => {
                // Skip listing if metadata fetch fails or is incomplete
                if (!data || !data.image_url) {
                    return; // Skip this then() callback
                }

                const listingElement = document.createElement('div');
                listingElement.classList.add('nft-item');
                listingElement.innerHTML = `
                    <img src="${data.image_url}" alt="${data.metadata?.name}" height="200px">
                    <h5>${data.metadata?.name || 'NFT Name'} (#${listing.tokenId})</h5>
                    <p class="address">Seller: ${listing.seller.slice(0, 6)}...${listing.seller.slice(-4)}</p>
                    <p>Price: ${web3.utils.fromWei(listing.price, 'ether')} Lava</p>
                    <p class="address">Contract: ${listing.tokenAddress.slice(0, 6)}...${listing.tokenAddress.slice(-4)}</p>
                    <p>Description: ${data.metadata?.description || 'No description'}</p>
                    <button onclick="buyNFT(${listing.listingId})">Buy</button>
                `;
                listingsContainer.appendChild(listingElement);
            })
            .catch(error => console.error('Error fetching NFT metadata:', error));
    }
}



async function buyNFT(listingId) {
    const listing = await contract.methods.getListingDetails(listingId).call();
    await contract.methods.buyNFT(listingId).send({ from: userAccount, value: listing.price });
    console.log(`NFT with listing ID ${listingId} bought by ${userAccount}`);
    loadNFTListings();
}

async function cancelListing(listingId) {
    await contract.methods.cancelListing(listingId).send({ from: userAccount });
    console.log(`Listing ID ${listingId} cancelled by ${userAccount}`);
    loadNFTListings();
}

async function listNFT() {
    const tokenAddress = document.getElementById('nftTokenAddress').value;
    const tokenId = document.getElementById('nftTokenId').value;
    const priceEth = document.getElementById('nftPriceEth').value; // Get price in ETH from the form
    const priceWei = web3.utils.toWei(priceEth, 'ether'); // Convert price to Wei

    try {
        const result = await contract.methods.listNFT(tokenAddress, tokenId, priceWei, false, 0).send({ from: userAccount });
        console.log('NFT listed successfully:', result);
        loadNFTListings(); // Refresh listings
    } catch (error) {
        console.error('Error listing NFT:', error);
    }
}

async function approveAndListNFT() {
    if (!web3) {
        alert("Web3 is not initialized. Make sure your wallet is connected.");
        return;
    }

    const tokenAddress = document.getElementById('nftTokenAddress').value;
    const tokenId = document.getElementById('nftTokenId').value;
    const priceEth = document.getElementById('nftPriceEth').value;
    const priceWei = web3.utils.toWei(priceEth, 'ether');

    const tokenContract = new web3.eth.Contract(ERC721ABI, tokenAddress);

    try {
        // Step 1: Approve the MagmaTrader contract to transfer the NFT
        await tokenContract.methods.approve(contractAddress, tokenId).send({ from: userAccount });
        console.log(`Approval successful for token ID ${tokenId}`);

        // Step 2: List the NFT on the MagmaTrader contract
        await contract.methods.listNFT(tokenAddress, tokenId, priceWei, false, 0).send({ from: userAccount });
        console.log(`NFT with token ID ${tokenId} listed successfully`);

        // Optionally, refresh the listings
        loadNFTListings();
    } catch (error) {
        console.error('Error during NFT listing process:', error);
    }
}


document.getElementById('connectWallet').addEventListener('click', initWeb3);
