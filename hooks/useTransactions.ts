'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { getTransactions } from '@/lib/storage';

export const useTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transactions on mount
  useEffect(() => {
    const loadTransactions = async () => {
      const data = await getTransactions();
      setTransactions(data);
      setLoading(false);
    };

    loadTransactions();
  }, []);

  // Refresh transactions
  const refreshTransactions = async () => {
    setLoading(true);
    const data = await getTransactions();
    setTransactions(data);
    setLoading(false);
  };

  return {
    transactions,
    loading,
    refreshTransactions,
  };
};
