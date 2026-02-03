'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Tooltip,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { IncomeItem } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface IncomeDialogProps {
  open: boolean;
  investmentName: string;
  incomeItems: IncomeItem[];
  onClose: () => void;
  onSave: (items: IncomeItem[]) => void;
}

export default function IncomeDialog({
  open,
  investmentName,
  incomeItems,
  onClose,
  onSave,
}: IncomeDialogProps) {
  const [items, setItems] = useState<IncomeItem[]>(incomeItems);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    concepto: '',
    tipo: 'ABONO' as 'CARGO' | 'ABONO',
    monto: '',
  });

  // Update items when incomeItems prop changes (when dialog opens for different investment)
  useEffect(() => {
    if (open) {
      setItems(incomeItems || []);
      setIsAdding(false);
      setEditingId(null);
    }
  }, [incomeItems, open]);

  const handleStartAdd = () => {
    setIsAdding(true);
    setFormData({ concepto: '', tipo: 'ABONO', monto: '' });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setFormData({ concepto: '', tipo: 'ABONO', monto: '' });
  };

  const handleSaveAdd = () => {
    if (!formData.concepto.trim() || !formData.monto) return;

    const newItem: IncomeItem = {
      id: `income-${Date.now()}`,
      concepto: formData.concepto,
      tipo: formData.tipo,
      monto: parseFloat(formData.monto),
      createdAt: new Date(),
    };

    setItems([...items, newItem]);
    handleCancelAdd();
  };

  const handleStartEdit = (item: IncomeItem) => {
    setEditingId(item.id);
    setFormData({
      concepto: item.concepto,
      tipo: item.tipo,
      monto: item.monto.toString(),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ concepto: '', tipo: 'CARGO', monto: '' });
  };

  const handleSaveEdit = () => {
    if (!formData.concepto.trim() || !formData.monto) return;

    setItems(
      items.map((item) =>
        item.id === editingId
          ? {
              ...item,
              concepto: formData.concepto,
              tipo: formData.tipo,
              monto: parseFloat(formData.monto),
            }
          : item
      )
    );
    handleCancelEdit();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este concepto de ingreso?')) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleSaveAll = () => {
    onSave(items);
    onClose();
  };

  const total = items.reduce((sum, item) => {
    return item.tipo === 'ABONO' ? sum + item.monto : sum - item.monto;
  }, 0);
  
  const totalCargo = items.filter(i => i.tipo === 'CARGO').reduce((sum, item) => sum + item.monto, 0);
  const totalAbono = items.filter(i => i.tipo === 'ABONO').reduce((sum, item) => sum + item.monto, 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Movimientos - {investmentName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {/* Tabla de conceptos */}
          <Box sx={{ flex: 1 }}>
            <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="45%">Concepto</TableCell>
                <TableCell width="15%" align="center">Tipo</TableCell>
                <TableCell width="25%" align="right">Monto</TableCell>
                <TableCell width="15%" align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Add Row */}
              {isAdding ? (
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Concepto..."
                      value={formData.concepto}
                      onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                      autoFocus
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      select
                      value={formData.tipo}
                      onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                    >
                      <MenuItem value="CARGO">Cargo</MenuItem>
                      <MenuItem value="ABONO">Abono</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      type="number"
                      placeholder="0"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      inputProps={{ step: '0.01' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Guardar">
                      <IconButton size="small" onClick={handleSaveAdd} color="success">
                        <CheckIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Cancelar">
                      <IconButton size="small" onClick={handleCancelAdd} color="error">
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell colSpan={4} align="center" sx={{ py: 1 }}>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleStartAdd}
                      variant="text"
                    >
                      Agregar Movimiento
                    </Button>
                  </TableCell>
                </TableRow>
              )}

              {/* Items */}
              {items.length === 0 && !isAdding ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary" variant="body2">
                      No hay movimientos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    {editingId === item.id ? (
                      <>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            value={formData.concepto}
                            onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                            autoFocus
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            select
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                          >
                            <MenuItem value="CARGO">Cargo</MenuItem>
                            <MenuItem value="ABONO">Abono</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            value={formData.monto}
                            onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                            inputProps={{ step: '0.01' }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Guardar">
                            <IconButton size="small" onClick={handleSaveEdit} color="success">
                              <CheckIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancelar">
                            <IconButton size="small" onClick={handleCancelEdit} color="error">
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{item.concepto}</TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={item.tipo} 
                            size="small" 
                            color={item.tipo === 'ABONO' ? 'success' : 'error'}
                            sx={{ minWidth: 65 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            fontWeight={500}
                            color={item.tipo === 'ABONO' ? 'success.main' : 'error.main'}
                          >
                            {item.tipo === 'ABONO' ? '+' : '-'}{formatCurrency(item.monto)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleStartEdit(item)} color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => handleDelete(item.id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}

            </TableBody>
          </Table>
        </TableContainer>
          </Box>

          {/* Panel de Resumen */}
          <Box sx={{ width: 300 }}>
            <Paper 
              elevation={3}
              sx={{ 
                p: 3,
                position: 'sticky',
                top: 0,
                bgcolor: 'grey.50'
              }}
            >
              <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
                📊 Resumen
              </Typography>
              
              {items.length === 0 ? (
                <Box sx={{ mt: 3, textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay conceptos agregados
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Total Abonos (Entradas) */}
                  <Box sx={{ 
                    bgcolor: 'success.lighter', 
                    p: 2, 
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'success.light'
                  }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Total Abonos (Entradas)
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      +{formatCurrency(totalAbono)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {items.filter(i => i.tipo === 'ABONO').length} concepto{items.filter(i => i.tipo === 'ABONO').length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Total Cargos (Salidas) */}
                  <Box sx={{ 
                    bgcolor: 'error.lighter', 
                    p: 2, 
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'error.light'
                  }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      Total Cargos (Salidas)
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="error.main">
                      -{formatCurrency(totalCargo)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {items.filter(i => i.tipo === 'CARGO').length} concepto{items.filter(i => i.tipo === 'CARGO').length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Balance Total */}
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.main',
                      p: 2.5,
                      borderRadius: 1,
                      boxShadow: 2,
                      mt: 1
                    }}
                  >
                    <Typography variant="caption" color="white" gutterBottom display="block" sx={{ opacity: 0.9 }}>
                      BALANCE TOTAL
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="white">
                      {formatCurrency(total)}
                    </Typography>
                    <Typography variant="caption" color="white" sx={{ opacity: 0.9 }}>
                      {items.length} concepto{items.length !== 1 ? 's' : ''} total{items.length !== 1 ? 'es' : ''}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSaveAll} variant="contained">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
