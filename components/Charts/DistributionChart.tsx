'use client';

import { Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Investment } from '@/lib/types';
import { formatCurrency } from '@/lib/calculations';

interface DistributionChartProps {
  investments: Investment[];
}

const COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#0288d1'];

export default function DistributionChart({ investments }: DistributionChartProps) {
  // Group by type
  const dataByType = investments.reduce((acc, inv) => {
    const existing = acc.find((item) => item.name === inv.type);
    if (existing) {
      existing.value += inv.accumulated;
    } else {
      acc.push({ name: inv.type, value: inv.accumulated });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  if (dataByType.length === 0) {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">No hay datos para mostrar</Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Distribución de Inversiones por Tipo
      </Typography>
      <Box sx={{ height: 350 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataByType}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {dataByType.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
