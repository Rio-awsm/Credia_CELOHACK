'use client';

import { useAuth } from '@/hooks/useAuth';
import { useCUSDBalance } from '@/hooks/useCUSDBalance';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { formatAddress } from '@/lib/celo';
import { useState } from 'react';
import { NetworkSwitchModal } from '../modals/NetworkSwitchModal';

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWalletConnection();
  const { authenticate, isAuthenticating, clearAuth, isAuthenticated } = useAuth();
  const { data: balance } = useCUSDBalance(address);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11142220');
  const isWrongNetwork = isConnected && chainId !== expectedChainId;

  const handleConnect = async () => {
    try {
      // Step 1: Connect wallet
      await connect();

      // Step 2: Authenticate
      await authenticate();
    } catch (error) {
      console.error('Connection/Authentication error:', error);
    }
  };

  const handleDisconnect = () => {
    // Clear authentication data
    clearAuth();

    // Disconnect wallet
    disconnect();
  };

  // Show "Re-authenticate" button if connected but not authenticated
  if (isConnected && address && !isAuthenticated && !isWrongNetwork) {
    return (
      <button
        onClick={() => authenticate()}
        disabled={isAuthenticating}
        className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:bg-gray-400 animate-pulse"
      >
        {isAuthenticating ? 'Authenticating...' : '🔐 Sign to Authenticate'}
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <>
        <button
          onClick={() => setShowNetworkModal(true)}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Wrong Network
        </button>
        <NetworkSwitchModal
          isOpen={showNetworkModal}
          onClose={() => setShowNetworkModal(false)}
        />
      </>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {/* Balance */}
        <div className="hidden md:block px-4 py-2 bg-green-50 text-green-900 rounded-lg text-sm font-medium">
          {parseFloat(balance || '0').toFixed(2)} cUSD
        </div>

        {/* Address */}
        <div className="px-4 py-2 bg-blue-50 text-blue-900 rounded-lg text-sm font-medium">
          {formatAddress(address)}
        </div>

        {/* Disconnect */}
        <button
          onClick={handleDisconnect}
          className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:bg-gray-400 animate-pulse"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting || isAuthenticating}
      className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium disabled:bg-gray-400 animate-pulse"
    >
      {isConnecting || isAuthenticating ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
