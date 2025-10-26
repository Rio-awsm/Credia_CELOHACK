'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
    const { authenticate, isAuthenticating, authError } = useAuth();

    const handleAuthenticate = async () => {
        const success = await authenticate();
        if (success) {
            onSuccess?.();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    🔐 Authentication Required
                </h2>
                <p className="text-gray-700 mb-6">
                    Your session has expired. Please sign a message with your wallet to continue.
                </p>

                {authError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {authError}
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={handleAuthenticate}
                        disabled={isAuthenticating}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                        {isAuthenticating ? 'Authenticating...' : 'Sign Message'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isAuthenticating}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                    This signature will not trigger any blockchain transaction or cost gas fees.
                </p>
            </div>
        </div>
    );
}
