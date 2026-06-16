import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Chip,
  CircularProgress,
  LinearProgress,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Timer,
  Warning,
  CheckCircle,
  Cancel,
  AccessTime
} from '@mui/icons-material';
import { scenarioService } from '../../services/scenarioService';
import { simulationService } from '../../services/simulationService';
import AIAssistant from './AIAssistant'; // ← NUEVO

// ─── Cronómetro ───────────────────────────────────────────────────────────────
const Cronometro = ({ totalSeconds, onTimeUp }) => {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [onTimeUp]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const porcentaje = (secondsLeft / totalSeconds) * 100;

  const color = porcentaje > 50 ? 'success' : porcentaje > 20 ? 'warning' : 'error';
  const bgColor = porcentaje > 50 ? '#e8f5e9' : porcentaje > 20 ? '#fff8e1' : '#ffebee';
  const textColor = porcentaje > 50 ? '#2e7d32' : porcentaje > 20 ? '#e65100' : '#c62828';

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          bgcolor: bgColor,
          border: '2px solid',
          borderColor: `${color}.main`,
          borderRadius: 3,
          px: 3,
          py: 2,
          mb: 1.5,
          transition: 'all 0.5s ease',
          animation: porcentaje <= 20 ? 'pulse 1s infinite' : 'none',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.7 }
          }
        }}
      >
        {porcentaje <= 20
          ? <Warning sx={{ color: textColor, fontSize: 28 }} />
          : <AccessTime sx={{ color: textColor, fontSize: 28 }} />
        }
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: textColor,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 4,
            lineHeight: 1
          }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={porcentaje}
        color={color}
        sx={{ height: 8, borderRadius: 4 }}
      />

      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        textAlign="center"
        sx={{ mt: 0.5 }}
      >
        {porcentaje > 50
          ? 'Tómate el tiempo que necesitas'
          : porcentaje > 20
          ? '⚠️ El tiempo se acaba — decide pronto'
          : '🚨 ¡Menos de un minuto!'}
      </Typography>
    </Box>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const RunSimulation = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();

  const [scenario, setScenario] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState('');
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeUp, setTimeUp] = useState(false);

  const loadScenario = useCallback(async () => {
    try {
      const res = await scenarioService.getById(scenarioId);
      setScenario(res.data.scenario);
    } catch (err) {
      console.error('Error al cargar escenario:', err);
      setError('Error cargando el escenario');
    } finally {
      setLoading(false);
    }
  }, [scenarioId]);

  useEffect(() => {
    loadScenario();
  }, [loadScenario]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (!selectedDecision && !auto) {
      alert('Por favor selecciona una decisión');
      return;
    }
    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    try {
      const result = await simulationService.run({
        scenarioId: parseInt(scenarioId),
        decisionIds: selectedDecision ? [parseInt(selectedDecision)] : [],
        timeTakenSeconds: timeTaken
      });
      navigate(`/simulation-result/${result.data.simulation.id}`);
    } catch (err) {
      console.error('Error al ejecutar simulación:', err);
      setError('Error ejecutando la simulación');
      setSubmitting(false);
    }
  }, [selectedDecision, startTime, scenarioId, navigate]);

  const handleTimeUp = useCallback(() => {
    setTimeUp(true);
    if (selectedDecision) {
      handleSubmit(true);
    }
  }, [selectedDecision, handleSubmit]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!scenario) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Escenario no encontrado</Alert>
      </Container>
    );
  }

  const totalSeconds = (scenario.timeLimitMinutes || 30) * 60;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>

      {timeUp && (
        <Alert severity="error" sx={{ mb: 2 }}>
          ⏰ Se agotó el tiempo.{' '}
          {selectedDecision
            ? 'Tu última selección fue enviada automáticamente.'
            : 'No seleccionaste ninguna decisión — la simulación se registrará como incompleta.'}
        </Alert>
      )}

      <Grid container spacing={3}>

        {/* ── Columna izquierda: escenario + decisiones ── */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" gutterBottom fontWeight={700}>
                {scenario.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={
                    scenario.difficulty === 'EASY' ? 'Fácil'
                    : scenario.difficulty === 'MEDIUM' ? 'Medio'
                    : 'Difícil'
                  }
                  color={
                    scenario.difficulty === 'EASY' ? 'success'
                    : scenario.difficulty === 'MEDIUM' ? 'warning'
                    : 'error'
                  }
                />
                <Chip icon={<Timer />} label={`${scenario.timeLimitMinutes} minutos`} />
                <Chip
                  label={`Presupuesto: $${parseFloat(scenario.initialBudget).toLocaleString()}`}
                  color="primary"
                />
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3, borderRadius: 2 }}>
              <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                {scenario.description}
              </Typography>
            </Paper>

            <Typography variant="h6" gutterBottom>
              ¿Qué decisión tomarás?
            </Typography>

            <RadioGroup
              value={selectedDecision}
              onChange={(e) => setSelectedDecision(e.target.value)}
            >
              {scenario.decisions.map((decision) => (
                <Paper
                  key={decision.id}
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: selectedDecision === decision.id.toString()
                      ? 'primary.main'
                      : 'transparent',
                    transition: 'all 0.2s',
                    cursor: timeUp ? 'not-allowed' : 'pointer',
                    '&:hover': !timeUp ? {
                      borderColor: 'primary.light',
                      bgcolor: 'primary.50'
                    } : {}
                  }}
                  onClick={() => !timeUp && setSelectedDecision(decision.id.toString())}
                >
                  <FormControlLabel
                    value={decision.id.toString()}
                    control={<Radio />}
                    disabled={timeUp}
                    label={<Typography variant="body1">{decision.text}</Typography>}
                  />
                </Paper>
              ))}
            </RadioGroup>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Tooltip title={!selectedDecision && !timeUp ? 'Selecciona una decisión primero' : ''}>
                <span style={{ flex: 1 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={submitting ? null : <CheckCircle />}
                    onClick={() => handleSubmit(false)}
                    disabled={(!selectedDecision && !timeUp) || submitting}
                    sx={{ py: 1.5, borderRadius: 2, fontWeight: 600 }}
                  >
                    {submitting ? 'Procesando...' : 'Ejecutar Decisión'}
                  </Button>
                </span>
              </Tooltip>

              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<Cancel />}
                onClick={() => navigate('/dashboard')}
                sx={{ flex: 1, py: 1.5, borderRadius: 2 }}
              >
                Cancelar
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* ── Columna derecha: cronómetro + IA ── */}
        <Grid item xs={12} md={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ⏱ Tiempo restante
              </Typography>
              <Cronometro totalSeconds={totalSeconds} onTimeUp={handleTimeUp} />
            </Paper>

            <AIAssistant
              contexto={{
                scenarioTitle: scenario.title,
                scenarioDescription: scenario.description,
                budget: scenario.initialBudget
              }}
            />

          </Box>
        </Grid>

      </Grid>
    </Container>
  );
};

export default RunSimulation;