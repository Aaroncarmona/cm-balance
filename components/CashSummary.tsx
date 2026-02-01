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
  Typography,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Cash } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface CashSummaryProps {
  cash: Cash[];
  onEdit: (cash: Cash) => void;
  onDelete: (id: string) => void;
}

export default function CashSummary({ cash, onEdit, onDelete }: CashSummaryProps) {
  const total = cash.reduce((sum, c) => sum + c.amount, 0);

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Concepto</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cash.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No hay caja registrada. Agrega una para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              cash.map((c) => (
                <TableRow
                  key={c.id}
                  hover
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Typography fontWeight={500}>{c.concept}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="text.secondary">{c.location}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600} color="success.main">
                      {formatCurrency(c.amount)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => onEdit(c)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" onClick={() => onDelete(c.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
            {cash.length > 0 && (
              <TableRow sx={{ bgcolor: 'success.50' }}>
                <TableCell colSpan={2}>
                  <Typography fontWeight={700}>Total Caja</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography fontWeight={700} fontSize="1.1rem" color="success.main">
                    {formatCurrency(total)}
                  </Typography>
                </TableCell>
                <TableCell />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
