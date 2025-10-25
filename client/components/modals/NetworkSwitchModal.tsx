'use client';

import { useWalletConnection } from '@/hooks/useWalletConnection';
import { getCurrentNetwork } from '@/lib/celo';
import { useState } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface NetworkSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NetworkSwitchModal({ isOpen, onClose }: NetworkSwitchModalProps) {
  const { switchNetwork } = useWalletConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const network = getCurrentNetwork();

  const handleSwitch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await switchNetwork();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Wrong Network</h2>
        
        <p className="text-gray-600 mb-6">
          Please switch to <span className="font-semibold">{network.name}</span> to continue.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSwitch}
            disabled={isLoading}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Switching...
              </span>
            ) : (
              'Switch Network'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
