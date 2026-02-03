'use client';

import { Box, CircularProgress, Paper, Typography, Grid, Card, CardContent, Chip, LinearProgress, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Business,
  AccountBalance,
  CreditCard,
  AttachMoney,
  Timeline,
  ShowChart,
  ExpandMore,
  Person,
} from '@mui/icons-material';
import Header from '@/components/Header';
import { useInvestments } from '@/hooks/useInvestments';
import { useOperative } from '@/hooks/useOperative';
import { useDebts } from '@/hooks/useDebts';
import { useSummary } from '@/hooks/useSummary';
import { formatCurrency, formatPercentage } from '@/lib/calculations';
import { getCPCMovements, getCuentas, getGeneralCuts, getClients } from '@/lib/storage';
import { updateOperativeFromMovementsById } from '@/lib/operativeCalculations';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { investments, loading: loadingInvestments } = useInvestments();
  const { operative: operativeRaw, loading: loadingOperative } = useOperative();
  const { debts, loading: loadingDebts } = useDebts();

  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [cuts, setCuts] = useState<any[]>([]);
  const [topClients, setTopClients] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['investments', 'clients', 'movements']);

  // Recalcular operative con movimientos reales
  const movements = getCPCMovements();
  const cuentas = getCuentas();
  const operative = operativeRaw.map(op => updateOperativeFromMovementsById(op, movements, cuentas));

  const summary = useSummary(investments, operative, debts, []);

  const loading = loadingInvestments || loadingOperative || loadingDebts;

  useEffect(() => {
    // Obtener últimos movimientos CPC
    const allMovements = getCPCMovements()
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 10);
    setRecentMovements(allMovements);

    // Obtener últimos cortes
    const allCuts = getGeneralCuts()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setCuts(allCuts);

    // Calcular top clientes con más deuda
    const allClients = getClients();
    const allCPCMovements = getCPCMovements();
    
    const clientTotals = allCPCMovements.reduce((acc, mov) => {
      if (!acc[mov.clientName]) {
        acc[mov.clientName] = { cargo: 0, abono: 0, movimientos: 0 };
      }
      acc[mov.clientName].movimientos++;
      if (mov.tipo === 'CARGO') {
        acc[mov.clientName].cargo += mov.monto;
      } else if (mov.tipo === 'ABONO') {
        acc[mov.clientName].abono += mov.monto;
      }
      return acc;
    }, {} as Record<string, { cargo: number; abono: number; movimientos: number }>);

    const clientsWithBalances = allClients
      .map(client => ({
        ...client,
        balance: (clientTotals[client.name]?.cargo || 0) - (clientTotals[client.name]?.abono || 0),
        totalCargo: clientTotals[client.name]?.cargo || 0,
        totalAbono: clientTotals[client.name]?.abono || 0,
        movimientos: clientTotals[client.name]?.movimientos || 0,
      }))
      .filter(c => c.balance > 0 && c.status === 'ACTIVO')
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);

    setTopClients(clientsWithBalances);
  }, []);

  const handleAccordionToggle = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calcular métricas clave
  const totalActivos = summary.totalInvestments + summary.totalOperative;
  const liquidez = summary.totalOperative;
  const apalancamiento = totalActivos > 0 ? (Math.abs(summary.totalDebt) / totalActivos) * 100 : 0;
  
  // Top inversiones por monto
  const topInvestments = [...investments]
    .sort((a, b) => b.accumulated - a.accumulated)
    .slice(0, 5);

  // Inversiones con mejor rendimiento (P/M positivo)
  const bestPerformers = [...investments]
    .filter(inv => inv.profitLoss > 0)
    .sort((a, b) => b.profitLoss - a.profitLoss)
    .slice(0, 3);

  // Cards principales
  const mainCards = [
    {
      title: 'Patrimonio Neto',
      value: summary.netWorth,
      icon: AttachMoney,
      color: summary.netWorth >= 0 ? '#2e7d32' : '#d32f2f',
      bgColor: summary.netWorth >= 0 ? '#e8f5e9' : '#ffebee',
      subtitle: 'Total de activos menos pasivos',
    },
    {
      title: 'Inversiones',
      value: summary.totalInvestments,
      icon: TrendingUp,
      color: '#1976d2',
      bgColor: '#e3f2fd',
      subtitle: `${investments.length} inversiones activas`,
    },
    {
      title: 'Operativo (CPC)',
      value: summary.totalOperative,
      icon: Business,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
      subtitle: `${operative.length} conceptos`,
    },
    {
      title: 'Deudas',
      value: Math.abs(summary.totalDebt),
      icon: CreditCard,
      color: '#d32f2f',
      bgColor: '#ffebee',
      subtitle: `${debts.length} deudas registradas`,
    },
  ];

  // Métricas secundarias
  const metricsCards = [
    {
      label: 'Liquidez',
      value: formatCurrency(liquidez),
      description: 'Disponible en operativo',
      color: liquidez > 0 ? 'success' : 'error',
    },
    {
      label: 'Apalancamiento',
      value: formatPercentage(apalancamiento),
      description: 'Deuda / Activos',
      color: apalancamiento < 30 ? 'success' : apalancamiento < 50 ? 'warning' : 'error',
    },
    {
      label: 'Diversificación',
      value: `${investments.length} inversiones`,
      description: 'Número de activos',
      color: investments.length > 5 ? 'success' : 'warning',
    },
  ];

  return (
    <Box>
      <Header
        title="Dashboard"
        subtitle="Resumen de tu situación financiera"
        showDate={true}
      />

      {/* Cards Principales */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {mainCards.map((card) => {
          const Icon = card.icon;
          return (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.title}>
              <Card
                sx={{
                  height: '100%',
                  borderLeft: 4,
                  borderColor: card.color,
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box
                      sx={{
                        bgcolor: card.bgColor,
                        p: 1.5,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Icon sx={{ color: card.color, fontSize: 28 }} />
                    </Box>
                  </Box>
                  <Typography color="text.secondary" variant="body2" gutterBottom>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color={card.color} sx={{ mb: 0.5 }}>
                    {formatCurrency(card.value)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Métricas Clave */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Métricas Clave
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {metricsCards.map((metric) => (
            <Grid size={{ xs: 12, sm: 4 }} key={metric.label}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {metric.label}
                  </Typography>
                  <Chip label={metric.value} size="small" color={metric.color as any} />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {metric.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Secciones Colapsables */}
      <Box sx={{ mb: 3 }}>
        {/* Top Inversiones */}
        <Accordion 
          expanded={expandedSections.includes('investments')} 
          onChange={() => handleAccordionToggle('investments')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShowChart color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Top 5 Inversiones
              </Typography>
              <Chip label={topInvestments.length} size="small" color="primary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Por Balance
                </Typography>
                {topInvestments.length === 0 ? (
                  <Typography color="text.secondary">No hay inversiones</Typography>
                ) : (
                  topInvestments.map((inv, index) => (
                    <Box
                      key={inv.id}
                      sx={{
                        py: 2,
                        borderBottom: index < topInvestments.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={600}>#{index + 1}</Typography>
                          <Typography fontWeight={500}>{inv.concept}</Typography>
                          <Chip label={inv.type} size="small" variant="outlined" />
                        </Box>
                        <Typography fontWeight={600} color="primary.main">
                          {formatCurrency(inv.accumulated)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary">
                          Portfolio: {formatPercentage(inv.portfolio)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(inv.portfolio, 100)}
                          sx={{ flex: 1, height: 6, borderRadius: 1 }}
                        />
                      </Box>
                    </Box>
                  ))
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Mejor Rendimiento (P/M)
                </Typography>
                {bestPerformers.length === 0 ? (
                  <Typography color="text.secondary">No hay inversiones con ganancia</Typography>
                ) : (
                  bestPerformers.map((inv, index) => (
                    <Box
                      key={inv.id}
                      sx={{
                        py: 2,
                        borderBottom: index < bestPerformers.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography fontWeight={500}>{inv.concept}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {inv.type}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography fontWeight={600} color="success.main">
                            +{formatCurrency(inv.profitLoss)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(inv.accumulated)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Top Clientes con Deuda */}
        <Accordion 
          expanded={expandedSections.includes('clients')} 
          onChange={() => handleAccordionToggle('clients')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="error" />
              <Typography variant="h6" fontWeight={600}>
                Top Clientes con Deuda
              </Typography>
              <Chip label={topClients.length} size="small" color="error" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {topClients.length === 0 ? (
              <Typography color="text.secondary">No hay clientes con deuda pendiente</Typography>
            ) : (
              topClients.map((client, index) => (
                <Box
                  key={client.id}
                  sx={{
                    py: 2,
                    borderBottom: index < topClients.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography fontWeight={600}>#{index + 1}</Typography>
                      <Typography fontWeight={500}>{client.name}</Typography>
                      <Chip 
                        label={`${client.movimientos} movimientos`} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                    <Typography fontWeight={700} color="error.main">
                      {formatCurrency(client.balance)}
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Cargos: <strong style={{ color: '#d32f2f' }}>{formatCurrency(client.totalCargo)}</strong>
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Abonos: <strong style={{ color: '#2e7d32' }}>{formatCurrency(client.totalAbono)}</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                  <LinearProgress
                    variant="determinate"
                    value={client.totalAbono > 0 ? (client.totalAbono / client.totalCargo) * 100 : 0}
                    sx={{ mt: 1, height: 6, borderRadius: 1 }}
                    color="success"
                  />
                </Box>
              ))
            )}
          </AccordionDetails>
        </Accordion>

        {/* Movimientos Recientes CPC */}
        <Accordion 
          expanded={expandedSections.includes('movements')} 
          onChange={() => handleAccordionToggle('movements')}
          sx={{ mb: 2 }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline color="secondary" />
              <Typography variant="h6" fontWeight={600}>
                Movimientos Recientes (CPC)
              </Typography>
              <Chip label={recentMovements.length} size="small" color="secondary" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {recentMovements.length === 0 ? (
              <Typography color="text.secondary">No hay movimientos</Typography>
            ) : (
              <Box>
                {recentMovements.map((mov, index) => (
                  <Box
                    key={mov.id}
                    sx={{
                      py: 1.5,
                      borderBottom: index < recentMovements.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {mov.clientName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {mov.cpcName} - {new Date(mov.fecha).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          fontWeight={600}
                          color={mov.tipo === 'ABONO' ? 'success.main' : 'error.main'}
                        >
                          {mov.tipo === 'ABONO' ? '+' : '-'}{formatCurrency(mov.monto)}
                        </Typography>
                        <Chip
                          label={mov.tipo}
                          size="small"
                          color={mov.tipo === 'ABONO' ? 'success' : 'error'}
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        {/* Historial de Cortes */}
        <Accordion 
          expanded={expandedSections.includes('cuts')} 
          onChange={() => handleAccordionToggle('cuts')}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountBalance color="info" />
              <Typography variant="h6" fontWeight={600}>
                Historial de Cortes
              </Typography>
              <Chip label={cuts.length} size="small" color="info" />
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {cuts.length === 0 ? (
              <Typography color="text.secondary">No hay cortes registrados</Typography>
            ) : (
              <Box>
                {cuts.map((cut, index) => (
                  <Box
                    key={cut.id}
                    sx={{
                      py: 1.5,
                      borderBottom: index < cuts.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Corte General
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(cut.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Typography variant="caption" color="text.secondary">
                        Inversiones: {formatCurrency(cut.summary.totalInvestments)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Operativo: {formatCurrency(cut.summary.totalOperative)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Patrimonio: {formatCurrency(cut.summary.netWorth)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
}
