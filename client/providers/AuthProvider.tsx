'use client';

import { AuthModal } from '@/components/modals/AuthModal';
import { onAuthSuccess } from '@/lib/api';
import { useEffect, useState } from 'react';

/**
 * Global authentication handler that shows auth modal when needed
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [showAuthModal, setShowAuthModal] = useState(false);

    useEffect(() => {
        const handleAuthRequired = () => {
            setShowAuthModal(true);
        };

        window.addEventListener('auth-required', handleAuthRequired);
        return () => window.removeEventListener('auth-required', handleAuthRequired);
    }, []);

    const handleAuthSuccess = () => {
        setShowAuthModal(false);
        onAuthSuccess(); // Notify any pending requests
    };

    return (
        <>
            {children}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleAuthSuccess}
            />
        </>
    );
}
