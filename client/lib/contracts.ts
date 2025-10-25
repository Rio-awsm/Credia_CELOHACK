import { ethers } from 'ethers';
import { getCUSDAddress, getCurrentNetwork } from './celo';

// Simplified cUSD ABI (ERC20)
export const CUSD_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

// TaskEscrow contract ABI
export const TASK_ESCROW_ABI = [
  'function createTask(uint256 paymentAmount, uint256 durationInDays) returns (uint256)',
  'function approveSubmission(uint256 taskId)',
  'function rejectSubmission(uint256 taskId)',
  'function getTask(uint256 taskId) view returns (tuple(uint256 taskId, address requester, address worker, uint256 paymentAmount, uint8 status, uint256 createdAt, uint256 expiresAt))',
  'function taskCounter() view returns (uint256)',
  'event TaskCreated(uint256 indexed taskId, address indexed requester, uint256 paymentAmount, uint256 expiresAt)',
  'event PaymentReleased(uint256 indexed taskId, address indexed worker, uint256 workerAmount, uint256 platformFee)',
];

/**
 * Get cUSD contract instance
 */
export function getCUSDContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(getCUSDAddress(), CUSD_ABI, signerOrProvider);
}

/**
 * Get TaskEscrow contract instance
 */
export function getTaskEscrowContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    throw new Error('Contract address not configured');
  }
  
  return new ethers.Contract(contractAddress, TASK_ESCROW_ABI, signerOrProvider);
}

/**
 * Get provider
 */
export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(getCurrentNetwork().rpcUrl);
}
