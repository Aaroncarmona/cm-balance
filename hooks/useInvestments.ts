'use client';

import { useState, useEffect, useCallback } from 'react';
import { Investment, InvestmentFormData } from '@/lib/types';
import {
  getInvestments,
  saveInvestments,
  addInvestment as addInvestmentStorage,
  updateInvestment as updateInvestmentStorage,
  deleteInvestment as deleteInvestmentStorage,
  addTransaction,
} from '@/lib/storage';
import { updateInvestmentCalculations } from '@/lib/calculations';

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Load investments on mount
  useEffect(() => {
    const loadInvestments = () => {
      const data = getInvestments();
      setInvestments(data);
      setLoading(false);
    };

    loadInvestments();
  }, []);

  // Recalculate portfolio percentages
  const recalculatePortfolios = useCallback((invs: Investment[]) => {
    const total = invs.reduce((sum, inv) => sum + inv.accumulated, 0);
    return invs.map(inv => ({
      ...inv,
      portfolio: total > 0 ? (inv.accumulated / total) * 100 : 0,
    }));
  }, []);

  // Add investment
  const addInvestment = useCallback(async (data: InvestmentFormData) => {
    const newInvestment = updateInvestmentCalculations(
      {
        id: `inv-${Date.now()}`,
        ...data,
      },
      investments
    );

    const updatedInvestments = recalculatePortfolios([...investments, newInvestment]);
    setInvestments(updatedInvestments);
    saveInvestments(updatedInvestments);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'INVERSION',
      itemId: newInvestment.id,
      itemName: newInvestment.concept,
      field: 'created',
      oldValue: 0,
      newValue: newInvestment.currentValue,
      description: `Inversión ${newInvestment.concept} creada`,
    });
  }, [investments, recalculatePortfolios]);

  // Update investment
  const updateInvestment = useCallback(async (id: string, data: Partial<InvestmentFormData>) => {
    const oldInvestment = investments.find(inv => inv.id === id);
    if (!oldInvestment) return;

    const updatedInvestment = updateInvestmentCalculations(
      {
        ...oldInvestment,
        ...data,
      },
      investments
    );

    const updatedInvestments = recalculatePortfolios(
      investments.map(inv => inv.id === id ? updatedInvestment : inv)
    );
    
    setInvestments(updatedInvestments);
    saveInvestments(updatedInvestments);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'INVERSION',
      itemId: id,
      itemName: updatedInvestment.concept,
      field: 'updated',
      oldValue: oldInvestment.currentValue,
      newValue: updatedInvestment.currentValue,
      description: `Inversión ${updatedInvestment.concept} actualizada`,
    });
  }, [investments, recalculatePortfolios]);

  // Delete investment
  const deleteInvestment = useCallback(async (id: string) => {
    const investment = investments.find(inv => inv.id === id);
    if (!investment) return;

    const updatedInvestments = recalculatePortfolios(
      investments.filter(inv => inv.id !== id)
    );
    
    setInvestments(updatedInvestments);
    saveInvestments(updatedInvestments);

    // Log transaction
    await addTransaction({
      id: `tx-${Date.now()}`,
      date: new Date(),
      category: 'INVERSION',
      itemId: id,
      itemName: investment.concept,
      field: 'deleted',
      oldValue: investment.currentValue,
      newValue: 0,
      description: `Inversión ${investment.concept} eliminada`,
    });
  }, [investments, recalculatePortfolios]);

  return {
    investments,
    loading,
    addInvestment,
    updateInvestment,
    deleteInvestment,
  };
};
