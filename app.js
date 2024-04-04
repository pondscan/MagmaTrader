let web3;
let userAccount;

// NFT Collection Object to store NFTs by collection
const nftCollections = {};

async function loadContractABI() {
    const response = await fetch('./contractABI.json');
    if (!response.ok) {
        throw new Error(`Failed to load contract ABI: ${response.statusText}`);
    }
    return await response.json();
}

async function initWeb3() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);

        window.ethereum.on('accountsChanged', async function(accounts) {
            if (accounts.length === 0) {
                document.getElementById('walletConnect').innerText = 'Connect Wallet';
                userAccount = null;
            } else {
                userAccount = accounts[0];
                updateButtonWithAddress(userAccount);
                fetchTokenCollections(userAccount);
            }
        });

        const accounts = await web3.eth.requestAccounts();
        userAccount = accounts[0];
        updateButtonWithAddress(userAccount);
        fetchTokenCollections(userAccount);

        const contractABI = await loadContractABI();
        const contractAddress = "0x2d03544dC31f1DfaeDC5082d26eE4B77B66B2458"; // Replace with your contract address
        magmaTraderContract = new web3.eth.Contract(contractABI, contractAddress);
    } else {
        alert("MetaMask is not installed. Please consider installing it: https://metamask.io/download.html");
    }
}

function updateButtonWithAddress(address) {
    const walletButton = document.getElementById('walletConnect');
    walletButton.innerText = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    walletButton.onclick = () => showModal(address);
}

function showModal(fullAddress) {
    const modalText = document.getElementById('modalText');
    modalText.innerHTML = `Connected as <span class="stat-chip">${fullAddress}</span>`;
    const infoModal = document.getElementById('infoModal');
    infoModal.style.display = 'block';
    document.getElementById('okBtn').onclick = () => {
        infoModal.style.display = 'none';
    };
}

function openTransferModal() {
    if (!currentSelectedCard) {
        alert('Please select an NFT to transfer.');
        return;
    }

    const transferModal = document.getElementById('nftModal');
    transferModal.innerHTML = `
        <div class="modal-content">
            <p>Transfer <img src="${currentSelectedCard.querySelector('img').src}" alt="NFT" style="width: 25px; height: 25px;"> to:</p>
            <input type="text" id="recipientAddress" placeholder="Recipient ETH Address">
            <div class="modal-actions">
                <button id="cancelTransfer">Cancel</button>
                <button id="confirmTransfer">Transfer</button>
            </div>
        </div>`;
    transferModal.style.display = 'block';

    document.getElementById('cancelTransfer').addEventListener('click', () => {
        console.log('Cancel button clicked, closing modal.');
        transferModal.style.display = 'none';
    });

    document.getElementById('confirmTransfer').addEventListener('click', () => {
        console.log('Transfer button clicked, initiating transfer.');
        transferNFT();
    });
}

async function transferNFT() {
    const recipientAddress = document.getElementById('recipientAddress').value;
    if (!web3.utils.isAddress(recipientAddress)) {
        alert('Invalid recipient address.');
        return;
    }

    const tokenId = currentSelectedCard.getAttribute('data-token-id');
    const contractAddress = currentSelectedCard.getAttribute('data-contract-address');

    try {
        console.log(`Initiating transfer... Token ID: ${tokenId} to ${recipientAddress}`);

        // Initialize contract instance
        const nftContract = new web3.eth.Contract(abi, contractAddress);

        // Call safeTransferFrom function with from, to, and tokenId parameters
        await nftContract.methods.safeTransferFrom(web3.eth.defaultAccount, recipientAddress, tokenId).send({ from: web3.eth.defaultAccount });

        console.log(`Transfer successful. Token ID: ${tokenId} has been transferred to ${recipientAddress}`);
        alert(`NFT (Token ID: ${tokenId}) successfully transferred to ${recipientAddress}`);
    } catch (error) {
        console.error('Error transferring NFT:', error);
        alert('Failed to transfer NFT. See console for details.');
    }

    document.getElementById('nftModal').style.display = 'none';
    console.log('Transfer modal closed.');
}



// Hardcoded ERC721 ABI
const abi = [
    // ERC721 Metadata
    {
        "constant":true,
        "inputs":[
            {"name":"_tokenId","type":"uint256"}
        ],
        "name":"getMetadata",
        "outputs":[
            {"name":"","type":"string"}
        ],
        "payable":false,
        "stateMutability":"view",
        "type":"function"
    },
    // Transfer and ownership functions
    {
        "constant":false,
        "inputs":[
            {"name":"_to","type":"address"},
            {"name":"_tokenId","type":"uint256"}
        ],
        "name":"transfer",
        "outputs":[],
        "payable":false,
        "stateMutability":"nonpayable",
        "type":"function"
    },
    {
        "constant":false,
        "inputs":[
            {"name":"_to","type":"address"},
            {"name":"_tokenId","type":"uint256"}
        ],
        "name":"safeTransferFrom",
        "outputs":[],
        "payable":false,
        "stateMutability":"nonpayable",
        "type":"function"
    },
    // Other ERC721 standard functions...
];

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('walletConnect').addEventListener('click', initWeb3);
    document.getElementById('viewMyNFTs').addEventListener('click', openTransferModal);

    // Event delegation for handling clicks within the transfer modal
    document.body.addEventListener('click', function(event) {
        const transferModal = document.getElementById('nftModal');

        // Handle the "Cancel" button click
        if (event.target && event.target.id === 'cancelTransfer') {
            console.log('Cancel button clicked, closing modal.');
            transferModal.style.display = 'none';
        }

        // Handle the "Transfer" button click
        if (event.target && event.target.id === 'confirmTransfer') {
            console.log('Transfer button clicked, initiating transfer.');
            transferNFT();
        }
    });
});

// Fetches all ERC-721 tokens owned by the user
async function fetchTokenCollections(address) {
    const apiUrl = `https://magmascan.org/api/v2/addresses/${address}/tokens?type=ERC-721`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.items.length === 0) {
            console.log('No ERC-721 tokens found for this address.');
            return;
        }
        // For each token collection, fetch the instances (NFTs)
        data.items.forEach(collection => {
            fetchNFTInstances(collection.token.address, address);
        });
    } catch (error) {
        console.error('Error fetching token collections:', error.message);
    }
}

async function fetchNFTInstances(tokenAddress, userAddress, uniqueToken = null) {
    let tokenInstancesUrl = `https://magmascan.org/api/v2/tokens/${tokenAddress}/instances`;
    if (uniqueToken) {
        tokenInstancesUrl += `?unique_token=${uniqueToken}`;
    }

    try {
        const response = await fetch(tokenInstancesUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            console.log(`No more NFT instances found for token at address ${tokenAddress}`);
            return;
        }

        // Filter the NFT instances to only include those owned by the user
        const ownedNFTs = data.items.filter(instance => instance.owner.hash.toLowerCase() === userAddress.toLowerCase());

        // Display each owned NFT
        ownedNFTs.forEach(nft => {
            const imageUrl = nft.metadata?.image || nft.image_url || 'nft_placeholder.jpg';
            addNFTCard(nft, imageUrl, tokenAddress);
        });

        // Check if there's a next page and fetch the next batch if so
        if (data.next_page_params && data.next_page_params.unique_token !== null) {
            fetchNFTInstances(tokenAddress, userAddress, data.next_page_params.unique_token);
        } else {
            console.log('All NFT instances have been fetched.');
        }
    } catch (error) {
        console.error(`Error fetching NFT instances from ${tokenAddress}:`, error);
    }
}

// Tracks the currently selected NFT card
let currentSelectedCard = null;

// Adds an NFT card to the webpage
function addNFTCard(nftInstance, imageUrl, tokenAddress) {
    const cardsContainer = document.getElementById('nftCards');
    if (!cardsContainer) {
        console.error('NFT cards container not found.');
        return;
    }

    const card = document.createElement('div');
    card.className = 'nft-card';
    card.setAttribute('data-token-id', nftInstance.id); // Set data-token-id attribute for transfer functionality
    card.setAttribute('data-contract-address', tokenAddress); // Set data-contract-address attribute for transfer functionality
    card.innerHTML = `<img src="${imageUrl}" alt="NFT Image" onerror="this.onerror=null;this.src='nft_placeholder.jpg';"><div class="nft-info">ID: ${nftInstance.id}</div>`;

    // Event listener for NFT card selection
    card.addEventListener('click', () => {
        // Deselect the current card if it is selected again
        if (currentSelectedCard === card) {
            card.classList.remove('selected');
            currentSelectedCard = null;
        } else {
            // Deselect the previously selected card if a different card is selected
            if (currentSelectedCard) {
                currentSelectedCard.classList.remove('selected');
            }
            card.classList.add('selected');
            currentSelectedCard = card; // Update the current selected card
        }
    });

    cardsContainer.appendChild(card);
}

// Exposes the fetchTokenCollections function globally so it can be called from other scripts
window.fetchTokenCollections = fetchTokenCollections;

