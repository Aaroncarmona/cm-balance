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
  TextField,
  Button,
  MenuItem,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  History as HistoryIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Investment, IncomeItem } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/calculations';
import IncomeDialog from '@/components/Modals/IncomeDialog';
import CutsHistoryDialog from '@/components/Modals/CutsHistoryDialog';

interface InvestmentTableProps {
  investments: Investment[];
  onEdit: (investment: Investment) => Promise<void>;
  onDelete: (id: string) => void;
  onAdd?: (data: any) => Promise<void>;
  onUpdateIncomeItems?: (id: string, items: IncomeItem[]) => Promise<void>;
}

export default function InvestmentTable({ investments, onEdit, onDelete, onAdd, onUpdateIncomeItems }: InvestmentTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCurrentValueId, setEditingCurrentValueId] = useState<string | null>(null);
  const [editingCurrentValue, setEditingCurrentValue] = useState<string>('');
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [cutsHistoryDialogOpen, setCutsHistoryDialogOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [newInvestmentForm, setNewInvestmentForm] = useState({
    concept: '',
    previousValue: '',
    currentValue: '',
    type: 'Fondo',
  });
  const [editInvestmentForm, setEditInvestmentForm] = useState({
    concept: '',
    previousValue: '',
    currentValue: '',
    type: 'Fondo',
  });

  const handleStartAdd = () => {
    setIsAdding(true);
    setNewInvestmentForm({
      concept: '',
      previousValue: '',
      currentValue: '',
      type: 'Fondo',
    });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewInvestmentForm({
      concept: '',
      previousValue: '',
      currentValue: '',
      type: 'Fondo',
    });
  };

  const handleSaveAdd = async () => {
    if (!newInvestmentForm.concept.trim()) {
      return;
    }

    const previousValue = parseFloat(newInvestmentForm.previousValue) || 0;
    const currentValue = parseFloat(newInvestmentForm.currentValue) || 0;

    if (onAdd) {
      await onAdd({
        concept: newInvestmentForm.concept,
        previousValue,
        currentValue,
        income: 0,
        type: newInvestmentForm.type,
      });
    }

    handleCancelAdd();
  };

  const handleStartEdit = (investment: Investment) => {
    setEditingId(investment.id);
    setEditInvestmentForm({
      concept: investment.concept,
      previousValue: investment.previousValue.toString(),
      currentValue: investment.currentValue.toString(),
      type: investment.type,
    });
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditInvestmentForm({
      concept: '',
      previousValue: '',
      currentValue: '',
      type: 'Fondo',
    });
  };

  const handleSaveEdit = async (investment: Investment) => {
    if (!editInvestmentForm.concept.trim()) {
      return;
    }

    const previousValue = parseFloat(editInvestmentForm.previousValue) || 0;
    const currentValue = parseFloat(editInvestmentForm.currentValue) || 0;

    // Call the onEdit callback with updated data
    await onEdit({
      ...investment,
      concept: editInvestmentForm.concept,
      previousValue,
      currentValue,
      type: editInvestmentForm.type as Investment['type'],
    });

    handleCancelEdit();
  };

  const handleOpenIncomeDialog = (investment: Investment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedInvestment(investment);
    setIncomeDialogOpen(true);
  };

  const handleCloseIncomeDialog = () => {
    setIncomeDialogOpen(false);
    setSelectedInvestment(null);
  };

  const handleSaveIncomeItems = async (items: IncomeItem[]) => {
    if (selectedInvestment && onUpdateIncomeItems) {
      await onUpdateIncomeItems(selectedInvestment.id, items);
    }
  };

  const handleStartEditCurrentValue = (investment: Investment, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCurrentValueId(investment.id);
    setEditingCurrentValue(investment.currentValue.toString());
  };

  const handleCancelEditCurrentValue = () => {
    setEditingCurrentValueId(null);
    setEditingCurrentValue('');
  };

  const handleSaveCurrentValue = async (investment: Investment) => {
    const newValue = parseFloat(editingCurrentValue);
    if (isNaN(newValue) || newValue < 0) return;

    await onEdit({
      ...investment,
      currentValue: newValue,
    });

    handleCancelEditCurrentValue();
  };

  const handleOpenCutsHistory = (investment: Investment) => {
    setSelectedInvestment(investment);
    setCutsHistoryDialogOpen(true);
  };

  const handleCloseCutsHistory = () => {
    setCutsHistoryDialogOpen(false);
    setSelectedInvestment(null);
  };

  // ESC key to cancel editing
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isAdding) {
          handleCancelAdd();
        }
        if (editingId) {
          handleCancelEdit();
        }
        if (editingCurrentValueId) {
          handleCancelEditCurrentValue();
        }
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isAdding, editingId, editingCurrentValueId]);

  const total = investments.reduce((sum, inv) => sum + inv.accumulated, 0);

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 110, minWidth: 110, maxWidth: 110 }}>Movimientos</TableCell>
              <TableCell width="18%">Concepto</TableCell>
              <TableCell align="right" sx={{ width: 120, minWidth: 120, maxWidth: 120 }}>Anterior</TableCell>
              <TableCell align="right" sx={{ width: 120, minWidth: 120, maxWidth: 120 }}>Actual</TableCell>
              <TableCell align="right" width="10%">P/M</TableCell>
              <TableCell align="right" width="10%">Ingreso</TableCell>
              <TableCell align="right" width="12%">Balance</TableCell>
              <TableCell sx={{ width: 90, minWidth: 90, maxWidth: 90 }}>Tipo</TableCell>
              <TableCell align="right" width="8%">Portafolio %</TableCell>
              <TableCell align="center" width="12%">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Inline Add Row */}
            {isAdding ? (
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell />
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Nombre del concepto..."
                    value={newInvestmentForm.concept}
                    onChange={(e) => setNewInvestmentForm({ ...newInvestmentForm, concept: e.target.value })}
                    autoFocus
                  />
                </TableCell>
                <TableCell sx={{ width: 140, minWidth: 140, maxWidth: 140 }}>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    placeholder="0"
                    value={newInvestmentForm.previousValue}
                    onChange={(e) => setNewInvestmentForm({ ...newInvestmentForm, previousValue: e.target.value })}
                    inputProps={{ step: '0.01' }}
                  />
                </TableCell>
                <TableCell sx={{ width: 140, minWidth: 140, maxWidth: 140 }}>
                  <TextField
                    size="small"
                    fullWidth
                    type="number"
                    placeholder="0"
                    value={newInvestmentForm.currentValue}
                    onChange={(e) => setNewInvestmentForm({ ...newInvestmentForm, currentValue: e.target.value })}
                    inputProps={{ step: '0.01' }}
                  />
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    select
                    value={newInvestmentForm.type}
                    onChange={(e) => setNewInvestmentForm({ ...newInvestmentForm, type: e.target.value })}
                  >
                    <MenuItem value="Fondo">Fondo</MenuItem>
                    <MenuItem value="Acciones">Acciones</MenuItem>
                    <MenuItem value="Cripto">Cripto</MenuItem>
                    <MenuItem value="Divisa">Divisa</MenuItem>
                    <MenuItem value="Ahorro">Ahorro</MenuItem>
                  </TextField>
                </TableCell>
                <TableCell />
                <TableCell align="center">
                  <IconButton size="small" onClick={handleSaveAdd} color="success">
                    <CheckIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancelAdd} color="error">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell colSpan={10} align="center" sx={{ py: 1 }}>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleStartAdd}
                    variant="text"
                  >
                    Agregar Inversión
                  </Button>
                </TableCell>
              </TableRow>
            )}

            {investments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay inversiones registradas. Agrega una para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              investments.map((investment) => (
                editingId === investment.id ? (
                  <TableRow key={investment.id} sx={{ bgcolor: 'action.selected' }}>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={(e) => handleOpenIncomeDialog(investment, e)}
                        sx={{ minWidth: 95 }}
                      >
                        {investment.incomeItems && investment.incomeItems.length > 0 ? investment.incomeItems.length : 'Agregar'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={editInvestmentForm.concept}
                        onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, concept: e.target.value })}
                        autoFocus
                      />
                    </TableCell>
                    <TableCell sx={{ width: 140, minWidth: 140, maxWidth: 140 }}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={editInvestmentForm.previousValue}
                        onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, previousValue: e.target.value })}
                        inputProps={{ step: '0.01' }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 140, minWidth: 140, maxWidth: 140 }}>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={editInvestmentForm.currentValue}
                        onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, currentValue: e.target.value })}
                        inputProps={{ step: '0.01' }}
                      />
                    </TableCell>
                    <TableCell />
                    <TableCell align="right">
                      <Typography>{formatCurrency(investment.income)}</Typography>
                    </TableCell>
                    <TableCell />
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        select
                        value={editInvestmentForm.type}
                        onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, type: e.target.value })}
                      >
                        <MenuItem value="Fondo">Fondo</MenuItem>
                        <MenuItem value="Acciones">Acciones</MenuItem>
                        <MenuItem value="Cripto">Cripto</MenuItem>
                        <MenuItem value="Divisa">Divisa</MenuItem>
                        <MenuItem value="Ahorro">Ahorro</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell />
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleSaveEdit(investment)} color="success">
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={handleCancelEdit} color="error">
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow
                    key={investment.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={(e) => handleOpenIncomeDialog(investment, e)}
                        sx={{ minWidth: 95 }}
                      >
                        {investment.incomeItems && investment.incomeItems.length > 0 ? investment.incomeItems.length : 'Agregar'}
                      </Button>
                    </TableCell>
                    <TableCell component="th" scope="row">
                      <Typography fontWeight={500}>{investment.concept}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ width: 140 }}>
                      <Typography color={investment.previousValue < 0 ? 'error.main' : 'inherit'}>
                        {formatCurrency(investment.previousValue)}
                      </Typography>
                    </TableCell>
                    <TableCell 
                      align="right"
                      onClick={(e) => {
                        if (editingCurrentValueId !== investment.id) {
                          handleStartEditCurrentValue(investment, e);
                        }
                      }}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        width: 140,
                        minWidth: 140,
                        maxWidth: 140,
                        p: '16px'
                      }}
                    >
                      {editingCurrentValueId === investment.id ? (
                        <TextField
                          size="small"
                          type="number"
                          value={editingCurrentValue}
                          onChange={(e) => setEditingCurrentValue(e.target.value)}
                          onBlur={() => handleSaveCurrentValue(investment)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveCurrentValue(investment);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          inputProps={{ 
                            step: '0.01',
                            style: { 
                              textAlign: 'right',
                              fontWeight: 600,
                              padding: '4px 8px'
                            }
                          }}
                          autoFocus
                          sx={{ 
                            width: '100%',
                            '& .MuiOutlinedInput-root': {
                              height: '32px'
                            }
                          }}
                        />
                      ) : (
                        <Tooltip title="Click para editar">
                          <Box component="span" sx={{ display: 'inline-block', width: '100%' }}>
                            <Typography fontWeight={600} color={investment.currentValue < 0 ? 'error.main' : 'inherit'}>
                              {formatCurrency(investment.currentValue)}
                            </Typography>
                          </Box>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {investment.profitLoss >= 0 ? (
                          <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                        )}
                        <Typography
                          color={investment.profitLoss < 0 ? 'error.main' : 'success.main'}
                          fontWeight={600}
                        >
                          {formatCurrency(investment.profitLoss)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={investment.income < 0 ? 'error.main' : 'inherit'}>
                        {formatCurrency(investment.income)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={investment.accumulated < 0 ? 'error.main' : 'inherit'}>
                        {formatCurrency(investment.accumulated)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={investment.type} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={500}>{formatPercentage(investment.portfolio)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleStartEdit(investment)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver Historial de Cortes">
                        <IconButton size="small" onClick={() => handleOpenCutsHistory(investment)} color="info">
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => onDelete(investment.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              ))
            )}
            {investments.length > 0 && (
              <TableRow sx={{ bgcolor: 'grey.100', borderTop: 2, borderColor: 'divider' }}>
                <TableCell />
                <TableCell>
                  <Typography fontWeight={700}>Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color={investments.reduce((sum, inv) => sum + inv.previousValue, 0) < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(investments.reduce((sum, inv) => sum + inv.previousValue, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color={investments.reduce((sum, inv) => sum + inv.currentValue, 0) < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(investments.reduce((sum, inv) => sum + inv.currentValue, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color={investments.reduce((sum, inv) => sum + inv.profitLoss, 0) < 0 ? 'error.main' : 'success.main'}>
                    {formatCurrency(investments.reduce((sum, inv) => sum + inv.profitLoss, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color={investments.reduce((sum, inv) => sum + inv.income, 0) < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(investments.reduce((sum, inv) => sum + inv.income, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} fontSize="1.1rem" color={total < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(total)}
                  </Typography>
                </TableCell>
                <TableCell />
                <TableCell />
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedInvestment && (
        <>
          <IncomeDialog
            open={incomeDialogOpen}
            investmentName={selectedInvestment.concept}
            incomeItems={selectedInvestment.incomeItems || []}
            onClose={handleCloseIncomeDialog}
            onSave={handleSaveIncomeItems}
          />
          <CutsHistoryDialog
            open={cutsHistoryDialogOpen}
            investmentName={selectedInvestment.concept}
            cuts={selectedInvestment.cuts || []}
            onClose={handleCloseCutsHistory}
          />
        </>
      )}
    </Box>
  );
}
