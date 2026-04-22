import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Box
} from '@mui/material';
import { People, School, Assignment, TrendingUp } from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalScenarios: 0,
    totalSimulations: 0,
    avgScore: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [usersRes, scenariosRes, simulationsRes] = await Promise.all([
        api.get('/users'),
        api.get('/scenarios'),
        api.get('/simulations')
      ]);

      const simulations = simulationsRes.data.data.simulations;
      const avgScore = simulations.length > 0
        ? simulations.reduce((sum, sim) => sum + sim.score, 0) / simulations.length
        : 0;

      setStats({
        totalUsers: usersRes.data.data.pagination.total,
        totalScenarios: scenariosRes.data.data.scenarios.length,
        totalSimulations: simulations.length,
        avgScore: avgScore.toFixed(1)
      });
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const StatCard = ({ title, value, icon, color }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4">{value}</Typography>
          </Box>
          <Box sx={{ color: color, fontSize: 48 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard - Administrador
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido, {user?.name}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Usuarios"
            value={stats.totalUsers}
            icon={<People />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Escenarios"
            value={stats.totalScenarios}
            icon={<School />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Simulaciones"
            value={stats.totalSimulations}
            icon={<Assignment />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Score Promedio"
            value={stats.avgScore}
            icon={<TrendingUp />}
            color="info.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Panel de Control
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Desde aquí puedes gestionar usuarios, escenarios y visualizar todas las simulaciones.
              Usa el menú de navegación para acceder a cada sección.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;