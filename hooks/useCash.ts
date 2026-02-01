'use client';

import { useState, useEffect, useCallback } from 'react';
import { Cash, CashFormData } from '@/lib/types';
import {
  getCash,
  saveCash,
  addTransaction,
} from '@/lib/storage';

export const useCash = () => {
  const [cash, setCash] = useState<Cash[]>([]);
  const [loading, setLoading] = useState(true);

  // Load cash on mount
  useEffect(() => {
    const loadCash = () => {
      const data = getCash();
      setCash(data);
      setLoading(false);
    };

    loadCash();
  }, []);

  // Add cash
  const addCash = useCallback(async (data: CashFormData) => {
    const newCash: Cash = {
      id: `cash-${Date.now()}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedCash = [...cash, newCash];
    setCash(updatedCash);
    saveCash(updatedCash);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'CAJA',
      itemId: newCash.id,
      itemName: newCash.concept,
      field: 'created',
      oldValue: 0,
      newValue: newCash.amount,
      description: `Caja ${newCash.concept} creada`,
    });
  }, [cash]);

  // Update cash
  const updateCash = useCallback(async (id: string, data: Partial<CashFormData>) => {
    const oldCash = cash.find(c => c.id === id);
    if (!oldCash) return;

    const updatedItem: Cash = {
      ...oldCash,
      ...data,
      updatedAt: new Date(),
    };

    const updatedCash = cash.map(c => c.id === id ? updatedItem : c);
    setCash(updatedCash);
    saveCash(updatedCash);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'CAJA',
      itemId: id,
      itemName: updatedItem.concept,
      field: 'updated',
      oldValue: oldCash.amount,
      newValue: updatedItem.amount,
      description: `Caja ${updatedItem.concept} actualizada`,
    });
  }, [cash]);

  // Delete cash
  const deleteCash = useCallback(async (id: string) => {
    const cashItem = cash.find(c => c.id === id);
    if (!cashItem) return;

    const updatedCash = cash.filter(c => c.id !== id);
    setCash(updatedCash);
    saveCash(updatedCash);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'CAJA',
      itemId: id,
      itemName: cashItem.concept,
      field: 'deleted',
      oldValue: cashItem.amount,
      newValue: 0,
      description: `Caja ${cashItem.concept} eliminada`,
    });
  }, [cash]);

  return {
    cash,
    loading,
    addCash,
    updateCash,
    deleteCash,
  };
};
