"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignatureUtil = void 0;
const ethers_1 = require("ethers");
class SignatureUtil {
    /**
     * Verify wallet signature
     */
    static verifySignature(message, signature, expectedAddress) {
        try {
            // Recover the address from the signature
            const recoveredAddress = ethers_1.ethers.verifyMessage(message, signature);
            // Compare addresses (case-insensitive)
            return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
        }
        catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }
    /**
     * Generate auth message for wallet to sign
     */
    static generateAuthMessage(walletAddress, timestamp) {
        return `Sign this message to authenticate with Celo Task Marketplace.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
    }
    /**
     * Validate timestamp (prevent replay attacks)
     */
    static isTimestampValid(timestamp, maxAgeMs = 5 * 60 * 1000) {
        const now = Date.now();
        const age = now - timestamp;
        // Check if timestamp is not from the future
        if (age < 0) {
            return false;
        }
        // Check if timestamp is not too old (default: 5 minutes)
        return age <= maxAgeMs;
    }
}
exports.SignatureUtil = SignatureUtil;
