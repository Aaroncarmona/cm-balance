'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ButtonGroup,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Upload as UploadIcon,
  InsertDriveFile as ExcelIcon,
  Description as CSVIcon,
  Code as JSONIcon,
} from '@mui/icons-material';
import { exportToExcel, exportToCSV, exportToJSON } from '@/lib/export';
import { importFromJSON, importFromExcel, importFromCSV } from '@/lib/import';
import { exportAllData, importAllData } from '@/lib/storage';

interface ExportImportProps {
  investments: any[];
  operative: any[];
  debts: any[];
  cash: any[];
  onImportComplete: () => void;
}

export default function ExportImport({
  investments,
  operative,
  debts,
  cash,
  onImportComplete,
}: ExportImportProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleExport = async (format: 'excel' | 'csv' | 'json') => {
    setLoading(true);
    setError(null);

    try {
      if (format === 'excel') {
        await exportToExcel(investments, operative, debts, cash);
      } else if (format === 'csv') {
        await exportToCSV(investments, operative, debts, cash);
      } else if (format === 'json') {
        const data = await exportAllData();
        await exportToJSON(data);
      }
      setExportDialogOpen(false);
    } catch (err) {
      setError('Error al exportar: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      let data: any;

      if (file.name.endsWith('.json')) {
        data = await importFromJSON(file);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        data = await importFromExcel(file);
      } else if (file.name.endsWith('.csv')) {
        data = await importFromCSV(file);
      } else {
        throw new Error('Formato de archivo no soportado');
      }

      setPreviewData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!previewData) return;

    setLoading(true);
    setError(null);

    try {
      await importAllData(previewData);
      setImportDialogOpen(false);
      setPreviewData(null);
      onImportComplete();
    } catch (err) {
      setError('Error al importar: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={() => setExportDialogOpen(true)}
      >
        Exportar
      </Button>
      <Button
        variant="outlined"
        startIcon={<UploadIcon />}
        onClick={() => setImportDialogOpen(true)}
      >
        Importar
      </Button>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Exportar Datos</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Selecciona el formato de exportación:
          </Typography>
          <ButtonGroup fullWidth orientation="vertical" sx={{ mt: 2 }}>
            <Button
              startIcon={<ExcelIcon />}
              onClick={() => handleExport('excel')}
              disabled={loading}
              sx={{ justifyContent: 'flex-start', py: 2 }}
            >
              Exportar a Excel (.xlsx)
            </Button>
            <Button
              startIcon={<CSVIcon />}
              onClick={() => handleExport('csv')}
              disabled={loading}
              sx={{ justifyContent: 'flex-start', py: 2 }}
            >
              Exportar a CSV (.csv)
            </Button>
            <Button
              startIcon={<JSONIcon />}
              onClick={() => handleExport('json')}
              disabled={loading}
              sx={{ justifyContent: 'flex-start', py: 2 }}
            >
              Exportar a JSON (Backup completo)
            </Button>
          </ButtonGroup>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importar Datos</DialogTitle>
        <DialogContent>
          {!previewData ? (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Selecciona un archivo para importar (Excel, CSV o JSON):
              </Typography>
              <Button
                variant="contained"
                component="label"
                fullWidth
                sx={{ mt: 2 }}
                disabled={loading}
              >
                Seleccionar Archivo
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={handleFileSelect}
                />
              </Button>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Advertencia: La importación sobrescribirá todos los datos actuales.
              </Alert>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Vista previa de los datos a importar:
              </Typography>
              <List dense>
                {previewData.investments && (
                  <ListItem>
                    <ListItemText
                      primary="Inversiones"
                      secondary={`${previewData.investments.length} items`}
                    />
                  </ListItem>
                )}
                {previewData.operative && (
                  <ListItem>
                    <ListItemText
                      primary="Operativo"
                      secondary={`${previewData.operative.length} items`}
                    />
                  </ListItem>
                )}
                {previewData.debts && (
                  <ListItem>
                    <ListItemText primary="Deudas" secondary={`${previewData.debts.length} items`} />
                  </ListItem>
                )}
                {previewData.cash && (
                  <ListItem>
                    <ListItemText primary="Caja" secondary={`${previewData.cash.length} items`} />
                  </ListItem>
                )}
              </List>
              <Alert severity="info" sx={{ mt: 2 }}>
                Confirma para importar estos datos.
              </Alert>
            </>
          )}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setImportDialogOpen(false);
              setPreviewData(null);
              setError(null);
            }}
          >
            Cancelar
          </Button>
          {previewData && (
            <Button onClick={handleImportConfirm} variant="contained" disabled={loading}>
              Confirmar Importación
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
