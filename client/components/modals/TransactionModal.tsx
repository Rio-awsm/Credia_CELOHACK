'use client';

import { useTransactions } from '@/hooks/useTransactions';
import { getExplorerUrl } from '@/lib/celo';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export function TransactionModal() {
  const { currentTx, updateTransaction } = useTransactions();

  if (!currentTx) return null;

  const handleClose = () => {
    updateTransaction(currentTx.hash, { ...currentTx });
    // You might want to actually close the modal here
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {currentTx.status === 'pending' && (
            <LoadingSpinner size="lg" />
          )}
          {currentTx.status === 'success' && (
            <div className="text-6xl">✅</div>
          )}
          {currentTx.status === 'failed' && (
            <div className="text-6xl">❌</div>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
          {currentTx.status === 'pending' && 'Transaction Pending'}
          {currentTx.status === 'success' && 'Transaction Successful'}
          {currentTx.status === 'failed' && 'Transaction Failed'}
        </h2>

        {/* Description */}
        <p className="text-center text-gray-600 mb-6">{currentTx.description}</p>

        {/* Transaction Hash */}
        {currentTx.hash && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
            <a
              href={getExplorerUrl(currentTx.hash)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-mono text-blue-600 hover:underline break-all"
            >
              {currentTx.hash}
            </a>
          </div>
        )}

        {/* Actions */}
        {currentTx.status !== 'pending' && (
          <button
            onClick={handleClose}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
