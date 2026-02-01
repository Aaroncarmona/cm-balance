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
import { Operative } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface OperativeTableProps {
  operative: Operative[];
  onEdit: (operative: Operative) => void;
  onDelete: (id: string) => void;
}

export default function OperativeTable({ operative, onEdit, onDelete }: OperativeTableProps) {
  const total = operative.reduce((sum, op) => sum + op.accumulated, 0);

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
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {operative.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay operativos registrados. Agrega uno para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              operative.map((op) => (
                <TableRow
                  key={op.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Typography fontWeight={500}>{op.concept}</Typography>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(op.previousValue)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>{formatCurrency(op.currentValue)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      {op.profitLoss >= 0 ? (
                        <TrendingUpIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : (
                        <TrendingDownIcon sx={{ fontSize: 16, color: 'error.main' }} />
                      )}
                      <Typography
                        color={op.profitLoss >= 0 ? 'success.main' : 'error.main'}
                        fontWeight={600}
                      >
                        {formatCurrency(op.profitLoss)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(op.income)}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>{formatCurrency(op.accumulated)}</Typography>
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
              ))
            )}
            {operative.length > 0 && (
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell colSpan={5}>
                  <Typography fontWeight={700}>Total</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} fontSize="1.1rem">
                    {formatCurrency(total)}
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
