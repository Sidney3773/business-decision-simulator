import { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip,
  Box, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip,
  Snackbar, Alert, CircularProgress, Switch, FormControlLabel, Avatar, LinearProgress
} from '@mui/material';
import {
  Add, Edit, Delete, Preview, PublishedWithChanges, Unpublished,
  BarChart, MenuBook, CheckCircle, Assignment, TrendingUp,
  AttachMoney, Timer, School
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { scenarioService } from '../../services/scenarioService';
import { useAuth } from '../../contexts/AuthContext';

// ─── Modal: Vista previa ──────────────────────────────────────────────────────
const VistaPrevia = ({ scenario, open, onClose }) => {
  if (!scenario) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Preview sx={{ color: 'primary.main' }} />
        Vista previa — como lo ve el estudiante
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          Esta es la vista exacta que verá el estudiante al iniciar la simulación.
          El cronómetro iniciará automáticamente cuando el estudiante abra el escenario.
        </Alert>
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={scenario.difficulty === 'EASY' ? 'Fácil' : scenario.difficulty === 'MEDIUM' ? 'Medio' : 'Difícil'}
            color={scenario.difficulty === 'EASY' ? 'success' : scenario.difficulty === 'MEDIUM' ? 'warning' : 'error'}
          />
          <Chip icon={<Timer fontSize="small" />} label={`${scenario.timeLimitMinutes} minutos`} />
          <Chip icon={<AttachMoney fontSize="small" />} label={`$${parseFloat(scenario.initialBudget).toLocaleString()}`} color="primary" variant="outlined" />
        </Box>
        <Typography variant="h5" fontWeight={700} gutterBottom>{scenario.title}</Typography>
        <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>{scenario.description}</Typography>
        </Paper>
        <Typography variant="h6" gutterBottom>¿Qué decisión tomarás?</Typography>
        {scenario.decisions?.map((decision, idx) => (
          <Paper key={decision.id || idx} sx={{ p: 2, mb: 2, borderRadius: 2, border: '2px solid transparent', bgcolor: 'background.paper' }}>
            <FormControlLabel control={<Switch disabled />} label={<Typography variant="body1">{decision.text}</Typography>} />
          </Paper>
        ))}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Cerrar vista previa</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Modal: Confirmar eliminación ────────────────────────────────────────────
const ConfirmDelete = ({ open, onConfirm, onCancel, title }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>¿Eliminar escenario?</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        Vas a eliminar <strong>"{title}"</strong>. Esta acción no se puede deshacer
        y se perderán todas las simulaciones asociadas.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancelar</Button>
      <Button onClick={onConfirm} color="error" variant="contained">Sí, eliminar</Button>
    </DialogActions>
  </Dialog>
);

// ─── Dashboard principal ──────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [previewScenario, setPreviewScenario] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { loadScenarios(); }, []); // eslint-disable-line

  const loadScenarios = async () => {
    try {
      const res = await scenarioService.getAll();
      const list = res?.data?.scenarios ?? [];
      setScenarios(list.filter(s => s.createdBy === user.id));
    } catch {
      showSnackbar('Error al cargar los escenarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (scenario) => {
    const nuevoEstado = !scenario.isActive;
    setTogglingId(scenario.id);
    try {
      const result = await scenarioService.update(scenario.id, { isActive: nuevoEstado });
      if (!result.success) throw new Error(result.message || 'Error desconocido');
      setScenarios(prev => prev.map(s => s.id === scenario.id ? { ...s, isActive: nuevoEstado } : s));
      showSnackbar(
        nuevoEstado ? `"${scenario.title}" publicado — los estudiantes ya pueden verlo` : `"${scenario.title}" despublicado`,
        nuevoEstado ? 'success' : 'warning'
      );
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error al cambiar el estado', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await scenarioService.delete(deleteDialog.id);
      if (!result.success) throw new Error(result.message);
      setScenarios(prev => prev.filter(s => s.id !== deleteDialog.id));
      showSnackbar('Escenario eliminado correctamente');
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Error al eliminar el escenario', 'error');
    } finally {
      setDeleteDialog({ open: false, id: null, title: '' });
    }
  };

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });
  const difficultyColor = d => d === 'EASY' ? 'success' : d === 'MEDIUM' ? 'warning' : 'error';
  const difficultyLabel = d => d === 'EASY' ? 'Fácil' : d === 'MEDIUM' ? 'Medio' : 'Difícil';

  const published = scenarios.filter(s => s.isActive).length;
  const drafts = scenarios.filter(s => !s.isActive).length;

  if (loading) return <Box sx={{ width: '100%', mt: 4 }}><LinearProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 4 }}>
      <Container maxWidth="lg">

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{
              width: 60, height: 60, fontSize: '1.5rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                Bienvenido, {user?.name?.split(' ')[0]}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Gestiona tus escenarios y haz seguimiento del progreso de tus estudiantes
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stat Cards — mismo patrón que StudentDashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Paper sx={{
              p: 3, borderRadius: 3, color: 'white',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)',
              transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MenuBook sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>{scenarios.length}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Mis Escenarios</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{
              p: 3, borderRadius: 3, color: 'white',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              boxShadow: '0 8px 24px rgba(67, 233, 123, 0.4)',
              transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>{published}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Publicados</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Paper sx={{
              p: 3, borderRadius: 3, color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assignment sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>{drafts}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Borradores</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabla de escenarios */}
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
          <Box sx={{
            px: 3, py: 2.5,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid', borderColor: 'divider'
          }}>
            <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <School sx={{ color: '#f5576c' }} />
              Mis Escenarios
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/scenarios/create')}
              sx={{
                borderRadius: 2, textTransform: 'none', fontWeight: 600,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                boxShadow: '0 4px 12px rgba(240, 147, 251, 0.4)',
                '&:hover': { transform: 'scale(1.02)', boxShadow: '0 6px 20px rgba(240, 147, 251, 0.5)' }
              }}
            >
              + Crear Escenario
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Dificultad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Presupuesto</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tiempo</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Publicado</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scenarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <MenuBook sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary" sx={{ mb: 2 }}>
                          No has creado escenarios aún. ¡Crea el primero!
                        </Typography>
                        <Button variant="outlined" startIcon={<Add />}
                          onClick={() => navigate('/scenarios/create')} sx={{ borderRadius: 2 }}>
                          Crear escenario
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  scenarios.map(scenario => (
                    <TableRow key={scenario.id} sx={{
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(240, 147, 251, 0.05)', transform: 'translateX(3px)' }
                    }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{scenario.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={difficultyLabel(scenario.difficulty)} size="small"
                          color={difficultyColor(scenario.difficulty)} sx={{ fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AttachMoney fontSize="small" sx={{ color: 'text.disabled' }} />
                          <Typography variant="body2">{parseFloat(scenario.initialBudget).toLocaleString()}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Timer fontSize="small" sx={{ color: 'text.disabled' }} />
                          <Typography variant="body2">{scenario.timeLimitMinutes} min</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {togglingId === scenario.id ? <CircularProgress size={20} /> : (
                          <Tooltip title={scenario.isActive ? 'Clic para despublicar' : 'Clic para publicar'}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <Switch checked={!!scenario.isActive}
                                onChange={() => handleTogglePublish(scenario)} color="success" size="small" />
                              <Chip
                                icon={scenario.isActive ? <PublishedWithChanges /> : <Unpublished />}
                                label={scenario.isActive ? 'Publicado' : 'Borrador'}
                                size="small"
                                color={scenario.isActive ? 'success' : 'default'}
                                variant={scenario.isActive ? 'filled' : 'outlined'}
                              />
                            </Box>
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Vista previa (como lo ve el estudiante)">
                            <IconButton size="small" color="info"
                              onClick={() => { setPreviewScenario(scenario); setPreviewOpen(true); }}>
                              <Preview fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Ver reportes de este escenario">
                            <IconButton size="small" color="primary"
                              onClick={() => navigate(`/scenarios/${scenario.id}/report`)}>
                              <BarChart fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Editar escenario">
                            <IconButton size="small"
                              onClick={() => navigate(`/scenarios/edit/${scenario.id}`)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar escenario">
                            <IconButton size="small" color="error"
                              onClick={() => setDeleteDialog({ open: true, id: scenario.id, title: scenario.title })}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Accesos rápidos */}
        <Grid container spacing={2} sx={{ mt: 3 }}>
          {[
            { label: 'Ver Reportes', icon: <TrendingUp />, gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', shadow: 'rgba(102, 126, 234, 0.4)', path: '/reports' },
            { label: 'Crear Escenario', icon: <Add />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', shadow: 'rgba(240, 147, 251, 0.4)', path: '/scenarios/create' },
          ].map(a => (
            <Grid item xs={12} sm={6} key={a.label}>
              <Button fullWidth variant="contained" startIcon={a.icon}
                onClick={() => navigate(a.path)}
                sx={{
                  py: 1.5, borderRadius: 2, fontWeight: 600, textTransform: 'none', fontSize: 15,
                  background: a.gradient,
                  boxShadow: `0 4px 12px ${a.shadow}`,
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${a.shadow}` },
                  transition: 'all 0.2s'
                }}>
                {a.label}
              </Button>
            </Grid>
          ))}
        </Grid>

        <VistaPrevia scenario={previewScenario} open={previewOpen} onClose={() => setPreviewOpen(false)} />
        <ConfirmDelete open={deleteDialog.open} title={deleteDialog.title}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteDialog({ open: false, id: null, title: '' })} />

        <Snackbar open={snackbar.open} autoHideDuration={4000}
          onClose={() => setSnackbar(p => ({ ...p, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snackbar.severity}
            onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: 2 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default TeacherDashboard;