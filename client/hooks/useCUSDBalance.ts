'use client';

import { getCUSDContract, getProvider } from '@/lib/contracts';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';

export function useCUSDBalance(address: string | null) {
  return useQuery({
    queryKey: ['cusd-balance', address],
    queryFn: async () => {
      if (!address) return '0';

      const provider = getProvider();
      const cUSDContract = getCUSDContract(provider);
      
      const balance = await cUSDContract.balanceOf(address);
      return ethers.formatEther(balance);
    },
    enabled: !!address,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

export function useCUSDAllowance(owner: string | null, spender: string) {
  return useQuery({
    queryKey: ['cusd-allowance', owner, spender],
    queryFn: async () => {
      if (!owner) return '0';

      const provider = getProvider();
      const cUSDContract = getCUSDContract(provider);
      
      const allowance = await cUSDContract.allowance(owner, spender);
      return ethers.formatEther(allowance);
    },
    enabled: !!owner,
  });
}
