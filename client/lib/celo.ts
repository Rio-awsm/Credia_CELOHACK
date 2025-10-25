import { ethers } from 'ethers';

// Network configurations
export const CELO_NETWORKS = {
  mainnet: {
    chainId: 42220,
    name: 'Celo Mainnet',
    rpcUrl: 'https://forno.celo.org',
    blockExplorer: 'https://celoscan.io',
    cUSDAddress: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  },
  sepolia: {
    chainId: 11142220,
    name: 'Celo Sepolia Testnet',
    rpcUrl: 'https://forno.celo-sepolia.celo-testnet.org',
    blockExplorer: 'https://sepolia.celoscan.io',
    cUSDAddress: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
  },
};

// Get current network config
export function getCurrentNetwork() {
  const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11142220');
  
  switch (chainId) {
    case 42220:
      return CELO_NETWORKS.mainnet;
    case 11142220:
      return CELO_NETWORKS.sepolia;
    default:
      return CELO_NETWORKS.sepolia;
  }
}

// Get cUSD token address
export function getCUSDAddress(): string {
  return getCurrentNetwork().cUSDAddress;
}

// Get block explorer URL
export function getExplorerUrl(txHash: string): string {
  return `${getCurrentNetwork().blockExplorer}/tx/${txHash}`;
}

// Format address
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Check if address is valid
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

// Parse error message
export function parseErrorMessage(error: any): string {
  if (error.reason) return error.reason;
  if (error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Transaction failed';
}
