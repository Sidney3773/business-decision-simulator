import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  SmartToy,
  Replay,
  Home,
  Timer,
  AttachMoney
} from '@mui/icons-material';
import { simulationService } from '../../services/simulationService';
import { aiService } from '../../services/aiService';

// ─── Componente análisis IA del resultado ─────────────────────────────────────
const AIResultAnalysis = ({ simulation }) => {
  const [analisis, setAnalisis] = useState('');
  const [loading, setLoading] = useState(false);
  const [generado, setGenerado] = useState(false);
  const [error, setError] = useState('');

  const generar = async () => {
    setLoading(true);
    setError('');
    try {
      // Encontrar la decisión óptima (mayor score)
      const decisions = simulation.scenario?.decisions || [];
      const optima = decisions.reduce((best, d) =>
        (d.impact?.score || 0) > (best.impact?.score || 0) ? d : best,
        decisions[0]
      );
      const decisionTomada = simulation.decisionsMade?.[0];

      const res = await aiService.analyzeResult({
        scenarioTitle: simulation.scenario?.title || 'Escenario',
        decisionText: decisionTomada?.text || 'Decisión tomada',
        score: simulation.score,
        optimalDecision: optima?.text || 'Decisión óptima'
      });
      setAnalisis(res?.data?.analisis ?? 'Sin respuesta del modelo.');
      setGenerado(true);
    } catch {
      setError('No se pudo conectar con Ollama. Verifica que esté corriendo en localhost:11434');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1.5px solid',
        borderColor: 'primary.light',
        bgcolor: 'primary.50'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <SmartToy color="primary" fontSize="small" />
        <Typography variant="subtitle2" fontWeight={600}>
          Análisis IA — ¿En qué puedes mejorar?
        </Typography>
        <Chip label="Ollama" size="small" variant="outlined" sx={{ fontSize: 10 }} />
      </Box>

      {!generado ? (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            La IA analiza tu decisión, detecta sesgos cognitivos y te da un plan de mejora personalizado.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2, fontSize: 12 }}>{error}</Alert>}
          <Button
            variant="contained"
            size="small"
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SmartToy />}
            onClick={generar}
            disabled={loading}
            sx={{ borderRadius: 2 }}
          >
            {loading ? 'Analizando...' : 'Generar análisis IA'}
          </Button>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
          {analisis}
        </Typography>
      )}
    </Paper>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const SimulationResult = () => {
  const { simulationId } = useParams();
  const navigate = useNavigate();
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSimulation = useCallback(async () => {
    try {
      const res = await simulationService.getById(simulationId);
      setSimulation(res.data.simulation);
    } catch (err) {
      console.error('Error cargando resultado:', err);
      setError('No se pudo cargar el resultado de la simulación');
    } finally {
      setLoading(false);
    }
  }, [simulationId]);

  useEffect(() => {
    loadSimulation();
  }, [loadSimulation]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !simulation) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error || 'Resultado no encontrado'}</Alert>
        <Button startIcon={<Home />} variant="outlined" onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </Container>
    );
  }

  const score = simulation.score ?? 0;
  const status = simulation.status;
  const scenario = simulation.scenario;
  const decisionTomada = simulation.decisionsMade?.[0];

  // Encontrar la decisión óptima
  const decisions = scenario?.decisions || [];
  const optima = decisions.reduce((best, d) =>
    (d.impact?.score || 0) > (best.impact?.score || 0) ? d : best,
    decisions[0]
  );
  const esDontimaDecision = decisionTomada?.decisionId === optima?.id;

  const scoreColor = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error';
  const tiempoMin = Math.floor((simulation.timeTakenSeconds || 0) / 60);
  const tiempoSeg = (simulation.timeTakenSeconds || 0) % 60;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {/* Encabezado */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Resultado de Simulación
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {scenario?.title}
        </Typography>
      </Box>

      <Grid container spacing={3}>

        {/* ── Columna izquierda: puntuación y decisión ── */}
        <Grid item xs={12} md={6}>

          {/* Puntuación */}
          <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              {status === 'COMPLETED' ? (
                <EmojiEvents sx={{ fontSize: 56, color: `${scoreColor}.main` }} />
              ) : (
                <Cancel sx={{ fontSize: 56, color: 'error.main' }} />
              )}
            </Box>

            <Typography
              variant="h2"
              fontWeight={800}
              color={`${scoreColor}.main`}
              sx={{ lineHeight: 1 }}
            >
              {score}
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              puntos
            </Typography>

            <LinearProgress
              variant="determinate"
              value={score}
              color={scoreColor}
              sx={{ height: 10, borderRadius: 5, my: 2 }}
            />

            <Chip
              label={
                score >= 80 ? 'Excelente desempeño' :
                score >= 60 ? 'Buen desempeño' :
                score >= 40 ? 'Desempeño aceptable' : 'Necesita mejorar'
              }
              color={scoreColor}
              sx={{ fontWeight: 600, px: 1 }}
            />

            {/* Métricas de la simulación */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Timer sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Tiempo</Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  {tiempoMin}:{String(tiempoSeg).padStart(2, '0')} min
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <AttachMoney sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="body2" color="text.secondary">Presupuesto final</Typography>
                <Typography variant="subtitle2" fontWeight={600}>
                  ${parseFloat(simulation.finalBudget || 0).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Decisión tomada */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {esDontimaDecision
                ? <CheckCircle color="success" fontSize="small" />
                : <TrendingDown color="error" fontSize="small" />
              }
              Tu decisión
            </Typography>
            <Paper
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: esDontimaDecision ? 'success.50' : 'error.50',
                border: '1px solid',
                borderColor: esDontimaDecision ? 'success.light' : 'error.light'
              }}
            >
              <Typography variant="body2" fontWeight={500}>
                {decisionTomada?.text || 'Sin decisión registrada'}
              </Typography>
            </Paper>

            {!esDontimaDecision && optima && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TrendingUp fontSize="small" color="success" /> Decisión óptima
                </Typography>
                <Paper sx={{ p: 2, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
                  <Typography variant="body2" fontWeight={500} color="success.dark">
                    {optima.text}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>

          {/* Feedback del sistema */}
          {simulation.feedback && (
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Retroalimentación
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {simulation.feedback}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* ── Columna derecha: análisis IA y acciones ── */}
        <Grid item xs={12} md={6}>

          {/* Análisis IA */}
          <Box sx={{ mb: 3 }}>
            <AIResultAnalysis simulation={simulation} />
          </Box>

          {/* Detalle de todas las decisiones disponibles */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Comparativa de decisiones
            </Typography>
            {decisions.map((decision, idx) => {
              const esMia = decisionTomada?.decisionId === decision.id;
              const esOptima = decision.id === optima?.id;
              return (
                <Box key={decision.id || idx} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip
                      label={`${String.fromCharCode(65 + idx)}`}
                      size="small"
                      color={esOptima ? 'success' : esMia ? 'primary' : 'default'}
                      variant={esMia || esOptima ? 'filled' : 'outlined'}
                    />
                    {esMia && <Chip label="Tu elección" size="small" color="primary" variant="outlined" />}
                    {esOptima && <Chip label="Óptima" size="small" color="success" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    {decision.text}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, ml: 4, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Puntos: <strong>{decision.impact?.score ?? '—'}</strong>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Impacto: <strong>${(decision.impact?.budget || 0).toLocaleString()}</strong>
                    </Typography>
                  </Box>
                  {esMia && decision.impact?.feedback && (
                    <Paper sx={{ p: 1.5, mt: 0.5, ml: 4, borderRadius: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">
                        {decision.impact.feedback}
                      </Typography>
                    </Paper>
                  )}
                  <Divider sx={{ mt: 1.5 }} />
                </Box>
              );
            })}
          </Paper>

          {/* Botones de acción */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<Replay />}
              onClick={() => navigate(`/simulation/${scenario?.id}`)}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 600 }}
            >
              Intentar de nuevo
            </Button>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              startIcon={<Home />}
              onClick={() => navigate('/dashboard')}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              Inicio
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SimulationResult;