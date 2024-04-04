// app.js

let web3;
let magmaTraderContract;
let userAccount;

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

        window.ethereum.on('accountsChanged', async function (accounts) {
            if (accounts.length === 0) {
                document.getElementById('walletConnect').innerText = 'Connect Wallet';
                userAccount = null;
            } else {
                userAccount = accounts[0];
                updateButtonWithAddress(userAccount);
                fetchTokenCollections(userAccount); // Defined in nftFetch.js
            }
        });

        const accounts = await web3.eth.requestAccounts();
        userAccount = accounts[0];
        updateButtonWithAddress(userAccount);
        fetchTokenCollections(userAccount); // Defined in nftFetch.js

        const contractABI = await loadContractABI();
        magmaTraderContract = new web3.eth.Contract(contractABI, "0x2d03544dC31f1DfaeDC5082d26eE4B77B66B2458");
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
    document.getElementById('closeModal').onclick = () => {
        infoModal.style.display = 'none';
    };
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('walletConnect').addEventListener('click', initWeb3);
});
