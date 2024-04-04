// nftFetch.js

async function fetchTokenCollections(address) {
    const apiUrl = `https://magmascan.org/api/v2/addresses/${address}/tokens?type=ERC-721`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        data.items.forEach(collection => {
            fetchNFTInstances(collection.token.address, address);
        });
    } catch (error) {
        console.error('Error fetching token collections:', error);
    }
}

async function fetchNFTInstances(tokenAddress, address) {
    const tokenInstancesUrl = `https://magmascan.org/api/v2/tokens/${tokenAddress}/instances`;
    try {
        const response = await fetch(tokenInstancesUrl);
        const data = await response.json();
        data.items.forEach(instance => {
            const imageUrl = instance.metadata?.image || instance.image_url || 'placeholder_image_url';
            addNFTCard(instance, imageUrl);
        });
    } catch (error) {
        console.error('Error fetching NFT instances:', error);
    }
}

function addNFTCard(nftInstance, imageUrl) {
    const cardsContainer = document.getElementById('nftCards');
    if (!cardsContainer) {
        console.log('NFT cards container not found.');
        return;
    }
    const card = document.createElement('div');
    card.className = 'nft-card';
    card.innerHTML = `<img src="${imageUrl}" alt="NFT Image" onerror="this.onerror=null;this.src='placeholder_image_url';"><div class="nft-info">ID: ${nftInstance.id}</div>`;
    card.addEventListener('click', () => {
        card.classList.toggle('selected');
        // Additional logic for selecting an NFT can go here
    });
    cardsContainer.appendChild(card);
}

// This line ensures fetchTokenCollections is available in the global scope when app.js calls it.
window.fetchTokenCollections = fetchTokenCollections;
