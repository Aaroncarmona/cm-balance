'use client';

import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import {
  TrendingUp,
  Business,
  CreditCard,
  AccountBalance,
  AccountBalanceWallet,
} from '@mui/icons-material';
import { formatCurrency } from '@/lib/calculations';
import { Summary } from '@/lib/types';

interface DashboardCardsProps {
  summary: Summary;
}

const iconMap = {
  investments: TrendingUp,
  operative: Business,
  debt: CreditCard,
  cash: AccountBalance,
  netWorth: AccountBalanceWallet,
};

export default function DashboardCards({ summary }: DashboardCardsProps) {
  const cards = [
    {
      title: 'Inversiones',
      value: summary.totalInvestments,
      icon: iconMap.investments,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Operativo',
      value: summary.totalOperative,
      icon: iconMap.operative,
      color: '#9c27b0',
      bgColor: '#f3e5f5',
    },
    {
      title: 'Deudas',
      value: summary.totalDebt,
      icon: iconMap.debt,
      color: '#d32f2f',
      bgColor: '#ffebee',
      isNegative: true,
    },
    {
      title: 'Caja',
      value: summary.totalCash,
      icon: iconMap.cash,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'Patrimonio Neto',
      value: summary.netWorth,
      icon: iconMap.netWorth,
      color: summary.netWorth >= 0 ? '#2e7d32' : '#d32f2f',
      bgColor: summary.netWorth >= 0 ? '#e8f5e9' : '#ffebee',
    },
  ];

  return (
    <Grid container spacing={3}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={card.title}>
            <Card
              sx={{
                height: '100%',
                borderLeft: 4,
                borderColor: card.color,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color={card.color}>
                      {formatCurrency(card.value)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: card.bgColor,
                      p: 1.5,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ color: card.color, fontSize: 28 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
