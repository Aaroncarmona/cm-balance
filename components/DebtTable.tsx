'use client';

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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { Debt } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface DebtTableProps {
  debts: Debt[];
  onEdit: (debt: Debt) => void;
  onDelete: (id: string) => void;
}

export default function DebtTable({ debts, onEdit, onDelete }: DebtTableProps) {
  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0);

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
              <TableCell align="right">Límite</TableCell>
              <TableCell align="right">Balance</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {debts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay deudas registradas. Agrega una para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              debts.map((debt) => (
                <TableRow
                  key={debt.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Typography fontWeight={500}>{debt.concept}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(debt.previousValue)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600} color="error.main">
                      {formatCurrency(debt.currentValue)}
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
                        color={debt.profitLoss >= 0 ? 'success.main' : 'error.main'}
                        fontWeight={600}
                      >
                        {formatCurrency(debt.profitLoss)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(debt.limit)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600} color="error.main">
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
              ))
            )}
            {debts.length > 0 && (
              <TableRow sx={{ bgcolor: 'error.50' }}>
                <TableCell colSpan={5}>
                  <Typography fontWeight={700}>Total Deuda</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} fontSize="1.1rem" color="error.main">
                    {formatCurrency(totalBalance)}
                  </Typography>
                </TableCell>
                <TableCell colSpan={2} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
