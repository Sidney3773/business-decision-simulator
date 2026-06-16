import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Grid,
  Tooltip
} from '@mui/material';
import {
  Add,
  Delete,
  CheckCircle,
  ArrowBack
} from '@mui/icons-material';
import { scenarioService } from '../../services/scenarioService';

const EditScenario = () => {
  const navigate = useNavigate();
  const { scenarioId } = useParams();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadScenario = useCallback(async () => {
    try {
      const res = await scenarioService.getById(scenarioId);
      const s = res.data.scenario;
      setFormData({
        title: s.title || '',
        description: s.description || '',
        difficulty: s.difficulty || 'MEDIUM',
        initialBudget: s.initialBudget || 100000,
        timeLimitMinutes: s.timeLimitMinutes || 30,
        decisions: s.decisions || []
      });
    } catch (err) {
      console.error('Error cargando escenario:', err);
      setError('No se pudo cargar el escenario para editar');
    } finally {
      setLoading(false);
    }
  }, [scenarioId]);

  useEffect(() => {
    loadScenario();
  }, [loadScenario]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDecisionChange = (index, field, value) => {
    setFormData(prev => {
      const newDecisions = [...prev.decisions];
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        newDecisions[index] = {
          ...newDecisions[index],
          [parent]: { ...newDecisions[index][parent], [child]: value }
        };
      } else {
        newDecisions[index] = { ...newDecisions[index], [field]: value };
      }
      return { ...prev, decisions: newDecisions };
    });
  };

  const addDecision = () => {
    setFormData(prev => ({
      ...prev,
      decisions: [
        ...prev.decisions,
        {
          id: prev.decisions.length + 1,
          text: '',
          impact: { budget: 0, score: 0, feedback: '' }
        }
      ]
    }));
  };

  const removeDecision = (index) => {
    if (formData.decisions.length === 1) {
      alert('Debe haber al menos una decisión');
      return;
    }
    setFormData(prev => ({
      ...prev,
      decisions: prev.decisions.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await scenarioService.update(scenarioId, formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!formData) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 4 }}>
      <Container maxWidth="md">
        <Alert severity="error">{error || 'Escenario no encontrado'}</Alert>
        <Button startIcon={<ArrowBack />} sx={{ mt: 2 }} onClick={() => navigate('/dashboard')}>Volver</Button>
      </Container></Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 4 }}>
    <Container maxWidth="md">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ bgcolor: 'white', boxShadow: 1, '&:hover': { bgcolor: 'grey.50' } }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{
            fontWeight: 800,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Editar Escenario
          </Typography>
          <Typography variant="body2" color="text.secondary">Modifica los campos del escenario.</Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>

          <TextField
            fullWidth
            label="Título del escenario"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Descripción / Contexto"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            multiline
            rows={4}
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Dificultad"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
              >
                <MenuItem value="EASY">Fácil</MenuItem>
                <MenuItem value="MEDIUM">Medio</MenuItem>
                <MenuItem value="HARD">Difícil</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Presupuesto inicial ($)"
                name="initialBudget"
                value={formData.initialBudget}
                onChange={handleChange}
                required
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Tiempo límite (min)"
                name="timeLimitMinutes"
                value={formData.timeLimitMinutes}
                onChange={handleChange}
                required
                inputProps={{ min: 5, max: 120 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>
              Decisiones
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formData.decisions.length} decisión(es)
            </Typography>
          </Box>

          {formData.decisions.map((decision, index) => (
            <Card key={index} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip
                    label={`Decisión ${String.fromCharCode(65 + index)}`}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                  <Tooltip title={formData.decisions.length === 1 ? 'Mínimo una decisión' : 'Eliminar decisión'}>
                    <span>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => removeDecision(index)}
                        disabled={formData.decisions.length === 1}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                <TextField
                  fullWidth
                  label="Texto de la decisión"
                  value={decision.text || ''}
                  onChange={(e) => handleDecisionChange(index, 'text', e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Impacto en presupuesto ($)"
                      value={decision.impact?.budget ?? 0}
                      onChange={(e) => handleDecisionChange(index, 'impact.budget', parseFloat(e.target.value))}
                      required
                      helperText="Negativo = gasto, Positivo = ingreso"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Puntuación (0–100)"
                      value={decision.impact?.score ?? 0}
                      onChange={(e) => handleDecisionChange(index, 'impact.score', parseInt(e.target.value))}
                      required
                      inputProps={{ min: 0, max: 100 }}
                      helperText="100 = decisión óptima"
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  label="Feedback para el estudiante"
                  value={decision.impact?.feedback || ''}
                  onChange={(e) => handleDecisionChange(index, 'impact.feedback', e.target.value)}
                  multiline
                  rows={2}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={addDecision}
            sx={{ mb: 3, borderRadius: 2 }}
            disabled={formData.decisions.length >= 5}
          >
            Agregar decisión
          </Button>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={saving} startIcon={saving ? null : <CheckCircle />}
              sx={{
                borderRadius: 2, py: 1.5, fontWeight: 700, fontSize: 16,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)' },
                transition: 'all 0.2s'
              }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
            <Button variant="outlined" fullWidth size="large" startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard')}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 600, borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
    </Box>
  );
};

export default EditScenario;