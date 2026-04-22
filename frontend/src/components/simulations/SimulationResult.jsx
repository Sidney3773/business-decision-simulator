import { useState, useEffect, useCallback } from 'react';
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
  CircularProgress
} from '@mui/material';
import { Timer } from '@mui/icons-material';
import { scenarioService } from '../../services/scenarioService';
import { simulationService } from '../../services/simulationService';

const RunSimulation = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const [scenario, setScenario] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState('');
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Usar useCallback para memorizar la función
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
  }, [scenarioId]); // scenarioId como dependencia

  useEffect(() => {
    loadScenario();
  }, [loadScenario]); // loadScenario como dependencia

  const handleSubmit = async () => {
    if (!selectedDecision) {
      alert('Por favor selecciona una decisión');
      return;
    }

    setSubmitting(true);
    const timeTaken = Math.floor((Date.now() - startTime) / 1000);

    try {
      const result = await simulationService.run({
        scenarioId: parseInt(scenarioId),
        decisionIds: [parseInt(selectedDecision)],
        timeTakenSeconds: timeTaken
      });

      navigate(`/simulation-result/${result.data.simulation.id}`);
    } catch (err) {
      console.error('Error al ejecutar simulación:', err);
      setError('Error ejecutando la simulación');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!scenario) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">Escenario no encontrado</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {scenario.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip
              label={scenario.difficulty}
              color={
                scenario.difficulty === 'EASY'
                  ? 'success'
                  : scenario.difficulty === 'MEDIUM'
                  ? 'warning'
                  : 'error'
              }
            />
            <Chip
              icon={<Timer />}
              label={`${scenario.timeLimitMinutes} minutos`}
            />
            <Chip
              label={`Presupuesto: $${parseFloat(scenario.initialBudget).toLocaleString()}`}
              color="primary"
            />
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3, bgcolor: 'grey.50', mb: 3 }}>
          <Typography variant="body1" paragraph>
            {scenario.description}
          </Typography>
        </Paper>

        <Typography variant="h6" gutterBottom>
          ¿Qué decisión tomarás?
        </Typography>

        <RadioGroup value={selectedDecision} onChange={(e) => setSelectedDecision(e.target.value)}>
          {scenario.decisions.map((decision) => (
            <Paper key={decision.id} sx={{ p: 2, mb: 2 }}>
              <FormControlLabel
                value={decision.id.toString()}
                control={<Radio />}
                label={
                  <Typography variant="body1">
                    {decision.text}
                  </Typography>
                }
              />
            </Paper>
          ))}
        </RadioGroup>

        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSubmit}
            disabled={!selectedDecision || submitting}
          >
            {submitting ? 'Procesando...' : 'Ejecutar Decisión'}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default RunSimulation;