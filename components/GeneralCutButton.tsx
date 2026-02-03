'use client';

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  ContentCut as CutIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { executeGeneralCut, restoreGeneralCut } from '@/lib/generalCut';
import { getGeneralCuts, deleteGeneralCut } from '@/lib/storage';
import { GeneralCut } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/calculations';

interface GeneralCutButtonProps {
  onCutComplete?: () => void;
}

export default function GeneralCutButton({ onCutComplete }: GeneralCutButtonProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [cuts, setCuts] = useState<GeneralCut[]>([]);

  const handleOpenConfirm = () => {
    setNotes('');
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirm = () => {
    setConfirmDialogOpen(false);
    setNotes('');
  };

  const handleExecuteCut = async () => {
    if (!confirm('¿Estás seguro de hacer el corte general? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    try {
      await executeGeneralCut(notes);
      handleCloseConfirm();
      if (onCutComplete) {
        onCutComplete();
      }
      window.location.reload();
    } catch (error) {
      console.error('Error al ejecutar corte:', error);
      alert('Error al ejecutar el corte general');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = () => {
    const allCuts = getGeneralCuts();
    // Ordenar por fecha descendente (más reciente primero)
    allCuts.sort((a, b) => new Date(b.cutDate).getTime() - new Date(a.cutDate).getTime());
    setCuts(allCuts);
    setHistoryDialogOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
  };

  const handleRestoreCut = async (cutId: string) => {
    if (!confirm('¿Restaurar este corte? Se reemplazarán todos los datos actuales.')) {
      return;
    }

    setLoading(true);
    try {
      await restoreGeneralCut(cutId);
      handleCloseHistory();
      window.location.reload();
    } catch (error) {
      console.error('Error al restaurar corte:', error);
      alert('Error al restaurar el corte');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCut = (cutId: string) => {
    if (!confirm('¿Eliminar este corte del historial?')) {
      return;
    }

    try {
      deleteGeneralCut(cutId);
      const updatedCuts = cuts.filter(c => c.id !== cutId);
      setCuts(updatedCuts);
    } catch (error) {
      console.error('Error al eliminar corte:', error);
      alert('Error al eliminar el corte');
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      {/* Botón principal para hacer corte */}
      <Button
        variant="contained"
        color="warning"
        startIcon={<CutIcon />}
        onClick={handleOpenConfirm}
        sx={{ fontWeight: 600 }}
      >
        Hacer Corte General
      </Button>

      {/* Botón para ver historial */}
      <Button
        variant="outlined"
        color="warning"
        startIcon={<HistoryIcon />}
        onClick={handleOpenHistory}
      >
        Historial
      </Button>

      {/* Dialog de confirmación */}
      <Dialog open={confirmDialogOpen} onClose={handleCloseConfirm} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Confirmar Corte General
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            El corte general guardará el estado actual y reseteará:
          </Alert>
          <Box sx={{ mb: 2, pl: 2 }}>
            <Typography variant="body2" gutterBottom>
              • <strong>Anterior</strong> = Balance/Acumulado actual
            </Typography>
            <Typography variant="body2" gutterBottom>
              • <strong>Actual</strong> = 0
            </Typography>
            <Typography variant="body2" gutterBottom>
              • <strong>Movimientos</strong> = [] (se limpian)
            </Typography>
            <Typography variant="body2" gutterBottom>
              • <strong>Cuentas</strong> = CERRADAS (del período anterior)
            </Typography>
          </Box>
          <TextField
            label="Notas (opcional)"
            multiline
            rows={3}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Corte Q1 2026"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleExecuteCut}
            variant="contained"
            color="warning"
            disabled={loading}
          >
            {loading ? 'Ejecutando...' : 'Confirmar Corte'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de historial */}
      <Dialog open={historyDialogOpen} onClose={handleCloseHistory} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>
          Historial de Cortes Generales
        </DialogTitle>
        <DialogContent>
          {cuts.length === 0 ? (
            <Alert severity="info">No hay cortes registrados</Alert>
          ) : (
            <List>
              {cuts.map((cut, index) => (
                <Box key={cut.id}>
                  <ListItem
                    sx={{
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          Corte #{cuts.length - index}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(new Date(cut.cutDate))}
                        </Typography>
                      </Box>
                      <Chip
                        label={`Patrimonio: ${formatCurrency(cut.summary.netWorth)}`}
                        color={cut.summary.netWorth >= 0 ? 'success' : 'error'}
                        size="small"
                      />
                    </Box>

                    {cut.notes && (
                      <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                        {cut.notes}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, width: '100%', mb: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Inversiones
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(cut.summary.totalInvestments)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Operativo
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(cut.summary.totalOperative)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Deudas
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(cut.summary.totalDebt)}
                        </Typography>
                      </Box>
                    </Box>

                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRestoreCut(cut.id)}
                        disabled={loading}
                        color="primary"
                        title="Restaurar corte"
                      >
                        <RestoreIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteCut(cut.id)}
                        disabled={loading}
                        color="error"
                        title="Eliminar corte"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < cuts.length - 1 && <Divider sx={{ my: 1 }} />}
                </Box>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
