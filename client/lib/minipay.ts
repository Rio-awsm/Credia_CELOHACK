declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface MiniPayProvider {
  isMiniPay: boolean;
  isMetaMask?: boolean;
}

/**
 * Check if running inside MiniPay app
 */
export function isMiniPay(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.ethereum?.isMiniPay);
}

/**
 * Check if MetaMask is available
 */
export function isMetaMask(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.ethereum?.isMetaMask && !window.ethereum?.isMiniPay);
}

/**
 * Get wallet provider name
 */
export function getWalletProvider(): string {
  if (isMiniPay()) return 'MiniPay';
  if (isMetaMask()) return 'MetaMask';
  return 'Unknown';
}

/**
 * Check if any wallet is available
 */
export function isWalletAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.ethereum);
}

/**
 * Get wallet installation URL
 */
export function getWalletInstallUrl(): string {
  // Check if mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    return 'https://minipay.opera.com/';
  }
  
  return 'https://metamask.io/download/';
}
