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
import { Operative, OperativeFormData } from '@/lib/types';
import { getTodayLocalInput } from '@/lib/dateUtils';

interface OperativeModalProps {
  open: boolean;
  operative?: Operative;
  onClose: () => void;
  onSave: (data: OperativeFormData) => void;
}

export default function OperativeModal({ open, operative, onClose, onSave }: OperativeModalProps) {
  const [formData, setFormData] = useState<OperativeFormData>({
    concept: '',
    previousValue: 0,
    currentValue: 0,
    income: 0,
  });

  const [fecha, setFecha] = useState(getTodayLocalInput());

  const [errors, setErrors] = useState<Partial<Record<keyof OperativeFormData, string>>>({});

  useEffect(() => {
    if (operative) {
      setFormData({
        concept: operative.concept,
        previousValue: operative.previousValue,
        currentValue: operative.currentValue,
        income: operative.income,
      });
    } else {
      setFormData({
        concept: '',
        previousValue: 0,
        currentValue: 0,
        income: 0,
      });
    }
    setFecha(new Date().toISOString().split('T')[0]);
    setErrors({});
  }, [operative, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof OperativeFormData, string>> = {};

    if (!formData.concept.trim()) {
      newErrors.concept = 'El concepto es requerido';
    }

    if (formData.currentValue < 0) {
      newErrors.currentValue = 'El valor actual no puede ser negativo';
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

  const handleChange = (field: keyof OperativeFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{operative ? 'Editar Operativo' : 'Nuevo Operativo'}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Concepto (CPC)"
                value={formData.concept}
                onChange={(e) => handleChange('concept', e.target.value)}
                error={!!errors.concept}
                helperText={errors.concept}
                placeholder="Ejemplo: CPC-PAUSADA, CPC-TX-2601"
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
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Valor Actual"
                type="number"
                value={formData.currentValue}
                onChange={(e) => handleChange('currentValue', parseFloat(e.target.value) || 0)}
                error={!!errors.currentValue}
                helperText={errors.currentValue}
                required
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Ingreso"
                type="number"
                value={formData.income}
                onChange={(e) => handleChange('income', parseFloat(e.target.value) || 0)}
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
          {operative ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
