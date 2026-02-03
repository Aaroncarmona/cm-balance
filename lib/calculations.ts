import { Investment, Operative, Debt, Cash, Summary } from './types';

/**
 * Calculate profit/loss (P/M)
 */
export const calculateProfitLoss = (currentValue: number, previousValue: number): number => {
  return currentValue - previousValue;
};

/**
 * Calculate accumulated value
 */
export const calculateAccumulated = (currentValue: number, income: number): number => {
  return currentValue + income;
};

/**
 * Calculate portfolio percentage
 */
export const calculatePortfolioPercentage = (accumulated: number, total: number): number => {
  if (total === 0) return 0;
  return (accumulated / total) * 100;
};

/**
 * Calculate total investments
 */
export const calculateTotalInvestments = (investments: Investment[]): number => {
  return investments.reduce((sum, inv) => sum + inv.accumulated, 0);
};

/**
 * Calculate total operative
 */
export const calculateTotalOperative = (operative: Operative[]): number => {
  return operative.reduce((sum, op) => sum + op.accumulated, 0);
};

/**
 * Calculate total debt (returns positive value)
 */
export const calculateTotalDebt = (debts: Debt[]): number => {
  return Math.abs(debts.reduce((sum, debt) => sum + debt.balance, 0));
};

/**
 * Calculate total cash
 */
export const calculateTotalCash = (cash: Cash[]): number => {
  return cash.reduce((sum, c) => sum + c.amount, 0);
};

/**
 * Calculate net worth
 */
export const calculateNetWorth = (
  totalInvestments: number,
  totalOperative: number,
  totalDebt: number,
  totalCash: number
): number => {
  return totalInvestments + totalOperative - totalDebt + totalCash;
};

/**
 * Calculate summary
 */
export const calculateSummary = (
  investments: Investment[],
  operative: Operative[],
  debts: Debt[],
  cash: Cash[]
): Summary => {
  const totalInvestments = calculateTotalInvestments(investments);
  const totalOperative = calculateTotalOperative(operative);
  const totalDebt = calculateTotalDebt(debts);
  const totalCash = calculateTotalCash(cash);
  const netWorth = calculateNetWorth(totalInvestments, totalOperative, totalDebt, totalCash);

  return {
    totalInvestments,
    totalOperative,
    totalDebt,
    totalCash,
    netWorth,
  };
};

/**
 * Update investment with calculated fields
 */
export const updateInvestmentCalculations = (
  investment: Partial<Investment>,
  allInvestments: Investment[]
): Investment => {
  const previousValue = investment.previousValue || 0;
  const currentValue = investment.currentValue || 0;
  const income = investment.income || 0;

  const profitLoss = calculateProfitLoss(currentValue, previousValue);
  // Para Inversiones: Balance = Actual + Ingreso (sin Anterior)
  const accumulated = currentValue + income;
  
  // Calculate total for portfolio percentage
  const total = allInvestments
    .filter(inv => inv.id !== investment.id)
    .reduce((sum, inv) => sum + inv.accumulated, 0) + accumulated;
  
  const portfolio = calculatePortfolioPercentage(accumulated, total);

  return {
    id: investment.id || '',
    concept: investment.concept || '',
    previousValue,
    currentValue,
    profitLoss,
    income,
    incomeItems: investment.incomeItems || [],
    accumulated,
    type: investment.type || 'Fondo',
    portfolio,
    cuts: investment.cuts || [],
    createdAt: investment.createdAt || new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Update operative with calculated fields
 */
export const updateOperativeCalculations = (
  operative: Partial<Operative>
): Operative => {
  const previousValue = operative.previousValue || 0;
  const currentValue = operative.currentValue || 0;
  const income = operative.income || 0;

  // Para Operativo: P/M = Anterior - |Actual|
  // Representa cuánto del período anterior queda pendiente
  const profitLoss = previousValue - Math.abs(currentValue);
  // Balance = anterior + actual (SIN transferencias a inversiones)
  const accumulated = previousValue + currentValue;

  return {
    id: operative.id || '',
    concept: operative.concept || '',
    previousValue,
    currentValue,
    profitLoss,
    income,
    accumulated,
    type: 'CPC',
    createdAt: operative.createdAt || new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Update debt with calculated fields
 */
export const updateDebtCalculations = (
  debt: Partial<Debt>
): Debt => {
  const previousValue = debt.previousValue || 0;
  const currentValue = debt.currentValue || 0;
  const limit = debt.limit || 0;

  const profitLoss = calculateProfitLoss(currentValue, previousValue);
  const balance = previousValue + currentValue; // Balance acumulado (anterior + actual)

  return {
    id: debt.id || '',
    concept: debt.concept || '',
    previousValue,
    currentValue,
    profitLoss,
    limit,
    balance,
    type: 'CREDITO',
    createdAt: debt.createdAt || new Date(),
    updatedAt: new Date(),
  };
};

/**
 * Format currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

/**
 * Format date
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format datetime
 */
export const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
