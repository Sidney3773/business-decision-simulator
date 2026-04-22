import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Box,
  Alert,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  PlayArrow,
  History,
  EmojiEvents,
  Speed,
  TrendingUp,
  Star
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { scenarioService } from '../../services/scenarioService';
import { simulationService } from '../../services/simulationService';
import { useAuth } from '../../contexts/AuthContext';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [recentSimulations, setRecentSimulations] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [scenariosRes, simulationsRes] = await Promise.all([
        scenarioService.getAll({ isActive: true }),
        simulationService.getUserSimulations(user.id)
      ]);
      setScenarios(scenariosRes.data.scenarios);
      
      const sims = simulationsRes.data.simulations;
      setRecentSimulations(sims.slice(0, 5));
      
      // Calcular estadísticas
      const completed = sims.filter(s => s.status === 'COMPLETED').length;
      const avgScore = sims.length > 0 
        ? (sims.reduce((sum, s) => sum + s.score, 0) / sims.length).toFixed(1)
        : 0;
      
      setStats({
        total: sims.length,
        avgScore,
        completed
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'EASY': return 'success';
      case 'MEDIUM': return 'warning';
      case 'HARD': return 'error';
      default: return 'default';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'info';
    if (score >= 50) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        {/* Header con Bienvenida */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontSize: '1.5rem',
                fontWeight: 700
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                ¡Hola, {user?.name?.split(' ')[0]}! 👋
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ¿Listo para mejorar tus habilidades de decisión?
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEvents sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>
                    {stats.avgScore}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Puntuación Promedio
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Speed sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>
                    {stats.completed}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Simulaciones Completadas
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(79, 172, 254, 0.4)',
                transition: 'transform 0.3s ease',
                '&:hover': { transform: 'translateY(-5px)' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Simulaciones
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Escenarios Disponibles */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
              }}
            >
              <Typography
                variant="h5"
                fontWeight={700}
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Star sx={{ color: '#667eea' }} />
                Escenarios Disponibles
              </Typography>
              
              {scenarios.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No hay escenarios disponibles actualmente
                </Alert>
              ) : (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {scenarios.map((scenario) => (
                    <Grid item xs={12} key={scenario.id}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          border: '2px solid transparent',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            border: '2px solid #667eea',
                            transform: 'translateX(5px)',
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)'
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Typography variant="h6" fontWeight={700}>
                              {scenario.title}
                            </Typography>
                            <Chip
                              label={scenario.difficulty}
                              color={getDifficultyColor(scenario.difficulty)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {scenario.description}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              size="small"
                              label={`💰 $${parseFloat(scenario.initialBudget).toLocaleString()}`}
                              variant="outlined"
                            />
                            <Chip
                              size="small"
                              label={`⏱️ ${scenario.timeLimitMinutes} min`}
                              variant="outlined"
                            />
                          </Box>
                        </CardContent>
                        
                        <CardActions sx={{ px: 2, pb: 2 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => navigate(`/simulation/${scenario.id}`)}
                            sx={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              fontWeight: 600,
                              textTransform: 'none',
                              borderRadius: 2,
                              py: 1,
                              '&:hover': {
                                transform: 'scale(1.02)',
                                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)'
                              }
                            }}
                          >
                            Iniciar Simulación
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* Historial Reciente */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                height: '100%'
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <History sx={{ color: '#667eea' }} />
                Historial Reciente
              </Typography>
              
              {recentSimulations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No has completado simulaciones aún
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ mt: 2 }}>
                  {recentSimulations.map((sim) => (
                    <Card
                      key={sim.id}
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        border: '1px solid #f0f0f0',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <CardContent sx={{ pb: 1.5 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          {sim.scenario?.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Chip
                            label={`${sim.score} pts`}
                            size="small"
                            color={getScoreColor(sim.score)}
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip
                            label={sim.status === 'COMPLETED' ? '✓ Completado' : sim.status}
                            size="small"
                            color={sim.status === 'COMPLETED' ? 'success' : 'default'}
                          />
                        </Box>
                        
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          {new Date(sim.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/my-simulations')}
                    sx={{
                      mt: 1,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Ver Todas
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StudentDashboard;