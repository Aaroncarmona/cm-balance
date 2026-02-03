'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/calculations';
import { Operative, IncomeItem } from '@/lib/types';
import { getCPCMovements, getCuentas } from '@/lib/storage';
import { useMemo } from 'react';
import { calculateOperativeTotalsById } from '@/lib/operativeCalculations';

interface OperativeMovementsDialogProps {
  open: boolean;
  operative: Operative | null;
  onClose: () => void;
}

export default function OperativeMovementsDialog({
  open,
  operative,
  onClose,
}: OperativeMovementsDialogProps) {
  const allMovements = useMemo(() => getCPCMovements(), [open]);
  const allCuentas = useMemo(() => getCuentas(), [open]);

  // Obtener movimientos y filtrar solo período actual
  const { movements: allPeriodMovements } = useMemo(() => {
    if (!operative) return { movements: [] };
    return calculateOperativeTotalsById(operative.id, operative.concept, allMovements, allCuentas);
  }, [operative, allMovements, allCuentas]);

  // Filtrar solo movimientos del período actual
  const movements = useMemo(() => {
    return allPeriodMovements.filter(m => {
      if (!m.cuentaId) return true; // Sin cuenta = período actual
      const cuenta = allCuentas.find(c => c.id === m.cuentaId);
      return cuenta?.status === 'ACTIVA'; // Solo cuentas activas
    });
  }, [allPeriodMovements, allCuentas]);

  // Combinar movimientos de clientes con egresos manuales (solo período actual)
  const allItems = useMemo(() => {
    if (!operative) return [];
    
    const items: Array<{
      id: string;
      fecha: Date;
      concepto: string;
      tipo: 'CARGO' | 'ABONO';
      monto: number;
      origen: string;
      cuenta?: string;
    }> = [];

    // Agregar movimientos de clientes (solo período actual)
    movements.forEach(m => {
      const cuenta = m.cuentaId ? allCuentas.find(c => c.id === m.cuentaId) : undefined;
      items.push({
        id: m.id,
        fecha: m.fecha,
        concepto: m.concepto,
        tipo: m.tipo,
        monto: m.monto,
        origen: m.clientName,
        cuenta: cuenta?.nombre,
      });
    });

    // Agregar egresos a inversiones (estos siempre son del período actual hasta que se haga corte)
    if (operative.incomeItems && operative.incomeItems.length > 0) {
      operative.incomeItems.forEach((item: IncomeItem) => {
        // Solo mostrar los CARGOS (egresos)
        if (item.tipo === 'CARGO') {
          items.push({
            id: item.id,
            fecha: item.createdAt,
            concepto: item.concepto,
            tipo: 'CARGO',
            monto: item.monto,
            origen: 'Egreso a inversión',
            cuenta: item.concepto,
          });
        }
      });
    }

    // Ordenar por fecha descendente
    return items.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [operative, movements, allCuentas]);

  // Calcular totales basados en allItems (incluye movimientos + egresos)
  const { totalCargos, totalAbonos, balance } = useMemo(() => {
    const cargos = allItems
      .filter(item => item.tipo === 'CARGO')
      .reduce((sum, item) => sum + item.monto, 0);
    const abonos = allItems
      .filter(item => item.tipo === 'ABONO')
      .reduce((sum, item) => sum + item.monto, 0);
    return {
      totalCargos: cargos,
      totalAbonos: abonos,
      balance: abonos - cargos
    };
  }, [allItems]);

  if (!operative) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
        Movimientos - {operative.concept}
      </DialogTitle>
      <DialogContent dividers>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Concepto</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Monto</TableCell>
                <TableCell>Fecha</TableCell>
                <TableCell>Origen</TableCell>
                <TableCell>Cuenta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No hay movimientos registrados
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                allItems.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.concepto}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.tipo}
                        size="small"
                        color={item.tipo === 'CARGO' ? 'error' : 'success'}
                        sx={{ fontWeight: 600, minWidth: 70 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        fontWeight={600}
                        color={item.tipo === 'CARGO' ? 'error.main' : 'success.main'}
                      >
                        {item.tipo === 'CARGO' ? '-' : '+'}{formatCurrency(Math.abs(item.monto))}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {format(new Date(item.fecha), 'dd-MMM')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.origen}</Typography>
                    </TableCell>
                    <TableCell>
                      {item.cuenta && (
                        <Chip
                          label={item.cuenta}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ textAlign: 'center', px: 2, py: 1, borderRadius: 1, bgcolor: 'success.lighter' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Abonos (Entradas)
            </Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">
              +{formatCurrency(totalAbonos)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allItems.filter(m => m.tipo === 'ABONO').length} concepto{allItems.filter(m => m.tipo === 'ABONO').length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', px: 2, py: 1, borderRadius: 1, bgcolor: 'error.lighter' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Cargos (Salidas)
            </Typography>
            <Typography variant="h6" fontWeight={700} color="error.main">
              -{formatCurrency(totalCargos)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allItems.filter(m => m.tipo === 'CARGO').length} concepto{allItems.filter(m => m.tipo === 'CARGO').length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center', px: 2, py: 1, borderRadius: 1, bgcolor: 'primary.lighter' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              BALANCE TOTAL
            </Typography>
            <Typography variant="h6" fontWeight={700} color={balance < 0 ? 'error.main' : 'primary.main'}>
              {formatCurrency(balance)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {allItems.length} concepto{allItems.length !== 1 ? 's' : ''} total
            </Typography>
          </Box>
        </Box>
        
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
