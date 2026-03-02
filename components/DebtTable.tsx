'use client';

import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Box,
  Chip,
  Typography,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Debt, DebtMovement, Investment } from '@/lib/types';
import { formatCurrency, updateDebtCalculations } from '@/lib/calculations';
import { getDebtMovements, saveDebtMovements, getInvestments, getDebts, saveDebts } from '@/lib/storage';
import { payDebtFromInvestment, removeDebtPaymentFromInvestment } from '@/lib/debtPayment';
import DebtIncomeDialog from '@/components/Modals/DebtIncomeDialog';

interface DebtTableProps {
  debts: Debt[];
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
  onUpdate?: () => void;
}

export default function DebtTable({ debts, onEdit, onDelete, onUpdate }: DebtTableProps) {
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [allMovements, setAllMovements] = useState<DebtMovement[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load movements and investments
  const loadData = () => {
    setAllMovements(getDebtMovements());
    setInvestments(getInvestments());
  };

  // Recalcular currentValue de las deudas cuando cambien los movimientos
  useEffect(() => {
    const allDebts = getDebts();
    let needsUpdate = false;
    
    const updatedDebts = allDebts.map(debt => {
      // Calcular income del período actual
      const movements = allMovements.filter(m => m.debtId === debt.id && !m.cutId);
      const cargos = movements.filter(m => m.tipo === 'CARGO').reduce((sum, m) => sum + m.monto, 0);
      const abonos = movements.filter(m => m.tipo === 'ABONO').reduce((sum, m) => sum + m.monto, 0);
      const income = abonos - cargos;
      
      // Si el currentValue no coincide con el income calculado, actualizar
      if (debt.currentValue !== income) {
        needsUpdate = true;
        return updateDebtCalculations({
          ...debt,
          currentValue: income,
        });
      }
      return debt;
    });
    
    if (needsUpdate) {
      saveDebts(updatedDebts);
    }
  }, [allMovements]);

  // Handle income button click
  const handleOpenIncome = (debt: Debt) => {
    loadData();
    setSelectedDebt(debt);
    setIncomeDialogOpen(true);
  };

  // Handle save movements with realtime sync
  const handleSaveMovements = (movements: DebtMovement[]) => {
    if (!selectedDebt) return;

    // Get old movements for this debt (only current period)
    const oldMovements = allMovements.filter(m => m.debtId === selectedDebt.id && !m.cutId);
    
    // Get historical movements for this debt (from previous periods)
    const historicalMovements = allMovements.filter(m => m.debtId === selectedDebt.id && m.cutId);
    
    // Get movements from other debts (including their historical ones)
    const otherMovements = allMovements.filter(m => m.debtId !== selectedDebt.id);

    // Process changes for realtime sync
    movements.forEach((newMov) => {
      const oldMov = oldMovements.find(m => m.id === newMov.id);

      // If it's an ABONO with investment
      if (newMov.tipo === 'ABONO' && newMov.investmentId) {
        // If it's a new movement or changed
        if (!oldMov || oldMov.investmentId !== newMov.investmentId || oldMov.monto !== newMov.monto) {
          // Remove old cargo if exists
          if (oldMov?.cargoIncomeId && oldMov?.investmentId) {
            removeDebtPaymentFromInvestment(oldMov.cargoIncomeId, oldMov.investmentId);
          }

          // Create new cargo in investment
          const result = payDebtFromInvestment(
            selectedDebt.concept,
            newMov.investmentId,
            newMov.monto,
            undefined
          );

          if (result.success && result.newCargoId) {
            newMov.cargoIncomeId = result.newCargoId;
          }
        }
      }
      // If old movement had cargo but new doesn't
      else if (oldMov?.cargoIncomeId && oldMov?.investmentId) {
        removeDebtPaymentFromInvestment(oldMov.cargoIncomeId, oldMov.investmentId);
      }
    });

    // Handle deleted movements
    oldMovements.forEach((oldMov) => {
      const stillExists = movements.find(m => m.id === oldMov.id);
      if (!stillExists && oldMov.cargoIncomeId && oldMov.investmentId) {
        removeDebtPaymentFromInvestment(oldMov.cargoIncomeId, oldMov.investmentId);
      }
    });

    // Save all movements (including historical ones)
    const updatedMovements = [...otherMovements, ...historicalMovements, ...movements];
    saveDebtMovements(updatedMovements);
    setAllMovements(updatedMovements);

    // Recalcular y actualizar la deuda con los nuevos valores
    const income = getDebtIncome(selectedDebt.id);
    const updatedDebt = updateDebtCalculations({
      ...selectedDebt,
      currentValue: income,
    });
    
    // Actualizar la deuda en el storage
    const allDebts = getDebts();
    const updatedDebts = allDebts.map(d => d.id === selectedDebt.id ? updatedDebt : d);
    saveDebts(updatedDebts);

    if (onUpdate) {
      onUpdate();
    }
  };

  // Calculate total income for each debt (only current period for currentValue)
  // For debts: ABONO reduces debt (positive), CARGO increases debt (negative)
  const getDebtIncome = (debtId: string): number => {
    // Solo movimientos del período actual para calcular el "Actual" del período
    const movements = allMovements.filter(m => m.debtId === debtId && !m.cutId);
    const cargos = movements.filter(m => m.tipo === 'CARGO').reduce((sum, m) => sum + m.monto, 0);
    const abonos = movements.filter(m => m.tipo === 'ABONO').reduce((sum, m) => sum + m.monto, 0);
    // Income = ABONOS - CARGOS (abonos reduce debt, cargos increase it)
    return abonos - cargos;
  };

  // Calculate total balance
  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 110, minWidth: 110, maxWidth: 110 }}>Movimientos</TableCell>
              <TableCell align="right" width="15%">Anterior</TableCell>
              <TableCell align="right" width="15%">P/M</TableCell>
              <TableCell align="right" width="15%">Ingreso</TableCell>
              <TableCell align="right" width="15%">Balance</TableCell>
              <TableCell width="12%">Tipo</TableCell>
              <TableCell align="center" width="13%">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {debts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay deudas registradas. Agrega una para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              debts.map((debt) => {
                // El balance ya está calculado correctamente en debt.balance (previousValue + currentValue)
                const movements = allMovements.filter(m => m.debtId === debt.id && !m.cutId);

                return (
                  <TableRow
                    key={debt.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={() => handleOpenIncome(debt)}
                        sx={{ minWidth: 95 }}
                      >
                        {movements.length > 0 ? movements.length : 'Agregar'}
                      </Button>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={debt.previousValue < 0 ? 'error.main' : 'inherit'}>
                        {formatCurrency(debt.previousValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {debt.profitLoss >= 0 ? (
                          <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                        )}
                        <Typography
                          color={debt.profitLoss < 0 ? 'error.main' : 'success.main'}
                          fontWeight={600}
                        >
                          {formatCurrency(debt.profitLoss)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={debt.currentValue < 0 ? 'error.main' : 'inherit'}>
                        {formatCurrency(debt.currentValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={debt.balance < 0 ? 'error.main' : 'success.main'}>
                        {formatCurrency(debt.balance)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={debt.type} size="small" color="error" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => onEdit(debt)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => onDelete(debt.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {debts.length > 0 && (
              <TableRow sx={{ bgcolor: 'grey.100', borderTop: 2, borderColor: 'divider' }}>
                <TableCell />
                <TableCell align="right">
                  <Typography fontWeight={700} color={debts.reduce((sum, debt) => sum + debt.previousValue, 0) < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(debts.reduce((sum, debt) => sum + debt.previousValue, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color={debts.reduce((sum, debt) => sum + debt.profitLoss, 0) < 0 ? 'error.main' : 'success.main'}>
                    {formatCurrency(debts.reduce((sum, debt) => sum + debt.profitLoss, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color={debts.reduce((sum, debt) => sum + debt.currentValue, 0) < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(debts.reduce((sum, debt) => sum + debt.currentValue, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} fontSize="1.1rem" color={totalBalance < 0 ? 'error.main' : 'success.main'}>
                    {formatCurrency(totalBalance)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography fontWeight={700}>Total</Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Debt Income Dialog */}
      {selectedDebt && (
        <DebtIncomeDialog
          open={incomeDialogOpen}
          debtId={selectedDebt.id}
          debtName={selectedDebt.concept}
          movements={allMovements.filter(m => m.debtId === selectedDebt.id && !m.cutId)}
          investments={investments}
          onClose={() => {
            setIncomeDialogOpen(false);
            setSelectedDebt(null);
          }}
          onSave={handleSaveMovements}
        />
      )}
    </Box>
  );
}
