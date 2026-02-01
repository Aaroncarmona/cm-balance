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
import { Debt, DebtFormData } from '@/lib/types';

interface DebtModalProps {
  open: boolean;
  debt?: Debt;
  onClose: () => void;
  onSave: (data: DebtFormData) => void;
}

export default function DebtModal({ open, debt, onClose, onSave }: DebtModalProps) {
  const [formData, setFormData] = useState<DebtFormData>({
    concept: '',
    previousValue: 0,
    currentValue: 0,
    limit: 0,
  });

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const [errors, setErrors] = useState<Partial<Record<keyof DebtFormData, string>>>({});

  useEffect(() => {
    if (debt) {
      setFormData({
        concept: debt.concept,
        previousValue: debt.previousValue,
        currentValue: debt.currentValue,
        limit: debt.limit,
      });
    } else {
      setFormData({
        concept: '',
        previousValue: 0,
        currentValue: 0,
        limit: 0,
      });
    }
    setFecha(new Date().toISOString().split('T')[0]);
    setErrors({});
  }, [debt, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof DebtFormData, string>> = {};

    if (!formData.concept.trim()) {
      newErrors.concept = 'El concepto es requerido';
    }

    if (formData.limit < 0) {
      newErrors.limit = 'El límite no puede ser negativo';
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

  const handleChange = (field: keyof DebtFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{debt ? 'Editar Deuda' : 'Nueva Deuda'}</DialogTitle>
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
                placeholder="Ejemplo: TX-2601"
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Valor Anterior"
                type="number"
                value={formData.previousValue}
                onChange={(e) => handleChange('previousValue', parseFloat(e.target.value) || 0)}
                InputProps={{ inputProps: { step: 0.01 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Valor Actual (Deuda)"
                type="number"
                value={formData.currentValue}
                onChange={(e) => handleChange('currentValue', parseFloat(e.target.value) || 0)}
                helperText="Ingresa valores negativos para deudas"
                required
                InputProps={{ inputProps: { step: 0.01 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Límite de Crédito"
                type="number"
                value={formData.limit}
                onChange={(e) => handleChange('limit', parseFloat(e.target.value) || 0)}
                error={!!errors.limit}
                helperText={errors.limit || 'Límite máximo del crédito'}
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
          {debt ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
