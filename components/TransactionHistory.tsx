'use client';

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  Typography,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { Transaction, TransactionCategory } from '@/lib/types';
import { formatDateTime, formatCurrency } from '@/lib/calculations';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const categoryColors: Record<TransactionCategory, 'primary' | 'secondary' | 'error' | 'success'> = {
  INVERSION: 'primary',
  OPERATIVO: 'secondary',
  DEUDA: 'error',
  CAJA: 'success',
};

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TransactionCategory | 'ALL'>('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesSearch =
          tx.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'ALL' || tx.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, categoryFilter]);

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              select
              label="Categoría"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as TransactionCategory | 'ALL')}
              size="small"
            >
              <MenuItem value="ALL">Todas</MenuItem>
              <MenuItem value="INVERSION">Inversiones</MenuItem>
              <MenuItem value="OPERATIVO">Operativo</MenuItem>
              <MenuItem value="DEUDA">Deudas</MenuItem>
              <MenuItem value="CAJA">Caja</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Item</TableCell>
              <TableCell>Acción</TableCell>
              <TableCell align="right">Valor Anterior</TableCell>
              <TableCell align="right">Valor Nuevo</TableCell>
              <TableCell>Descripción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchTerm || categoryFilter !== 'ALL'
                      ? 'No se encontraron transacciones con los filtros aplicados.'
                      : 'No hay transacciones registradas aún.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.id} hover>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(new Date(tx.date))}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tx.category}
                      size="small"
                      color={categoryColors[tx.category]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{tx.itemName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tx.field}
                      size="small"
                      variant="filled"
                      sx={{
                        bgcolor:
                          tx.field === 'created'
                            ? 'success.light'
                            : tx.field === 'deleted'
                            ? 'error.light'
                            : 'info.light',
                        color: 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {typeof tx.oldValue === 'number' ? formatCurrency(tx.oldValue) : tx.oldValue}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={600}>
                      {typeof tx.newValue === 'number' ? formatCurrency(tx.newValue) : tx.newValue}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {tx.description || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredTransactions.length > 0 && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {filteredTransactions.length} de {transactions.length} transacciones
          </Typography>
        </Box>
      )}
    </Box>
  );
}
