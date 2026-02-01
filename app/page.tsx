'use client';

import { Box, CircularProgress, Paper, Typography, Grid } from '@mui/material';
import Header from '@/components/Header';
import DashboardCards from '@/components/DashboardCards';
import DistributionChart from '@/components/Charts/DistributionChart';
import ComparisonChart from '@/components/Charts/ComparisonChart';
import { useInvestments } from '@/hooks/useInvestments';
import { useOperative } from '@/hooks/useOperative';
import { useDebts } from '@/hooks/useDebts';
import { useCash } from '@/hooks/useCash';
import { useSummary } from '@/hooks/useSummary';
import { useTransactions } from '@/hooks/useTransactions';
import { formatDateTime } from '@/lib/calculations';

export default function DashboardPage() {
  const { investments, loading: loadingInvestments } = useInvestments();
  const { operative, loading: loadingOperative } = useOperative();
  const { debts, loading: loadingDebts } = useDebts();
  const { cash, loading: loadingCash } = useCash();
  const { transactions, loading: loadingTransactions } = useTransactions();

  const summary = useSummary(investments, operative, debts, cash);

  const loading = loadingInvestments || loadingOperative || loadingDebts || loadingCash || loadingTransactions;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get last 5 transactions
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <Box>
      <Header
        title="Dashboard"
        subtitle="Resumen de tu situación financiera"
        showDate={true}
      />

      <DashboardCards summary={summary} />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DistributionChart investments={investments} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <ComparisonChart summary={summary} />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Últimas Transacciones
        </Typography>
        {recentTransactions.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>
            No hay transacciones recientes
          </Typography>
        ) : (
          <Box>
            {recentTransactions.map((tx) => (
              <Box
                key={tx.id}
                sx={{
                  py: 2,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:last-child': { borderBottom: 0 },
                }}
              >
                <Box>
                  <Typography fontWeight={500}>{tx.itemName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tx.category} - {formatDateTime(new Date(tx.date))}
                  </Typography>
                </Box>
                <Typography
                  color={
                    tx.field === 'created'
                      ? 'success.main'
                      : tx.field === 'deleted'
                      ? 'error.main'
                      : 'info.main'
                  }
                  fontWeight={600}
                >
                  {tx.field}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
