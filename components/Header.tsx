'use client';

import { Box, Typography, Chip, Paper } from '@mui/material';
import { formatCurrency, formatDate } from '@/lib/calculations';

interface HeaderProps {
  title: string;
  subtitle?: string;
  totalValue?: number;
  showDate?: boolean;
}

export default function Header({ title, subtitle, totalValue, showDate = true }: HeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 3,
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        borderBottom: 2,
        borderColor: 'primary.main',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          {showDate && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {formatDate(new Date())}
            </Typography>
          )}
          {totalValue !== undefined && (
            <Chip
              label={formatCurrency(totalValue)}
              color={totalValue >= 0 ? 'success' : 'error'}
              sx={{ fontSize: '1rem', fontWeight: 600, height: 36 }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
}
