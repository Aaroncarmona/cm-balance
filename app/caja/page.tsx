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
import CashSummary from '@/components/CashSummary';
import CashModal from '@/components/Modals/CashModal';
import { useCash } from '@/hooks/useCash';
import { Cash } from '@/lib/types';
import { calculateTotalCash } from '@/lib/calculations';

export default function CajaPage() {
  const { cash, loading, addCash, updateCash, deleteCash } = useCash();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCash, setSelectedCash] = useState<Cash | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cashToDelete, setCashToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleAdd = () => {
    setSelectedCash(undefined);
    setModalOpen(true);
  };

  const handleEdit = (c: Cash) => {
    setSelectedCash(c);
    setModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedCash) {
        await updateCash(selectedCash.id, data);
        setSnackbar({ open: true, message: 'Caja actualizada correctamente', severity: 'success' });
      } else {
        await addCash(data);
        setSnackbar({ open: true, message: 'Caja agregada correctamente', severity: 'success' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar la caja', severity: 'error' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setCashToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (cashToDelete) {
      try {
        await deleteCash(cashToDelete);
        setSnackbar({ open: true, message: 'Caja eliminada correctamente', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Error al eliminar la caja', severity: 'error' });
      }
    }
    setDeleteDialogOpen(false);
    setCashToDelete(null);
  };

  const total = calculateTotalCash(cash);

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
        title="Caja"
        subtitle="Gestiona tu efectivo disponible"
        totalValue={total}
      />

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          size="large"
          color="success"
        >
          Nueva Caja
        </Button>
      </Box>

      <CashSummary
        cash={cash}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />

      <CashModal
        open={modalOpen}
        cash={selectedCash}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Estás seguro de que deseas eliminar esta caja? Esta acción no se puede deshacer.
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
