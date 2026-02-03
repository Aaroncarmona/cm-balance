import { getCuentas, saveCuentas, getOperative, saveOperative, getCPCMovements } from './storage';
import { Cuenta, Operative, IncomeItem } from './types';

/**
 * Migración: Actualizar cuentas existentes para agregar el egreso en operativo
 * Ejecutar esta función una vez para corregir cuentas antiguas
 */
export const migrateCuentasToOperativeEgress = (): { success: boolean; updated: number; errors: string[] } => {
  try {
    const cuentas = getCuentas();
    const operatives = getOperative();
    const movements = getCPCMovements();
    const errors: string[] = [];
    let updated = 0;

    // Buscar cuentas que:
    // 1. Tienen inversión vinculada
    // 2. NO tienen operativeId
    // 3. Están ACTIVAS
    const cuentasToMigrate = cuentas.filter(
      c => c.investmentId && !c.operativeId && c.status === 'ACTIVA'
    );

    if (cuentasToMigrate.length === 0) {
      return { success: true, updated: 0, errors: [] };
    }

    console.log(`🔄 Migrando ${cuentasToMigrate.length} cuentas...`);

    // Intentar asignar operativeId basado en el nombre de la cuenta
    // Formato esperado: "CPC-PAUSADA", "CPC-TX-2601", etc.
    const updatedCuentas = cuentas.map(cuenta => {
      if (!cuentasToMigrate.includes(cuenta)) {
        return cuenta;
      }

      // Buscar el operativo que corresponde al prefijo del nombre
      let matchedOperative: Operative | undefined;

      // Buscar por nombre exacto primero
      for (const op of operatives) {
        if (cuenta.nombre.toUpperCase().includes(op.concept.toUpperCase())) {
          matchedOperative = op;
          break;
        }
      }

      // Si no encuentra, usar el primero como fallback
      if (!matchedOperative && operatives.length > 0) {
        matchedOperative = operatives[0];
        errors.push(`Cuenta "${cuenta.nombre}": No se encontró operativo específico, usando "${matchedOperative.concept}"`);
      }

      if (matchedOperative) {
        // Calcular el monto de la cuenta basado en sus movimientos
        const cuentaMovements = movements.filter(m => m.cuentaId === cuenta.id);
        const monto = cuentaMovements.reduce((sum, m) => {
          return m.tipo === 'ABONO' ? sum + m.monto : sum - m.monto;
        }, 0);

        // Crear el egreso en el operativo
        const newEgressId = `egress-migrate-${Date.now()}-${cuenta.id}`;
        const newEgressItem: IncomeItem = {
          id: newEgressId,
          concepto: `Egreso a inversión: ${cuenta.nombre}`,
          tipo: 'CARGO',
          monto: monto,
          createdAt: new Date(),
        };

        // Actualizar el operativo
        const opIndex = operatives.findIndex(op => op.id === matchedOperative!.id);
        if (opIndex !== -1) {
          const updatedIncomeItems = [...(operatives[opIndex].incomeItems || []), newEgressItem];
          const totalIncome = updatedIncomeItems.reduce((sum, item) => {
            return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
          }, 0);

          operatives[opIndex] = {
            ...operatives[opIndex],
            incomeItems: updatedIncomeItems,
            income: totalIncome,
            accumulated: operatives[opIndex].currentValue + totalIncome,
          };

          updated++;

          return {
            ...cuenta,
            operativeId: matchedOperative.id,
            operativeName: matchedOperative.concept,
            operativeEgressId: newEgressId,
            updatedAt: new Date(),
          };
        }
      } else {
        errors.push(`Cuenta "${cuenta.nombre}": No se encontró ningún operativo`);
      }

      return cuenta;
    });

    // Guardar cambios
    saveCuentas(updatedCuentas);
    saveOperative(operatives);

    console.log(`✅ Migración completada: ${updated} cuentas actualizadas`);
    if (errors.length > 0) {
      console.warn('⚠️ Advertencias:', errors);
    }

    return { success: true, updated, errors };
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return { success: false, updated: 0, errors: [String(error)] };
  }
};
