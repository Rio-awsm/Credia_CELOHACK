import { ethers } from 'ethers';
import { readFileSync } from 'fs';
import { join } from 'path';

const TaskEscrowABI = JSON.parse(
  readFileSync(
    join(__dirname, '../../artifacts/contracts/TaskEscrow.sol/TaskEscrow.json'),
    'utf8'
  )
);

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;
  private signer: ethers.Wallet;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(
      process.env.CELO_RPC_URL || 'https://forno.celo-sepolia.celo-testnet.org'
    );

    // Initialize signer
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY not configured');
    }
    this.signer = new ethers.Wallet(privateKey, this.provider);

    // Initialize contract
    const contractAddress = process.env.CONTRACT_ADDRESS;
    if (!contractAddress) {
      throw new Error('CONTRACT_ADDRESS not configured');
    }
    this.contract = new ethers.Contract(
      contractAddress,
      TaskEscrowABI.abi,
      this.signer
    );
  }

  /**
   * Create task on blockchain
   */
  async createTask(paymentAmount: string, durationInDays: number): Promise<{
    taskId: number;
    txHash: string;
  }> {
    try {
      console.log(`Creating task on blockchain: ${paymentAmount} cUSD for ${durationInDays} days`);

      const tx = await this.contract.createTask(
        ethers.parseEther(paymentAmount),
        durationInDays
      );

      console.log(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

      // Get taskId from event
      const event = receipt.logs.find((log: any) => {
        try {
          return this.contract.interface.parseLog(log)?.name === 'TaskCreated';
        } catch {
          return false;
        }
      });

      const parsedEvent = this.contract.interface.parseLog(event as any);
      const taskId = Number(parsedEvent?.args[0]);

      return {
        taskId,
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error('Blockchain createTask error:', error);
      throw new Error(`Failed to create task on blockchain: ${error}`);
    }
  }

  /**
   * Approve submission and release payment
   */
  async approveSubmission(taskId: number): Promise<string> {
    try {
      console.log(`Approving submission for task ${taskId} on blockchain`);

      const tx = await this.contract.approveSubmission(taskId);
      console.log(`Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Payment released! Tx: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      console.error('Blockchain approveSubmission error:', error);
      throw new Error(`Failed to approve submission: ${error}`);
    }
  }

  /**
   * Reject submission and refund requester
   */
  async rejectSubmission(taskId: number): Promise<string> {
    try {
      console.log(`Rejecting submission for task ${taskId} on blockchain`);

      const tx = await this.contract.rejectSubmission(taskId);
      const receipt = await tx.wait();

      return receipt.hash;
    } catch (error) {
      console.error('Blockchain rejectSubmission error:', error);
      throw new Error(`Failed to reject submission: ${error}`);
    }
  }

  /**
   * Check cUSD balance
   */
  async getCUSDBalance(walletAddress: string): Promise<string> {
    try {
      const cUSDAddress = process.env.CUSD_SEPOLIA_ADDRESS;
      if (!cUSDAddress) {
        throw new Error('CUSD_SEPOLIA_ADDRESS not configured');
      }

      const cUSDContract = new ethers.Contract(
        cUSDAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );

      const balance = await cUSDContract.balanceOf(walletAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Get cUSD balance error:', error);
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService();
