'use client';

import { useState, Fragment } from 'react';
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
  Typography,
  Box,
  Chip,
  IconButton,
  Collapse,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { InvestmentCut } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CutsHistoryDialogProps {
  open: boolean;
  investmentName: string;
  cuts: InvestmentCut[];
  onClose: () => void;
}

export default function CutsHistoryDialog({
  open,
  investmentName,
  cuts,
  onClose,
}: CutsHistoryDialogProps) {
  const [expandedCuts, setExpandedCuts] = useState<Set<string>>(new Set());
  
  const sortedCuts = [...cuts].sort((a, b) => 
    new Date(b.cutDate).getTime() - new Date(a.cutDate).getTime()
  );

  const toggleExpand = (cutId: string) => {
    const newExpanded = new Set(expandedCuts);
    if (newExpanded.has(cutId)) {
      newExpanded.delete(cutId);
    } else {
      newExpanded.add(cutId);
    }
    setExpandedCuts(newExpanded);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        Histórico de Cortes - {investmentName}
        <Typography variant="caption" display="block" color="text.secondary">
          {cuts.length} corte{cuts.length !== 1 ? 's' : ''} registrado{cuts.length !== 1 ? 's' : ''}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {sortedCuts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No hay cortes registrados para esta inversión
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="40px"></TableCell>
                  <TableCell>Fecha del Corte</TableCell>
                  <TableCell align="right">Anterior</TableCell>
                  <TableCell align="right">Actual</TableCell>
                  <TableCell align="right">P/M</TableCell>
                  <TableCell align="right">Ingreso</TableCell>
                  <TableCell align="right">Acumulado</TableCell>
                  <TableCell align="center">Conceptos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedCuts.map((cut, index) => (
                  <Fragment key={cut.id}>
                    <TableRow hover>
                      <TableCell>
                        {cut.incomeItems.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={() => toggleExpand(cut.id)}
                          >
                            {expandedCuts.has(cut.id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {format(new Date(cut.cutDate), "dd 'de' MMMM, yyyy", { locale: es })}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(cut.cutDate), 'HH:mm:ss')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(cut.previousValue)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={600}>
                          {formatCurrency(cut.currentValue)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          color={cut.profitLoss >= 0 ? 'success.main' : 'error.main'}
                          fontWeight={600}
                        >
                          {formatCurrency(cut.profitLoss)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(cut.income)}
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight={700} fontSize="1.1rem">
                          {formatCurrency(cut.accumulated)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={cut.incomeItems.length} 
                          size="small" 
                          color={cut.incomeItems.length > 0 ? 'primary' : 'default'}
                        />
                      </TableCell>
                    </TableRow>
                    {/* Fila expandible con conceptos */}
                    {cut.incomeItems.length > 0 && (
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                          <Collapse in={expandedCuts.has(cut.id)} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2, bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                              <Typography variant="subtitle2" gutterBottom fontWeight={600} color="primary">
                                Conceptos de Ingreso ({cut.incomeItems.length})
                              </Typography>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>Concepto</TableCell>
                                    <TableCell align="center">Tipo</TableCell>
                                    <TableCell align="right">Monto</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {cut.incomeItems.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell>
                                        <Typography variant="body2">
                                          {item.concepto}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="center">
                                        <Chip
                                          label={item.tipo}
                                          size="small"
                                          color={item.tipo === 'ABONO' ? 'success' : 'error'}
                                          sx={{ minWidth: 75 }}
                                        />
                                      </TableCell>
                                      <TableCell align="right">
                                        <Typography
                                          variant="body2"
                                          fontWeight={500}
                                          color={item.tipo === 'ABONO' ? 'success.main' : 'error.main'}
                                        >
                                          {item.tipo === 'ABONO' ? '+ ' : '- '}
                                          {formatCurrency(item.monto)}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {/* Fila de totales */}
                                  <TableRow>
                                    <TableCell colSpan={2} align="right">
                                      <Typography variant="body2" fontWeight={600}>
                                        Balance Total:
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" fontWeight={700} color="primary">
                                        {formatCurrency(cut.income)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
