'use client';

import { useMemo } from 'react';
import { Investment, Operative, Debt, Cash, Summary } from '@/lib/types';
import { calculateSummary } from '@/lib/calculations';

export const useSummary = (
  investments: Investment[],
  operative: Operative[],
  debts: Debt[],
  cash: Cash[]
): Summary => {
  return useMemo(() => {
    return calculateSummary(investments, operative, debts, cash);
  }, [investments, operative, debts, cash]);
};
