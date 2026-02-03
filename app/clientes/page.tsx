'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { Stack } from '@mui/material';
import { useClients } from '@/hooks/useClients';
import { getClients, saveClients, getCPCClients, getCPCMovements } from '@/lib/storage';
import { Client, ClientFormData } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

export default function ClientesPage() {
  const { clients: loadedClients, loading: loadingClients } = useClients();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Modal states
  const [clientModalOpen, setClientModalOpen] = useState(false);

  // Form data
  const [clientForm, setClientForm] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    ubicacion: '',
    notes: '',
    status: 'ACTIVO',
  });

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Load data
  useEffect(() => {
    if (!loadingClients) {
      const allClients = getClients();
      const allMovements = getCPCMovements();
      
      // Calculate totals from CPC movements (REAL data)
      const clientTotals = allMovements.reduce((acc, mov) => {
        if (!acc[mov.clientName]) {
          acc[mov.clientName] = { cargo: 0, abono: 0 };
        }
        if (mov.tipo === 'CARGO') {
          acc[mov.clientName].cargo += mov.monto;
        } else if (mov.tipo === 'ABONO') {
          acc[mov.clientName].abono += mov.monto;
        }
        return acc;
      }, {} as Record<string, { cargo: number; abono: number }>);

      // Update clients with totals
      const updatedClients = allClients.map(client => ({
        ...client,
        totalCargo: clientTotals[client.name]?.cargo || 0,
        totalAbono: clientTotals[client.name]?.abono || 0,
        balance: (clientTotals[client.name]?.cargo || 0) - (clientTotals[client.name]?.abono || 0),
      }));

      setClients(updatedClients);
      setLoading(false);
    }
  }, [loadingClients]);

  const activeClients = clients.filter(c => c.status === 'ACTIVO');
  const inactiveClients = clients.filter(c => c.status === 'INACTIVO');

  // Handlers
  const handleAddClient = () => {
    setSelectedClient(null);
    setClientForm({
      name: '',
      email: '',
      phone: '',
      ubicacion: '',
      notes: '',
      status: 'ACTIVO',
    });
    setClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setClientForm({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      ubicacion: client.ubicacion || '',
      notes: client.notes || '',
      status: client.status,
    });
    setClientModalOpen(true);
  };

  const handleSaveClient = () => {
    try {
      if (!clientForm.name.trim()) {
        setSnackbar({ open: true, message: 'El nombre es requerido', severity: 'error' });
        return;
      }

      if (selectedClient) {
        // Update existing
        const updatedClients = clients.map(c =>
          c.id === selectedClient.id
            ? {
                ...c,
                name: clientForm.name,
                email: clientForm.email,
                phone: clientForm.phone,
                ubicacion: clientForm.ubicacion,
                notes: clientForm.notes,
                status: clientForm.status,
                updatedAt: new Date(),
              }
            : c
        );
        setClients(updatedClients);
        saveClients(updatedClients);
      } else {
        // Add new
        const newClient: Client = {
          id: `client-${Date.now()}`,
          name: clientForm.name,
          email: clientForm.email,
          phone: clientForm.phone,
          ubicacion: clientForm.ubicacion,
          notes: clientForm.notes,
          totalCargo: 0,
          totalAbono: 0,
          balance: 0,
          status: clientForm.status,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const updatedClients = [...clients, newClient];
        setClients(updatedClients);
        saveClients(updatedClients);
        setSelectedClient(newClient);
      }

      setClientModalOpen(false);
      setSnackbar({ open: true, message: 'Cliente guardado correctamente', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Error al guardar', severity: 'error' });
    }
  };

  const handleDeleteClient = (id: string) => {
    if (confirm('¿Eliminar este cliente?')) {
      const updatedClients = clients.filter(c => c.id !== id);
      setClients(updatedClients);
      saveClients(updatedClients);
      if (selectedClient?.id === id) {
        setSelectedClient(null);
      }
      setSnackbar({ open: true, message: 'Cliente eliminado', severity: 'success' });
    }
  };

  if (loading || loadingClients) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          borderBottom: 2,
          borderColor: 'secondary.main',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Clientes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestión de clientes y directorio
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClient}
            color="secondary"
            size="large"
          >
            Nuevo Cliente
          </Button>
        </Box>
      </Paper>

      {/* Two Column Layout */}
      <Grid container spacing={3}>
        {/* LEFT: Clients List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600}>
                  Lista de Clientes
                </Typography>
                <Chip
                  label={`${activeClients.length} activos`}
                  color="success"
                  size="small"
                />
              </Box>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {clients.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary" gutterBottom>
                    No hay clientes registrados
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleAddClient}
                    sx={{ mt: 2 }}
                  >
                    Agregar cliente
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {activeClients.length > 0 && (
                    <>
                      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          ACTIVOS
                        </Typography>
                      </Box>
                      {activeClients.map((client, index) => (
                        <Box key={client.id}>
                          <ListItem
                            disablePadding
                            secondaryAction={
                              <Box>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    edge="end"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClient(client);
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    edge="end"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClient(client.id);
                                    }}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          >
                            <ListItemButton
                              selected={selectedClient?.id === client.id}
                              onClick={() => setSelectedClient(client)}
                            >
                              <ListItemText
                                primary={
                                  <Typography fontWeight={selectedClient?.id === client.id ? 600 : 400}>
                                    {client.name}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" display="block">
                                      Balance: <strong style={{ color: client.balance > 0 ? '#d32f2f' : '#2e7d32' }}>
                                        {formatCurrency(client.balance)}
                                      </strong>
                                    </Typography>
                                    {client.email && (
                                      <Typography variant="caption" color="text.secondary" display="block">
                                        {client.email}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                                secondaryTypographyProps={{ component: 'div' }}
                              />
                            </ListItemButton>
                          </ListItem>
                          {index < activeClients.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </>
                  )}

                  {inactiveClients.length > 0 && (
                    <>
                      <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100', mt: 2 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          INACTIVOS
                        </Typography>
                      </Box>
                      {inactiveClients.map((client, index) => (
                        <Box key={client.id}>
                          <ListItem
                            disablePadding
                            secondaryAction={
                              <Box>
                                <Tooltip title="Editar">
                                  <IconButton
                                    size="small"
                                    edge="end"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditClient(client);
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Eliminar">
                                  <IconButton
                                    size="small"
                                    edge="end"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteClient(client.id);
                                    }}
                                    color="error"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            }
                          >
                            <ListItemButton
                              selected={selectedClient?.id === client.id}
                              onClick={() => setSelectedClient(client)}
                            >
                              <ListItemText
                                primary={
                                  <Typography fontWeight={selectedClient?.id === client.id ? 600 : 400} color="text.secondary">
                                    {client.name}
                                  </Typography>
                                }
                                secondary={
                                  <Box sx={{ mt: 0.5 }}>
                                    <Typography variant="caption" display="block">
                                      Balance: {formatCurrency(client.balance)}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItemButton>
                          </ListItem>
                          {index < inactiveClients.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </>
                  )}
                </List>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* RIGHT: Client Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          {selectedClient ? (
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                <Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {selectedClient.name}
                  </Typography>
                  <Chip
                    label={selectedClient.status}
                    color={selectedClient.status === 'ACTIVO' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditClient(selectedClient)}
                >
                  Editar
                </Button>
              </Box>

              {/* Financial Summary Card */}
              <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Resumen Financiero
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Saldo Pendiente
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color={selectedClient.balance > 0 ? 'error.main' : 'success.main'}>
                        {formatCurrency(selectedClient.balance)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Total Cargo
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="error.main">
                        {formatCurrency(selectedClient.totalCargo)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Total Abono
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="success.main">
                        {formatCurrency(selectedClient.totalAbono)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Movimientos/Deudas CPC */}
              <Paper variant="outlined" sx={{ mb: 3 }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab icon={<ReceiptIcon />} iconPosition="start" label="Movimientos" />
                    <Tab icon={<TimelineIcon />} iconPosition="start" label="Por Concepto CPC" />
                  </Tabs>
                </Box>

                {/* Tab 1: Movimientos */}
                {tabValue === 0 && (
                  <Box sx={{ p: 3 }}>
                    {(() => {
                      const allMovements = getCPCMovements();
                      const clientMovements = allMovements
                        .filter(m => m.clientName === selectedClient.name)
                        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

                      if (clientMovements.length === 0) {
                        return (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary">
                              No hay movimientos registrados para este cliente
                            </Typography>
                          </Box>
                        );
                      }

                      return (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Fecha</TableCell>
                                <TableCell>Concepto CPC</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell align="right">Monto</TableCell>
                                <TableCell>Cuenta</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {clientMovements.map((mov) => (
                                <TableRow key={mov.id} hover>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {new Date(mov.fecha).toLocaleDateString()}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight={500}>
                                      {mov.cpcName}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={mov.tipo}
                                      size="small"
                                      color={mov.tipo === 'ABONO' ? 'success' : 'error'}
                                      icon={mov.tipo === 'ABONO' ? <TrendingDownIcon /> : <TrendingUpIcon />}
                                    />
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography
                                      variant="body2"
                                      fontWeight={600}
                                      color={mov.tipo === 'ABONO' ? 'success.main' : 'error.main'}
                                    >
                                      {mov.tipo === 'ABONO' ? '+' : ''}{formatCurrency(mov.monto)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {mov.cuentaId ? (
                                      <Chip
                                        label="Asignado"
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                      />
                                    ) : (
                                      <Chip
                                        label="Pendiente"
                                        size="small"
                                        variant="outlined"
                                        color="default"
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      );
                    })()}
                  </Box>
                )}

                {/* Tab 2: Por Concepto CPC */}
                {tabValue === 1 && (
                  <Box sx={{ p: 3 }}>
                    {(() => {
                      const allMovements = getCPCMovements();
                      const clientMovements = allMovements
                        .filter(m => m.clientName === selectedClient.name);

                      // Agrupar por concepto CPC
                      const movementsByCPC = clientMovements.reduce((acc, mov) => {
                        if (!acc[mov.cpcName]) {
                          acc[mov.cpcName] = { cargos: 0, abonos: 0, balance: 0, movimientos: 0 };
                        }
                        acc[mov.cpcName].movimientos++;
                        if (mov.tipo === 'CARGO') {
                          acc[mov.cpcName].cargos += mov.monto;
                        } else {
                          acc[mov.cpcName].abonos += mov.monto;
                        }
                        acc[mov.cpcName].balance = acc[mov.cpcName].cargos - acc[mov.cpcName].abonos;
                        return acc;
                      }, {} as Record<string, { cargos: number; abonos: number; balance: number; movimientos: number }>);

                      const cpcList = Object.entries(movementsByCPC);

                      if (cpcList.length === 0) {
                        return (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <TimelineIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary">
                              No hay movimientos registrados para este cliente
                            </Typography>
                          </Box>
                        );
                      }

                      return (
                        <Grid container spacing={2}>
                          {cpcList.map(([cpcName, data]) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cpcName}>
                              <Card variant="outlined">
                                <CardContent>
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="subtitle1" fontWeight={600}>
                                      {cpcName}
                                    </Typography>
                                    <Chip
                                      label={`${data.movimientos} mov.`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  </Box>
                                  <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Cargos:
                                      </Typography>
                                      <Typography variant="body2" color="error.main" fontWeight={600}>
                                        {formatCurrency(data.cargos)}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Abonos:
                                      </Typography>
                                      <Typography variant="body2" color="success.main" fontWeight={600}>
                                        {formatCurrency(data.abonos)}
                                      </Typography>
                                    </Box>
                                    <Divider />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                      <Typography variant="caption" fontWeight={600}>
                                        Balance:
                                      </Typography>
                                      <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        color={data.balance > 0 ? 'error.main' : data.balance < 0 ? 'success.main' : 'inherit'}
                                      >
                                        {formatCurrency(data.balance)}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      );
                    })()}
                  </Box>
                )}
              </Paper>

              {/* Contact Information */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Información de Contacto
                </Typography>
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {selectedClient.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon color="action" fontSize="small" />
                      <Typography variant="body2">{selectedClient.email}</Typography>
                    </Box>
                  )}
                  {selectedClient.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon color="action" fontSize="small" />
                      <Typography variant="body2">{selectedClient.phone}</Typography>
                    </Box>
                  )}
                  {selectedClient.ubicacion && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon color="action" fontSize="small" />
                      <Typography variant="body2">{selectedClient.ubicacion}</Typography>
                    </Box>
                  )}
                  {!selectedClient.email && !selectedClient.phone && !selectedClient.ubicacion && (
                    <Typography variant="body2" color="text.secondary">
                      No hay información de contacto disponible
                    </Typography>
                  )}
                </Stack>
              </Paper>

              {/* Notes */}
              {selectedClient.notes && (
                <Paper variant="outlined" sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Notas
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                    {selectedClient.notes}
                  </Typography>
                </Paper>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 5, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Selecciona un cliente
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Elige un cliente de la lista para ver sus detalles
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Client Modal */}
      <Dialog open={clientModalOpen} onClose={() => setClientModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedClient ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Nombre del Cliente *"
                value={clientForm.name}
                onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label="Correo"
                type="email"
                value={clientForm.email}
                onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
              />
              <TextField
                fullWidth
                label="Número"
                value={clientForm.phone}
                onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
              />
              <TextField
                fullWidth
                label="Ubicación"
                value={clientForm.ubicacion}
                onChange={(e) => setClientForm({ ...clientForm, ubicacion: e.target.value })}
              />
              <TextField
                fullWidth
                label="Notas"
                value={clientForm.notes}
                onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                select
                label="Estado"
                value={clientForm.status}
                onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as 'ACTIVO' | 'INACTIVO' })}
              >
                <MenuItem value="ACTIVO">Activo</MenuItem>
                <MenuItem value="INACTIVO">Inactivo</MenuItem>
              </TextField>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveClient} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
