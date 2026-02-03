'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
} from '@mui/material';
import { Cash, CashFormData } from '@/lib/types';
import { getTodayLocalInput } from '@/lib/dateUtils';

interface CashModalProps {
  open: boolean;
  cash?: Cash;
  onClose: () => void;
  onSave: (data: CashFormData) => void;
}

export default function CashModal({ open, cash, onClose, onSave }: CashModalProps) {
  const [formData, setFormData] = useState<CashFormData>({
    concept: '',
    amount: 0,
    location: '',
  });

  const [fecha, setFecha] = useState(getTodayLocalInput());

  const [errors, setErrors] = useState<Partial<Record<keyof CashFormData, string>>>({});

  useEffect(() => {
    if (cash) {
      setFormData({
        concept: cash.concept,
        amount: cash.amount,
        location: cash.location,
      });
    } else {
      setFormData({
        concept: '',
        amount: 0,
        location: '',
      });
    }
    setFecha(new Date().toISOString().split('T')[0]);
    setErrors({});
  }, [cash, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CashFormData, string>> = {};

    if (!formData.concept.trim()) {
      newErrors.concept = 'El concepto es requerido';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'La ubicación es requerida';
    }

    if (formData.amount < 0) {
      newErrors.amount = 'El monto no puede ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };

  const handleChange = (field: keyof CashFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{cash ? 'Editar Caja' : 'Nueva Caja'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Concepto"
                value={formData.concept}
                onChange={(e) => handleChange('concept', e.target.value)}
                error={!!errors.concept}
                helperText={errors.concept}
                placeholder="Ejemplo: Efectivo, Cuenta bancaria"
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Ubicación"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                error={!!errors.location}
                helperText={errors.location}
                placeholder="Ejemplo: CAJA, BBVA, Santander"
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Monto"
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                error={!!errors.amount}
                helperText={errors.amount}
                required
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Fecha del movimiento"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained">
          {cash ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
