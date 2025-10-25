import { ethers } from 'ethers';

export class SignatureUtil {
  /**
   * Verify wallet signature
   */
  static verifySignature(
    message: string,
    signature: string,
    expectedAddress: string
  ): boolean {
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(message, signature);

      // Compare addresses (case-insensitive)
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate auth message for wallet to sign
   */
  static generateAuthMessage(walletAddress: string, timestamp: number): string {
    return `Sign this message to authenticate with Celo Task Marketplace.\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  }

  /**
   * Validate timestamp (prevent replay attacks)
   */
  static isTimestampValid(timestamp: number, maxAgeMs: number = 5 * 60 * 1000): boolean {
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
