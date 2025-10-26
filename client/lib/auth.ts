/**
 * Authentication utilities for wallet-based auth
 */

export class AuthService {
    private static readonly AUTH_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes, matching server

    /**
     * Check if user is authenticated with valid credentials
     */
    static isAuthenticated(): boolean {
        if (typeof window === 'undefined') return false;

        const walletAddress = localStorage.getItem('walletAddress');
        const signature = localStorage.getItem('signature');
        const timestamp = localStorage.getItem('timestamp');

        if (!walletAddress || !signature || !timestamp) {
            return false;
        }

        // Check if timestamp is still valid
        const authTimestamp = parseInt(timestamp);
        const now = Date.now();
        const age = now - authTimestamp;

        return age <= this.AUTH_EXPIRY_MS;
    }

    /**
     * Clear authentication data
     */
    static clearAuth(): void {
        if (typeof window === 'undefined') return;

        localStorage.removeItem('walletAddress');
        localStorage.removeItem('signature');
        localStorage.removeItem('message');
        localStorage.removeItem('timestamp');
    }

    /**
     * Get stored wallet address
     */
    static getWalletAddress(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('walletAddress');
    }

    /**
     * Store authentication data
     */
    static storeAuth(
        walletAddress: string,
        signature: string,
        message: string,
        timestamp: number
    ): void {
        if (typeof window === 'undefined') return;

        localStorage.setItem('walletAddress', walletAddress);
        localStorage.setItem('signature', signature);
        localStorage.setItem('message', message);
        localStorage.setItem('timestamp', timestamp.toString());
    }

    /**
     * Generate authentication message for signing
     */
    static generateAuthMessage(walletAddress: string, timestamp: number): string {
        return `Sign this message to authenticate with Celo Task Marketplace.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
    }
}
