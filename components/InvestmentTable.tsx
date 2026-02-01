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
} from '@mui/icons-material';
import { Investment, IncomeItem } from '@/lib/types';
import { formatCurrency, formatPercentage } from '@/lib/calculations';
import IncomeDialog from '@/components/Modals/IncomeDialog';

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
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
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
      type: editInvestmentForm.type,
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
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isAdding, editingId]);

  const total = investments.reduce((sum, inv) => sum + inv.accumulated, 0);

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell align="right">Anterior</TableCell>
              <TableCell align="right">Actual</TableCell>
              <TableCell align="right">P/M</TableCell>
              <TableCell align="right">Ingreso</TableCell>
              <TableCell align="right">Acumulado</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Portafolio %</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Inline Add Row */}
            {isAdding ? (
              <TableRow sx={{ bgcolor: 'action.hover' }}>
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
                <TableCell>
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
                <TableCell>
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
                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    Click después
                  </Typography>
                </TableCell>
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
                <TableCell colSpan={9} align="center" sx={{ py: 1 }}>
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
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay inversiones registradas. Agrega una para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              investments.map((investment) => (
                editingId === investment.id ? (
                  <TableRow key={investment.id} sx={{ bgcolor: 'action.selected' }}>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={editInvestmentForm.concept}
                        onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, concept: e.target.value })}
                        autoFocus
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        type="number"
                        value={editInvestmentForm.previousValue}
                        onChange={(e) => setEditInvestmentForm({ ...editInvestmentForm, previousValue: e.target.value })}
                        inputProps={{ step: '0.01' }}
                      />
                    </TableCell>
                    <TableCell>
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
                    <TableCell 
                      align="right"
                      onClick={(e) => handleOpenIncomeDialog(investment, e)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography>{formatCurrency(investment.income)}</Typography>
                        {investment.incomeItems && investment.incomeItems.length > 0 && (
                          <Chip 
                            label={investment.incomeItems.length} 
                            size="small" 
                            color="info" 
                            sx={{ height: 18, fontSize: '0.7rem' }} 
                          />
                        )}
                      </Box>
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
                    <TableCell component="th" scope="row">
                      <Typography fontWeight={500}>{investment.concept}</Typography>
                    </TableCell>
                    <TableCell align="right">{formatCurrency(investment.previousValue)}</TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>{formatCurrency(investment.currentValue)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        {investment.profitLoss >= 0 ? (
                          <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                        ) : (
                          <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                        )}
                        <Typography
                          color={investment.profitLoss >= 0 ? 'success.main' : 'error.main'}
                          fontWeight={600}
                        >
                          {formatCurrency(investment.profitLoss)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell 
                      align="right"
                      onClick={(e) => handleOpenIncomeDialog(investment, e)}
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Typography>{formatCurrency(investment.income)}</Typography>
                        {investment.incomeItems && investment.incomeItems.length > 0 ? (
                          <Chip 
                            label={investment.incomeItems.length} 
                            size="small" 
                            color="info" 
                            sx={{ height: 18, fontSize: '0.7rem' }} 
                          />
                        ) : (
                          <Tooltip title="Click para agregar conceptos">
                            <Chip 
                              label="+" 
                              size="small" 
                              color="default" 
                              sx={{ height: 18, fontSize: '0.7rem', minWidth: 24 }} 
                            />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600}>{formatCurrency(investment.accumulated)}</Typography>
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
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={5}>
                  <Typography fontWeight={700}>Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} fontSize="1.1rem">
                    {formatCurrency(total)}
                  </Typography>
                </TableCell>
                <TableCell colSpan={3} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedInvestment && (
        <IncomeDialog
          open={incomeDialogOpen}
          investmentName={selectedInvestment.concept}
          incomeItems={selectedInvestment.incomeItems || []}
          onClose={handleCloseIncomeDialog}
          onSave={handleSaveIncomeItems}
        />
      )}
    </Box>
  );
}
