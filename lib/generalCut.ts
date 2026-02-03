import {
  GeneralCut,
  Investment,
  Operative,
  Debt,
  Cuenta,
  CPCClient,
  CPCMovement,
  DebtMovement,
  Summary,
} from './types';
import {
  getInvestments,
  saveInvestments,
  getOperative,
  saveOperative,
  getDebts,
  saveDebts,
  getCuentas,
  saveCuentas,
  getCPCClients,
  getCPCMovements,
  saveCPCMovements,
  getDebtMovements,
  saveDebtMovements,
  addGeneralCut,
  getGeneralCut,
} from './storage';
import { updateOperativeFromMovementsById } from './operativeCalculations';
import { updateDebtCalculations } from './calculations';

/**
 * Calcula el summary del estado actual
 */
function calculateSummary(
  investments: Investment[],
  operative: Operative[],
  debts: Debt[]
): Summary {
  const totalInvestments = investments.reduce((sum, inv) => sum + inv.accumulated, 0);
  const totalOperative = operative.reduce((sum, op) => sum + op.accumulated, 0);
  const totalDebt = Math.abs(debts.reduce((sum, debt) => sum + debt.balance, 0));
  const netWorth = totalInvestments + totalOperative - totalDebt;

  return {
    totalInvestments,
    totalOperative,
    totalDebt,
    totalCash: 0, // Ya no usamos caja
    netWorth,
  };
}

/**
 * Ejecuta un corte general del sistema
 * 
 * Proceso:
 * 1. Guarda snapshot completo del estado actual
 * 2. Para cada concepto:
 *    - Anterior = Balance/Acumulado actual
 *    - Actual = 0
 *    - Movimientos = []
 * 3. Marca todas las cuentas activas como "CERRADA" (del período anterior)
 */
export async function executeGeneralCut(notes?: string): Promise<string> {
  // 1. Obtener todo el estado actual
  const investments = getInvestments();
  const operativeRaw = getOperative();
  const debts = getDebts();
  const cuentas = getCuentas();
  const cpcClients = getCPCClients();
  const cpcMovements = getCPCMovements();
  const debtMovements = getDebtMovements();

  // 1.5. IMPORTANTE: Recalcular operative con los movimientos reales de CPC
  const operative = operativeRaw.map(op => 
    updateOperativeFromMovementsById(op, cpcMovements, cuentas)
  );
  
  // 1.6. Recalcular deudas con los movimientos del período actual
  const debtsRecalculated = debts.map(debt => {
    // Calcular currentValue basándose en movimientos del período actual (sin cutId)
    const currentPeriodMovements = debtMovements.filter(m => m.debtId === debt.id && !m.cutId);
    const cargos = currentPeriodMovements.filter(m => m.tipo === 'CARGO').reduce((sum, m) => sum + m.monto, 0);
    const abonos = currentPeriodMovements.filter(m => m.tipo === 'ABONO').reduce((sum, m) => sum + m.monto, 0);
    const currentValue = abonos - cargos; // Income del período actual
    
    // Recalcular con el currentValue correcto
    return updateDebtCalculations({
      ...debt,
      currentValue,
    });
  });
  
  // 1.7. Guardar los valores recalculados ANTES del corte (para que queden persistidos)
  saveOperative(operative);
  saveDebts(debtsRecalculated);

  // 2. Calcular summary con los valores REALES
  const summary = calculateSummary(investments, operative, debtsRecalculated);

  // 3. Crear el snapshot del corte (estado ANTES del reset, con valores recalculados)
  const cut: GeneralCut = {
    id: `cut-${Date.now()}`,
    cutDate: new Date(),
    notes,
    investments: JSON.parse(JSON.stringify(investments)),
    operative: JSON.parse(JSON.stringify(operative)),
    debts: JSON.parse(JSON.stringify(debtsRecalculated)),
    cuentas: JSON.parse(JSON.stringify(cuentas)),
    cpcClients: JSON.parse(JSON.stringify(cpcClients)),
    cpcMovements: JSON.parse(JSON.stringify(cpcMovements)),
    debtMovements: JSON.parse(JSON.stringify(debtMovements)),
    summary,
    createdAt: new Date(),
  };

  // 4. Guardar el corte
  addGeneralCut(cut);

  // 5. Resetear Inversiones
  const resetInvestments = investments.map(inv => ({
    ...inv,
    previousValue: inv.accumulated, // Anterior = Balance actual (referencia histórica)
    currentValue: inv.accumulated, // Actual = Balance actual (continúa)
    profitLoss: 0, // P/M = 0
    income: 0, // Ingreso = 0
    incomeItems: [], // Movimientos de transferencias = []
    accumulated: inv.accumulated, // Balance = Actual + Ingreso = accumulated + 0
    updatedAt: new Date(),
  }));

  // 6. Resetear Operativo
  const resetOperative = operative.map(op => ({
    ...op,
    previousValue: op.accumulated, // Anterior = Acumulado actual
    currentValue: 0, // Actual = 0
    profitLoss: 0, // P/M = 0
    income: 0, // Ingreso = 0
    incomeItems: [], // Movimientos = []
    accumulated: op.accumulated, // Balance se mantiene
    updatedAt: new Date(),
  }));

  // 7. Resetear Deudas (usando valores recalculados)
  const resetDebts = debtsRecalculated.map(debt => ({
    ...debt,
    previousValue: debt.balance, // Anterior = Balance actual recalculado
    currentValue: 0, // Actual = 0
    profitLoss: 0, // P/M = 0
    balance: debt.balance, // Balance se mantiene
    updatedAt: new Date(),
  }));

  // 8. Crear cuentas históricas para movimientos sin asignar
  const newHistoricalCuentas: Cuenta[] = [];
  const cutDate = new Date();
  const cutDateStr = `${cutDate.getDate()}-${cutDate.toLocaleString('es-ES', { month: 'short' })}-${cutDate.getFullYear()}`;
  
  // Para cada concepto operativo, crear cuenta histórica si tiene movimientos sin asignar
  operative.forEach(op => {
    const unassignedMovements = cpcMovements.filter(
      m => m.cpcName === op.concept && !m.cuentaId
    );
    
    if (unassignedMovements.length > 0) {
      const historicalCuenta: Cuenta = {
        id: `cuenta-hist-${op.id}-${Date.now()}`,
        nombre: `HISTÓRICO-${cutDateStr}`,
        descripcion: `Corte automático del ${cutDateStr}`,
        status: 'CERRADA',
        operativeId: op.id,
        operativeName: op.concept,
        createdAt: cutDate,
        updatedAt: cutDate,
      };
      newHistoricalCuentas.push(historicalCuenta);
    }
  });

  // 9. Asignar movimientos sin cuenta a sus respectivas cuentas históricas
  const updatedMovements = cpcMovements.map(m => {
    if (m.cuentaId) return m; // Ya tiene cuenta
    
    // Buscar la cuenta histórica correspondiente
    const historicalCuenta = newHistoricalCuentas.find(c => c.operativeName === m.cpcName);
    if (historicalCuenta) {
      return { ...m, cuentaId: historicalCuenta.id };
    }
    return m;
  });

  // 10. Cerrar todas las cuentas activas + agregar las nuevas históricas
  const resetCuentas = [
    ...cuentas.map(cuenta => ({
      ...cuenta,
      status: 'CERRADA' as const,
      updatedAt: new Date(),
    })),
    ...newHistoricalCuentas,
  ];

  // 11. Marcar los movimientos de deudas con el cutId (movimientos históricos)
  const markedDebtMovements = debtMovements.map(dm => ({
    ...dm,
    cutId: cut.id,
  }));

  // 12. Guardar todo el estado reseteado
  saveInvestments(resetInvestments);
  saveOperative(resetOperative);
  saveDebts(resetDebts);
  saveCuentas(resetCuentas);
  saveCPCMovements(updatedMovements);
  saveDebtMovements(markedDebtMovements);

  return cut.id;
}

/**
 * Restaura un corte general anterior
 * 
 * Proceso:
 * 1. Obtiene el corte del historial
 * 2. Restaura todos los datos al estado del corte
 */
export async function restoreGeneralCut(cutId: string): Promise<void> {
  // 1. Obtener el corte
  const cut = getGeneralCut(cutId);
  if (!cut) {
    throw new Error('Corte no encontrado');
  }

  // 2. Restaurar todo el estado
  saveInvestments(cut.investments);
  saveOperative(cut.operative);
  saveDebts(cut.debts);
  saveCuentas(cut.cuentas);

  // Nota: CPCClients, CPCMovements y DebtMovements no se restauran porque
  // son datos históricos que no deberían modificarse al restaurar un corte.
  // Si el usuario necesita restaurar estos también, se puede agregar.
}
