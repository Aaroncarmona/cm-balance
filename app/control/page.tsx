'use client';

import { useState } from 'react';
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
import { useInvestments } from '@/hooks/useInvestments';
import { useOperative } from '@/hooks/useOperative';
import { useDebts } from '@/hooks/useDebts';
import { useCash } from '@/hooks/useCash';
import { useSummary } from '@/hooks/useSummary';
import InvestmentTable from '@/components/InvestmentTable';
import OperativeTable from '@/components/OperativeTable';
import DebtTable from '@/components/DebtTable';
import CashSummary from '@/components/CashSummary';
import InvestmentModal from '@/components/Modals/InvestmentModal';
import OperativeModal from '@/components/Modals/OperativeModal';
import DebtModal from '@/components/Modals/DebtModal';
import CashModal from '@/components/Modals/CashModal';
import { Investment, Operative, Debt, Cash } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/calculations';

export default function ControlPage() {
  const { investments, loading: loadingInv, addInvestment, updateInvestment, deleteInvestment } = useInvestments();
  const { operative, loading: loadingOp, addOperative, updateOperativeItem, deleteOperativeItem } = useOperative();
  const { debts, loading: loadingDebt, addDebt, updateDebt, deleteDebt } = useDebts();
  const { cash, loading: loadingCash, addCash, updateCash, deleteCash } = useCash();
  
  const summary = useSummary(investments, operative, debts, cash);

  // Modal states
  const [invModalOpen, setInvModalOpen] = useState(false);
  const [opModalOpen, setOpModalOpen] = useState(false);
  const [debtModalOpen, setDebtModalOpen] = useState(false);
  const [cashModalOpen, setCashModalOpen] = useState(false);

  const [selectedInvestment, setSelectedInvestment] = useState<Investment | undefined>();
  const [selectedOperative, setSelectedOperative] = useState<Operative | undefined>();
  const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>();
  const [selectedCash, setSelectedCash] = useState<Cash | undefined>();

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loading = loadingInv || loadingOp || loadingDebt || loadingCash;

  // Investment handlers
  const handleInvEdit = (investment: Investment) => {
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

  // Cash handlers
  const handleCashEdit = (c: Cash) => {
    setSelectedCash(c);
    setCashModalOpen(true);
  };

  const handleCashSave = async (data: any) => {
    try {
      if (selectedCash) {
        await updateCash(selectedCash.id, data);
        setSnackbar({ open: true, message: 'Actualizado correctamente', severity: 'success' });
      } else {
        await addCash(data);
        setSnackbar({ open: true, message: 'Agregado correctamente', severity: 'success' });
      }
      setCashModalOpen(false);
      setSelectedCash(undefined);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleCashDelete = async (id: string) => {
    if (confirm('¿Eliminar esta caja?')) {
      try {
        await deleteCash(id);
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
            <ExportImport
              investments={investments}
              operative={operative}
              debts={debts}
              cash={cash}
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            INVERSIONES
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              setSelectedInvestment(undefined);
              setInvModalOpen(true);
            }}
          >
            Agregar
          </Button>
        </Box>
        <InvestmentTable
          investments={investments}
          onEdit={handleInvEdit}
          onDelete={handleInvDelete}
        />
      </Paper>

      {/* Operativo */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            OPERATIVO (CPC)
          </Typography>
          <Button
            variant="contained"
            size="small"
            color="secondary"
            onClick={() => {
              setSelectedOperative(undefined);
              setOpModalOpen(true);
            }}
          >
            Agregar
          </Button>
        </Box>
        <OperativeTable
          operative={operative}
          onEdit={handleOpEdit}
          onDelete={handleOpDelete}
        />
      </Paper>

      {/* Deudas */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            DEUDA
          </Typography>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={() => {
              setSelectedDebt(undefined);
              setDebtModalOpen(true);
            }}
          >
            Agregar
          </Button>
        </Box>
        <DebtTable
          debts={debts}
          onEdit={handleDebtEdit}
          onDelete={handleDebtDelete}
        />
      </Paper>

      {/* Caja */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight={600}>
            CAJA
          </Typography>
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={() => {
              setSelectedCash(undefined);
              setCashModalOpen(true);
            }}
          >
            Agregar
          </Button>
        </Box>
        <CashSummary
          cash={cash}
          onEdit={handleCashEdit}
          onDelete={handleCashDelete}
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
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Caja
            </Typography>
            <Typography variant="h6" fontWeight={600} color="success.main">
              {formatCurrency(summary.totalCash)}
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

      <CashModal
        open={cashModalOpen}
        cash={selectedCash}
        onClose={() => {
          setCashModalOpen(false);
          setSelectedCash(undefined);
        }}
        onSave={handleCashSave}
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
