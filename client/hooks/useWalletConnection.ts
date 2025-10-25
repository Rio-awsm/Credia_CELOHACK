'use client';

import { getCurrentNetwork, parseErrorMessage } from '@/lib/celo';
import { getWalletProvider, isWalletAvailable } from '@/lib/minipay';
import { ethers } from 'ethers';
import { create } from 'zustand';

interface WalletState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.Signer | null;
  error: string | null;
  walletType: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  initialize: () => Promise<void>; // Add this
}

export const useWalletConnection = create<WalletState>((set, get) => ({
  address: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  provider: null,
  signer: null,
  error: null,
  walletType: null,

  initialize: async () => {
    // Check if wallet was previously connected
    if (typeof window === 'undefined') return;
    
    if (!isWalletAvailable()) return;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.listAccounts();
      
      if (accounts.length > 0) {
        // Auto-connect if previously connected
        await get().connect();
      }
    } catch (error) {
      console.log('Not previously connected');
    }
  },

  connect: async () => {
    set({ isConnecting: true, error: null });

    try {
      if (!isWalletAvailable()) {
        throw new Error('No wallet detected. Please install MiniPay or MetaMask.');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];
      
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      const expectedChainId = getCurrentNetwork().chainId;
      if (chainId !== expectedChainId) {
        await get().switchNetwork();
        return;
      }
      
      const signer = await provider.getSigner();
      const walletType = getWalletProvider();
      
      set({
        address,
        chainId,
        provider,
        signer,
        isConnected: true,
        isConnecting: false,
        walletType,
      });

      console.log(`✅ Connected to ${walletType}:`, address);
    } catch (error: any) {
      const errorMessage = parseErrorMessage(error);
      set({ 
        error: errorMessage,
        isConnecting: false,
      });
      console.error('Wallet connection error:', error);
      throw error;
    }
  },

  disconnect: () => {
    set({
      address: null,
      chainId: null,
      provider: null,
      signer: null,
      isConnected: false,
      walletType: null,
    });
    console.log('🔌 Wallet disconnected');
  },

  switchNetwork: async () => {
    try {
      const targetNetwork = getCurrentNetwork();
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetNetwork.chainId.toString(16)}`,
                chainName: targetNetwork.name,
                nativeCurrency: {
                  name: 'CELO',
                  symbol: 'CELO',
                  decimals: 18,
                },
                rpcUrls: [targetNetwork.rpcUrl],
                blockExplorerUrls: [targetNetwork.blockExplorer],
              },
            ],
          });
        } else {
          throw switchError;
        }
      }

      await get().connect();
    } catch (error: any) {
      const errorMessage = parseErrorMessage(error);
      set({ error: errorMessage });
      throw error;
    }
  },

  signMessage: async (message: string) => {
    const { signer } = get();
    
    if (!signer) {
      throw new Error('Wallet not connected');
    }
    
    try {
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error: any) {
      throw new Error(parseErrorMessage(error));
    }
  },
}));

// Initialize on client side
if (typeof window !== 'undefined') {
  // Initialize wallet connection on mount
  useWalletConnection.getState().initialize();

  // Listen for account changes
  if (window.ethereum) {
    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        useWalletConnection.getState().disconnect();
      } else {
        useWalletConnection.getState().connect();
      }
    });

    window.ethereum.on('chainChanged', () => {
      window.location.reload();
    });
  }
}
