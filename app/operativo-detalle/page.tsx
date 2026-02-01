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
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { Stack } from '@mui/material';
import { useOperative } from '@/hooks/useOperative';
import { getCPCMovements, saveCPCMovements, getClients, getOperative, saveOperative, getCuentas, saveCuentas } from '@/lib/storage';
import { CPCMovement, Client, Operative, Cuenta } from '@/lib/types';
import { formatCurrency, calculateProfitLoss, calculateAccumulated } from '@/lib/calculations';

export default function OperativoDetallePage() {
  const { operative: loadedOperative, loading: loadingOperative, refresh: refreshOperative } = useOperative();
  const [operative, setOperative] = useState<any[]>([]);
  const [movements, setMovements] = useState<CPCMovement[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [selectedCPC, setSelectedCPC] = useState<string>('');
  const [selectedOperative, setSelectedOperative] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [operativeModalOpen, setOperativeModalOpen] = useState(false);
  const [cuentaModalOpen, setCuentaModalOpen] = useState(false);

  // Form data for inline add
  const [addingForClient, setAddingForClient] = useState<string | null>(null);
  const [addingNewClient, setAddingNewClient] = useState(false);
  const [editingMovementId, setEditingMovementId] = useState<string | null>(null);
  const [newMovementForm, setNewMovementForm] = useState({
    clientName: '',
    tipo: 'CARGO' as 'CARGO' | 'ABONO',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    cuentaId: '',
  });
  const [editMovementForm, setEditMovementForm] = useState({
    tipo: 'CARGO' as 'CARGO' | 'ABONO',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    concepto: '',
    cuentaId: '',
  });
  const [cuentaForm, setCuentaForm] = useState({
    nombre: '',
    descripcion: '',
  });

  const [operativeForm, setOperativeForm] = useState({
    concept: '',
    previousValue: 0,
    currentValue: 0,
    income: 0,
  });

  // Cuenta editing state
  const [editingCuentaId, setEditingCuentaId] = useState<string | null>(null);
  const [editingCuentaForm, setEditingCuentaForm] = useState({
    nombre: '',
    descripcion: '',
  });
  const [cuentaFilter, setCuentaFilter] = useState('');
  const [cuentaStatusFilter, setCuentaStatusFilter] = useState<'TODAS' | 'ACTIVA' | 'INACTIVA'>('ACTIVA');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load data
  useEffect(() => {
    if (!loadingOperative) {
      const loadedMovements = getCPCMovements();
      const loadedClients = getClients();
      const loadedCuentas = getCuentas();
      const ops = getOperative();
      setMovements(loadedMovements);
      setClients(loadedClients);
      setCuentas(loadedCuentas);
      setOperative(ops);
      
      if (ops.length > 0 && !selectedCPC) {
        setSelectedCPC(ops[0].concept);
      }
      setLoading(false);
    }
  }, [loadingOperative, selectedCPC]);

  // ESC key to cancel editing/adding
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (addingForClient || addingNewClient || editingMovementId) {
          handleCancelAdd();
          handleCancelEdit();
        }
        if (editingCuentaId) {
          handleCancelEditCuenta();
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [addingForClient, addingNewClient, editingMovementId, editingCuentaId]);

  const filteredMovements = movements.filter(m => m.cpcName === selectedCPC);
  
  // Group movements by client
  const clientGroups = filteredMovements.reduce((acc, movement) => {
    if (!acc[movement.clientName]) {
      acc[movement.clientName] = [];
    }
    acc[movement.clientName].push(movement);
    return acc;
  }, {} as Record<string, CPCMovement[]>);

  // Calculate totals per client
  const clientTotals = Object.entries(clientGroups).map(([clientName, movs]) => {
    const cargo = movs.filter(m => m.tipo === 'CARGO').reduce((s, m) => s + m.monto, 0);
    const abono = movs.filter(m => m.tipo === 'ABONO').reduce((s, m) => s + m.monto, 0);
    return {
      clientName,
      cargo,
      abono,
      falta: cargo - abono,
      movements: movs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()),
    };
  });

  // Calculate grand totals
  const totalCargo = filteredMovements
    .filter(m => m.tipo === 'CARGO')
    .reduce((sum, m) => sum + m.monto, 0);
  
  const totalAbono = filteredMovements
    .filter(m => m.tipo === 'ABONO')
    .reduce((sum, m) => sum + m.monto, 0);
  
  const balance = totalCargo - totalAbono;

  // Handlers
  const handleStartAddMovement = (clientName: string) => {
    setAddingForClient(clientName);
    setAddingNewClient(false);
    setNewMovementForm({
      clientName: '',
      tipo: 'CARGO',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      cuentaId: '',
    });
  };

  const handleStartAddNewClient = () => {
    setAddingNewClient(true);
    setAddingForClient(null);
    setNewMovementForm({
      clientName: '',
      tipo: 'CARGO',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      cuentaId: '',
    });
  };

  const handleCancelAdd = () => {
    setAddingForClient(null);
    setAddingNewClient(false);
    setNewMovementForm({
      clientName: '',
      tipo: 'CARGO',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      cuentaId: '',
    });
  };

  const handleSaveNewMovement = (clientName?: string) => {
    try {
      const finalClientName = clientName || newMovementForm.clientName.trim();
      
      if (!finalClientName) {
        setSnackbar({ open: true, message: 'Ingresa el nombre del cliente', severity: 'error' });
        return;
      }

      const monto = parseFloat(newMovementForm.monto);
      
      if (!monto || monto <= 0) {
        setSnackbar({ open: true, message: 'Ingresa un monto válido', severity: 'error' });
        return;
      }

      const newMovement: CPCMovement = {
        id: `mov-${Date.now()}`,
        clientId: '',
        clientName: finalClientName,
        cpcName: selectedCPC,
        tipo: newMovementForm.tipo,
        monto,
        fecha: new Date(newMovementForm.fecha),
        concepto: newMovementForm.concepto,
        cuentaId: newMovementForm.cuentaId || undefined,
        createdAt: new Date(),
      };
      
      const updatedMovements = [...movements, newMovement];
      setMovements(updatedMovements);
      saveCPCMovements(updatedMovements);
      
      setAddingForClient(null);
      setAddingNewClient(false);
      setNewMovementForm({
        clientName: '',
        tipo: 'CARGO',
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        concepto: '',
        cuentaId: '',
      });
      
      setSnackbar({ open: true, message: 'Movimiento agregado', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };


  const handleEditMovement = (movement: CPCMovement) => {
    setEditingMovementId(movement.id);
    setEditMovementForm({
      tipo: movement.tipo,
      monto: movement.monto.toString(),
      fecha: new Date(movement.fecha).toISOString().split('T')[0],
      concepto: movement.concepto,
      cuentaId: movement.cuentaId || '',
    });
    // Cancel any other add operations
    setAddingForClient(null);
    setAddingNewClient(false);
  };

  const handleCancelEdit = () => {
    setEditingMovementId(null);
    setEditMovementForm({
      tipo: 'CARGO',
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      cuentaId: '',
    });
  };

  const handleSaveEdit = () => {
    try {
      const monto = parseFloat(editMovementForm.monto);
      
      if (!monto || monto <= 0) {
        setSnackbar({ open: true, message: 'Ingresa un monto válido', severity: 'error' });
        return;
      }

      const updatedMovements = movements.map(m =>
        m.id === editingMovementId
          ? {
              ...m,
              tipo: editMovementForm.tipo,
              monto,
              fecha: new Date(editMovementForm.fecha),
              concepto: editMovementForm.concepto,
              cuentaId: editMovementForm.cuentaId || undefined,
            }
          : m
      );
      
      setMovements(updatedMovements);
      saveCPCMovements(updatedMovements);
      setEditingMovementId(null);
      setSnackbar({ open: true, message: 'Movimiento actualizado', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar', severity: 'error' });
    }
  };

  const handleDeleteMovement = (movement: CPCMovement) => {
    if (confirm(`¿Eliminar este movimiento de ${formatCurrency(movement.monto)} (${movement.tipo}) para ${movement.clientName}?`)) {
      const updatedMovements = movements.filter(m => m.id !== movement.id);
      setMovements(updatedMovements);
      saveCPCMovements(updatedMovements);
      setSnackbar({ open: true, message: 'Movimiento eliminado', severity: 'success' });
    }
  };

  // Operative handlers
  const handleAddOperative = () => {
    setSelectedOperative(null);
    setOperativeForm({
      concept: '',
      previousValue: 0,
      currentValue: 0,
      income: 0,
    });
    setOperativeModalOpen(true);
  };

  const handleEditOperative = (op: Operative) => {
    setSelectedOperative(op);
    setOperativeForm({
      concept: op.concept,
      previousValue: op.previousValue,
      currentValue: op.currentValue,
      income: op.income,
    });
    setOperativeModalOpen(true);
  };

  const handleSaveOperative = () => {
    try {
      if (!operativeForm.concept.trim()) {
        setSnackbar({ open: true, message: 'El concepto es requerido', severity: 'error' });
        return;
      }

      if (selectedOperative) {
        // Update existing
        const profitLoss = calculateProfitLoss(operativeForm.previousValue, operativeForm.currentValue);
        const accumulated = calculateAccumulated(operativeForm.currentValue, operativeForm.income);
        
        const updatedOperative = operative.map(op =>
          op.id === selectedOperative.id
            ? {
                ...op,
                concept: operativeForm.concept,
                previousValue: operativeForm.previousValue,
                currentValue: operativeForm.currentValue,
                income: operativeForm.income,
                profitLoss,
                accumulated,
                updatedAt: new Date(),
              }
            : op
        );
        setOperative(updatedOperative);
        saveOperative(updatedOperative);
        
        // Update selected CPC if name changed
        if (selectedCPC === selectedOperative.concept) {
          setSelectedCPC(operativeForm.concept);
        }
      } else {
        // Add new
        const profitLoss = calculateProfitLoss(operativeForm.previousValue, operativeForm.currentValue);
        const accumulated = calculateAccumulated(operativeForm.currentValue, operativeForm.income);
        
        const newOperative: Operative = {
          id: `op-${Date.now()}`,
          concept: operativeForm.concept,
          previousValue: operativeForm.previousValue,
          currentValue: operativeForm.currentValue,
          income: operativeForm.income,
          profitLoss,
          accumulated,
          type: 'CPC',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const updatedOperative = [...operative, newOperative];
        setOperative(updatedOperative);
        saveOperative(updatedOperative);
        setSelectedCPC(newOperative.concept);
      }

      setOperativeModalOpen(false);
      setSnackbar({ open: true, message: 'Concepto guardado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleDeleteOperative = (id: string) => {
    const op = operative.find(o => o.id === id);
    if (!op) return;

    const hasMovements = movements.filter(m => m.cpcName === op.concept).length > 0;
    
    if (hasMovements) {
      if (!confirm(`El concepto "${op.concept}" tiene movimientos registrados. ¿Eliminar de todas formas? Esto también eliminará todos sus movimientos.`)) {
        return;
      }
      // Delete all movements for this CPC
      const updatedMovements = movements.filter(m => m.cpcName !== op.concept);
      setMovements(updatedMovements);
      saveCPCMovements(updatedMovements);
    } else {
      if (!confirm(`¿Eliminar el concepto "${op.concept}"?`)) {
        return;
      }
    }

    const updatedOperative = operative.filter(o => o.id !== id);
    setOperative(updatedOperative);
    saveOperative(updatedOperative);
    
    if (selectedCPC === op.concept) {
      setSelectedCPC(updatedOperative.length > 0 ? updatedOperative[0].concept : '');
    }
    
    setSnackbar({ open: true, message: 'Concepto eliminado', severity: 'success' });
  };

  // Cuenta handlers
  const handleAddCuenta = () => {
    setCuentaForm({ nombre: '', descripcion: '' });
    setCuentaModalOpen(true);
  };

  const handleSaveCuenta = () => {
    try {
      if (!cuentaForm.nombre.trim()) {
        setSnackbar({ open: true, message: 'El nombre es requerido', severity: 'error' });
        return;
      }

      const newCuenta: Cuenta = {
        id: `cuenta-${Date.now()}`,
        nombre: cuentaForm.nombre,
        descripcion: cuentaForm.descripcion,
        status: 'ACTIVA',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCuentas = [...cuentas, newCuenta];
      setCuentas(updatedCuentas);
      saveCuentas(updatedCuentas);
      setCuentaModalOpen(false);
      setSnackbar({ open: true, message: 'Cuenta creada', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleToggleCuentaStatus = (id: string) => {
    const cuenta = cuentas.find(c => c.id === id);
    if (!cuenta) return;

    const newStatus = cuenta.status === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    
    const updatedCuentas = cuentas.map(c =>
      c.id === id
        ? { 
            ...c, 
            status: newStatus as 'ACTIVA' | 'INACTIVA',
            updatedAt: new Date() 
          }
        : c
    );
    setCuentas(updatedCuentas);
    saveCuentas(updatedCuentas);
    setSnackbar({ open: true, message: `Cuenta ${newStatus === 'INACTIVA' ? 'cerrada' : 'reactivada'}`, severity: 'success' });
  };

  const handleStartEditCuenta = (cuenta: Cuenta) => {
    setEditingCuentaId(cuenta.id);
    setEditingCuentaForm({
      nombre: cuenta.nombre,
      descripcion: cuenta.descripcion || '',
    });
  };

  const handleCancelEditCuenta = () => {
    setEditingCuentaId(null);
    setEditingCuentaForm({ nombre: '', descripcion: '' });
  };

  const handleUpdateCuenta = (id: string) => {
    if (!editingCuentaForm.nombre.trim()) {
      setSnackbar({ open: true, message: 'El nombre es requerido', severity: 'error' });
      return;
    }

    const updatedCuentas = cuentas.map(c =>
      c.id === id
        ? { 
            ...c, 
            nombre: editingCuentaForm.nombre,
            descripcion: editingCuentaForm.descripcion,
            updatedAt: new Date() 
          }
        : c
    );
    setCuentas(updatedCuentas);
    saveCuentas(updatedCuentas);
    setEditingCuentaId(null);
    setEditingCuentaForm({ nombre: '', descripcion: '' });
    setSnackbar({ open: true, message: 'Cuenta actualizada', severity: 'success' });
  };

  const handleDeleteCuenta = (id: string) => {
    // Check if cuenta has movements assigned
    const hasMovements = movements.some(m => m.cuentaId === id);
    
    if (hasMovements) {
      setSnackbar({ 
        open: true, 
        message: 'No se puede eliminar una cuenta con movimientos asignados', 
        severity: 'error' 
      });
      return;
    }

    if (confirm('¿Estás seguro de eliminar esta cuenta?')) {
      const updatedCuentas = cuentas.filter(c => c.id !== id);
      setCuentas(updatedCuentas);
      saveCuentas(updatedCuentas);
      setSnackbar({ open: true, message: 'Cuenta eliminada', severity: 'success' });
    }
  };

  const handleChangeCuenta = (movementId: string, cuentaId: string) => {
    const updatedMovements = movements.map(m =>
      m.id === movementId
        ? { ...m, cuentaId: cuentaId || undefined }
        : m
    );
    setMovements(updatedMovements);
    saveCPCMovements(updatedMovements);
  };

  // Calculate totals per cuenta
  const cuentaTotals = cuentas.map(cuenta => {
    const movs = movements.filter(m => m.cuentaId === cuenta.id);
    return {
      ...cuenta,
      total: movs.reduce((sum, m) => sum + m.monto, 0),
      count: movs.length,
    };
  });

  // Filter cuentas
  const filteredCuentaTotals = cuentaTotals.filter(cuenta => {
    // Filter by status
    if (cuentaStatusFilter !== 'TODAS' && cuenta.status !== cuentaStatusFilter) {
      return false;
    }
    
    // Filter by search text
    if (!cuentaFilter.trim()) return true;
    const search = cuentaFilter.toLowerCase();
    return (
      cuenta.nombre.toLowerCase().includes(search) ||
      (cuenta.descripcion || '').toLowerCase().includes(search)
    );
  });

  if (loading || loadingOperative) {
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
          borderColor: 'secondary.main',
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Operativo - Detalle de Clientes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Control de Cargos y Abonos por Cliente
        </Typography>
      </Paper>

      {/* Three Column Layout */}
      <Grid container spacing={3}>
        {/* LEFT: CPC List */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  Conceptos de Operativo
                </Typography>
                <Tooltip title="Nuevo concepto">
                  <IconButton size="small" onClick={handleAddOperative} color="secondary">
                    <AddIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {operative.length} CPC activos
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {operative.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <BusinessIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary">
                    No hay conceptos de operativo
                  </Typography>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {operative.map((op, index) => {
                    const opMovements = movements.filter(m => m.cpcName === op.concept);
                    const opCargo = opMovements.filter(m => m.tipo === 'CARGO').reduce((s, m) => s + m.monto, 0);
                    const opAbono = opMovements.filter(m => m.tipo === 'ABONO').reduce((s, m) => s + m.monto, 0);
                    const opBalance = opCargo - opAbono;

                    return (
                      <Box key={op.id}>
                        <ListItem
                          disablePadding
                          secondaryAction={
                            <Box>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditOperative(op);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteOperative(op.id);
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        >
                          <ListItemButton
                            selected={selectedCPC === op.concept}
                            onClick={() => setSelectedCPC(op.concept)}
                          >
                            <ListItemText
                              primary={
                                <Typography fontWeight={selectedCPC === op.concept ? 600 : 400}>
                                  {op.concept}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="caption" display="block">
                                    Balance: <strong style={{ color: opBalance > 0 ? '#d32f2f' : '#2e7d32' }}>
                                      {formatCurrency(opBalance)}
                                    </strong>
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {opMovements.length} movimientos
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                        {index < operative.length - 1 && <Divider />}
                      </Box>
                    );
                  })}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* CENTER: Movements Table */}
        <Grid item xs={12} md={6}>
          {selectedCPC ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {selectedCPC}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={`${Object.keys(clientGroups).length} clientes`}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      label={`${filteredMovements.length} movimientos`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>

              {/* Summary Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingUpIcon />
                        <Typography variant="body2" fontWeight={600}>
                          Total Cargos
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {formatCurrency(totalCargo)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <TrendingDownIcon />
                        <Typography variant="body2" fontWeight={600}>
                          Total Abonos
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {formatCurrency(totalAbono)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card sx={{ bgcolor: balance > 0 ? 'warning.light' : 'info.light', color: 'white' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BusinessIcon />
                        <Typography variant="body2" fontWeight={600}>
                          Balance
                        </Typography>
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {formatCurrency(balance)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Movements Table Grouped by Client */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: 180 }}>Cliente</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, width: 100 }}>Falta</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, width: 100 }}>Cargo</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, width: 100 }}>Abono</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 120 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: 120 }}>Cuenta</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Concepto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Add New Client Row */}
                    {addingNewClient ? (
                      <TableRow sx={{ bgcolor: 'action.hover' }}>
                        <TableCell sx={{ width: 180 }}>
                          <Autocomplete
                            size="small"
                            options={clients
                              .filter(c => c.status === 'ACTIVO')
                              .filter(c => !Object.keys(clientGroups).includes(c.name))
                              .map(c => c.name)}
                            value={newMovementForm.clientName || null}
                            onChange={(e, newValue) => setNewMovementForm({ ...newMovementForm, clientName: newValue || '' })}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder="Buscar cliente..."
                                autoFocus
                              />
                            )}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ width: 100 }}></TableCell>
                        <TableCell sx={{ width: 100 }}>
                          <TextField
                            select
                            size="small"
                            value={newMovementForm.tipo}
                            onChange={(e) => setNewMovementForm({ ...newMovementForm, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                            fullWidth
                          >
                            <MenuItem value="CARGO">Cargo</MenuItem>
                            <MenuItem value="ABONO">Abono</MenuItem>
                          </TextField>
                        </TableCell>
                        <TableCell sx={{ width: 100 }}>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="Monto"
                            value={newMovementForm.monto}
                            onChange={(e) => setNewMovementForm({ ...newMovementForm, monto: e.target.value })}
                            fullWidth
                            InputProps={{ inputProps: { step: 0.01 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ width: 120 }}>
                          <TextField
                            size="small"
                            type="date"
                            value={newMovementForm.fecha}
                            onChange={(e) => setNewMovementForm({ ...newMovementForm, fecha: e.target.value })}
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ width: 120 }}>
                          <TextField
                            select
                            size="small"
                            value={newMovementForm.cuentaId}
                            onChange={(e) => setNewMovementForm({ ...newMovementForm, cuentaId: e.target.value })}
                            fullWidth
                            displayEmpty
                          >
                            <MenuItem value="">Sin cuenta</MenuItem>
                            {cuentas
                              .filter(c => c.status === 'ACTIVA')
                              .map(cuenta => (
                                <MenuItem key={cuenta.id} value={cuenta.id}>
                                  {cuenta.nombre}
                                </MenuItem>
                              ))}
                          </TextField>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              size="small"
                              placeholder="Nota/Concepto"
                              value={newMovementForm.concepto}
                              onChange={(e) => setNewMovementForm({ ...newMovementForm, concepto: e.target.value })}
                              sx={{ minWidth: 200, flex: 1 }}
                            />
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleSaveNewMovement()}
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={handleCancelAdd}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<AddIcon />}
                            onClick={handleStartAddNewClient}
                            sx={{ borderStyle: 'dashed' }}
                            disabled={clients.filter(c => c.status === 'ACTIVO' && !Object.keys(clientGroups).includes(c.name)).length === 0}
                          >
                            {clients.filter(c => c.status === 'ACTIVO' && !Object.keys(clientGroups).includes(c.name)).length === 0
                              ? 'Todos los clientes ya tienen movimientos'
                              : 'Agregar Cliente'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}

                    {Object.keys(clientGroups).length === 0 && !addingNewClient ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No hay movimientos registrados
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientTotals.map((client) => (
                        <React.Fragment key={client.clientName}>
                          {/* Client Header Row */}
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                              {client.clientName}
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                fontWeight={700}
                                fontSize="0.95rem"
                                color={client.falta > 0 ? 'error.main' : 'success.main'}
                              >
                                {formatCurrency(client.falta)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700} fontSize="0.95rem" color="error.main">
                                {formatCurrency(client.cargo)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography fontWeight={700} fontSize="0.95rem" color="success.main">
                                {formatCurrency(client.abono)}
                              </Typography>
                            </TableCell>
                            <TableCell colSpan={3}>
                              <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => handleStartAddMovement(client.clientName)}
                                variant="outlined"
                              >
                                Agregar
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Add new movement row (inline) */}
                          {addingForClient === client.clientName && !addingNewClient && (
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                              <TableCell sx={{ width: 180 }}></TableCell>
                              <TableCell sx={{ width: 100 }}></TableCell>
                              <TableCell sx={{ width: 100 }}>
                                <TextField
                                  select
                                  size="small"
                                  value={newMovementForm.tipo}
                                  onChange={(e) => setNewMovementForm({ ...newMovementForm, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                                  fullWidth
                                >
                                  <MenuItem value="CARGO">Cargo</MenuItem>
                                  <MenuItem value="ABONO">Abono</MenuItem>
                                </TextField>
                              </TableCell>
                              <TableCell sx={{ width: 100 }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  placeholder="Monto"
                                  value={newMovementForm.monto}
                                  onChange={(e) => setNewMovementForm({ ...newMovementForm, monto: e.target.value })}
                                  fullWidth
                                  InputProps={{ inputProps: { step: 0.01 } }}
                                  autoFocus
                                />
                              </TableCell>
                              <TableCell sx={{ width: 120 }}>
                                <TextField
                                  size="small"
                                  type="date"
                                  value={newMovementForm.fecha}
                                  onChange={(e) => setNewMovementForm({ ...newMovementForm, fecha: e.target.value })}
                                  fullWidth
                                />
                              </TableCell>
                              <TableCell sx={{ width: 120 }}>
                                <TextField
                                  select
                                  size="small"
                                  value={newMovementForm.cuentaId}
                                  onChange={(e) => setNewMovementForm({ ...newMovementForm, cuentaId: e.target.value })}
                                  fullWidth
                                  displayEmpty
                                >
                                  <MenuItem value="">Sin cuenta</MenuItem>
                                  {cuentas
                                    .filter(c => c.status === 'ACTIVA')
                                    .map(cuenta => (
                                      <MenuItem key={cuenta.id} value={cuenta.id}>
                                        {cuenta.nombre}
                                      </MenuItem>
                                    ))}
                                </TextField>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <TextField
                                    size="small"
                                    placeholder="Nota/Concepto"
                                    value={newMovementForm.concepto}
                                    onChange={(e) => setNewMovementForm({ ...newMovementForm, concepto: e.target.value })}
                                    sx={{ minWidth: 200, flex: 1 }}
                                  />
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleSaveNewMovement(client.clientName)}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={handleCancelAdd}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          )}

                          {/* Movement Detail Rows */}
                          {client.movements.map((movement, idx) => (
                            editingMovementId === movement.id ? (
                              // Edit mode
                              <TableRow key={movement.id} sx={{ bgcolor: 'action.selected' }}>
                                <TableCell sx={{ pl: 4, width: 180 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {idx + 1}
                                  </Typography>
                                </TableCell>
                                <TableCell sx={{ width: 100 }}></TableCell>
                                <TableCell sx={{ width: 100 }}>
                                  <TextField
                                    select
                                    size="small"
                                    value={editMovementForm.tipo}
                                    onChange={(e) => setEditMovementForm({ ...editMovementForm, tipo: e.target.value as 'CARGO' | 'ABONO' })}
                                    fullWidth
                                  >
                                    <MenuItem value="CARGO">Cargo</MenuItem>
                                    <MenuItem value="ABONO">Abono</MenuItem>
                                  </TextField>
                                </TableCell>
                                <TableCell sx={{ width: 100 }}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={editMovementForm.monto}
                                    onChange={(e) => setEditMovementForm({ ...editMovementForm, monto: e.target.value })}
                                    fullWidth
                                    InputProps={{ inputProps: { step: 0.01 } }}
                                    autoFocus
                                  />
                                </TableCell>
                                <TableCell sx={{ width: 120 }}>
                                  <TextField
                                    size="small"
                                    type="date"
                                    value={editMovementForm.fecha}
                                    onChange={(e) => setEditMovementForm({ ...editMovementForm, fecha: e.target.value })}
                                    fullWidth
                                  />
                                </TableCell>
                                <TableCell sx={{ width: 120 }}>
                                  <TextField
                                    select
                                    size="small"
                                    value={editMovementForm.cuentaId}
                                    onChange={(e) => setEditMovementForm({ ...editMovementForm, cuentaId: e.target.value })}
                                    fullWidth
                                    displayEmpty
                                  >
                                    <MenuItem value="">Sin cuenta</MenuItem>
                                    {cuentas
                                      .filter(c => c.status === 'ACTIVA')
                                      .map(cuenta => (
                                        <MenuItem key={cuenta.id} value={cuenta.id}>
                                          {cuenta.nombre}
                                        </MenuItem>
                                      ))}
                                  </TextField>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                      size="small"
                                      placeholder="Nota/Concepto"
                                      value={editMovementForm.concepto}
                                      onChange={(e) => setEditMovementForm({ ...editMovementForm, concepto: e.target.value })}
                                      sx={{ minWidth: 200, flex: 1 }}
                                    />
                                    <IconButton
                                      size="small"
                                      color="success"
                                      onClick={handleSaveEdit}
                                    >
                                      <AddIcon />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={handleCancelEdit}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ) : (
                              // View mode
                              <TableRow key={movement.id} hover>
                                <TableCell sx={{ pl: 4 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {idx + 1}
                                  </Typography>
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell align="right">
                                  {movement.tipo === 'CARGO' && (
                                    <Typography color="error.main">
                                      {formatCurrency(movement.monto)}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="right">
                                  {movement.tipo === 'ABONO' && (
                                    <Typography color="success.main">
                                      {formatCurrency(movement.monto)}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(movement.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {movement.cuentaId ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <Chip
                                        label={cuentas.find(c => c.id === movement.cuentaId)?.nombre || '-'}
                                        size="small"
                                        color={cuentas.find(c => c.id === movement.cuentaId)?.status === 'ACTIVA' ? 'primary' : 'default'}
                                        variant="outlined"
                                        onDelete={cuentas.find(c => c.id === movement.cuentaId)?.status === 'ACTIVA' ? () => handleChangeCuenta(movement.id, '') : undefined}
                                        sx={{ fontSize: '0.7rem' }}
                                      />
                                    </Box>
                                  ) : (
                                    <Button
                                      size="small"
                                      variant="text"
                                      sx={{
                                        minWidth: 'auto',
                                        p: 0.5,
                                        fontSize: '0.75rem',
                                        textTransform: 'none',
                                        color: 'text.secondary',
                                      }}
                                      onClick={(e) => {
                                        const anchorEl = e.currentTarget;
                                        const menu = document.createElement('div');
                                        // Show menu with available accounts
                                      }}
                                    >
                                      <TextField
                                        select
                                        size="small"
                                        value=""
                                        onChange={(e) => handleChangeCuenta(movement.id, e.target.value)}
                                        displayEmpty
                                        variant="standard"
                                        sx={{
                                          '& .MuiInput-root:before': { borderBottom: 'none' },
                                          '& .MuiInput-root:hover:before': { borderBottom: 'none !important' },
                                          '& .MuiInput-root:after': { borderBottom: 'none' },
                                          '& .MuiSelect-select': {
                                            py: 0,
                                            color: 'text.secondary',
                                            fontSize: '0.75rem',
                                          }
                                        }}
                                        SelectProps={{
                                          displayEmpty: true,
                                          renderValue: () => '+ Asignar',
                                        }}
                                      >
                                        {cuentas
                                          .filter(c => c.status === 'ACTIVA')
                                          .map(cuenta => (
                                            <MenuItem key={cuenta.id} value={cuenta.id}>
                                              <Typography variant="body2">{cuenta.nombre}</Typography>
                                            </MenuItem>
                                          ))}
                                      </TextField>
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {movement.concepto || '-'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditMovement(movement)}
                                        color="primary"
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteMovement(movement)}
                                        color="error"
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            )
                          ))}

                          {/* Spacer */}
                          <TableRow>
                            <TableCell colSpan={7} sx={{ height: 8, p: 0 }} />
                          </TableRow>
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          ) : (
            <Paper sx={{ p: 5, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecciona un concepto de operativo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elige un CPC de la lista para ver y gestionar sus movimientos
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* RIGHT: Cuentas/Cortes Panel */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: 'calc(100vh - 280px)', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight={600}>
                Cuentas / Cortes
              </Typography>
              <IconButton size="small" onClick={handleAddCuenta} color="secondary">
                <AddIcon />
              </IconButton>
            </Box>

            {cuentaTotals.length > 0 && (
              <Stack spacing={1} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Buscar cuenta..."
                  value={cuentaFilter}
                  onChange={(e) => setCuentaFilter(e.target.value)}
                />
                <TextField
                  size="small"
                  fullWidth
                  select
                  value={cuentaStatusFilter}
                  onChange={(e) => setCuentaStatusFilter(e.target.value as 'TODAS' | 'ACTIVA' | 'INACTIVA')}
                >
                  <MenuItem value="ACTIVA">Solo Activas</MenuItem>
                  <MenuItem value="INACTIVA">Solo Inactivas</MenuItem>
                  <MenuItem value="TODAS">Todas</MenuItem>
                </TextField>
              </Stack>
            )}

            {cuentaTotals.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  No hay cuentas creadas
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={handleAddCuenta}
                  sx={{ mt: 1 }}
                >
                  Crear Cuenta
                </Button>
              </Box>
            ) : filteredCuentaTotals.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron cuentas
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {filteredCuentaTotals.map((cuenta) => (
                  <Card
                    key={cuenta.id}
                    variant="outlined"
                    sx={{
                      bgcolor: cuenta.status === 'ACTIVA' ? 'background.paper' : 'action.disabledBackground',
                      borderColor: editingCuentaId === cuenta.id ? 'primary.main' : undefined,
                      borderWidth: editingCuentaId === cuenta.id ? 2 : 1,
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Box 
                          sx={{ 
                            flex: 1,
                            cursor: editingCuentaId !== cuenta.id ? 'pointer' : 'default',
                            '&:hover': editingCuentaId !== cuenta.id ? { opacity: 0.7 } : {},
                          }}
                          onClick={() => editingCuentaId !== cuenta.id && handleStartEditCuenta(cuenta)}
                        >
                          {editingCuentaId === cuenta.id ? (
                            <Stack spacing={1}>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Nombre de la cuenta"
                                value={editingCuentaForm.nombre}
                                onChange={(e) => setEditingCuentaForm({ ...editingCuentaForm, nombre: e.target.value })}
                                autoFocus
                                variant="standard"
                                sx={{ 
                                  '& .MuiInput-root': {
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    '&:before': {
                                      borderBottomColor: 'divider',
                                    },
                                    '&:hover:not(.Mui-disabled):before': {
                                      borderBottomColor: 'text.secondary',
                                    }
                                  }
                                }}
                              />
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Agregar nota..."
                                value={editingCuentaForm.descripcion}
                                onChange={(e) => setEditingCuentaForm({ ...editingCuentaForm, descripcion: e.target.value })}
                                multiline
                                rows={2}
                                variant="standard"
                                sx={{ 
                                  '& .MuiInput-root': {
                                    fontSize: '0.75rem',
                                    '&:before': {
                                      borderBottomColor: 'divider',
                                    },
                                    '&:hover:not(.Mui-disabled):before': {
                                      borderBottomColor: 'text.secondary',
                                    }
                                  }
                                }}
                              />
                            </Stack>
                          ) : (
                            <>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {cuenta.nombre}
                              </Typography>
                              {cuenta.descripcion ? (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                  {cuenta.descripcion}
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                  Sin nota
                                </Typography>
                              )}
                            </>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5, ml: 1 }}>
                          {editingCuentaId !== cuenta.id && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCuenta(cuenta.id);
                              }}
                              sx={{ p: 0.5 }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                          <Chip
                            label={cuenta.status}
                            size="small"
                            color={cuenta.status === 'ACTIVA' ? 'success' : 'default'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleCuentaStatus(cuenta.id);
                            }}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': { opacity: 0.8 }
                            }}
                          />
                        </Box>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" fontWeight={700} color="primary.main">
                            {formatCurrency(cuenta.total)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {cuenta.count} movimiento{cuenta.count !== 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        {editingCuentaId === cuenta.id && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Guardar">
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateCuenta(cuenta.id)}
                                color="success"
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Cancelar">
                              <IconButton
                                size="small"
                                onClick={handleCancelEditCuenta}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Operative Modal */}
      <Dialog open={operativeModalOpen} onClose={() => setOperativeModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedOperative ? 'Editar Concepto' : 'Nuevo Concepto de Operativo'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Concepto / Nombre *"
                value={operativeForm.concept}
                onChange={(e) => setOperativeForm({ ...operativeForm, concept: e.target.value })}
                placeholder="Ej: CPC-TX-2601, CPC-PRESTAMO"
                required
              />
              <TextField
                fullWidth
                label="Valor Anterior"
                type="number"
                value={operativeForm.previousValue}
                onChange={(e) => setOperativeForm({ ...operativeForm, previousValue: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { step: 0.01 } }}
              />
              <TextField
                fullWidth
                label="Valor Actual"
                type="number"
                value={operativeForm.currentValue}
                onChange={(e) => setOperativeForm({ ...operativeForm, currentValue: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { step: 0.01 } }}
              />
              <TextField
                fullWidth
                label="Ingresos"
                type="number"
                value={operativeForm.income}
                onChange={(e) => setOperativeForm({ ...operativeForm, income: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { step: 0.01 } }}
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOperativeModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveOperative} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>


      {/* Cuenta Modal */}
      <Dialog open={cuentaModalOpen} onClose={() => setCuentaModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nueva Cuenta / Corte</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nombre de la Cuenta *"
                value={cuentaForm.nombre}
                onChange={(e) => setCuentaForm({ ...cuentaForm, nombre: e.target.value })}
                placeholder="Ej: Corte 29-Ene, Cuenta Semanal..."
                required
                autoFocus
              />
              <TextField
                fullWidth
                label="Descripción"
                value={cuentaForm.descripcion}
                onChange={(e) => setCuentaForm({ ...cuentaForm, descripcion: e.target.value })}
                multiline
                rows={2}
                placeholder="Opcional: Agrega una descripción o nota"
              />
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCuentaModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveCuenta} variant="contained">
            Crear Cuenta
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
