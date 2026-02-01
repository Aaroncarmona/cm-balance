'use client';

import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  TrendingUp as InvestmentIcon,
  Business as OperativeIcon,
  CreditCard as DebtIcon,
  AccountBalance as CashIcon,
  History as HistoryIcon,
  ViewList as ControlIcon,
  People as ClientesIcon,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';

const drawerWidth = 260;

const menuItems = [
  { text: 'Control', icon: <ControlIcon />, path: '/control' },
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: 'Clientes', icon: <ClientesIcon />, path: '/clientes' },
  { text: 'Inversiones', icon: <InvestmentIcon />, path: '/inversiones' },
  { text: 'Operativo', icon: <OperativeIcon />, path: '/operativo-detalle' },
  { text: 'Deudas', icon: <DebtIcon />, path: '/deudas' },
  { text: 'Caja', icon: <CashIcon />, path: '/caja' },
  { text: 'Historial', icon: <HistoryIcon />, path: '/historial' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <Toolbar sx={{ px: 3, py: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary">
            Banlance
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Control Financiero
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => router.push(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? 'inherit' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
