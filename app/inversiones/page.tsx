'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import Header from '@/components/Header';
import InvestmentTable from '@/components/InvestmentTable';
import ExportImport from '@/components/ExportImport';
import { useInvestments } from '@/hooks/useInvestments';
import { useOperative } from '@/hooks/useOperative';
import { useDebts } from '@/hooks/useDebts';
import { useCash } from '@/hooks/useCash';
import { Investment } from '@/lib/types';
import { calculateTotalInvestments } from '@/lib/calculations';

export default function InversionesPage() {
  const { investments, loading, addInvestment, updateInvestment, deleteInvestment } = useInvestments();
  const { operative } = useOperative();
  const { debts } = useDebts();
  const { cash } = useCash();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleEdit = async (investment: Investment) => {
    // Now this is called from inline edit with the complete updated investment
    try {
      await updateInvestment(investment.id, investment);
      setSnackbar({ open: true, message: 'Inversión actualizada correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar la inversión', severity: 'error' });
    }
  };

  const handleSave = async (data: any) => {
    try {
      await addInvestment(data);
      setSnackbar({ open: true, message: 'Inversión agregada correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar la inversión', severity: 'error' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setInvestmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (investmentToDelete) {
      try {
        await deleteInvestment(investmentToDelete);
        setSnackbar({ open: true, message: 'Inversión eliminada correctamente', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al eliminar la inversión', severity: 'error' });
      }
    }
    setDeleteDialogOpen(false);
    setInvestmentToDelete(null);
  };

  const handleUpdateIncomeItems = async (id: string, items: any[]) => {
    try {
      const investment = investments.find(inv => inv.id === id);
      if (investment) {
        // Calculate total: CARGO adds, ABONO subtracts
        const totalIncome = items.reduce((sum, item) => {
          return item.tipo === 'CARGO' ? sum + item.monto : sum - item.monto;
        }, 0);
        await updateInvestment(id, { ...investment, incomeItems: items, income: totalIncome });
        setSnackbar({ open: true, message: 'Ingresos actualizados correctamente', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar los ingresos', severity: 'error' });
    }
  };

  const total = calculateTotalInvestments(investments);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Header
        title="Inversiones"
        subtitle="Gestiona tus inversiones y portafolio"
        totalValue={total}
      />

      <Box sx={{ mb: 3 }}>
        <ExportImport
          investments={investments}
          operative={operative}
          debts={debts}
          cash={cash}
          onImportComplete={() => window.location.reload()}
        />
      </Box>

      <InvestmentTable
        investments={investments}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onAdd={handleSave}
        onUpdateIncomeItems={handleUpdateIncomeItems}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar esta inversión? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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
