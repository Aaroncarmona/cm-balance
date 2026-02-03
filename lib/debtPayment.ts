import { getInvestments, saveInvestments } from './storage';
import { IncomeItem } from './types';

/**
 * Paga una deuda desde una inversión
 * Crea un cargo (salida de dinero) en la inversión especificada
 * Retorna el ID del cargo creado para poder rastrearlo
 */
export const payDebtFromInvestment = (
  debtName: string,
  investmentId: string,
  monto: number,
  oldCargoId?: string // Si existe, lo eliminará antes de crear el nuevo
): { success: boolean; newCargoId?: string; error?: string } => {
  try {
    const investments = getInvestments();
    const targetInv = investments.find(inv => inv.id === investmentId);

    if (!targetInv) {
      return { success: false, error: 'Inversión no encontrada' };
    }

    // Inicializar incomeItems si no existe
    if (!targetInv.incomeItems) {
      targetInv.incomeItems = [];
    }

    // 1. Si hay un cargo anterior, eliminarlo
    if (oldCargoId) {
      targetInv.incomeItems = targetInv.incomeItems.filter(
        item => item.id !== oldCargoId
      );
    }

    // 2. Crear nuevo cargo (salida de dinero para pagar deuda)
    const newCargoId = `debt-payment-${Date.now()}`;
    const newCargo: IncomeItem = {
      id: newCargoId,
      concepto: `Pago deuda: ${debtName}`,
      tipo: 'CARGO', // CARGO = salida de dinero
      monto: monto,
      createdAt: new Date(),
    };

    targetInv.incomeItems.push(newCargo);

    // 3. Recalcular income total (ABONO suma, CARGO resta)
    const totalIncome = targetInv.incomeItems.reduce((sum, item) => {
      return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
    }, 0);

    targetInv.income = totalIncome;
    targetInv.accumulated = targetInv.currentValue + totalIncome;

    // 4. Recalcular portfolio percentages
    const total = investments.reduce((sum, inv) => sum + inv.accumulated, 0);
    investments.forEach(inv => {
      inv.portfolio = total > 0 ? (inv.accumulated / total) * 100 : 0;
    });

    // 5. Guardar todo
    saveInvestments(investments);

    return { success: true, newCargoId };
  } catch (error) {
    console.error('Error en payDebtFromInvestment:', error);
    return { success: false, error: 'Error al procesar el pago' };
  }
};

/**
 * Elimina un pago de deuda de una inversión
 */
export const removeDebtPaymentFromInvestment = (
  cargoId: string,
  investmentId: string
): { success: boolean; error?: string } => {
  try {
    const investments = getInvestments();
    const targetInv = investments.find(inv => inv.id === investmentId);

    if (!targetInv || !targetInv.incomeItems) {
      return { success: false, error: 'Inversión no encontrada' };
    }

    // Eliminar el cargo
    targetInv.incomeItems = targetInv.incomeItems.filter(
      item => item.id !== cargoId
    );

    // Recalcular
    const totalIncome = targetInv.incomeItems.reduce((sum, item) => {
      return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
    }, 0);

    targetInv.income = totalIncome;
    targetInv.accumulated = targetInv.currentValue + totalIncome;

    // Recalcular portfolios
    const total = investments.reduce((sum, inv) => sum + inv.accumulated, 0);
    investments.forEach(inv => {
      inv.portfolio = total > 0 ? (inv.accumulated / total) * 100 : 0;
    });

    saveInvestments(investments);

    return { success: true };
  } catch (error) {
    console.error('Error en removeDebtPaymentFromInvestment:', error);
    return { success: false, error: 'Error al eliminar el pago' };
  }
};
