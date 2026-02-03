import {
  Investment,
  Operative,
  Debt,
  Cash,
  Transaction,
  Snapshot,
  AppConfig,
  ExportData,
  CPCClient,
  CPCMovement,
  Client,
  Cuenta,
  DebtMovement,
  GeneralCut,
} from './types';
import { emitDataUpdated } from './events';

// Storage keys
const STORAGE_KEYS = {
  INVESTMENTS: 'banlance:investments',
  OPERATIVE: 'banlance:operative',
  DEBTS: 'banlance:debts',
  CASH: 'banlance:cash',
  CPC_CLIENTS: 'banlance:cpc_clients',
  CPC_MOVEMENTS: 'banlance:cpc_movements',
  DEBT_MOVEMENTS: 'banlance:debt_movements',
  CLIENTS: 'banlance:clients',
  CUENTAS: 'banlance:cuentas',
  GENERAL_CUTS: 'banlance:general_cuts',
  CONFIG: 'banlance:config',
  LAST_UPDATE: 'banlance:lastUpdate',
} as const;

// IndexedDB configuration
const DB_NAME = 'banlance-db';
const DB_VERSION = 1;
const STORES = {
  TRANSACTIONS: 'transactions',
  SNAPSHOTS: 'snapshots',
} as const;

// Helper to check if we're in browser
const isBrowser = typeof window !== 'undefined';

// =============================================================================
// LocalStorage functions
// =============================================================================

/**
 * Get data from localStorage
 */
const getFromLocalStorage = <T>(key: string, defaultValue: T): T => {
  if (!isBrowser) return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const parsed = JSON.parse(item);
    
    // Convert date strings back to Date objects
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        date: item.date ? new Date(item.date) : undefined,
      })) as T;
    }
    
    return parsed;
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Save data to localStorage
 */
const saveToLocalStorage = <T>(key: string, data: T): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error);
  }
};

/**
 * Remove data from localStorage
 */
const removeFromLocalStorage = (key: string): void => {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage key ${key}:`, error);
  }
};

// =============================================================================
// Investments storage
// =============================================================================

export const getInvestments = (): Investment[] => {
  return getFromLocalStorage<Investment[]>(STORAGE_KEYS.INVESTMENTS, []);
};

export const saveInvestments = (investments: Investment[]): void => {
  saveToLocalStorage(STORAGE_KEYS.INVESTMENTS, investments);
  updateLastUpdate();
  emitDataUpdated('investments');
};

export const addInvestment = (investment: Investment): void => {
  const investments = getInvestments();
  investments.push(investment);
  saveInvestments(investments);
};

export const updateInvestment = (id: string, updates: Partial<Investment>): void => {
  const investments = getInvestments();
  const index = investments.findIndex(inv => inv.id === id);
  if (index !== -1) {
    investments[index] = { ...investments[index], ...updates, updatedAt: new Date() };
    saveInvestments(investments);
  }
};

export const deleteInvestment = (id: string): void => {
  const investments = getInvestments();
  const filtered = investments.filter(inv => inv.id !== id);
  saveInvestments(filtered);
};

// =============================================================================
// Operative storage
// =============================================================================

export const getOperative = (): Operative[] => {
  return getFromLocalStorage<Operative[]>(STORAGE_KEYS.OPERATIVE, []);
};

export const saveOperative = (operative: Operative[]): void => {
  saveToLocalStorage(STORAGE_KEYS.OPERATIVE, operative);
  updateLastUpdate();
  emitDataUpdated('operative');
};

export const addOperative = (op: Operative): void => {
  const operative = getOperative();
  operative.push(op);
  saveOperative(operative);
};

export const updateOperativeItem = (id: string, updates: Partial<Operative>): void => {
  const operative = getOperative();
  const index = operative.findIndex(op => op.id === id);
  if (index !== -1) {
    operative[index] = { ...operative[index], ...updates, updatedAt: new Date() };
    saveOperative(operative);
  }
};

export const deleteOperativeItem = (id: string): void => {
  const operative = getOperative();
  const filtered = operative.filter(op => op.id !== id);
  saveOperative(filtered);
};

// =============================================================================
// Debts storage
// =============================================================================

export const getDebts = (): Debt[] => {
  return getFromLocalStorage<Debt[]>(STORAGE_KEYS.DEBTS, []);
};

export const saveDebts = (debts: Debt[]): void => {
  saveToLocalStorage(STORAGE_KEYS.DEBTS, debts);
  updateLastUpdate();
  emitDataUpdated('debts');
};

export const addDebt = (debt: Debt): void => {
  const debts = getDebts();
  debts.push(debt);
  saveDebts(debts);
};

export const updateDebt = (id: string, updates: Partial<Debt>): void => {
  const debts = getDebts();
  const index = debts.findIndex(debt => debt.id === id);
  if (index !== -1) {
    debts[index] = { ...debts[index], ...updates, updatedAt: new Date() };
    saveDebts(debts);
  }
};

export const deleteDebt = (id: string): void => {
  const debts = getDebts();
  const filtered = debts.filter(debt => debt.id !== id);
  saveDebts(filtered);
};

// =============================================================================
// Cash storage
// =============================================================================

export const getCash = (): Cash[] => {
  return getFromLocalStorage<Cash[]>(STORAGE_KEYS.CASH, []);
};

export const saveCash = (cash: Cash[]): void => {
  saveToLocalStorage(STORAGE_KEYS.CASH, cash);
  updateLastUpdate();
};

export const addCash = (c: Cash): void => {
  const cash = getCash();
  cash.push(c);
  saveCash(cash);
};

export const updateCashItem = (id: string, updates: Partial<Cash>): void => {
  const cash = getCash();
  const index = cash.findIndex(c => c.id === id);
  if (index !== -1) {
    cash[index] = { ...cash[index], ...updates, updatedAt: new Date() };
    saveCash(cash);
  }
};

export const deleteCashItem = (id: string): void => {
  const cash = getCash();
  const filtered = cash.filter(c => c.id !== id);
  saveCash(filtered);
};

// =============================================================================
// CPC Clients storage
// =============================================================================

export const getCPCClients = (): CPCClient[] => {
  return getFromLocalStorage<CPCClient[]>(STORAGE_KEYS.CPC_CLIENTS, []);
};

export const saveCPCClients = (clients: CPCClient[]): void => {
  saveToLocalStorage(STORAGE_KEYS.CPC_CLIENTS, clients);
  updateLastUpdate();
};

export const addCPCClient = (client: CPCClient): void => {
  const clients = getCPCClients();
  clients.push(client);
  saveCPCClients(clients);
};

export const updateCPCClient = (id: string, updates: Partial<CPCClient>): void => {
  const clients = getCPCClients();
  const index = clients.findIndex(c => c.id === id);
  if (index !== -1) {
    clients[index] = { ...clients[index], ...updates, updatedAt: new Date() };
    saveCPCClients(clients);
  }
};

export const deleteCPCClient = (id: string): void => {
  const clients = getCPCClients();
  const filtered = clients.filter(c => c.id !== id);
  saveCPCClients(filtered);
};

export const getClientsByCPC = (cpcName: string): CPCClient[] => {
  const clients = getCPCClients();
  return clients.filter(c => c.cpcName === cpcName);
};

// =============================================================================
// CPC Movements storage
// =============================================================================

export const getCPCMovements = (): CPCMovement[] => {
  return getFromLocalStorage<CPCMovement[]>(STORAGE_KEYS.CPC_MOVEMENTS, []);
};

export const saveCPCMovements = (movements: CPCMovement[]): void => {
  saveToLocalStorage(STORAGE_KEYS.CPC_MOVEMENTS, movements);
  updateLastUpdate();
  emitDataUpdated('movements');
};

export const addCPCMovement = (movement: CPCMovement): void => {
  const movements = getCPCMovements();
  movements.push(movement);
  saveCPCMovements(movements);
};

export const getMovementsByClient = (clientId: string): CPCMovement[] => {
  const movements = getCPCMovements();
  return movements.filter(m => m.clientId === clientId).sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
};

export const getMovementsByCPC = (cpcName: string): CPCMovement[] => {
  const movements = getCPCMovements();
  return movements.filter(m => m.cpcName === cpcName).sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
};

// =============================================================================
// Debt Movements storage
// =============================================================================

export const getDebtMovements = (): DebtMovement[] => {
  return getFromLocalStorage<DebtMovement[]>(STORAGE_KEYS.DEBT_MOVEMENTS, []);
};

export const saveDebtMovements = (movements: DebtMovement[]): void => {
  saveToLocalStorage(STORAGE_KEYS.DEBT_MOVEMENTS, movements);
  updateLastUpdate();
  emitDataUpdated('movements');
};

export const addDebtMovement = (movement: DebtMovement): void => {
  const movements = getDebtMovements();
  movements.push(movement);
  saveDebtMovements(movements);
};

export const getMovementsByDebt = (debtId: string): DebtMovement[] => {
  const movements = getDebtMovements();
  return movements.filter(m => m.debtId === debtId).sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
};

// =============================================================================
// Clients storage
// =============================================================================

export const getClients = (): Client[] => {
  return getFromLocalStorage<Client[]>(STORAGE_KEYS.CLIENTS, []);
};

export const saveClients = (clients: Client[]): void => {
  saveToLocalStorage(STORAGE_KEYS.CLIENTS, clients);
  updateLastUpdate();
};

export const addClient = (client: Client): void => {
  const clients = getClients();
  clients.push(client);
  saveClients(clients);
};

export const updateClient = (id: string, updates: Partial<Client>): void => {
  const clients = getClients();
  const index = clients.findIndex(c => c.id === id);
  if (index !== -1) {
    clients[index] = { ...clients[index], ...updates, updatedAt: new Date() };
    saveClients(clients);
  }
};

export const deleteClient = (id: string): void => {
  const clients = getClients();
  const filtered = clients.filter(c => c.id !== id);
  saveClients(filtered);
};

// =============================================================================
// Cuentas storage
// =============================================================================

export const getCuentas = (): Cuenta[] => {
  return getFromLocalStorage<Cuenta[]>(STORAGE_KEYS.CUENTAS, []);
};

export const saveCuentas = (cuentas: Cuenta[]): void => {
  saveToLocalStorage(STORAGE_KEYS.CUENTAS, cuentas);
  updateLastUpdate();
  emitDataUpdated('cuentas');
};

export const addCuenta = (cuenta: Cuenta): void => {
  const cuentas = getCuentas();
  cuentas.push(cuenta);
  saveCuentas(cuentas);
};

export const updateCuenta = (id: string, updates: Partial<Cuenta>): void => {
  const cuentas = getCuentas();
  const index = cuentas.findIndex(c => c.id === id);
  if (index !== -1) {
    cuentas[index] = { ...cuentas[index], ...updates, updatedAt: new Date() };
    saveCuentas(cuentas);
  }
};

export const deleteCuenta = (id: string): void => {
  const cuentas = getCuentas();
  const filtered = cuentas.filter(c => c.id !== id);
  saveCuentas(filtered);
};

// =============================================================================
// Config storage
// =============================================================================

const defaultConfig: AppConfig = {
  lastUpdate: new Date(),
  autoBackup: true,
  backupFrequency: 'daily',
  theme: 'light',
};

export const getConfig = (): AppConfig => {
  const config = getFromLocalStorage<AppConfig>(STORAGE_KEYS.CONFIG, defaultConfig);
  return {
    ...config,
    lastUpdate: config.lastUpdate ? new Date(config.lastUpdate) : new Date(),
  };
};

export const saveConfig = (config: AppConfig): void => {
  saveToLocalStorage(STORAGE_KEYS.CONFIG, config);
};

export const updateLastUpdate = (): void => {
  const config = getConfig();
  config.lastUpdate = new Date();
  saveConfig(config);
};

// =============================================================================
// IndexedDB functions
// =============================================================================

/**
 * Open IndexedDB connection
 */
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!isBrowser) {
      reject(new Error('IndexedDB is not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create transactions store
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const transactionsStore = db.createObjectStore(STORES.TRANSACTIONS, {
          keyPath: 'id',
          autoIncrement: false,
        });
        transactionsStore.createIndex('date', 'date', { unique: false });
        transactionsStore.createIndex('category', 'category', { unique: false });
      }

      // Create snapshots store
      if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
        const snapshotsStore = db.createObjectStore(STORES.SNAPSHOTS, {
          keyPath: 'id',
          autoIncrement: false,
        });
        snapshotsStore.createIndex('date', 'date', { unique: false });
      }
    };
  });
};

/**
 * Add transaction to IndexedDB
 */
export const addTransaction = async (transaction: Transaction): Promise<void> => {
  if (!isBrowser) return;

  try {
    const db = await openDB();
    const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    store.add(transaction);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
  }
};

/**
 * Get all transactions from IndexedDB
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  if (!isBrowser) return [];

  try {
    const db = await openDB();
    const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const transactions = request.result.map((t: any) => ({
          ...t,
          date: new Date(t.date),
        }));
        resolve(transactions);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
};

/**
 * Create snapshot
 */
export const createSnapshot = async (): Promise<void> => {
  if (!isBrowser) return;

  try {
    const snapshot: Snapshot = {
      id: `snapshot-${Date.now()}`,
      date: new Date(),
      investments: getInvestments(),
      operative: getOperative(),
      debts: getDebts(),
      cash: getCash(),
      summary: {
        totalInvestments: 0,
        totalOperative: 0,
        totalDebt: 0,
        totalCash: 0,
        netWorth: 0,
      },
    };

    const db = await openDB();
    const tx = db.transaction(STORES.SNAPSHOTS, 'readwrite');
    const store = tx.objectStore(STORES.SNAPSHOTS);
    store.add(snapshot);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error creating snapshot:', error);
  }
};

/**
 * Get all snapshots
 */
export const getSnapshots = async (): Promise<Snapshot[]> => {
  if (!isBrowser) return [];

  try {
    const db = await openDB();
    const tx = db.transaction(STORES.SNAPSHOTS, 'readonly');
    const store = tx.objectStore(STORES.SNAPSHOTS);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const snapshots = request.result.map((s: any) => ({
          ...s,
          date: new Date(s.date),
        }));
        resolve(snapshots);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting snapshots:', error);
    return [];
  }
};

// =============================================================================
// General Cuts storage
// =============================================================================

export const getGeneralCuts = (): GeneralCut[] => {
  return getFromLocalStorage<GeneralCut[]>(STORAGE_KEYS.GENERAL_CUTS, []);
};

export const saveGeneralCuts = (cuts: GeneralCut[]): void => {
  saveToLocalStorage(STORAGE_KEYS.GENERAL_CUTS, cuts);
  updateLastUpdate();
};

export const addGeneralCut = (cut: GeneralCut): void => {
  const cuts = getGeneralCuts();
  cuts.push(cut);
  saveGeneralCuts(cuts);
};

export const getGeneralCut = (id: string): GeneralCut | undefined => {
  const cuts = getGeneralCuts();
  return cuts.find(c => c.id === id);
};

export const deleteGeneralCut = (id: string): void => {
  const cuts = getGeneralCuts();
  const filtered = cuts.filter(c => c.id !== id);
  saveGeneralCuts(filtered);
};

// =============================================================================
// Export/Import functions
// =============================================================================

/**
 * Export all data
 */
export const exportAllData = async (): Promise<ExportData> => {
  const transactions = await getTransactions();

  return {
    version: '1.0.0',
    exportDate: new Date(),
    investments: getInvestments(),
    operative: getOperative(),
    debts: getDebts(),
    cash: getCash(),
    transactions,
  };
};

/**
 * Import all data
 */
export const importAllData = async (data: ExportData): Promise<void> => {
  // Validate data structure
  if (!data.investments || !data.operative || !data.debts || !data.cash) {
    throw new Error('Invalid import data structure');
  }

  // Import to localStorage
  saveInvestments(data.investments);
  saveOperative(data.operative);
  saveDebts(data.debts);
  saveCash(data.cash);

  // Import transactions to IndexedDB
  if (data.transactions && data.transactions.length > 0) {
    for (const transaction of data.transactions) {
      await addTransaction(transaction);
    }
  }
};

/**
 * Clear all data
 */
export const clearAllData = (): void => {
  removeFromLocalStorage(STORAGE_KEYS.INVESTMENTS);
  removeFromLocalStorage(STORAGE_KEYS.OPERATIVE);
  removeFromLocalStorage(STORAGE_KEYS.DEBTS);
  removeFromLocalStorage(STORAGE_KEYS.CASH);
  updateLastUpdate();
};
