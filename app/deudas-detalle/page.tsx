'use client';

import { useState, useEffect } from 'react';
import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CreditCard as CreditCardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useDebts } from '@/hooks/useDebts';
import { useInvestments } from '@/hooks/useInvestments';
import { getDebtMovements, saveDebtMovements, getDebts, saveDebts } from '@/lib/storage';
import { DebtMovement, Debt } from '@/lib/types';
import { getTodayLocalInput, dateToLocalInput, dateInputToLocal } from '@/lib/dateUtils';
import { formatCurrency } from '@/lib/calculations';
import { payDebtFromInvestment, removeDebtPaymentFromInvestment } from '@/lib/debtPayment';

export default function DeudasDetallePage() {
  const { debts: loadedDebts, loading: loadingDebts } = useDebts();
  const { investments } = useInvestments();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [movements, setMovements] = useState<DebtMovement[]>([]);
  const [selectedDebt, setSelectedDebt] = useState<string>('');
  const [selectedDebtObj, setSelectedDebtObj] = useState<Debt | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [debtModalOpen, setDebtModalOpen] = useState(false);

  // Form data for inline add
  const [addingNewMovement, setAddingNewMovement] = useState(false);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [newMovementForm, setNewMovementForm] = useState({
    tipo: 'CARGO' as 'CARGO' | 'ABONO',
    monto: '',
    fecha: getTodayLocalInput(),
    concepto: '',
    investmentId: '',
    investmentName: '',
  });
  const [editMovementForm, setEditMovementForm] = useState({
    tipo: 'CARGO' as 'CARGO' | 'ABONO',
    monto: '',
    fecha: getTodayLocalInput(),
    concepto: '',
    investmentId: '',
    investmentName: '',
  });
  const [debtForm, setDebtForm] = useState({
    concept: '',
    limit: 0,
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load data
  useEffect(() => {
    if (!loadingDebts) {
      const loadedMovements = getDebtMovements();
      const dbs = getDebts();
      setMovements(loadedMovements);
      setDebts(dbs);
      
      if (dbs.length > 0 && !selectedDebt) {
        setSelectedDebt(dbs[0].concept);
      }
      setLoading(false);
    }
  }, [loadingDebts, selectedDebt]);

  // ESC key to cancel editing/adding
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (addingNewMovement || editingMovementId) {
          handleCancelAdd();
          handleCancelEdit();
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [addingNewMovement, editingMovementId]);

  // Mostrar TODOS los movimientos (históricos + actuales) de la deuda seleccionada
  const filteredMovements = movements.filter(m => m.debtName === selectedDebt);

  // Calculate totals
  const totalCargo = filteredMovements
    .filter(m => m.tipo === 'CARGO')
    .reduce((sum, m) => sum + m.monto, 0);
  
  const totalAbono = filteredMovements
    .filter(m => m.tipo === 'ABONO')
    .reduce((sum, m) => sum + m.monto, 0);
  
  const balance = totalCargo - totalAbono;

  // Handlers
  const handleStartAddMovement = () => {
    setAddingNewMovement(true);
    setNewMovementForm({
      tipo: 'CARGO',
      monto: '',
      fecha: getTodayLocalInput(),
      concepto: '',
      investmentId: '',
      investmentName: '',
    });
  };

  const handleCancelAdd = () => {
    setAddingNewMovement(false);
    setNewMovementForm({
      tipo: 'CARGO',
      monto: '',
      fecha: getTodayLocalInput(),
      concepto: '',
      investmentId: '',
      investmentName: '',
    });
  };

  const handleSaveAdd = async () => {
    try {
      const monto = parseFloat(newMovementForm.monto);
      
      if (!monto || monto <= 0) {
        setSnackbar({ open: true, message: 'Ingresa un monto válido', severity: 'error' });
        return;
      }

      const newMovement: DebtMovement = {
        id: `debt-mov-${Date.now()}`,
        debtId: selectedDebtObj?.id || '',
        debtName: selectedDebt,
        tipo: newMovementForm.tipo,
        monto,
        fecha: dateInputToLocal(newMovementForm.fecha),
        concepto: newMovementForm.concepto,
        investmentId: newMovementForm.investmentId || undefined,
        investmentName: newMovementForm.investmentName || undefined,
        createdAt: new Date(),
      };

      // Si es un abono desde inversión, crear cargo en la inversión
      if (newMovementForm.tipo === 'ABONO' && newMovementForm.investmentId) {
        const result = payDebtFromInvestment(
          selectedDebt,
          newMovementForm.investmentId,
          monto,
          undefined
        );

        if (result.success && result.newCargoId) {
          newMovement.cargoIncomeId = result.newCargoId;
        } else {
          setSnackbar({ open: true, message: `Error al procesar pago: ${result.error}`, severity: 'error' });
          return;
        }
      }
      
      const updatedMovements = [...movements, newMovement];
      setMovements(updatedMovements);
      saveDebtMovements(updatedMovements);
      
      setAddingNewMovement(false);
      setNewMovementForm({
        tipo: 'CARGO',
        monto: '',
        fecha: getTodayLocalInput(),
        concepto: '',
        investmentId: '',
        investmentName: '',
      });
      
      setSnackbar({ open: true, message: 'Movimiento agregado', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleEditMovement = (movement: DebtMovement) => {
    setEditingMovementId(movement.id);
    setEditMovementForm({
      tipo: movement.tipo,
      monto: movement.monto.toString(),
      fecha: dateToLocalInput(movement.fecha),
      concepto: movement.concepto,
      investmentId: movement.investmentId || '',
      investmentName: movement.investmentName || '',
    });
    setAddingNewMovement(false);
  };

  const handleCancelEdit = () => {
    setEditingMovementId(null);
    setEditMovementForm({
      tipo: 'CARGO',
      monto: '',
      fecha: getTodayLocalInput(),
      concepto: '',
      investmentId: '',
      investmentName: '',
    });
  };

  const handleSaveEdit = async () => {
    try {
      const monto = parseFloat(editMovementForm.monto);
      
      if (!monto || monto <= 0) {
        setSnackbar({ open: true, message: 'Ingresa un monto válido', severity: 'error' });
        return;
      }

      const oldMovement = movements.find(m => m.id === editingMovementId);
      const updatedMovements = movements.map(m =>
        m.id === editingMovementId
          ? {
              ...m,
              tipo: editMovementForm.tipo,
              monto,
              fecha: dateInputToLocal(editMovementForm.fecha),
              concepto: editMovementForm.concepto,
              investmentId: editMovementForm.investmentId || undefined,
              investmentName: editMovementForm.investmentName || undefined,
            }
          : m
      );
      
      // Manejar cambios en pago desde inversión
      const movement = updatedMovements.find(m => m.id === editingMovementId);
      if (movement) {
        // Si cambió la inversión y es abono
        if (editMovementForm.tipo === 'ABONO' && editMovementForm.investmentId) {
          // Si cambió la inversión o el monto
          if (oldMovement?.investmentId !== editMovementForm.investmentId || 
              oldMovement?.monto !== monto) {
            
            // Eliminar cargo anterior si existe
            if (oldMovement?.cargoIncomeId && oldMovement?.investmentId) {
              removeDebtPaymentFromInvestment(
                oldMovement.cargoIncomeId,
                oldMovement.investmentId
              );
            }

            // Crear nuevo cargo
            const result = payDebtFromInvestment(
              selectedDebt,
              editMovementForm.investmentId,
              monto,
              undefined
            );

            if (result.success && result.newCargoId) {
              movement.cargoIncomeId = result.newCargoId;
            }
          }
        }
        // Si ya no es abono o ya no tiene inversión, eliminar cargo
        else if (oldMovement?.cargoIncomeId && oldMovement?.investmentId) {
          removeDebtPaymentFromInvestment(
            oldMovement.cargoIncomeId,
            oldMovement.investmentId
          );
          movement.cargoIncomeId = undefined;
        }
      }
      
      setMovements(updatedMovements);
      saveDebtMovements(updatedMovements);
      setEditingMovementId(null);
      setSnackbar({ open: true, message: 'Movimiento actualizado', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar', severity: 'error' });
    }
  };

  const handleDeleteMovement = (movement: DebtMovement) => {
    if (confirm(`¿Eliminar este movimiento de ${formatCurrency(movement.monto)} (${movement.tipo})?`)) {
      // Si tiene cargo en inversión, eliminarlo
      if (movement.cargoIncomeId && movement.investmentId) {
        removeDebtPaymentFromInvestment(
          movement.cargoIncomeId,
          movement.investmentId
        );
      }

      const updatedMovements = movements.filter(m => m.id !== movement.id);
      setMovements(updatedMovements);
      saveDebtMovements(updatedMovements);
      setSnackbar({ open: true, message: 'Movimiento eliminado', severity: 'success' });
    }
  };

  // Debt handlers
  const handleAddDebt = () => {
    setSelectedDebtObj(null);
    setDebtForm({
      concept: '',
      limit: 0,
    });
    setDebtModalOpen(true);
  };

  const handleSaveDebt = () => {
    try {
      if (!debtForm.concept.trim()) {
        setSnackbar({ open: true, message: 'El concepto es requerido', severity: 'error' });
        return;
      }

      const newDebt: Debt = {
        id: `debt-${Date.now()}`,
        concept: debtForm.concept,
        previousValue: 0,
        currentValue: 0,
        profitLoss: 0,
        limit: debtForm.limit,
        balance: 0,
        type: 'CREDITO',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedDebts = [...debts, newDebt];
      setDebts(updatedDebts);
      saveDebts(updatedDebts);
      setDebtModalOpen(false);
      setSelectedDebt(newDebt.concept);
      setSnackbar({ open: true, message: 'Deuda creada', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleDeleteDebt = (id: string) => {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    const hasMovements = movements.filter(m => m.debtName === debt.concept).length > 0;
    
    if (hasMovements) {
      if (!confirm(`La deuda "${debt.concept}" tiene movimientos registrados. ¿Eliminar de todas formas?`)) {
        return;
      }
      const updatedMovements = movements.filter(m => m.debtName !== debt.concept);
      setMovements(updatedMovements);
      saveDebtMovements(updatedMovements);
    } else {
      if (!confirm(`¿Eliminar la deuda "${debt.concept}"?`)) {
        return;
      }
    }

    const updatedDebts = debts.filter(d => d.id !== id);
    setDebts(updatedDebts);
    saveDebts(updatedDebts);
    
    if (selectedDebt === debt.concept) {
      setSelectedDebt(updatedDebts.length > 0 ? updatedDebts[0].concept : '');
    }
    
    setSnackbar({ open: true, message: 'Deuda eliminada', severity: 'success' });
  };

  // Update selectedDebtObj when selectedDebt changes
  useEffect(() => {
    const debt = debts.find(d => d.concept === selectedDebt);
    setSelectedDebtObj(debt || null);
  }, [selectedDebt, debts]);

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
          borderColor: 'error.main',
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Deudas - Detalle de Movimientos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Control de Cargos y Pagos de Deudas
        </Typography>
      </Paper>

      {/* Three Column Layout */}
      <Grid container spacing={3}>
        {/* LEFT: Debt List */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper sx={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Conceptos de Deudas
                </Typography>
                <Tooltip title="Nueva deuda">
                  <IconButton size="small" onClick={handleAddDebt} color="error">
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {debts.length} deudas activas
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {debts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    No hay deudas registradas
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddDebt}
                    sx={{ mt: 1 }}
                  >
                    Agregar primera deuda
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {debts.map((debt) => {
                    const debtMovements = movements.filter(m => m.debtName === debt.concept);
                    const debtCargo = debtMovements
                      .filter(m => m.tipo === 'CARGO')
                      .reduce((s, m) => s + m.monto, 0);
                    const debtAbono = debtMovements
                      .filter(m => m.tipo === 'ABONO')
                      .reduce((s, m) => s + m.monto, 0);
                    const debtBalance = debtCargo - debtAbono;

                    return (
                      <React.Fragment key={debt.id}>
                        <ListItemButton
                          selected={selectedDebt === debt.concept}
                          onClick={() => setSelectedDebt(debt.concept)}
                          sx={{
                            '&.Mui-selected': {
                              bgcolor: 'action.selected',
                              '&:hover': { bgcolor: 'action.hover' },
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography fontWeight={selectedDebt === debt.concept ? 600 : 400}>
                                {debt.concept}
                              </Typography>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  Saldo: <strong style={{ color: debtBalance > 0 ? '#d32f2f' : '#2e7d32' }}>
                                    {formatCurrency(debtBalance)}
                                  </strong>
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {debtMovements.length} movimientos
                                </Typography>
                              </React.Fragment>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                          />
                        </ListItemButton>
                        <Divider />
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </Box>

            {selectedDebtObj && (
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteDebt(selectedDebtObj.id)}
                  fullWidth
                >
                  Eliminar Deuda
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* CENTER: Movements Table */}
        <Grid size={{ xs: 12, md: 9 }}>
          {!selectedDebt ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CreditCardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Selecciona una deuda para ver sus movimientos
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3, p: 2 }}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="caption">Total Cargos (Deuda)</Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {formatCurrency(totalCargo)}
                      </Typography>
                      <Typography variant="caption">
                        {filteredMovements.filter(m => m.tipo === 'CARGO').length} movimientos
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="caption">Total Abonos (Pagos)</Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {formatCurrency(totalAbono)}
                      </Typography>
                      <Typography variant="caption">
                        {filteredMovements.filter(m => m.tipo === 'ABONO').length} movimientos
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card sx={{ bgcolor: balance > 0 ? 'warning.light' : 'info.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="caption">Saldo Pendiente</Typography>
                      <Typography variant="h5" fontWeight={700}>
                        {formatCurrency(balance)}
                      </Typography>
                      <Typography variant="caption">
                        {balance > 0 ? 'Pendiente de pago' : 'Pagado'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Movements Table */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2 }}>
                <TableContainer>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Concepto</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Inversión Pago</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Inline Add Row */}
                      {addingNewMovement && (
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                          <TableCell>
                            <TextField
                              type="date"
                              size="small"
                              value={newMovementForm.fecha}
                              onChange={(e) => setNewMovementForm({ ...newMovementForm, fecha: e.target.value })}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              value={newMovementForm.tipo}
                              onChange={(e) => setNewMovementForm({ ...newMovementForm, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                              fullWidth
                            >
                              <MenuItem value="CARGO">Cargo (+ Deuda)</MenuItem>
                              <MenuItem value="ABONO">Abono (Pago)</MenuItem>
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              placeholder="Concepto..."
                              value={newMovementForm.concepto}
                              onChange={(e) => setNewMovementForm({ ...newMovementForm, concepto: e.target.value })}
                              fullWidth
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              placeholder="0.00"
                              value={newMovementForm.monto}
                              onChange={(e) => setNewMovementForm({ ...newMovementForm, monto: e.target.value })}
                              fullWidth
                              inputProps={{ step: 0.01, min: 0 }}
                            />
                          </TableCell>
                          <TableCell>
                            {newMovementForm.tipo === 'ABONO' && (
                              <Autocomplete
                                size="small"
                                options={investments}
                                getOptionLabel={(option) => option.concept}
                                value={investments.find(inv => inv.id === newMovementForm.investmentId) || null}
                                onChange={(_, newValue) => {
                                  setNewMovementForm({
                                    ...newMovementForm,
                                    investmentId: newValue?.id || '',
                                    investmentName: newValue?.concept || '',
                                  });
                                }}
                                renderInput={(params) => (
                                  <TextField {...params} placeholder="Inversión..." />
                                )}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <IconButton size="small" color="success" onClick={handleSaveAdd}>
                              <AddIcon />
                            </IconButton>
                            <IconButton size="small" onClick={handleCancelAdd}>
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )}

                      {/* Existing Movements */}
                      {filteredMovements
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                        .map((movement) => {
                          const isEditing = editingMovementId === movement.id;

                          if (isEditing) {
                            return (
                              <TableRow key={movement.id} sx={{ bgcolor: 'action.selected' }}>
                                <TableCell>
                                  <TextField
                                    type="date"
                                    size="small"
                                    value={editMovementForm.fecha}
                                    onChange={(e) => setEditMovementForm({ ...editMovementForm, fecha: e.target.value })}
                                    fullWidth
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    select
                                    size="small"
                                    value={editMovementForm.tipo}
                                    onChange={(e) => setEditMovementForm({ ...editMovementForm, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                                    fullWidth
                                  >
                                    <MenuItem value="CARGO">Cargo (+ Deuda)</MenuItem>
                                    <MenuItem value="ABONO">Abono (Pago)</MenuItem>
                                  </TextField>
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    size="small"
                                    value={editMovementForm.concepto}
                                    onChange={(e) => setEditMovementForm({ ...editMovementForm, concepto: e.target.value })}
                                    fullWidth
                                  />
                                </TableCell>
                                <TableCell>
                                  <TextField
                                    type="number"
                                    size="small"
                                    value={editMovementForm.monto}
                                    onChange={(e) => setEditMovementForm({ ...editMovementForm, monto: e.target.value })}
                                    fullWidth
                                    inputProps={{ step: 0.01, min: 0 }}
                                  />
                                </TableCell>
                                <TableCell>
                                  {editMovementForm.tipo === 'ABONO' && (
                                    <Autocomplete
                                      size="small"
                                      options={investments}
                                      getOptionLabel={(option) => option.concept}
                                      value={investments.find(inv => inv.id === editMovementForm.investmentId) || null}
                                      onChange={(_, newValue) => {
                                        setEditMovementForm({
                                          ...editMovementForm,
                                          investmentId: newValue?.id || '',
                                          investmentName: newValue?.concept || '',
                                        });
                                      }}
                                      renderInput={(params) => (
                                        <TextField {...params} placeholder="Inversión..." />
                                      )}
                                    />
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  <IconButton size="small" color="success" onClick={handleSaveEdit}>
                                    <AddIcon />
                                  </IconButton>
                                  <IconButton size="small" onClick={handleCancelEdit}>
                                    <DeleteIcon />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return (
                            <TableRow key={movement.id} hover>
                              <TableCell>
                                {new Date(movement.fecha).toLocaleDateString('es-MX')}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={movement.tipo}
                                  size="small"
                                  color={movement.tipo === 'CARGO' ? 'error' : 'success'}
                                />
                              </TableCell>
                              <TableCell>{movement.concepto || '---'}</TableCell>
                              <TableCell align="right">
                                <Typography
                                  fontWeight={600}
                                  color={movement.tipo === 'CARGO' ? 'error' : 'success.main'}
                                >
                                  {movement.tipo === 'CARGO' ? '+' : '-'}
                                  {formatCurrency(movement.monto)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {movement.investmentName ? (
                                  <Chip
                                    label={movement.investmentName}
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                  />
                                ) : '---'}
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditMovement(movement)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteMovement(movement)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}

                      {filteredMovements.length === 0 && !addingNewMovement && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                              No hay movimientos registrados
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* Add Movement Button */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
                {!addingNewMovement && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleStartAddMovement}
                    fullWidth
                    variant="outlined"
                  >
                    Agregar Movimiento
                  </Button>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Debt Modal */}
      <Dialog open={debtModalOpen} onClose={() => setDebtModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Deuda</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Concepto / Nombre *"
                value={debtForm.concept}
                onChange={(e) => setDebtForm({ ...debtForm, concept: e.target.value })}
                placeholder="Ej: Tarjeta BBVA, Préstamo Personal"
                required
              />
              <TextField
                fullWidth
                label="Límite de Crédito"
                type="number"
                value={debtForm.limit}
                onChange={(e) => setDebtForm({ ...debtForm, limit: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { step: 0.01 } }}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDebtModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveDebt} variant="contained">
            Crear
          </Button>
        </DialogActions>
      </Dialog>

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
