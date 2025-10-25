'use client';

import { useCUSDBalance } from '@/hooks/useCUSDBalance';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { formatAddress } from '@/lib/celo';
import { useState } from 'react';
import { NetworkSwitchModal } from '../modals/NetworkSwitchModal';

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect, chainId } = useWalletConnection();
  const { data: balance } = useCUSDBalance(address);
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  const expectedChainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '44787');
  const isWrongNetwork = isConnected && chainId !== expectedChainId;

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

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
          onClick={disconnect}
          className="px-4 py-2 text-sm text-gray-700 hover:text-red-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting}
      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
