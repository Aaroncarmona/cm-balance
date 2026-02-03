'use client';

import { useState } from 'react';
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
import { Operative, IncomeItem } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { getCPCMovements, getCuentas } from '@/lib/storage';
import { calculateOperativeTotalsById } from '@/lib/operativeCalculations';
import OperativeMovementsDialog from '@/components/Modals/OperativeMovementsDialog';

interface OperativeTableProps {
  operative: Operative[];
  onEdit: (operative: Operative) => void;
  onDelete: (id: string) => void;
  onUpdateIncomeItems?: (id: string, items: IncomeItem[]) => void;
}

export default function OperativeTable({ operative, onEdit, onDelete, onUpdateIncomeItems }: OperativeTableProps) {
  const [movementsDialogOpen, setMovementsDialogOpen] = useState(false);
  const [selectedOperative, setSelectedOperative] = useState<Operative | null>(null);

  // Calcular total de movimientos por concepto operativo (SOLO período actual)
  // NO usamos useMemo porque necesitamos recalcular cada vez con los datos más recientes
  const allMovements = getCPCMovements();
  const allCuentas = getCuentas();
  
  const movementCounts: Record<string, number> = {};
  
  operative.forEach(op => {
    // Usar la función calculateOperativeTotalsById con currentPeriodOnly = true
    const { movements } = calculateOperativeTotalsById(
      op.id,
      op.concept,
      allMovements,
      allCuentas,
      true // Solo período actual
    );
    
    // Los egresos siempre son del período actual hasta que se haga corte
    const egressCount = op.incomeItems?.filter(item => item.tipo === 'CARGO').length || 0;
    
    movementCounts[op.id] = movements.length + egressCount;
  });

  const handleOpenMovements = (op: Operative) => {
    setSelectedOperative(op);
    setMovementsDialogOpen(true);
  };

  const total = operative.reduce((sum, op) => sum + op.accumulated, 0);

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 110, minWidth: 110, maxWidth: 110 }}>Movimientos</TableCell>
              <TableCell width="25%">Concepto</TableCell>
              <TableCell align="right" sx={{ width: 140, minWidth: 140, maxWidth: 140 }}>Anterior</TableCell>
              <TableCell align="right" sx={{ width: 140, minWidth: 140, maxWidth: 140 }}>Actual</TableCell>
              <TableCell align="right" width="15%">Balance</TableCell>
              <TableCell sx={{ width: 90, minWidth: 90, maxWidth: 90 }}>Tipo</TableCell>
              <TableCell align="center" width="12%">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {operative.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay operativos registrados. Agrega uno para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              operative.map((op) => {
                const movementCount = movementCounts[op.id] || 0;
                return (
                  <TableRow
                    key={op.id}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ReceiptIcon />}
                        onClick={() => handleOpenMovements(op)}
                        sx={{ minWidth: 95 }}
                      >
                        {movementCount}
                      </Button>
                    </TableCell>
                    <TableCell component="th" scope="row">
                      <Typography fontWeight={500}>{op.concept}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography color={op.previousValue < 0 ? 'error.main' : 'inherit'}>
                        {formatCurrency(op.previousValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={op.currentValue < 0 ? 'error.main' : 'inherit'}>
                        {formatCurrency(op.currentValue)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} color={op.accumulated < 0 ? 'error.main' : 'inherit'}>
                        {formatCurrency(op.accumulated)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={op.type} size="small" color="secondary" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => onEdit(op)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => onDelete(op.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {operative.length > 0 && (
              <TableRow sx={{ bgcolor: 'grey.100', borderTop: 2, borderColor: 'divider' }}>
                <TableCell />
                <TableCell>
                  <Typography fontWeight={700}>Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color={operative.reduce((sum, op) => sum + op.previousValue, 0) < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(operative.reduce((sum, op) => sum + op.previousValue, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} color={operative.reduce((sum, op) => sum + op.currentValue, 0) < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(operative.reduce((sum, op) => sum + op.currentValue, 0))}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} fontSize="1.1rem" color={total < 0 ? 'error.main' : 'inherit'}>
                    {formatCurrency(total)}
                  </Typography>
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Operative Movements Dialog */}
      <OperativeMovementsDialog
        open={movementsDialogOpen}
        operative={selectedOperative}
        onClose={() => {
          setMovementsDialogOpen(false);
          setSelectedOperative(null);
        }}
      />
    </Box>
  );
}
