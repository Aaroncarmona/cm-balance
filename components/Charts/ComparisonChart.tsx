'use client';

import { Paper, Typography, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Summary } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface ComparisonChartProps {
  summary: Summary;
}

export default function ComparisonChart({ summary }: ComparisonChartProps) {
  const data = [
    {
      name: 'Activos',
      Inversiones: summary.totalInvestments,
      Operativo: summary.totalOperative,
      Caja: summary.totalCash,
    },
    {
      name: 'Pasivos',
      Deudas: Math.abs(summary.totalDebt),
    },
    {
      name: 'Neto',
      'Patrimonio Neto': summary.netWorth,
    },
  ];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Comparación de Categorías
      </Typography>
      <Box sx={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="Inversiones" fill="#1976d2" />
            <Bar dataKey="Operativo" fill="#9c27b0" />
            <Bar dataKey="Caja" fill="#2e7d32" />
            <Bar dataKey="Deudas" fill="#d32f2f" />
            <Bar dataKey="Patrimonio Neto" fill="#0288d1" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
