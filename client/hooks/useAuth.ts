'use client';

import { AuthService } from '@/lib/auth';
import { useWalletConnection } from './useWalletConnection';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useAuth() {
    const { address, isConnected, signMessage } = useWalletConnection();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Check authentication status on mount and when wallet changes
    useEffect(() => {
        const checkAuth = () => {
            const authenticated = AuthService.isAuthenticated();
            setIsAuthenticated(authenticated);

            // If wallet is connected but not authenticated, show warning
            if (isConnected && !authenticated) {
                console.warn('⚠️ Wallet connected but not authenticated');
            }
        };

        checkAuth();

        // Check auth status every 30 seconds
        const interval = setInterval(checkAuth, 30000);
        return () => clearInterval(interval);
    }, [isConnected, address]);

    const authenticate = async () => {
        if (!isConnected || !address) {
            setAuthError('Please connect your wallet first');
            return false;
        }

        setIsAuthenticating(true);
        setAuthError(null);

        try {
            // Clear any old auth before registering to avoid sending expired credentials
            const oldAuthExists = AuthService.isAuthenticated();
            if (!oldAuthExists) {
                AuthService.clearAuth();
            }

            // Step 1: Register user if needed
            try {
                await api.users.register({
                    walletAddress: address,
                    role: 'worker',
                });
                console.log('✅ User registered successfully');
            } catch (error: any) {
                // User might already exist, which is fine
                if (error.response?.status !== 409) {
                    console.log('Registration note:', error.response?.data?.message || error.message);
                }
            }

            // Step 2: Generate and sign authentication message
            const timestamp = Date.now();
            const message = AuthService.generateAuthMessage(address, timestamp);
            const signature = await signMessage(message);

            // Step 3: Store authentication
            AuthService.storeAuth(address, signature, message, timestamp);
            setIsAuthenticated(true);

            console.log('✅ Authentication successful');
            return true;
        } catch (error: any) {
            console.error('Authentication error:', error);
            setAuthError(error.message || 'Authentication failed');
            AuthService.clearAuth();
            setIsAuthenticated(false);
            return false;
        } finally {
            setIsAuthenticating(false);
        }
    };

    const clearAuth = () => {
        AuthService.clearAuth();
        setIsAuthenticated(false);
        setAuthError(null);
    };

    return {
        isAuthenticated,
        isAuthenticating,
        authError,
        authenticate,
        clearAuth,
    };
}
