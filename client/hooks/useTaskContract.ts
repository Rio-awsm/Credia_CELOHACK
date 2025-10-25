'use client';

import { parseErrorMessage } from '@/lib/celo';
import { getCUSDContract, getTaskEscrowContract } from '@/lib/contracts';
import { ethers } from 'ethers';
import { useState } from 'react';
import { useWalletConnection } from './useWalletConnection';

export function useTaskContract() {
  const { signer, address } = useWalletConnection();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create task on blockchain
   */
  const createTask = async (paymentAmount: number, durationInDays: number) => {
    if (!signer || !address) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    setError(null);

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      if (!contractAddress) {
        throw new Error('Contract address not configured');
      }

      // Step 1: Approve cUSD spending
      console.log('📝 Approving cUSD spending...');
      const cUSDContract = getCUSDContract(signer);
      const amount = ethers.parseEther(paymentAmount.toString());
      
      const approveTx = await cUSDContract.approve(contractAddress, amount);
      await approveTx.wait();
      console.log('✅ cUSD approved');

      // Step 2: Create task
      console.log('📝 Creating task on blockchain...');
      const taskContract = getTaskEscrowContract(signer);
      const createTx = await taskContract.createTask(amount, durationInDays);
      
      console.log('⏳ Waiting for confirmation...');
      const receipt = await createTx.wait();
      
      // Parse event to get taskId
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = taskContract.interface.parseLog(log);
          return parsed?.name === 'TaskCreated';
        } catch {
          return false;
        }
      });

      let taskId = 0;
      if (event) {
        const parsedEvent = taskContract.interface.parseLog(event);
        taskId = Number(parsedEvent?.args[0]);
      }

      console.log('✅ Task created! Task ID:', taskId);

      setIsLoading(false);
      return {
        taskId,
        txHash: receipt.hash,
      };
    } catch (err: any) {
      const errorMessage = parseErrorMessage(err);
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  };

  /**
   * Check task status on blockchain
   */
  const checkTaskStatus = async (taskId: number) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      const taskContract = getTaskEscrowContract(signer);
      const task = await taskContract.getTask(taskId);
      
      return {
        taskId: Number(task.taskId),
        requester: task.requester,
        worker: task.worker,
        paymentAmount: ethers.formatEther(task.paymentAmount),
        status: Number(task.status),
        createdAt: Number(task.createdAt),
        expiresAt: Number(task.expiresAt),
      };
    } catch (err: any) {
      const errorMessage = parseErrorMessage(err);
      throw new Error(errorMessage);
    }
  };

  /**
   * Get current task counter
   */
  const getTaskCounter = async () => {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_CELO_RPC_URL);
    const taskContract = getTaskEscrowContract(provider);
    const counter = await taskContract.taskCounter();
    return Number(counter);
  };

  return {
    createTask,
    checkTaskStatus,
    getTaskCounter,
    isLoading,
    error,
  };
}
