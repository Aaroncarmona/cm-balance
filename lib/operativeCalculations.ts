import { CPCMovement, Cuenta, Operative, IncomeItem } from './types';

/**
 * Obtiene los movimientos que corresponden a un concepto operativo específico.
 * 
 * Lógica CORRECTA usando IDs:
 * - Si el movimiento tiene cuentaId, se busca la cuenta y se usa su operativeId
 * - Si el movimiento NO tiene cuentaId, se usa el cpcName original
 * 
 * @param operativeId - El ID del concepto operativo
 * @param operativeName - El nombre del concepto operativo (para movimientos sin cuenta)
 * @param allMovements - Todos los movimientos CPC
 * @param allCuentas - Todas las cuentas
 * @returns Array de movimientos que pertenecen a ese concepto
 */
export function getMovementsForOperativeById(
  operativeId: string,
  operativeName: string,
  allMovements: CPCMovement[],
  allCuentas: Cuenta[],
  currentPeriodOnly: boolean = false
): CPCMovement[] {
  return allMovements.filter(movement => {
    // Si solo queremos movimientos del período actual
    if (currentPeriodOnly) {
      // Si tiene cuenta asignada, verificar que la cuenta esté ACTIVA
      if (movement.cuentaId) {
        const cuenta = allCuentas.find(c => c.id === movement.cuentaId);
        // Solo incluir si la cuenta está activa (no cerrada)
        if (!cuenta || cuenta.status === 'CERRADA') {
          return false;
        }
        // Verificar que pertenezca al operativo correcto
        if (cuenta.operativeId) {
          return cuenta.operativeId === operativeId;
        }
        return movement.cpcName === operativeName;
      }
      // Si no tiene cuenta, es del período actual - verificar que pertenezca al operativo
      return movement.cpcName === operativeName;
    }
    
    // Lógica original: todos los movimientos (históricos + actuales)
    if (movement.cuentaId) {
      const cuenta = allCuentas.find(c => c.id === movement.cuentaId);
      if (cuenta && cuenta.operativeId) {
        return cuenta.operativeId === operativeId;
      }
      return movement.cpcName === operativeName;
    }
    
    return movement.cpcName === operativeName;
  });
}

/**
 * Calcula los totales de un concepto operativo considerando las cuentas asignadas (por ID).
 * 
 * @param operativeId - El ID del concepto operativo
 * @param operativeName - El nombre del concepto operativo
 * @param allMovements - Todos los movimientos CPC
 * @param allCuentas - Todas las cuentas
 * @param currentPeriodOnly - Si true, solo cuenta movimientos del período actual (sin cuentas cerradas)
 * @returns Objeto con totalCargos, totalAbonos y balance
 */
export function calculateOperativeTotalsById(
  operativeId: string,
  operativeName: string,
  allMovements: CPCMovement[],
  allCuentas: Cuenta[],
  currentPeriodOnly: boolean = false
): {
  totalCargos: number;
  totalAbonos: number;
  balance: number;
  movements: CPCMovement[];
} {
  const movements = getMovementsForOperativeById(operativeId, operativeName, allMovements, allCuentas, currentPeriodOnly);
  
  const totalCargos = movements
    .filter(m => m.tipo === 'CARGO')
    .reduce((sum, m) => sum + m.monto, 0);
    
  const totalAbonos = movements
    .filter(m => m.tipo === 'ABONO')
    .reduce((sum, m) => sum + m.monto, 0);
    
  const balance = totalCargos - totalAbonos;
  
  return {
    totalCargos,
    totalAbonos,
    balance,
    movements,
  };
}

/**
 * Actualiza los valores de un concepto operativo basándose en sus movimientos reales (por ID).
 * 
 * Para conceptos CPC (con clientes/movimientos):
 * - El "Balance" proviene de los movimientos reales (Cargos - Abonos)
 * - Se ignoran los valores manuales (Anterior, Actual)
 * 
 * @param operative - El concepto operativo a actualizar
 * @param allMovements - Todos los movimientos CPC
 * @param allCuentas - Todas las cuentas
 * @returns El concepto operativo actualizado con los valores correctos
 */
export function updateOperativeFromMovementsById(
  operative: Operative,
  allMovements: CPCMovement[],
  allCuentas: Cuenta[]
): Operative {
  // Calcular movimientos del PERÍODO ACTUAL solamente (sin cuentas cerradas)
  const { balance: currentBalance } = calculateOperativeTotalsById(
    operative.id,
    operative.concept, 
    allMovements, 
    allCuentas,
    true // Solo período actual
  );
  
  // Calcular egresos/ingresos (incomeItems) del período actual
  const { net: incomeNet } = calculateIncomeItemsTotals(operative.incomeItems);
  
  // currentValue = balance de movimientos del período actual
  const currentValue = currentBalance;
  
  // profitLoss = anterior menos valor absoluto del actual
  // Representa cuánto del período anterior queda pendiente
  const profitLoss = operative.previousValue - Math.abs(currentValue);
  
  // accumulated = anterior + actual (SIN transferencias)
  // Balance solo refleja movimientos CPC, no transferencias a inversiones
  const accumulated = operative.previousValue + currentValue;
  
  return {
    ...operative,
    currentValue,
    profitLoss,
    income: incomeNet,
    accumulated,
    updatedAt: new Date(),
  };
}

export function calculateIncomeItemsTotals(
  items?: IncomeItem[]
): { totalCargos: number; totalAbonos: number; net: number } {
  if (!items || items.length === 0) {
    return { totalCargos: 0, totalAbonos: 0, net: 0 };
  }

  const totalCargos = items
    .filter(item => item.tipo === 'CARGO')
    .reduce((sum, item) => sum + item.monto, 0);
  const totalAbonos = items
    .filter(item => item.tipo === 'ABONO')
    .reduce((sum, item) => sum + item.monto, 0);

  return {
    totalCargos,
    totalAbonos,
    net: totalAbonos - totalCargos,
  };
}
