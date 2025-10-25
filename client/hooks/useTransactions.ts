'use client';

import { create } from 'zustand';

export interface Transaction {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  description: string;
  timestamp: number;
}

interface TransactionState {
  transactions: Transaction[];
  currentTx: Transaction | null;
  
  addTransaction: (tx: Omit<Transaction, 'timestamp'>) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;
  clearTransactions: () => void;
}

export const useTransactions = create<TransactionState>((set) => ({
  transactions: [],
  currentTx: null,

  addTransaction: (tx) => {
    const transaction: Transaction = {
      ...tx,
      timestamp: Date.now(),
    };
    
    set((state) => ({
      transactions: [transaction, ...state.transactions],
      currentTx: transaction,
    }));
  },

  updateTransaction: (hash, updates) => {
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.hash === hash ? { ...tx, ...updates } : tx
      ),
      currentTx:
        state.currentTx?.hash === hash
          ? { ...state.currentTx, ...updates }
          : state.currentTx,
    }));
  },

  clearTransactions: () => {
    set({ transactions: [], currentTx: null });
  },
}));
