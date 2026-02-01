'use client';

import { useState, useEffect, useCallback } from 'react';
import { Debt, DebtFormData } from '@/lib/types';
import {
  getDebts,
  saveDebts,
  addTransaction,
} from '@/lib/storage';
import { updateDebtCalculations } from '@/lib/calculations';

export const useDebts = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  // Load debts on mount
  useEffect(() => {
    const loadDebts = () => {
      const data = getDebts();
      setDebts(data);
      setLoading(false);
    };

    loadDebts();
  }, []);

  // Add debt
  const addDebt = useCallback(async (data: DebtFormData) => {
    const newDebt = updateDebtCalculations({
      id: `debt-${Date.now()}`,
      ...data,
      type: 'CREDITO',
    });

    const updatedDebts = [...debts, newDebt];
    setDebts(updatedDebts);
    saveDebts(updatedDebts);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'DEUDA',
      itemId: newDebt.id,
      itemName: newDebt.concept,
      field: 'created',
      oldValue: 0,
      newValue: newDebt.currentValue,
      description: `Deuda ${newDebt.concept} creada`,
    });
  }, [debts]);

  // Update debt
  const updateDebt = useCallback(async (id: string, data: Partial<DebtFormData>) => {
    const oldDebt = debts.find(debt => debt.id === id);
    if (!oldDebt) return;

    const updatedItem = updateDebtCalculations({
      ...oldDebt,
      ...data,
    });

    const updatedDebts = debts.map(debt => debt.id === id ? updatedItem : debt);
    setDebts(updatedDebts);
    saveDebts(updatedDebts);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'DEUDA',
      itemId: id,
      itemName: updatedItem.concept,
      field: 'updated',
      oldValue: oldDebt.currentValue,
      newValue: updatedItem.currentValue,
      description: `Deuda ${updatedItem.concept} actualizada`,
    });
  }, [debts]);

  // Delete debt
  const deleteDebt = useCallback(async (id: string) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    const updatedDebts = debts.filter(d => d.id !== id);
    setDebts(updatedDebts);
    saveDebts(updatedDebts);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'DEUDA',
      itemId: id,
      itemName: debt.concept,
      field: 'deleted',
      oldValue: debt.currentValue,
      newValue: 0,
      description: `Deuda ${debt.concept} eliminada`,
    });
  }, [debts]);

  return {
    debts,
    loading,
    addDebt,
    updateDebt,
    deleteDebt,
  };
};
