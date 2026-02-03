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
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Stack } from '@mui/material';
import { useOperative } from '@/hooks/useOperative';
import { useInvestments } from '@/hooks/useInvestments';
import { getCPCMovements, saveCPCMovements, getClients, getOperative, saveOperative, getCuentas, saveCuentas, getInvestments, saveInvestments } from '@/lib/storage';
import { CPCMovement, Client, Operative, Cuenta, OperativoCut } from '@/lib/types';
import { formatCurrency, calculateProfitLoss, updateInvestmentCalculations } from '@/lib/calculations';
import { transferCuentaToInvestment } from '@/lib/cuentaTransfer';
import { getMovementsForOperativeById, calculateOperativeTotalsById, calculateIncomeItemsTotals } from '@/lib/operativeCalculations';
import { getTodayLocalInput, dateToLocalInput, dateInputToLocal } from '@/lib/dateUtils';

export default function OperativoDetallePage() {
  const { operative: loadedOperative, loading: loadingOperative } = useOperative();
  const { investments, updateInvestment } = useInvestments();
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
    fecha: getTodayLocalInput(),
    concepto: '',
    cuentaId: '',
  });
  const [editMovementForm, setEditMovementForm] = useState({
    tipo: 'CARGO' as 'CARGO' | 'ABONO',
    monto: '',
    fecha: getTodayLocalInput(),
    concepto: '',
    cuentaId: '',
  });
  const [cuentaForm, setCuentaForm] = useState({
    nombre: '',
    descripcion: '',
    operativeId: '',
    operativeName: '',
    investmentId: '',
    investmentName: '',
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
    operativeId: '',
    operativeName: '',
    investmentId: '',
    investmentName: '',
  });
  const [cuentaFilter, setCuentaFilter] = useState('');
  const [cuentaStatusFilter, setCuentaStatusFilter] = useState<'TODAS' | 'ACTIVA' | 'CERRADA'>('ACTIVA');

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load data ONCE on mount
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingOperative]); // Removed selectedCPC to prevent reloading on concept change

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

  // Obtener el concepto operativo seleccionado para usar su ID
  const currentOperative = operative.find(op => op.concept === selectedCPC);
  const filteredMovements = currentOperative 
    ? getMovementsForOperativeById(currentOperative.id, currentOperative.concept, movements, cuentas)
    : movements.filter(m => m.cpcName === selectedCPC);
  
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

  // Calculate grand totals (movimientos + ajustes)
  const incomeTotals = calculateIncomeItemsTotals(currentOperative?.incomeItems);
  const totalCargo = filteredMovements
    .filter(m => m.tipo === 'CARGO')
    .reduce((sum, m) => sum + m.monto, 0) + incomeTotals.totalCargos;
  
  const totalAbono = filteredMovements
    .filter(m => m.tipo === 'ABONO')
    .reduce((sum, m) => sum + m.monto, 0) + incomeTotals.totalAbonos;
  
  const balance = totalCargo - totalAbono;

  // Helper function to sync cuenta income with linked investment AND operative
  const syncCuentaIncome = (cuentaId: string, updatedMovements?: CPCMovement[]) => {
    const cuenta = cuentas.find(c => c.id === cuentaId);
    if (!cuenta || !cuenta.investmentId || !cuenta.transferredIncomeId) {
      return; // No hay inversión vinculada
    }
    const sourceMovements = updatedMovements || movements;

    // Calcular el total actual de la cuenta
    const cuentaTotal = sourceMovements
      .filter(m => m.cuentaId === cuentaId)
      .reduce((sum, m) => {
        return m.tipo === 'ABONO' ? sum + m.monto : sum - m.monto;
      }, 0);

    // 1. Actualizar el ingreso en la inversión
    let allInvestments = getInvestments();
    const targetInvIndex = allInvestments.findIndex(inv => inv.id === cuenta.investmentId);
    
    if (targetInvIndex !== -1) {
      const targetInv = allInvestments[targetInvIndex];
      
      // Actualizar el monto del ingreso existente
      const updatedIncomeItems = (targetInv.incomeItems || []).map(item =>
        item.id === cuenta.transferredIncomeId
          ? { ...item, monto: cuentaTotal }
          : item
      );
      
      // Recalcular el total de ingresos
      const totalIncome = calculateIncomeItemsTotals(updatedIncomeItems).net;
      
      // Usar updateInvestmentCalculations para recalcular correctamente
      const updatedInv = updateInvestmentCalculations(
        {
          ...targetInv,
          incomeItems: updatedIncomeItems,
          income: totalIncome,
        },
        allInvestments
      );
      
      allInvestments[targetInvIndex] = updatedInv;
      
      // Recalcular portfolio percentages de TODAS las inversiones
      const totalAccumulated = allInvestments.reduce((sum, inv) => sum + inv.accumulated, 0);
      allInvestments = allInvestments.map(inv => ({
        ...inv,
        portfolio: totalAccumulated > 0 ? (inv.accumulated / totalAccumulated) * 100 : 0,
      }));
      
      saveInvestments(allInvestments);
    }

    // 2. Actualizar el egreso en el operativo
    if (cuenta.operativeId && cuenta.operativeEgressId) {
      const operatives = getOperative();
      const targetOpIndex = operatives.findIndex(op => op.id === cuenta.operativeId);
      
      if (targetOpIndex !== -1) {
        const targetOp = operatives[targetOpIndex];
        
        // Actualizar el monto del egreso existente
        const updatedIncomeItems = (targetOp.incomeItems || []).map(item =>
          item.id === cuenta.operativeEgressId
            ? { ...item, monto: cuentaTotal }
            : item
        );
        
        // Recalcular el total (CARGO resta, ABONO suma)
        const totalIncome = calculateIncomeItemsTotals(updatedIncomeItems).net;
        
        targetOp.incomeItems = updatedIncomeItems;
        targetOp.income = totalIncome;
        // Balance = Anterior + Actual (sin transferencias)
        targetOp.accumulated = targetOp.previousValue + targetOp.currentValue;
        
        operatives[targetOpIndex] = targetOp;
        saveOperative(operatives);
      }
    }
  };

  // Handlers
  const handleStartAddMovement = (clientName: string) => {
    setAddingForClient(clientName);
    setAddingNewClient(false);
    setNewMovementForm({
      clientName: '',
      tipo: 'CARGO',
      monto: '',
      fecha: getTodayLocalInput(),
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
      fecha: getTodayLocalInput(),
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
      fecha: getTodayLocalInput(),
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
        fecha: dateInputToLocal(newMovementForm.fecha),
        concepto: newMovementForm.concepto,
        cuentaId: newMovementForm.cuentaId || undefined,
        createdAt: new Date(),
      };
      
      const updatedMovements = [...movements, newMovement];
      setMovements(updatedMovements);
      saveCPCMovements(updatedMovements);
      
      // Sync with investment if cuenta is linked
      if (newMovement.cuentaId) {
        syncCuentaIncome(newMovement.cuentaId, updatedMovements);
      }
      
      setAddingForClient(null);
      setAddingNewClient(false);
      setNewMovementForm({
        clientName: '',
        tipo: 'CARGO',
        monto: '',
        fecha: getTodayLocalInput(),
        concepto: '',
        cuentaId: '',
      });
      
      setSnackbar({ open: true, message: 'Movimiento agregado', severity: 'success' });
      
      // Refrescar datos sin recargar la página
      const refreshedMovements = getCPCMovements();
      const refreshedCuentas = getCuentas();
      setMovements(refreshedMovements);
      setCuentas(refreshedCuentas);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };


  const handleEditMovement = (movement: CPCMovement) => {
    setEditingMovementId(movement.id);
    setEditMovementForm({
      tipo: movement.tipo,
      monto: movement.monto.toString(),
      fecha: dateToLocalInput(movement.fecha),
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
      fecha: getTodayLocalInput(),
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

      const oldMovement = movements.find(m => m.id === editingMovementId);
      const updatedMovements = movements.map(m =>
        m.id === editingMovementId
          ? {
              ...m,
              tipo: editMovementForm.tipo,
              monto,
              fecha: dateInputToLocal(editMovementForm.fecha),
              concepto: editMovementForm.concepto,
              cuentaId: editMovementForm.cuentaId || undefined,
            }
          : m
      );
      
      setMovements(updatedMovements);
      saveCPCMovements(updatedMovements);
      
      // Sync with investment if cuenta changed or still linked
      if (editMovementForm.cuentaId) {
        syncCuentaIncome(editMovementForm.cuentaId, updatedMovements);
      }
      // Also sync old cuenta if it changed
      if (oldMovement?.cuentaId && oldMovement.cuentaId !== editMovementForm.cuentaId) {
        syncCuentaIncome(oldMovement.cuentaId, updatedMovements);
      }
      
      setEditingMovementId(null);
      setSnackbar({ open: true, message: 'Movimiento actualizado', severity: 'success' });
      
      // Refrescar datos sin recargar la página
      const refreshedMovements = getCPCMovements();
      const refreshedCuentas = getCuentas();
      setMovements(refreshedMovements);
      setCuentas(refreshedCuentas);
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al actualizar', severity: 'error' });
    }
  };

  const handleDeleteMovement = (movement: CPCMovement) => {
    if (confirm(`¿Eliminar este movimiento de ${formatCurrency(movement.monto)} (${movement.tipo}) para ${movement.clientName}?`)) {
      const updatedMovements = movements.filter(m => m.id !== movement.id);
      setMovements(updatedMovements);
      saveCPCMovements(updatedMovements);
      
      // Sync with investment if movement was linked to cuenta
      if (movement.cuentaId) {
        syncCuentaIncome(movement.cuentaId, updatedMovements);
      }
      
      setSnackbar({ open: true, message: 'Movimiento eliminado', severity: 'success' });
      
      // Refrescar datos sin recargar la página
      const refreshedMovements = getCPCMovements();
      const refreshedCuentas = getCuentas();
      setMovements(refreshedMovements);
      setCuentas(refreshedCuentas);
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
        // Para Operativo: P/M = Anterior - |Actual|
        const profitLoss = operativeForm.previousValue - Math.abs(operativeForm.currentValue);
        // Balance = Anterior + Actual (sin transferencias)
        const accumulated = operativeForm.previousValue + operativeForm.currentValue;
        
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
        // Para Operativo: P/M = Anterior - |Actual|
        const profitLoss = operativeForm.previousValue - Math.abs(operativeForm.currentValue);
        // Balance = Anterior + Actual (sin transferencias)
        const accumulated = operativeForm.previousValue + operativeForm.currentValue;
        
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

    // Obtener movimientos que pertenecen a este concepto (usando ID)
    const opMovements = getMovementsForOperativeById(op.id, op.concept, movements, cuentas);
    const hasMovements = opMovements.length > 0;
    
    if (hasMovements) {
      if (!confirm(`El concepto "${op.concept}" tiene movimientos registrados. ¿Eliminar de todas formas? Esto también eliminará todos sus movimientos.`)) {
        return;
      }
      // Delete all movements for this CPC (usando IDs)
      const movementIdsToDelete = new Set(opMovements.map(m => m.id));
      const updatedMovements = movements.filter(m => !movementIdsToDelete.has(m.id));
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

  // Cut handlers
  // Cuenta handlers
  const handleAddCuenta = () => {
    console.group('➕ AGREGAR CUENTA');
    console.log('🎯 selectedCPC actual:', selectedCPC);
    
    const selectedOp = operative.find(op => op.concept === selectedCPC);
    console.log('🎯 selectedOp encontrado:', selectedOp);
    
    setCuentaForm({ 
      nombre: '', 
      descripcion: '', 
      operativeId: selectedOp?.id || '',
      operativeName: selectedCPC || '',
      investmentId: '', 
      investmentName: '' 
    });
    console.groupEnd();
    setCuentaModalOpen(true);
  };

  const handleSaveCuenta = async () => {
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
        operativeId: cuentaForm.operativeId || undefined,
        operativeName: cuentaForm.operativeName || undefined,
        investmentId: cuentaForm.investmentId || undefined,
        investmentName: cuentaForm.investmentName || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Si tiene inversión vinculada, crear el ingreso y egreso inmediatamente
      if (newCuenta.investmentId && newCuenta.operativeId) {
        const result = transferCuentaToInvestment(
          newCuenta.id,
          newCuenta.nombre,
          newCuenta.investmentId,
          0, // Inicia en 0, se actualizará con movimientos
          undefined,
          undefined,
          newCuenta.operativeId, // Operative de origen
          undefined
        );

        if (result.success && result.newIncomeId && result.newEgressId) {
          newCuenta.transferredIncomeId = result.newIncomeId;
          newCuenta.operativeEgressId = result.newEgressId;
        }
      }

      const updatedCuentas = [...cuentas, newCuenta];
      
      setCuentas(updatedCuentas);
      saveCuentas(updatedCuentas);
      
      setCuentaModalOpen(false);
      setSnackbar({ open: true, message: 'Cuenta creada', severity: 'success' });
      
      // Refrescar datos sin recargar la página
      const refreshedCuentas = getCuentas();
      setCuentas(refreshedCuentas);
    } catch (error) {
      console.error('❌ Error al crear cuenta:', error);
      console.groupEnd();
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleToggleCuentaStatus = async (id: string) => {
    const cuenta = cuentas.find(c => c.id === id);
    if (!cuenta) return;

    const newStatus = cuenta.status === 'ACTIVA' ? 'CERRADA' : 'ACTIVA';
    
    // Simplemente cambiar el estado, no afectar inversiones
    const updatedCuentas = cuentas.map(c =>
      c.id === id
        ? { 
            ...c, 
            status: newStatus as 'ACTIVA' | 'CERRADA',
            updatedAt: new Date() 
          }
        : c
    );
    setCuentas(updatedCuentas);
    saveCuentas(updatedCuentas);
    setSnackbar({ open: true, message: `Cuenta ${newStatus === 'CERRADA' ? 'cerrada' : 'abierta'}`, severity: 'success' });
  };

  const handleStartEditCuenta = (cuenta: Cuenta) => {
    setEditingCuentaId(cuenta.id);
    setEditingCuentaForm({
      nombre: cuenta.nombre,
      descripcion: cuenta.descripcion || '',
      operativeId: cuenta.operativeId || '',
      operativeName: cuenta.operativeName || '',
      investmentId: cuenta.investmentId || '',
      investmentName: cuenta.investmentName || '',
    });
  };

  const handleCancelEditCuenta = () => {
    setEditingCuentaId(null);
    setEditingCuentaForm({ nombre: '', descripcion: '', operativeId: '', operativeName: '', investmentId: '', investmentName: '' });
  };

  const handleUpdateCuenta = async (id: string) => {
    if (!editingCuentaForm.nombre.trim()) {
      setSnackbar({ open: true, message: 'El nombre es requerido', severity: 'error' });
      return;
    }

    const cuenta = cuentas.find(c => c.id === id);
    if (!cuenta) return;

    // Calcular el total actual de la cuenta
    const cuentaTotal = movements
      .filter(m => m.cuentaId === id)
      .reduce((sum, m) => {
        return m.tipo === 'ABONO' ? sum + m.monto : sum - m.monto;
      }, 0);

    const investmentChanged = editingCuentaForm.investmentId !== cuenta.investmentId;
    const hadInvestment = !!cuenta.investmentId;
    const hasInvestment = !!editingCuentaForm.investmentId;

    // CASO 1: Cambió de inversión (ambas existen)
    if (investmentChanged && hadInvestment && hasInvestment && cuenta.transferredIncomeId) {
      const result = transferCuentaToInvestment(
        cuenta.id,
        editingCuentaForm.nombre,
        editingCuentaForm.investmentId,
        cuentaTotal,
        cuenta.transferredIncomeId,
        cuenta.investmentId,
        cuenta.operativeId,
        cuenta.operativeEgressId
      );

      if (result.success && result.newIncomeId) {
        const updatedCuentas = cuentas.map(c =>
          c.id === id
            ? { 
                ...c, 
                nombre: editingCuentaForm.nombre,
                descripcion: editingCuentaForm.descripcion,
                operativeId: editingCuentaForm.operativeId || cuenta.operativeId,
                operativeName: editingCuentaForm.operativeName || cuenta.operativeName,
                investmentId: editingCuentaForm.investmentId,
                investmentName: editingCuentaForm.investmentName,
                transferredIncomeId: result.newIncomeId,
                operativeEgressId: result.newEgressId || cuenta.operativeEgressId,
                updatedAt: new Date() 
              }
            : c
        );
        setCuentas(updatedCuentas);
        saveCuentas(updatedCuentas);
        setEditingCuentaId(null);
        setEditingCuentaForm({ nombre: '', descripcion: '', operativeId: '', operativeName: '', investmentId: '', investmentName: '' });
        setSnackbar({ 
          open: true, 
          message: `Ingreso movido a ${editingCuentaForm.investmentName}`, 
          severity: 'success' 
        });
        return;
      }
    }

    // CASO 2: Se agregó inversión (no tenía antes)
    if (!hadInvestment && hasInvestment) {
      const result = transferCuentaToInvestment(
        cuenta.id,
        editingCuentaForm.nombre,
        editingCuentaForm.investmentId,
        cuentaTotal,
        undefined,
        undefined,
        cuenta.operativeId,
        undefined
      );

      if (result.success && result.newIncomeId) {
        const updatedCuentas = cuentas.map(c =>
          c.id === id
            ? { 
                ...c, 
                nombre: editingCuentaForm.nombre,
                descripcion: editingCuentaForm.descripcion,
                operativeId: editingCuentaForm.operativeId || cuenta.operativeId,
                operativeName: editingCuentaForm.operativeName || cuenta.operativeName,
                investmentId: editingCuentaForm.investmentId,
                investmentName: editingCuentaForm.investmentName,
                transferredIncomeId: result.newIncomeId,
                operativeEgressId: result.newEgressId,
                updatedAt: new Date() 
              }
            : c
        );
        setCuentas(updatedCuentas);
        saveCuentas(updatedCuentas);
        setEditingCuentaId(null);
        setEditingCuentaForm({ nombre: '', descripcion: '', operativeId: '', operativeName: '', investmentId: '', investmentName: '' });
        setSnackbar({ 
          open: true, 
          message: `Ingreso creado en ${editingCuentaForm.investmentName}`, 
          severity: 'success' 
        });
        return;
      }
    }

    // CASO 3: Se quitó la inversión (tenía antes, ahora no)
    if (hadInvestment && !hasInvestment && cuenta.transferredIncomeId) {
      // Eliminar el ingreso de la inversión
      const investments = getInvestments();
      const targetInv = investments.find(inv => inv.id === cuenta.investmentId);
      
      if (targetInv && targetInv.incomeItems) {
        const updatedIncomeItems = targetInv.incomeItems.filter(
          item => item.id !== cuenta.transferredIncomeId
        );
        const totalIncome = calculateIncomeItemsTotals(updatedIncomeItems).net;
        
        targetInv.incomeItems = updatedIncomeItems;
        targetInv.income = totalIncome;
        targetInv.accumulated = targetInv.previousValue + targetInv.currentValue + totalIncome;
        
        saveInvestments(investments);
      }

      // Eliminar el egreso del operativo
      if (cuenta.operativeEgressId && cuenta.operativeId) {
        const operatives = getOperative();
        const targetOp = operatives.find(op => op.id === cuenta.operativeId);
        
        if (targetOp && targetOp.incomeItems) {
          const updatedIncomeItems = targetOp.incomeItems.filter(
            item => item.id !== cuenta.operativeEgressId
          );
          const totalIncome = calculateIncomeItemsTotals(updatedIncomeItems).net;
          
          targetOp.incomeItems = updatedIncomeItems;
          targetOp.income = totalIncome;
          // Balance = Anterior + Actual (sin transferencias)
          targetOp.accumulated = targetOp.previousValue + targetOp.currentValue;
          
          saveOperative(operatives);
        }
      }

      const updatedCuentas = cuentas.map(c =>
        c.id === id
          ? { 
              ...c, 
              nombre: editingCuentaForm.nombre,
              descripcion: editingCuentaForm.descripcion,
              investmentId: undefined,
              investmentName: undefined,
              transferredIncomeId: undefined,
              operativeEgressId: undefined,
              updatedAt: new Date() 
            }
          : c
      );
      setCuentas(updatedCuentas);
      saveCuentas(updatedCuentas);
      setEditingCuentaId(null);
      setEditingCuentaForm({ nombre: '', descripcion: '', operativeId: '', operativeName: '', investmentId: '', investmentName: '' });
      setSnackbar({ open: true, message: 'Cuenta actualizada. Ingreso eliminado', severity: 'success' });
      return;
    }

    // CASO 4: Sin cambios en inversión, solo actualizar datos
    const updatedCuentas = cuentas.map(c =>
      c.id === id
        ? { 
            ...c, 
            nombre: editingCuentaForm.nombre,
            descripcion: editingCuentaForm.descripcion,
            operativeId: editingCuentaForm.operativeId || c.operativeId,
            operativeName: editingCuentaForm.operativeName || c.operativeName,
            investmentId: editingCuentaForm.investmentId || undefined,
            investmentName: editingCuentaForm.investmentName || undefined,
            updatedAt: new Date() 
          }
        : c
    );
    setCuentas(updatedCuentas);
    saveCuentas(updatedCuentas);
    setEditingCuentaId(null);
    setEditingCuentaForm({ nombre: '', descripcion: '', operativeId: '', operativeName: '', investmentId: '', investmentName: '' });
    setSnackbar({ open: true, message: 'Cuenta actualizada', severity: 'success' });
    
    // Refrescar datos sin recargar la página
    const refreshedCuentas = getCuentas();
    setCuentas(refreshedCuentas);
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
      const cuentaToDelete = cuentas.find(c => c.id === id);
      
      if (!cuentaToDelete) return;

      // Si tiene inversión vinculada, eliminar el ingreso de la inversión
      if (cuentaToDelete.investmentId && cuentaToDelete.transferredIncomeId) {
        
        const investments = getInvestments();
        const investmentIndex = investments.findIndex(inv => inv.id === cuentaToDelete.investmentId);
        
        if (investmentIndex !== -1) {
          const investment = investments[investmentIndex];
          
          // Inicializar incomeItems si no existe
          if (!investment.incomeItems) {
            investment.incomeItems = [];
          }
          
          // Eliminar el ingreso específico
          investment.incomeItems = investment.incomeItems.filter(
            item => item.id !== cuentaToDelete.transferredIncomeId
          );
          
          // Recalcular el income total
          investment.income = calculateIncomeItemsTotals(investment.incomeItems).net;
          investment.profitLoss = investment.currentValue - investment.previousValue;
          
          // Recalcular accumulated: Para Inversiones = Actual + Ingreso
          investment.accumulated = investment.currentValue + investment.income;
          
          investments[investmentIndex] = investment;
          saveInvestments(investments);
        }
      }

      // Si tiene operativo vinculado, eliminar el egreso del operativo
      if (cuentaToDelete.operativeId && cuentaToDelete.operativeEgressId) {
        
        const ops = getOperative();
        const opIndex = ops.findIndex(op => op.id === cuentaToDelete.operativeId);
        
        if (opIndex !== -1) {
          const op = ops[opIndex];
          
          // Inicializar incomeItems si no existe
          if (!op.incomeItems) {
            op.incomeItems = [];
          }
          
          // Eliminar el egreso específico
          op.incomeItems = op.incomeItems.filter(
            item => item.id !== cuentaToDelete.operativeEgressId
          );
          
          // Recalcular el income total (ABONO suma, CARGO resta)
          const totalIncome = calculateIncomeItemsTotals(op.incomeItems).net;
          
          op.income = totalIncome;
          // Balance = Anterior + Actual (sin transferencias)
          op.accumulated = op.previousValue + op.currentValue;
          
          ops[opIndex] = op;
          saveOperative(ops);
        }
      }

      // Eliminar la cuenta
      const updatedCuentas = cuentas.filter(c => c.id !== id);
      setCuentas(updatedCuentas);
      saveCuentas(updatedCuentas);
      
      setSnackbar({ open: true, message: 'Cuenta eliminada', severity: 'success' });
      
      // Refrescar datos sin recargar la página
      const refreshedCuentas = getCuentas();
      setCuentas(refreshedCuentas);
    }
  };

  const handleChangeCuenta = (movementId: string, cuentaId: string) => {
    const oldMovement = movements.find(m => m.id === movementId);
    const updatedMovements = movements.map(m =>
      m.id === movementId
        ? { ...m, cuentaId: cuentaId || undefined }
        : m
    );
    setMovements(updatedMovements);
    saveCPCMovements(updatedMovements);
    
    // Sync with both old and new cuenta if linked to investments
    if (cuentaId) {
      syncCuentaIncome(cuentaId, updatedMovements);
    }
    if (oldMovement?.cuentaId && oldMovement.cuentaId !== cuentaId) {
      syncCuentaIncome(oldMovement.cuentaId, updatedMovements);
    }
  };

  // Calculate totals per cuenta
  const cuentaTotals = cuentas.map(cuenta => {
    const movs = movements.filter(m => m.cuentaId === cuenta.id);
    return {
      ...cuenta,
      total: movs.reduce((sum, m) => {
        return m.tipo === 'ABONO' ? sum + m.monto : sum - m.monto;
      }, 0),
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Operativo - Detalle de Clientes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control de Cargos y Abonos por Cliente
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Three Column Layout */}
      <Grid container spacing={3}>
        {/* LEFT: CPC List */}
        <Grid size={{ xs: 12, md: 2 }}>
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
                    const { totalCargos: opCargo, totalAbonos: opAbono, balance: opBalance, movements: opMovements } = calculateOperativeTotalsById(
                      op.id,
                      op.concept,
                      movements,
                      cuentas
                    );
                    const opIncomeTotals = calculateIncomeItemsTotals(op.incomeItems);
                    const opBalanceWithAdjustments = opBalance + opIncomeTotals.net;
                    const opItemsCount = opMovements.length + (op.incomeItems?.length || 0);

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
                            onClick={() => {
                              console.log('🎯 Cambiando concepto:', { 
                                anterior: selectedCPC, 
                                nuevo: op.concept 
                              });
                              setSelectedCPC(op.concept);
                            }}
                          >
                            <ListItemText
                              primary={
                                <Typography 
                                  fontWeight={selectedCPC === op.concept ? 600 : 400}
                                  noWrap
                                  sx={{ maxWidth: 180 }}
                                  title={op.concept}
                                >
                                  {op.concept}
                                </Typography>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                    Balance: <strong style={{ color: opBalanceWithAdjustments > 0 ? '#d32f2f' : '#2e7d32' }}>
                                      {formatCurrency(opBalanceWithAdjustments)}
                                    </strong>
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<ReceiptIcon />}
                                      sx={{ minWidth: 70, px: 1, py: 0.25 }}
                                    >
                                      {opItemsCount}
                                    </Button>
                                    <Typography variant="caption" color="text.secondary">
                                      movimientos
                                    </Typography>
                                  </Box>
                                </React.Fragment>
                              }
                              secondaryTypographyProps={{ component: 'div' }}
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
        <Grid size={{ xs: 12, md: 8 }}>
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
                <Grid size={{ xs: 12, md: 4 }}>
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
                <Grid size={{ xs: 12, md: 4 }}>
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
                <Grid size={{ xs: 12, md: 4 }}>
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
                        <TableCell sx={{ width: 130 }}>
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
                            SelectProps={{ displayEmpty: true }}
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
                              <TableCell sx={{ width: 130 }}>
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
                                  SelectProps={{ displayEmpty: true }}
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
                                <TableCell sx={{ width: 130 }}>
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
                                    SelectProps={{ displayEmpty: true }}
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
                                    <TextField
                                      select
                                      size="small"
                                      value=""
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleChangeCuenta(movement.id, e.target.value);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      variant="standard"
                                      sx={{
                                        minWidth: 100,
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
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                              <Typography variant="body2">{cuenta.nombre}</Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                {cuenta.operativeName || cuenta.investmentName || 'Sin concepto'}
                                              </Typography>
                                            </Box>
                                          </MenuItem>
                                        ))}
                                      {cuentas.filter(c => c.status === 'ACTIVA').length === 0 && (
                                        <MenuItem disabled>
                                          <Typography variant="caption" color="text.secondary">
                                            No hay cuentas activas
                                          </Typography>
                                        </MenuItem>
                                      )}
                                    </TextField>
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
        <Grid size={{ xs: 12, md: 2 }}>
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
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                  <Chip
                    label="Todas"
                    onClick={() => setCuentaStatusFilter('TODAS')}
                    color={cuentaStatusFilter === 'TODAS' ? 'primary' : 'default'}
                    variant={cuentaStatusFilter === 'TODAS' ? 'filled' : 'outlined'}
                    size="small"
                  />
                  <Chip
                    label="Activas"
                    onClick={() => setCuentaStatusFilter('ACTIVA')}
                    color={cuentaStatusFilter === 'ACTIVA' ? 'success' : 'default'}
                    variant={cuentaStatusFilter === 'ACTIVA' ? 'filled' : 'outlined'}
                    size="small"
                  />
                  <Chip
                    label="Cerradas"
                    onClick={() => setCuentaStatusFilter('CERRADA')}
                    color={cuentaStatusFilter === 'CERRADA' ? 'default' : 'default'}
                    variant={cuentaStatusFilter === 'CERRADA' ? 'filled' : 'outlined'}
                    size="small"
                  />
                </Stack>
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
                              <TextField
                                size="small"
                                fullWidth
                                select
                                label="Inversión destino"
                                value={editingCuentaForm.investmentId}
                                onChange={(e) => {
                                  const selectedInv = investments.find(inv => inv.id === e.target.value);
                                  setEditingCuentaForm({ 
                                    ...editingCuentaForm, 
                                    investmentId: e.target.value,
                                    investmentName: selectedInv?.concept || ''
                                  });
                                }}
                                variant="standard"
                              >
                                <MenuItem value="">
                                  <em>Sin transferencia</em>
                                </MenuItem>
                                {investments.map(inv => (
                                  <MenuItem key={inv.id} value={inv.id}>
                                    {inv.concept}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Stack>
                          ) : (
                            <>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                                <Typography 
                                  variant="subtitle2" 
                                  fontWeight={600}
                                  noWrap
                                  sx={{ maxWidth: 180 }}
                                  title={cuenta.nombre}
                                >
                                  {cuenta.nombre}
                                </Typography>
                                {cuenta.investmentName && (
                                  <Chip 
                                    label={`→ ${cuenta.investmentName}`}
                                    size="small"
                                    color="secondary"
                                    variant="outlined"
                                    sx={{ height: 18, fontSize: '0.65rem' }}
                                  />
                                )}
                                {cuenta.transferredIncomeId && cuenta.status === 'CERRADA' && (
                                  <Chip 
                                    label="✓"
                                    size="small"
                                    color="success"
                                    sx={{ height: 18, minWidth: 24, fontSize: '0.65rem' }}
                                  />
                                )}
                              </Box>
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
              <TextField
                fullWidth
                select
                label="Transferir a Inversión"
                value={cuentaForm.investmentId}
                onChange={(e) => {
                  const selectedInv = investments.find(inv => inv.id === e.target.value);
                  setCuentaForm({ 
                    ...cuentaForm, 
                    investmentId: e.target.value,
                    investmentName: selectedInv?.concept || ''
                  });
                }}
                helperText="Al cerrar la cuenta, el total se transferirá automáticamente a esta inversión"
              >
                <MenuItem value="">
                  <em>Ninguna (sin transferencia)</em>
                </MenuItem>
                {investments.map(inv => (
                  <MenuItem key={inv.id} value={inv.id}>
                    {inv.concept}
                  </MenuItem>
                ))}
              </TextField>
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
