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
   * Assign worker to a task
   */
  async assignWorker(taskId: number, workerAddress: string): Promise<string> {
    try {
      console.log(`Assigning worker ${workerAddress} to task ${taskId} on blockchain`);

      const tx = await this.contract.assignWorker(taskId, workerAddress);
      console.log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`Worker assigned! Tx: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      console.error('Blockchain assignWorker error:', error);
      throw new Error(`Failed to assign worker: ${error}`);
    }
  }

  /**
   * Approve submission and release payment
   */
  async approveSubmission(taskId: number): Promise<string> {
    try {
      console.log(`Approving submission for task ${taskId} on blockchain`);

      // First, verify the task exists on-chain
      try {
        const taskData = await this.contract.tasks(taskId);
        console.log('Task data from blockchain:', {
          taskId: taskData.taskId.toString(),
          requester: taskData.requester,
          worker: taskData.worker,
          status: taskData.status,
          paymentAmount: ethers.formatEther(taskData.paymentAmount),
        });

        if (taskData.requester === ethers.ZeroAddress) {
          throw new Error(`Task ${taskId} does not exist on blockchain`);
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch task data:', error.message);
        const contractAddr = this.contract.target;
        throw new Error(
          `Task ${taskId} not found on contract ${contractAddr}. ` +
          `This task may have been created on a different contract. ` +
          `Check CONTRACT_ADDRESS in .env matches the contract used to create this task.`
        );
      }

      const tx = await this.contract.approveSubmission(taskId);
      console.log(`Transaction sent: ${tx.hash}`);

      const receipt = await tx.wait();
      console.log(`Payment released! Tx: ${receipt.hash}`);

      return receipt.hash;
    } catch (error: any) {
      console.error('Blockchain approveSubmission error:', error);

      // Provide helpful error message
      const contractAddr = this.contract.target;
      let errorMsg = `Failed to approve submission for task ${taskId}. `;

      if (error.message?.includes('Task does not exist') || error.message?.includes('not found')) {
        errorMsg += `Task not found on contract ${contractAddr}. `;
        errorMsg += `Ensure the task was created with this contract address.`;
      } else {
        errorMsg += error.message || 'Unknown blockchain error';
      }

      throw new Error(errorMsg);
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

  /**
   * Get task details from blockchain
   */
  async getTask(taskId: number): Promise<{
    taskId: number;
    requester: string;
    worker: string;
    paymentAmount: string;
    status: number;
    createdAt: number;
    expiresAt: number;
  } | null> {
    try {
      const taskData = await this.contract.tasks(taskId);

      // Check if task exists (requester is not zero address)
      if (taskData.requester === ethers.ZeroAddress) {
        return null;
      }

      return {
        taskId: Number(taskData.taskId),
        requester: taskData.requester,
        worker: taskData.worker,
        paymentAmount: ethers.formatEther(taskData.paymentAmount),
        status: Number(taskData.status),
        createdAt: Number(taskData.createdAt),
        expiresAt: Number(taskData.expiresAt),
      };
    } catch (error) {
      console.error('Get task error:', error);
      throw error;
    }
  }

  /**
   * Get current task counter from blockchain
   */
  async getTaskCounter(): Promise<number> {
    try {
      const counter = await this.contract.taskCounter();
      return Number(counter);
    } catch (error) {
      console.error('Get task counter error:', error);
      throw error;
    }
  }

  /**
   * Get contract address being used
   */
  getContractAddress(): string {
    return this.contract.target as string;
  }

  /**
   * Check if user has approved the contract to spend cUSD
   */
  async checkAllowance(walletAddress: string): Promise<string> {
    try {
      const cUSDAddress = process.env.CUSD_SEPOLIA_ADDRESS;
      const contractAddress = process.env.CONTRACT_ADDRESS;

      if (!cUSDAddress) {
        throw new Error('CUSD_SEPOLIA_ADDRESS not configured');
      }
      if (!contractAddress) {
        throw new Error('CONTRACT_ADDRESS not configured');
      }

      const cUSDContract = new ethers.Contract(
        cUSDAddress,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        this.provider
      );

      const allowance = await cUSDContract.allowance(walletAddress, contractAddress);
      return ethers.formatEther(allowance);
    } catch (error) {
      console.error('Check allowance error:', error);
      throw error;
    }
  }

  /**
   * Approve contract to spend cUSD tokens
   */
  async approveCUSD(amount: string): Promise<string> {
    try {
      const cUSDAddress = process.env.CUSD_SEPOLIA_ADDRESS;
      const contractAddress = process.env.CONTRACT_ADDRESS;

      if (!cUSDAddress) {
        throw new Error('CUSD_SEPOLIA_ADDRESS not configured');
      }
      if (!contractAddress) {
        throw new Error('CONTRACT_ADDRESS not configured');
      }

      const cUSDContract = new ethers.Contract(
        cUSDAddress,
        ['function approve(address spender, uint256 amount) returns (bool)'],
        this.signer
      );

      console.log(`Approving ${amount} cUSD for TaskEscrow contract...`);
      const tx = await cUSDContract.approve(contractAddress, ethers.parseEther(amount));
      const receipt = await tx.wait();

      console.log(`✅ Approval confirmed: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      console.error('Approve cUSD error:', error);
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService();
