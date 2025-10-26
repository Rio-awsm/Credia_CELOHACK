'use client';

import { useAuth } from '@/hooks/useAuth';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { ReactNode } from 'react';

interface AuthGuardProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Component that requires authentication
 * Shows fallback or warning if user is not authenticated
 */
export function AuthGuard({ children, fallback }: AuthGuardProps) {
    const { isConnected } = useWalletConnection();
    const { isAuthenticated, authenticate, isAuthenticating } = useAuth();

    if (!isConnected) {
        return (
            fallback || (
                <div className="text-center py-12">
                    <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            🔌 Wallet Not Connected
                        </h3>
                        <p className="text-gray-700">
                            Please connect your wallet to access this feature.
                        </p>
                    </div>
                </div>
            )
        );
    }

    if (!isAuthenticated) {
        return (
            fallback || (
                <div className="text-center py-12">
                    <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            🔐 Authentication Required
                        </h3>
                        <p className="text-gray-700 mb-4">
                            Please sign a message to verify your wallet ownership.
                        </p>
                        <button
                            onClick={() => authenticate()}
                            disabled={isAuthenticating}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                        >
                            {isAuthenticating ? 'Authenticating...' : 'Sign Message'}
                        </button>
                    </div>
                </div>
            )
        );
    }

    return <>{children}</>;
}
