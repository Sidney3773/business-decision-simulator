import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  IconButton
} from '@mui/material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Logout,
  Dashboard,
  Person,
  TrendingUp,
  KeyboardArrowDown
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN': return '#f44336';
      case 'TEACHER': return '#ff9800';
      case 'STUDENT': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'TEACHER': return 'Profesor';
      case 'STUDENT': return 'Estudiante';
      default: return role;
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            flexGrow: 1,
            cursor: 'pointer'
          }}
          onClick={() => navigate('/dashboard')}
        >
          <Box
            sx={{
              width: 45,
              height: 45,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <TrendingUp sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: 'white',
                letterSpacing: '-0.5px'
              }}
            >
              Business Simulator
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.7rem'
              }}
            >
              Entrena tus decisiones empresariales
            </Typography>
          </Box>
        </Box>

        {/* Navigation Buttons */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1, mr: 2 }}>
          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={() => navigate('/dashboard')}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 2,
              px: 2,
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.15)'
              }
            }}
          >
            Dashboard
          </Button>
        </Box>

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              display: { xs: 'none', sm: 'block' },
              textAlign: 'right',
              mr: 1
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: 'white'
              }}
            >
              {user.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '0.7rem',
                px: 1,
                py: 0.3,
                borderRadius: 1,
                background: getRoleColor(user.role),
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              {getRoleLabel(user.role)}
            </Typography>
          </Box>

          <IconButton
            onClick={handleMenu}
            sx={{
              p: 0,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              '&:hover': {
                border: '2px solid rgba(255, 255, 255, 0.6)'
              }
            }}
          >
            <Avatar
              sx={{
                width: 42,
                height: 42,
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 700,
                backdropFilter: 'blur(10px)'
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>

          <KeyboardArrowDown
            sx={{
              color: 'white',
              display: { xs: 'none', sm: 'block' }
            }}
          />
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 220,
              borderRadius: 2,
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)'
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" fontWeight={600}>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.email}
            </Typography>
          </Box>

          <Divider />

          <MenuItem
            onClick={() => {
              handleClose();
              navigate('/dashboard');
            }}
            sx={{ py: 1.5 }}
          >
            <Dashboard sx={{ mr: 1.5, fontSize: 20 }} />
            Dashboard
          </MenuItem>

          <MenuItem
            onClick={() => {
              handleClose();
              navigate('/profile');
            }}
            sx={{ py: 1.5 }}
          >
            <Person sx={{ mr: 1.5, fontSize: 20 }} />
            Mi Perfil
          </MenuItem>

          <Divider />

          <MenuItem
            onClick={handleLogout}
            sx={{
              py: 1.5,
              color: 'error.main'
            }}
          >
            <Logout sx={{ mr: 1.5, fontSize: 20 }} />
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;