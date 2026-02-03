import { getInvestments, saveInvestments, getOperative, saveOperative } from './storage';
import { IncomeItem, Investment, Operative } from './types';
import { updateInvestmentCalculations } from './calculations';

/**
 * Transferir o mover el ingreso de una cuenta a una inversión
 * También crea un egreso en el operativo de origen
 */
export const transferCuentaToInvestment = (
  cuentaId: string,
  cuentaNombre: string,
  investmentId: string,
  monto: number,
  oldTransferredIncomeId?: string,
  oldInvestmentId?: string,
  operativeId?: string,
  oldOperativeEgressId?: string
): { success: boolean; newIncomeId?: string; newEgressId?: string; error?: string } => {
  try {
    // Obtener datos frescos
    let allInvestments = getInvestments();
    let allOperatives = getOperative();

    // 1. Si existe un egreso previo en operativo, eliminarlo
    if (oldOperativeEgressId && operativeId) {
      allOperatives = allOperatives.map(op => {
        if (op.id === operativeId) {
          const cleanedIncomeItems = (op.incomeItems || []).filter(
            item => item.id !== oldOperativeEgressId
          );
          const newIncome = cleanedIncomeItems.reduce((sum, item) => {
            return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
          }, 0);
          
          return {
            ...op,
            incomeItems: cleanedIncomeItems,
            income: newIncome,
            // Para Operativo: accumulated = Anterior + Actual (sin transferencias)
            accumulated: op.previousValue + op.currentValue,
            updatedAt: new Date(),
          };
        }
        return op;
      });
    }

    // 2. Si existe un ingreso previo, eliminarlo de la inversión anterior
    if (oldTransferredIncomeId && oldInvestmentId) {
      allInvestments = allInvestments.map(inv => {
        if (inv.id === oldInvestmentId) {
          const cleanedIncomeItems = (inv.incomeItems || []).filter(
            item => item.id !== oldTransferredIncomeId
          );
          const newIncome = cleanedIncomeItems.reduce((sum, item) => {
            return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
          }, 0);
          
          // Recalcular con los nuevos valores
          return updateInvestmentCalculations(
            {
              ...inv,
              incomeItems: cleanedIncomeItems,
              income: newIncome,
            },
            allInvestments
          );
        }
        return inv;
      });
    }

    // 2. Crear egreso en operativo si aplica
    let newEgressId: string | undefined;
    if (operativeId && monto > 0) {
      newEgressId = `egress-${Date.now()}-${cuentaId}`;
      const newEgressItem: IncomeItem = {
        id: newEgressId,
        concepto: `Egreso a inversión: ${cuentaNombre}`,
        tipo: 'CARGO', // CARGO = egreso/salida
        monto: monto,
        createdAt: new Date(),
      };

      allOperatives = allOperatives.map(op => {
        if (op.id === operativeId) {
          const updatedIncomeItems = [...(op.incomeItems || []), newEgressItem];
          const newIncome = updatedIncomeItems.reduce((sum, item) => {
            return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
          }, 0);
          
          return {
            ...op,
            incomeItems: updatedIncomeItems,
            income: newIncome,
            // Para Operativo: accumulated = Anterior + Actual (sin transferencias)
            accumulated: op.previousValue + op.currentValue,
            updatedAt: new Date(),
          };
        }
        return op;
      });
    }

    // 3. Crear el nuevo concepto de ingreso en inversión
    const newIncomeId = `income-${Date.now()}-${cuentaId}`;
    const newIncomeItem: IncomeItem = {
      id: newIncomeId,
      concepto: `Transferencia desde cuenta: ${cuentaNombre}`,
      tipo: 'ABONO',
      monto: monto,
      createdAt: new Date(),
    };

    // 4. Agregar el concepto a la inversión destino
    allInvestments = allInvestments.map(inv => {
      if (inv.id === investmentId) {
        const updatedIncomeItems = [...(inv.incomeItems || []), newIncomeItem];
        const newIncome = updatedIncomeItems.reduce((sum, item) => {
          return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
        }, 0);
        
        // Recalcular con los nuevos valores
        return updateInvestmentCalculations(
          {
            ...inv,
            incomeItems: updatedIncomeItems,
            income: newIncome,
          },
          allInvestments
        );
      }
      return inv;
    });

    // 5. Recalcular portfolios de todas las inversiones
    const totalAccumulated = allInvestments.reduce((sum, inv) => sum + inv.accumulated, 0);
    allInvestments = allInvestments.map(inv => ({
      ...inv,
      portfolio: totalAccumulated > 0 ? (inv.accumulated / totalAccumulated) * 100 : 0,
    }));

    // 6. Guardar todo de una vez
    saveInvestments(allInvestments);
    if (operativeId) {
      saveOperative(allOperatives);
    }

    return { success: true, newIncomeId, newEgressId };
  } catch (error) {
    console.error('Error en transferCuentaToInvestment:', error);
    return { success: false, error: String(error) };
  }
};

/**
 * Eliminar la transferencia de una cuenta (cuando se reactiva)
 */
export const removeTransferFromInvestment = (
  transferredIncomeId: string,
  investmentId: string
): { success: boolean; error?: string } => {
  try {
    let allInvestments = getInvestments();

    allInvestments = allInvestments.map(inv => {
      if (inv.id === investmentId) {
        const cleanedIncomeItems = (inv.incomeItems || []).filter(
          item => item.id !== transferredIncomeId
        );
        const newIncome = cleanedIncomeItems.reduce((sum, item) => {
          return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
        }, 0);
        
        return updateInvestmentCalculations(
          {
            ...inv,
            incomeItems: cleanedIncomeItems,
            income: newIncome,
          },
          allInvestments
        );
      }
      return inv;
    });

    // Recalcular portfolios
    const totalAccumulated = allInvestments.reduce((sum, inv) => sum + inv.accumulated, 0);
    allInvestments = allInvestments.map(inv => ({
      ...inv,
      portfolio: totalAccumulated > 0 ? (inv.accumulated / totalAccumulated) * 100 : 0,
    }));

    saveInvestments(allInvestments);

    return { success: true };
  } catch (error) {
    console.error('Error en removeTransferFromInvestment:', error);
    return { success: false, error: String(error) };
  }
};
