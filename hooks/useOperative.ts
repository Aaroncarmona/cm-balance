'use client';

import { useState, useEffect, useCallback } from 'react';
import { Operative, OperativeFormData } from '@/lib/types';
import {
  getOperative,
  saveOperative,
  addTransaction,
} from '@/lib/storage';
import { updateOperativeCalculations } from '@/lib/calculations';

export const useOperative = () => {
  const [operative, setOperative] = useState<Operative[]>([]);
  const [loading, setLoading] = useState(true);

  // Load operative on mount
  useEffect(() => {
    const loadOperative = () => {
      const data = getOperative();
      setOperative(data);
      setLoading(false);
    };

    loadOperative();
  }, []);

  // Add operative
  const addOperative = useCallback(async (data: OperativeFormData) => {
    const newOperative = updateOperativeCalculations({
      id: `op-${Date.now()}`,
      ...data,
      type: 'CPC',
    });

    const updatedOperative = [...operative, newOperative];
    setOperative(updatedOperative);
    saveOperative(updatedOperative);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'OPERATIVO',
      itemId: newOperative.id,
      itemName: newOperative.concept,
      field: 'created',
      oldValue: 0,
      newValue: newOperative.currentValue,
      description: `Operativo ${newOperative.concept} creado`,
    });
  }, [operative]);

  // Update operative
  const updateOperativeItem = useCallback(async (id: string, data: Partial<OperativeFormData>) => {
    const oldOperative = operative.find(op => op.id === id);
    if (!oldOperative) return;

    const updatedItem = updateOperativeCalculations({
      ...oldOperative,
      ...data,
    });

    const updatedOperative = operative.map(op => op.id === id ? updatedItem : op);
    setOperative(updatedOperative);
    saveOperative(updatedOperative);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'OPERATIVO',
      itemId: id,
      itemName: updatedItem.concept,
      field: 'updated',
      oldValue: oldOperative.currentValue,
      newValue: updatedItem.currentValue,
      description: `Operativo ${updatedItem.concept} actualizado`,
    });
  }, [operative]);

  // Delete operative
  const deleteOperativeItem = useCallback(async (id: string) => {
    const operativeItem = operative.find(op => op.id === id);
    if (!operativeItem) return;

    const updatedOperative = operative.filter(op => op.id !== id);
    setOperative(updatedOperative);
    saveOperative(updatedOperative);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'OPERATIVO',
      itemId: id,
      itemName: operativeItem.concept,
      field: 'deleted',
      oldValue: operativeItem.currentValue,
      newValue: 0,
      description: `Operativo ${operativeItem.concept} eliminado`,
    });
  }, [operative]);

  return {
    operative,
    loading,
    addOperative,
    updateOperativeItem,
    deleteOperativeItem,
  };
};
