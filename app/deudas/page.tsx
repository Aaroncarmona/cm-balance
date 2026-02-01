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
import { Add as AddIcon } from '@mui/icons-material';
import Header from '@/components/Header';
import DebtTable from '@/components/DebtTable';
import DebtModal from '@/components/Modals/DebtModal';
import { useDebts } from '@/hooks/useDebts';
import { Debt } from '@/lib/types';
import { calculateTotalDebt } from '@/lib/calculations';

export default function DeudasPage() {
  const { debts, loading, addDebt, updateDebt, deleteDebt } = useDebts();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleAdd = () => {
    setSelectedDebt(undefined);
    setModalOpen(true);
  };

  const handleEdit = (debt: Debt) => {
    setSelectedDebt(debt);
    setModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedDebt) {
        await updateDebt(selectedDebt.id, data);
        setSnackbar({ open: true, message: 'Deuda actualizada correctamente', severity: 'success' });
      } else {
        await addDebt(data);
        setSnackbar({ open: true, message: 'Deuda agregada correctamente', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar la deuda', severity: 'error' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDebtToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (debtToDelete) {
      try {
        await deleteDebt(debtToDelete);
        setSnackbar({ open: true, message: 'Deuda eliminada correctamente', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al eliminar la deuda', severity: 'error' });
      }
    }
    setDeleteDialogOpen(false);
    setDebtToDelete(null);
  };

  const total = calculateTotalDebt(debts);

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
        title="Deudas"
        subtitle="Gestiona tus créditos y deudas"
        totalValue={total}
      />

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="large"
          color="error"
        >
          Nueva Deuda
        </Button>
      </Box>

      <DebtTable
        debts={debts}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <DebtModal
        open={modalOpen}
        debt={selectedDebt}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar esta deuda? Esta acción no se puede deshacer.
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
