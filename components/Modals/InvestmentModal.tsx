'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Grid,
} from '@mui/material';
import { Investment, InvestmentFormData, InvestmentType } from '@/lib/types';

interface InvestmentModalProps {
  open: boolean;
  investment?: Investment;
  onClose: () => void;
  onSave: (data: InvestmentFormData) => void;
}

const investmentTypes: InvestmentType[] = ['Fondo', 'Acciones', 'Cripto', 'Divisa', 'Ahorro'];

export default function InvestmentModal({ open, investment, onClose, onSave }: InvestmentModalProps) {
  const [formData, setFormData] = useState<InvestmentFormData>({
    concept: '',
    previousValue: 0,
    currentValue: 0,
    income: 0,
    type: 'Fondo',
  });

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  const [errors, setErrors] = useState<Partial<Record<keyof InvestmentFormData, string>>>({});

  useEffect(() => {
    if (investment) {
      setFormData({
        concept: investment.concept,
        previousValue: investment.previousValue,
        currentValue: investment.currentValue,
        income: investment.income,
        type: investment.type,
      });
    } else {
      setFormData({
        concept: '',
        previousValue: 0,
        currentValue: 0,
        income: 0,
        type: 'Fondo',
      });
    }
    setFecha(new Date().toISOString().split('T')[0]);
    setErrors({});
  }, [investment, open]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof InvestmentFormData, string>> = {};

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

  const handleChange = (field: keyof InvestmentFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{investment ? 'Editar Inversión' : 'Nueva Inversión'}</DialogTitle>
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Ingreso"
                type="number"
                value={formData.income}
                onChange={(e) => handleChange('income', parseFloat(e.target.value) || 0)}
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                select
                label="Tipo"
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value as InvestmentType)}
              >
                {investmentTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
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
          {investment ? 'Actualizar' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
