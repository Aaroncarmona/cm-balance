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
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Paper,
  Stack,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { DebtMovement, Investment } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { getTodayLocalInput, dateToLocalInput, dateInputToLocal } from '@/lib/dateUtils';

interface DebtIncomeDialogProps {
  open: boolean;
  debtId: string;
  debtName: string;
  movements: DebtMovement[];
  investments: Investment[];
  onClose: () => void;
  onSave: (movements: DebtMovement[]) => void;
}

export default function DebtIncomeDialog({
  open,
  debtId,
  debtName,
  movements,
  investments,
  onClose,
  onSave,
}: DebtIncomeDialogProps) {
  const [items, setItems] = useState<DebtMovement[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newForm, setNewForm] = useState({
    tipo: 'CARGO' as 'CARGO' | 'ABONO',
    concepto: '',
    monto: '',
    fecha: getTodayLocalInput(),
    investmentId: '',
    investmentName: '',
  });

  const [editForm, setEditForm] = useState({
    tipo: 'CARGO' as 'CARGO' | 'ABONO',
    concepto: '',
    monto: '',
    fecha: '',
    investmentId: '',
    investmentName: '',
  });

  // Initialize items when dialog opens or movements change
  useEffect(() => {
    if (open) {
      setItems([...movements]);
      setIsAdding(false);
      setEditingId(null);
    }
  }, [open, movements]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancelAdd();
        handleCancelEdit();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleStartAdd = () => {
    setIsAdding(true);
    setEditingId(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewForm({
      tipo: 'CARGO',
      concepto: '',
      monto: '',
      fecha: getTodayLocalInput(),
      investmentId: '',
      investmentName: '',
    });
  };

  const handleSaveAdd = () => {
    if (!newForm.concepto.trim() || !newForm.monto) {
      return;
    }

    const monto = parseFloat(newForm.monto);
    if (isNaN(monto) || monto <= 0) {
      return;
    }

    const newMovement: DebtMovement = {
      id: `debt-mov-${Date.now()}`,
      debtId: debtId,
      debtName: debtName,
      tipo: newForm.tipo,
      monto: monto,
      fecha: dateInputToLocal(newForm.fecha),
      concepto: newForm.concepto,
      investmentId: newForm.investmentId || undefined,
      investmentName: newForm.investmentName || undefined,
      createdAt: new Date(),
    };

    setItems([...items, newMovement]);
    handleCancelAdd();
  };

  const handleStartEdit = (item: DebtMovement) => {
    setEditingId(item.id);
    setIsAdding(false);
    setEditForm({
      tipo: item.tipo,
      concepto: item.concepto,
      monto: item.monto.toString(),
      fecha: dateToLocalInput(item.fecha),
      investmentId: item.investmentId || '',
      investmentName: item.investmentName || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      tipo: 'CARGO',
      concepto: '',
      monto: '',
      fecha: '',
      investmentId: '',
      investmentName: '',
    });
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.concepto.trim() || !editForm.monto) {
      return;
    }

    const monto = parseFloat(editForm.monto);
    if (isNaN(monto) || monto <= 0) {
      return;
    }

    setItems(items.map(item =>
      item.id === id
        ? {
            ...item,
            tipo: editForm.tipo,
            concepto: editForm.concepto,
            monto: monto,
            fecha: dateInputToLocal(editForm.fecha),
            investmentId: editForm.investmentId || undefined,
            investmentName: editForm.investmentName || undefined,
          }
        : item
    ));
    handleCancelEdit();
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar este movimiento?')) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSave = () => {
    onSave(items);
    onClose();
  };

  const handleCancel = () => {
    setItems([...movements]);
    handleCancelAdd();
    handleCancelEdit();
    onClose();
  };

  // Calculate totals
  const totalCargos = items
    .filter(item => item.tipo === 'CARGO')
    .reduce((sum, item) => sum + item.monto, 0);
  
  const totalAbonos = items
    .filter(item => item.tipo === 'ABONO')
    .reduce((sum, item) => sum + item.monto, 0);

  const balance = totalCargos - totalAbonos;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 600 }}>
        Movimientos - {debtName}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="100">Fecha</TableCell>
                <TableCell width="120">Tipo</TableCell>
                <TableCell>Concepto</TableCell>
                <TableCell width="130" align="right">Monto</TableCell>
                <TableCell width="200">Inversión</TableCell>
                <TableCell width="120" align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Inline Add Row */}
              {isAdding ? (
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      fullWidth
                      value={newForm.fecha}
                      onChange={(e) => setNewForm({ ...newForm, fecha: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      fullWidth
                      value={newForm.tipo}
                      onChange={(e) => setNewForm({ ...newForm, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                    >
                      <MenuItem value="CARGO">CARGO</MenuItem>
                      <MenuItem value="ABONO">ABONO</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Concepto..."
                      value={newForm.concepto}
                      onChange={(e) => setNewForm({ ...newForm, concepto: e.target.value })}
                      autoFocus
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      placeholder="0.00"
                      value={newForm.monto}
                      onChange={(e) => setNewForm({ ...newForm, monto: e.target.value })}
                      inputProps={{ step: 0.01, min: 0 }}
                    />
                  </TableCell>
                  <TableCell>
                    {newForm.tipo === 'ABONO' ? (
                      <Autocomplete
                        size="small"
                        options={investments}
                        getOptionLabel={(option) => option.concept}
                        value={investments.find(inv => inv.id === newForm.investmentId) || null}
                        onChange={(_, newValue) => {
                          setNewForm({
                            ...newForm,
                            investmentId: newValue?.id || '',
                            investmentName: newValue?.concept || '',
                          });
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Seleccionar..."
                          />
                        )}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">---</Typography>
                    )}
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
                  <TableCell colSpan={6} align="center" sx={{ py: 1 }}>
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

              {/* Empty State */}
              {items.length === 0 && !isAdding && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No hay movimientos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}

              {/* Data Rows */}
              {items
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                .map((item) => (
                  editingId === item.id ? (
                    // Edit Mode
                    <TableRow key={item.id} sx={{ bgcolor: 'action.selected' }}>
                      <TableCell>
                        <TextField
                          type="date"
                          size="small"
                          fullWidth
                          value={editForm.fecha}
                          onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={editForm.tipo}
                          onChange={(e) => setEditForm({ ...editForm, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                        >
                          <MenuItem value="CARGO">CARGO</MenuItem>
                          <MenuItem value="ABONO">ABONO</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          fullWidth
                          value={editForm.concepto}
                          onChange={(e) => setEditForm({ ...editForm, concepto: e.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          fullWidth
                          value={editForm.monto}
                          onChange={(e) => setEditForm({ ...editForm, monto: e.target.value })}
                          inputProps={{ step: 0.01, min: 0 }}
                        />
                      </TableCell>
                      <TableCell>
                        {editForm.tipo === 'ABONO' ? (
                          <Autocomplete
                            size="small"
                            options={investments}
                            getOptionLabel={(option) => option.concept}
                            value={investments.find(inv => inv.id === editForm.investmentId) || null}
                            onChange={(_, newValue) => {
                              setEditForm({
                                ...editForm,
                                investmentId: newValue?.id || '',
                                investmentName: newValue?.concept || '',
                              });
                            }}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Seleccionar..."
                              />
                            )}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">---</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Guardar">
                          <IconButton size="small" onClick={() => handleSaveEdit(item.id)} color="success">
                            <CheckIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton size="small" onClick={handleCancelEdit} color="error">
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // View Mode
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.tipo}
                          size="small"
                          color={item.tipo === 'CARGO' ? 'error' : 'success'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{item.concepto}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color={item.tipo === 'CARGO' ? 'error.main' : 'success.main'}
                        >
                          {item.tipo === 'CARGO' ? '+' : '-'}{formatCurrency(item.monto)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {item.investmentName ? (
                          <Chip
                            label={item.investmentName}
                            size="small"
                            variant="outlined"
                            color="primary"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">---</Typography>
                        )}
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
                    </TableRow>
                  )
                ))}

              {/* Summary Row */}
              {items.length > 0 && (
                <TableRow sx={{ bgcolor: balance > 0 ? 'error.50' : 'success.50', borderTop: 2, borderColor: 'divider' }}>
                  <TableCell colSpan={2}>
                    <Typography fontWeight={700}>Resumen</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Cargos:</Typography>
                        <Typography variant="body2" fontWeight={600} color="error.main">
                          +{formatCurrency(totalCargos)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Abonos:</Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          -{formatCurrency(totalAbonos)}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" colSpan={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">Saldo Pendiente:</Typography>
                      <Typography variant="h6" fontWeight={700} color={balance > 0 ? 'error.main' : 'success.main'}>
                        {formatCurrency(balance)}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
}
