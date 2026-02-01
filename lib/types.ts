// Investment types
export type InvestmentType = 'Fondo' | 'Acciones' | 'Cripto' | 'Divisa' | 'Ahorro';

export interface IncomeItem {
  id: string;
  concepto: string;
  tipo: 'CARGO' | 'ABONO';
  monto: number;
  createdAt: Date;
}

export interface Investment {
  id: string;
  concept: string;
  previousValue: number;
  currentValue: number;
  profitLoss: number;
  income: number;
  incomeItems?: IncomeItem[]; // Array de conceptos de ingreso
  accumulated: number;
  type: InvestmentType;
  portfolio: number; // percentage
  createdAt: Date;
  updatedAt: Date;
}

// Operative types
export interface Operative {
  id: string;
  concept: string;
  previousValue: number;
  currentValue: number;
  profitLoss: number;
  income: number;
  accumulated: number;
  type: 'CPC';
  createdAt: Date;
  updatedAt: Date;
}

// Cliente CPC (detalle del operativo)
export interface CPCClient {
  id: string;
  cpcId: string; // ID del operativo al que pertenece
  cpcName: string; // CPC-TX-2601, CPC-PRESTAMO, etc.
  clientName: string;
  falta: number; // saldo pendiente
  cargo: number; // monto que debe
  abono: number; // pagos realizados
  fecha?: string; // última fecha de movimiento
  concepto?: string; // concepto del movimiento
  createdAt: Date;
  updatedAt: Date;
}

// Movimiento de CPC (historial de cargos/abonos)
export interface CPCMovement {
  id: string;
  clientId: string;
  clientName: string;
  cpcName: string;
  tipo: 'CARGO' | 'ABONO';
  monto: number;
  fecha: Date;
  concepto: string;
  cuentaId?: string; // ID de la cuenta/corte asignada
  createdAt: Date;
}

// Cuenta/Corte para agrupar movimientos
export interface Cuenta {
  id: string;
  nombre: string;
  descripcion?: string;
  status: 'ACTIVA' | 'INACTIVA';
  createdAt: Date;
  updatedAt: Date;
}

// Debt types
export interface Debt {
  id: string;
  concept: string;
  previousValue: number;
  currentValue: number;
  profitLoss: number;
  limit: number;
  balance: number;
  type: 'CREDITO';
  createdAt: Date;
  updatedAt: Date;
}

// Cash types
export interface Cash {
  id: string;
  concept: string;
  amount: number;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

// Client types
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  ubicacion?: string;
  notes?: string;
  totalCargo: number;
  totalAbono: number;
  balance: number;
  status: 'ACTIVO' | 'INACTIVO';
  createdAt: Date;
  updatedAt: Date;
}

// Transaction types
export type TransactionCategory = 'INVERSION' | 'OPERATIVO' | 'DEUDA' | 'CAJA';

export interface Transaction {
  id: string;
  date: Date;
  category: TransactionCategory;
  itemId: string;
  itemName: string;
  field: string;
  oldValue: number | string;
  newValue: number | string;
  description?: string;
}

// Summary types
export interface Summary {
  totalInvestments: number;
  totalOperative: number;
  totalDebt: number;
  totalCash: number;
  netWorth: number;
}

// Snapshot types for backup
export interface Snapshot {
  id: string;
  date: Date;
  investments: Investment[];
  operative: Operative[];
  debts: Debt[];
  cash: Cash[];
  summary: Summary;
}

// Config types
export interface AppConfig {
  lastUpdate: Date;
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly';
  theme: 'light' | 'dark';
}

// Export/Import types
export interface ExportData {
  version: string;
  exportDate: Date;
  investments: Investment[];
  operative: Operative[];
  debts: Debt[];
  cash: Cash[];
  transactions: Transaction[];
}

// Form types
export interface InvestmentFormData {
  concept: string;
  previousValue: number;
  currentValue: number;
  income: number;
  type: InvestmentType;
}

export interface OperativeFormData {
  concept: string;
  previousValue: number;
  currentValue: number;
  income: number;
}

export interface DebtFormData {
  concept: string;
  previousValue: number;
  currentValue: number;
  limit: number;
}

export interface CashFormData {
  concept: string;
  amount: number;
  location: string;
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  ubicacion?: string;
  notes?: string;
  status: 'ACTIVO' | 'INACTIVO';
}
