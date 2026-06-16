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
  Avatar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment
} from '@mui/material';
import {
  Search,
  History,
  EmojiEvents,
  TrendingUp,
  Star,
  Timer,
  AttachMoney,
  Visibility,
  Replay,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { simulationService } from '../../services/simulationService';
import { useAuth } from '../../contexts/AuthContext';

const MySimulations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [simulations, setSimulations] = useState([]);
  const [filteredSimulations, setFilteredSimulations] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgScore: 0, completed: 0, highestScore: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await simulationService.getUserSimulations(user.id);
      const sims = res.data.simulations || [];
      setSimulations(sims);
      setFilteredSimulations(sims);

      // Calcular estadísticas
      const completed = sims.filter(s => s.status === 'COMPLETED').length;
      const total = sims.length;
      const avgScore = total > 0 
        ? parseFloat((sims.reduce((sum, s) => sum + (s.score || 0), 0) / total).toFixed(1))
        : 0;
      const highestScore = total > 0
        ? Math.max(...sims.map(s => s.score || 0))
        : 0;

      setStats({
        total,
        avgScore,
        completed,
        highestScore
      });
    } catch (error) {
      console.error('Error cargando simulaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Aplicar filtros y orden
  useEffect(() => {
    let result = [...simulations];

    // Búsqueda por título de escenario
    if (searchTerm.trim() !== '') {
      result = result.filter(sim => 
        sim.scenario?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por dificultad
    if (difficultyFilter !== 'ALL') {
      result = result.filter(sim => sim.scenario?.difficulty === difficultyFilter);
    }

    // Filtro por estado
    if (statusFilter !== 'ALL') {
      result = result.filter(sim => sim.status === statusFilter);
    }

    // Ordenar
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'highest-score') {
      result.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === 'lowest-score') {
      result.sort((a, b) => (a.score || 0) - (b.score || 0));
    }

    setFilteredSimulations(result);
  }, [simulations, searchTerm, difficultyFilter, statusFilter, sortBy]);

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
        {/* Header con botón para volver */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/dashboard')}
              startIcon={<ArrowBack />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'rgba(102, 126, 234, 0.5)',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#667eea',
                  background: 'rgba(102, 126, 234, 0.05)'
                }
              }}
            >
              Volver al Dashboard
            </Button>
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
                Mi Historial de Simulaciones 📜
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revisa tus decisiones, feedback previo y análisis de desempeño.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEvents sx={{ fontSize: 40, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h4" fontWeight={800}>
                    {stats.avgScore}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                    Puntuación Promedio
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(56, 239, 125, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Star sx={{ fontSize: 40, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h4" fontWeight={800}>
                    {stats.highestScore} pts
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                    Mejor Puntuación
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <History sx={{ fontSize: 40, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h4" fontWeight={800}>
                    {stats.completed}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                    Completadas
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp sx={{ fontSize: 40, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h4" fontWeight={800}>
                    {stats.total}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, display: 'block' }}>
                    Total Intentos
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Panel de Filtros */}
        <Paper sx={{ p: 3, borderRadius: 3, mb: 4, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Buscar escenario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel id="difficulty-filter-label">Dificultad</InputLabel>
                <Select
                  labelId="difficulty-filter-label"
                  value={difficultyFilter}
                  label="Dificultad"
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="ALL">Todas</MenuItem>
                  <MenuItem value="EASY">Fácil</MenuItem>
                  <MenuItem value="MEDIUM">Medio</MenuItem>
                  <MenuItem value="HARD">Difícil</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="medium">
                <InputLabel id="status-filter-label">Estado</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Estado"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="ALL">Todos</MenuItem>
                  <MenuItem value="COMPLETED">Completados</MenuItem>
                  <MenuItem value="IN_PROGRESS">En Progreso</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} md={4}>
              <FormControl fullWidth size="medium">
                <InputLabel id="sort-by-label">Ordenar por</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sortBy}
                  label="Ordenar por"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="newest">Fecha: Más reciente</MenuItem>
                  <MenuItem value="oldest">Fecha: Más antiguo</MenuItem>
                  <MenuItem value="highest-score">Puntuación: Más alta</MenuItem>
                  <MenuItem value="lowest-score">Puntuación: Más baja</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Lista de Simulaciones */}
        {filteredSimulations.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 3, textAlign: 'center', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No se encontraron simulaciones
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Prueba a cambiar los filtros de búsqueda o realiza una nueva simulación.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Ir a Escenarios Disponibles
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredSimulations.map((sim) => (
              <Grid item xs={12} key={sim.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    border: '1.5px solid transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#667eea',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Chip
                            label={sim.scenario?.difficulty}
                            color={getDifficultyColor(sim.scenario?.difficulty)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Realizado el:{' '}
                            {new Date(sim.createdAt).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </Box>
                        <Typography variant="h6" fontWeight={700} gutterBottom>
                          {sim.scenario?.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {sim.scenario?.description}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Timer sx={{ color: 'text.secondary', fontSize: 18 }} />
                            <Typography variant="body2" color="text.secondary">
                              Tiempo:{' '}
                              <strong>
                                {Math.floor((sim.timeTakenSeconds || 0) / 60)}:
                                {String((sim.timeTakenSeconds || 0) % 60).padStart(2, '0')} min
                              </strong>
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoney sx={{ color: 'text.secondary', fontSize: 18 }} />
                            <Typography variant="body2" color="text.secondary">
                              Presupuesto final:{' '}
                              <strong>
                                ${parseFloat(sim.finalBudget || 0).toLocaleString()}
                              </strong>
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} sm={6} md={3} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                        <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Puntuación obtenida
                          </Typography>
                          <Chip
                            label={`${sim.score} / 100 pts`}
                            color={getScoreColor(sim.score)}
                            sx={{
                              fontWeight: 700,
                              fontSize: '1rem',
                              px: 1,
                              py: 2,
                              borderRadius: 2
                            }}
                          />
                          <Chip
                            label={sim.status === 'COMPLETED' ? 'Completado' : sim.status}
                            size="small"
                            variant="outlined"
                            color={sim.status === 'COMPLETED' ? 'success' : 'default'}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                  
                  <CardActions
                    sx={{
                      px: 3,
                      pb: 3,
                      pt: 0,
                      justifyContent: 'flex-end',
                      gap: 1.5
                    }}
                  >
                    <Button
                      variant="outlined"
                      startIcon={<Replay />}
                      size="small"
                      onClick={() => navigate(`/simulation/${sim.scenario?.id}`)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Intentar de nuevo
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Visibility />}
                      size="small"
                      onClick={() => navigate(`/simulation-result/${sim.id}`)}
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                        }
                      }}
                    >
                      Ver Resultados & Feedback
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default MySimulations;
