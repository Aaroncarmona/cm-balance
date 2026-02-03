'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import ExportImport from '@/components/ExportImport';
import GeneralCutButton from '@/components/GeneralCutButton';
import { useInvestments } from '@/hooks/useInvestments';
import { useOperative } from '@/hooks/useOperative';
import { useDebts } from '@/hooks/useDebts';
import { useSummary } from '@/hooks/useSummary';
import InvestmentTable from '@/components/InvestmentTable';
import OperativeTable from '@/components/OperativeTable';
import DebtTable from '@/components/DebtTable';
import InvestmentModal from '@/components/Modals/InvestmentModal';
import OperativeModal from '@/components/Modals/OperativeModal';
import DebtModal from '@/components/Modals/DebtModal';
import { Investment, Operative, Debt } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/calculations';
import { migrateCuentasToOperativeEgress } from '@/lib/migrateCuentas';
import { getCPCMovements, getCuentas, getInvestments as getInvestmentsFromStorage, getOperative as getOperativeFromStorage, getDebts as getDebtsFromStorage, saveOperative } from '@/lib/storage';
import { updateOperativeFromMovementsById } from '@/lib/operativeCalculations';
import { onDataUpdated } from '@/lib/events';

export default function ControlPage() {
  const { investments: investmentsHook, loading: loadingInv, addInvestment, updateInvestment, deleteInvestment } = useInvestments();
  const { operative: operativeHook, loading: loadingOp, addOperative, updateOperativeItem, deleteOperativeItem } = useOperative();
  const { debts: debtsHook, loading: loadingDebt, addDebt, updateDebt, deleteDebt } = useDebts();
  
  // Estado local para datos frescos que se actualizan automáticamente
  const [investments, setInvestments] = useState(investmentsHook);
  const [operative, setOperative] = useState(operativeHook);
  const [debts, setDebts] = useState(debtsHook);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Sincronizar con hooks al cargar
  useEffect(() => {
    setInvestments(investmentsHook);
  }, [investmentsHook]);
  
  useEffect(() => {
    setOperative(operativeHook);
  }, [operativeHook]);
  
  useEffect(() => {
    setDebts(debtsHook);
  }, [debtsHook]);
  
  // Escuchar cambios y recargar datos
  useEffect(() => {
    // Sistema de eventos personalizado para actualizaciones instantáneas
    const unsubscribe = onDataUpdated((detail) => {
      console.log('📡 Data updated:', detail.dataType);
      setRefreshTrigger(prev => prev + 1);
    });
    
    // También escuchar cambios de storage de otras pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && (e.key.includes('cpc_movements') || e.key.includes('cuentas') || e.key.includes('investments') || e.key.includes('operative') || e.key.includes('debts'))) {
        console.log('📡 Storage changed:', e.key);
        setRefreshTrigger(prev => prev + 1);
      }
    };
    
    // Refrescar cuando vuelve el foco a la ventana
    const handleFocus = () => {
      console.log('📡 Window focused, refreshing...');
      setRefreshTrigger(prev => prev + 1);
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);
  
  // Recargar datos cuando cambia refreshTrigger
  useEffect(() => {
    setInvestments(getInvestmentsFromStorage());
    setOperative(getOperativeFromStorage());
    setDebts(getDebtsFromStorage());
  }, [refreshTrigger]);
  
  // Recalcular operative con los movimientos reales de CPC
  const movements = getCPCMovements();
  const cuentas = getCuentas();
  const operativeWithRealValues = operative.map(op => updateOperativeFromMovementsById(op, movements, cuentas));
  
  const summary = useSummary(investments, operativeWithRealValues, debts, []);

  // Modal states
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [opModalOpen, setOpModalOpen] = useState(false);
  const [debtModalOpen, setDebtModalOpen] = useState(false);

  const [selectedInvestment, setSelectedInvestment] = useState<Investment | undefined>();
  const [selectedOperative, setSelectedOperative] = useState<Operative | undefined>();
  const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>();

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loading = loadingInv || loadingOp || loadingDebt;

  // Migración automática una sola vez al cargar
  useEffect(() => {
    const MIGRATION_KEY = 'banlance:cuentas_migration_v1';
    const migrated = localStorage.getItem(MIGRATION_KEY);
    
    if (!migrated) {
      console.log('🔄 Ejecutando migración de cuentas...');
      const result = migrateCuentasToOperativeEgress();
      
      if (result.success) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        if (result.updated > 0) {
          console.log(`✅ Migración completada: ${result.updated} cuentas actualizadas`);
          setSnackbar({ 
            open: true, 
            message: `Migración completada: ${result.updated} cuentas actualizadas. Recargando...`, 
            severity: 'success' 
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        console.error('❌ Error en migración:', result.errors);
      }
    }
  }, []);

  // Investment handlers
  const handleInvEdit = async (investment: Investment) => {
    setSelectedInvestment(investment);
    setInvModalOpen(true);
  };

  const handleInvSave = async (data: any) => {
    try {
      if (selectedInvestment) {
        await updateInvestment(selectedInvestment.id, data);
        setSnackbar({ open: true, message: 'Actualizado correctamente', severity: 'success' });
      } else {
        await addInvestment(data);
        setSnackbar({ open: true, message: 'Agregado correctamente', severity: 'success' });
      }
      setInvModalOpen(false);
      setSelectedInvestment(undefined);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleInvDelete = async (id: string) => {
    if (confirm('¿Eliminar esta inversión?')) {
      try {
        await deleteInvestment(id);
        setSnackbar({ open: true, message: 'Eliminado correctamente', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' });
      }
    }
  };

  // Operative handlers
  const handleOpEdit = (op: Operative) => {
    setSelectedOperative(op);
    setOpModalOpen(true);
  };

  const handleOpSave = async (data: any) => {
    try {
      if (selectedOperative) {
        await updateOperativeItem(selectedOperative.id, data);
        setSnackbar({ open: true, message: 'Actualizado correctamente', severity: 'success' });
      } else {
        await addOperative(data);
        setSnackbar({ open: true, message: 'Agregado correctamente', severity: 'success' });
      }
      setOpModalOpen(false);
      setSelectedOperative(undefined);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleOpDelete = async (id: string) => {
    if (confirm('¿Eliminar este operativo?')) {
      try {
        await deleteOperativeItem(id);
        setSnackbar({ open: true, message: 'Eliminado correctamente', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' });
      }
    }
  };

  const handleUpdateOperativeIncomeItems = async (id: string, items: any[]) => {
    try {
      const opIndex = operative.findIndex(o => o.id === id);
      if (opIndex !== -1) {
        const op = operative[opIndex];
        // Calculate total: ABONO adds, CARGO subtracts
        const totalIncome = items.reduce((sum, item) => {
          return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
        }, 0);
        
        // Actualizar directamente en el array
        const updatedOp = {
          ...op,
          incomeItems: items,
          income: totalIncome,
          // Balance = Anterior + Actual (sin transferencias)
          accumulated: op.previousValue + op.currentValue,
          updatedAt: new Date(),
        };
        
        const updatedOperative = [...operative];
        updatedOperative[opIndex] = updatedOp;
        
        setOperative(updatedOperative);
        saveOperative(updatedOperative);
        setSnackbar({ open: true, message: 'Movimientos actualizados correctamente', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar los movimientos', severity: 'error' });
    }
  };

  // Debt handlers
  const handleDebtEdit = (debt: Debt) => {
    setSelectedDebt(debt);
    setDebtModalOpen(true);
  };

  const handleDebtSave = async (data: any) => {
    try {
      if (selectedDebt) {
        await updateDebt(selectedDebt.id, data);
        setSnackbar({ open: true, message: 'Actualizado correctamente', severity: 'success' });
      } else {
        await addDebt(data);
        setSnackbar({ open: true, message: 'Agregado correctamente', severity: 'success' });
      }
      setDebtModalOpen(false);
      setSelectedDebt(undefined);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleDebtDelete = async (id: string) => {
    if (confirm('¿Eliminar esta deuda?')) {
      try {
        await deleteDebt(id);
        setSnackbar({ open: true, message: 'Eliminado correctamente', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al eliminar', severity: 'error' });
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          borderBottom: 2,
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Control Financiero
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(new Date())} - Actualización Quincenal
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <GeneralCutButton onCutComplete={() => window.location.reload()} />
            <ExportImport
              investments={investments}
              operative={operativeWithRealValues}
              debts={debts}
              cash={[]}
              onImportComplete={() => window.location.reload()}
            />
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Patrimonio Neto
              </Typography>
              <Typography variant="h4" fontWeight={700} color={summary.netWorth >= 0 ? 'success.main' : 'error.main'}>
                {formatCurrency(summary.netWorth)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Inversiones */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
          INVERSIONES
        </Typography>
        <InvestmentTable
          investments={investments}
          onEdit={handleInvEdit}
          onDelete={handleInvDelete}
          onAdd={handleInvSave}
        />
      </Paper>

      {/* Operativo */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
          OPERATIVO (CPC)
        </Typography>
        <OperativeTable
          operative={operativeWithRealValues}
          onEdit={handleOpEdit}
          onDelete={handleOpDelete}
          onUpdateIncomeItems={handleUpdateOperativeIncomeItems}
        />
      </Paper>

      {/* Deudas */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
          DEUDA
        </Typography>
        <DebtTable
          debts={debts}
          onEdit={handleDebtEdit}
          onDelete={handleDebtDelete}
          onUpdate={() => window.location.reload()}
        />
      </Paper>

      {/* Totales */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          TOTALES
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Inversiones
            </Typography>
            <Typography variant="h6" fontWeight={600} color="primary.main">
              {formatCurrency(summary.totalInvestments)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Operativo
            </Typography>
            <Typography variant="h6" fontWeight={600} color="secondary.main">
              {formatCurrency(summary.totalOperative)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Deudas
            </Typography>
            <Typography variant="h6" fontWeight={600} color="error.main">
              {formatCurrency(summary.totalDebt)}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Patrimonio Neto
            </Typography>
            <Typography variant="h5" fontWeight={700} color={summary.netWorth >= 0 ? 'success.main' : 'error.main'}>
              {formatCurrency(summary.netWorth)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Modals */}
      <InvestmentModal
        open={invModalOpen}
        investment={selectedInvestment}
        onClose={() => {
          setInvModalOpen(false);
          setSelectedInvestment(undefined);
        }}
        onSave={handleInvSave}
      />

      <OperativeModal
        open={opModalOpen}
        operative={selectedOperative}
        onClose={() => {
          setOpModalOpen(false);
          setSelectedOperative(undefined);
        }}
        onSave={handleOpSave}
      />

      <DebtModal
        open={debtModalOpen}
        debt={selectedDebt}
        onClose={() => {
          setDebtModalOpen(false);
          setSelectedDebt(undefined);
        }}
        onSave={handleDebtSave}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
