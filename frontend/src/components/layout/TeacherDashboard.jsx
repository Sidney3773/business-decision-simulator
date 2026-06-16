import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  PublishedWithChanges,
  Unpublished,
  BarChart,
  Preview
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { scenarioService } from '../../services/scenarioService';
import { useAuth } from '../../contexts/AuthContext';

// ─── Modal: Vista previa del escenario ───────────────────────────────────────
const VistaPrevia = ({ scenario, open, onClose }) => {
  if (!scenario) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Preview sx={{ color: 'primary.main' }} />
        Vista previa — como lo ve el estudiante
      </DialogTitle>

      <DialogContent dividers>
        {/* Banner aclaratorio para el docente */}
        <Alert severity="info" sx={{ mb: 3 }}>
          Esta es la vista exacta que verá el estudiante al iniciar la simulación.
          El cronómetro iniciará automáticamente cuando el estudiante abra el escenario.
        </Alert>

        {/* Encabezado del escenario */}
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={scenario.difficulty === 'EASY' ? 'Fácil' : scenario.difficulty === 'MEDIUM' ? 'Medio' : 'Difícil'}
            color={scenario.difficulty === 'EASY' ? 'success' : scenario.difficulty === 'MEDIUM' ? 'warning' : 'error'}
          />
          <Chip label={`⏱ ${scenario.timeLimitMinutes} minutos`} />
          <Chip
            label={`$${parseFloat(scenario.initialBudget).toLocaleString()}`}
            color="primary"
            variant="outlined"
          />
        </Box>

        <Typography variant="h5" fontWeight={700} gutterBottom>
          {scenario.title}
        </Typography>

        <Paper sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, mb: 3 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
            {scenario.description}
          </Typography>
        </Paper>

        <Typography variant="h6" gutterBottom>
          ¿Qué decisión tomarás?
        </Typography>

        {scenario.decisions?.map((decision, idx) => (
          <Paper
            key={decision.id || idx}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 2,
              border: '2px solid transparent',
              bgcolor: 'background.paper'
            }}
          >
            <FormControlLabel
              control={<Switch disabled />}
              label={
                <Typography variant="body1">{decision.text}</Typography>
              }
            />
          </Paper>
        ))}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar vista previa
        </Button>
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
      <Button onClick={onConfirm} color="error" variant="contained">
        Sí, eliminar
      </Button>
    </DialogActions>
  </Dialog>
);

// ─── Dashboard principal ──────────────────────────────────────────────────────
const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);  // ID del escenario que está cambiando estado

  // Vista previa
  const [previewScenario, setPreviewScenario] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Confirmación de borrado
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, title: '' });

  // Notificaciones
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadScenarios();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadScenarios = async () => {
    try {
      // scenarioService.getAll() devuelve response.data → { success, data: { scenarios } }
      const res = await scenarioService.getAll();
      const list = res?.data?.scenarios ?? [];
      const myScenarios = list.filter(s => s.createdBy === user.id);
      setScenarios(myScenarios);
    } catch (error) {
      console.error('Error cargando escenarios:', error);
      showSnackbar('Error al cargar los escenarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ── Publicar / Despublicar ──────────────────────────────────────────────────
  const handleTogglePublish = async (scenario) => {
    const nuevoEstado = !scenario.isActive;
    setTogglingId(scenario.id);

    try {
      // scenarioService.update devuelve response.data directamente
      const result = await scenarioService.update(scenario.id, { isActive: nuevoEstado });

      if (!result.success) throw new Error(result.message || 'Error desconocido');

      // Actualiza el estado local sin recargar toda la lista
      setScenarios(prev =>
        prev.map(s =>
          s.id === scenario.id ? { ...s, isActive: nuevoEstado } : s
        )
      );

      showSnackbar(
        nuevoEstado
          ? `"${scenario.title}" publicado — los estudiantes ya pueden verlo`
          : `"${scenario.title}" despublicado — ya no visible para estudiantes`,
        nuevoEstado ? 'success' : 'warning'
      );
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      showSnackbar(
        error.response?.data?.message || 'Error al cambiar el estado del escenario',
        'error'
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ── Vista previa ────────────────────────────────────────────────────────────
  const handlePreview = (scenario) => {
    setPreviewScenario(scenario);
    setPreviewOpen(true);
  };

  // ── Eliminar ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    try {
      const result = await scenarioService.delete(deleteDialog.id);
      if (!result.success) throw new Error(result.message);
      setScenarios(prev => prev.filter(s => s.id !== deleteDialog.id));
      showSnackbar('Escenario eliminado correctamente', 'success');
    } catch (error) {
      console.error('Error eliminando escenario:', error);
      showSnackbar(
        error.response?.data?.message || 'Error al eliminar el escenario',
        'error'
      );
    } finally {
      setDeleteDialog({ open: false, id: null, title: '' });
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const difficultyColor = (d) =>
    d === 'EASY' ? 'success' : d === 'MEDIUM' ? 'warning' : 'error';

  const difficultyLabel = (d) =>
    d === 'EASY' ? 'Fácil' : d === 'MEDIUM' ? 'Medio' : 'Difícil';

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Dashboard — Docente
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido, {user?.name}
      </Typography>

      {/* Tarjetas de resumen */}
      <Grid container spacing={2} sx={{ mb: 3, mt: 1 }}>
        {[
          { label: 'Mis escenarios', value: scenarios.length, color: 'primary.main' },
          { label: 'Publicados', value: scenarios.filter(s => s.isActive).length, color: 'success.main' },
          { label: 'Borradores', value: scenarios.filter(s => !s.isActive).length, color: 'text.secondary' },
        ].map((card) => (
          <Grid item xs={12} sm={4} key={card.label}>
            <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center' }}>
              <Typography variant="h3" fontWeight={700} sx={{ color: card.color }}>
                {card.value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Tabla de escenarios */}
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            Mis Escenarios
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/scenarios/create')}
            sx={{ borderRadius: 2 }}
          >
            Crear Escenario
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Dificultad</TableCell>
                  <TableCell>Presupuesto</TableCell>
                  <TableCell>Tiempo</TableCell>
                  <TableCell align="center">Publicado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {scenarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No has creado escenarios aún. ¡Crea el primero!
                    </TableCell>
                  </TableRow>
                ) : (
                  scenarios.map((scenario) => (
                    <TableRow
                      key={scenario.id}
                      sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {scenario.title}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={difficultyLabel(scenario.difficulty)}
                          size="small"
                          color={difficultyColor(scenario.difficulty)}
                        />
                      </TableCell>

                      <TableCell>
                        ${parseFloat(scenario.initialBudget).toLocaleString()}
                      </TableCell>

                      <TableCell>
                        {scenario.timeLimitMinutes} min
                      </TableCell>

                      {/* ── Toggle publicar/despublicar ── */}
                      <TableCell align="center">
                        {togglingId === scenario.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Tooltip
                            title={
                              scenario.isActive
                                ? 'Clic para despublicar — los estudiantes dejarán de verlo'
                                : 'Clic para publicar — los estudiantes podrán verlo'
                            }
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <Switch
                                checked={!!scenario.isActive}
                                onChange={() => handleTogglePublish(scenario)}
                                color="success"
                                size="small"
                              />
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

                      {/* ── Acciones ── */}
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <Tooltip title="Vista previa (como lo ve el estudiante)">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handlePreview(scenario)}
                            >
                              <Preview fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Ver reportes de este escenario">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => navigate(`/scenarios/${scenario.id}`)}
                            >
                              <BarChart fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Editar escenario">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/scenarios/edit/${scenario.id}`)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Eliminar escenario">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  id: scenario.id,
                                  title: scenario.title
                                })
                              }
                            >
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
        )}
      </Paper>

      {/* ── Modales ── */}
      <VistaPrevia
        scenario={previewScenario}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      />

      <ConfirmDelete
        open={deleteDialog.open}
        title={deleteDialog.title}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, id: null, title: '' })}
      />

      {/* ── Snackbar de notificaciones ── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TeacherDashboard;