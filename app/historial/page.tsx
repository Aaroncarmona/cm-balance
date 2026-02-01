'use client';

import { Box, CircularProgress } from '@mui/material';
import Header from '@/components/Header';
import TransactionHistory from '@/components/TransactionHistory';
import { useTransactions } from '@/hooks/useTransactions';

export default function HistorialPage() {
  const { transactions, loading } = useTransactions();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Header
        title="Historial"
        subtitle="Registro de todas las transacciones y cambios"
        showDate={true}
      />

      <TransactionHistory transactions={transactions} />
    </Box>
  );
}
