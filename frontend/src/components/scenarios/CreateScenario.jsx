import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { scenarioService } from '../../services/scenarioService';

const CreateScenario = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    initialBudget: 100000,
    timeLimitMinutes: 30,
    decisions: [
      { id: 1, text: '', impact: { budget: 0, score: 0, feedback: '' } }
    ]
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleDecisionChange = (index, field, value) => {
    const newDecisions = [...formData.decisions];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newDecisions[index][parent][child] = value;
    } else {
      newDecisions[index][field] = value;
    }
    setFormData({ ...formData, decisions: newDecisions });
  };

  const addDecision = () => {
    setFormData({
      ...formData,
      decisions: [
        ...formData.decisions,
        { id: formData.decisions.length + 1, text: '', impact: { budget: 0, score: 0, feedback: '' } }
      ]
    });
  };

  const removeDecision = (index) => {
    if (formData.decisions.length === 1) {
      alert('Debe haber al menos una decisión');
      return;
    }
    const newDecisions = formData.decisions.filter((_, i) => i !== index);
    setFormData({ ...formData, decisions: newDecisions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await scenarioService.create(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el escenario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Crear Nuevo Escenario
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Título"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              select
              label="Dificultad"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              sx={{ flex: 1 }}
            >
              <MenuItem value="EASY">Fácil</MenuItem>
              <MenuItem value="MEDIUM">Medio</MenuItem>
              <MenuItem value="HARD">Difícil</MenuItem>
            </TextField>

            <TextField
              type="number"
              label="Presupuesto Inicial"
              name="initialBudget"
              value={formData.initialBudget}
              onChange={handleChange}
              required
              sx={{ flex: 1 }}
            />

            <TextField
              type="number"
              label="Tiempo Límite (min)"
              name="timeLimitMinutes"
              value={formData.timeLimitMinutes}
              onChange={handleChange}
              required
              sx={{ flex: 1 }}
            />
          </Box>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Decisiones
          </Typography>

          {formData.decisions.map((decision, index) => (
            <Card key={index} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">Decisión {index + 1}</Typography>
                  <IconButton
                    color="error"
                    onClick={() => removeDecision(index)}
                    disabled={formData.decisions.length === 1}
                  >
                    <Delete />
                  </IconButton>
                </Box>

                <TextField
                  fullWidth
                  label="Texto de la decisión"
                  value={decision.text}
                  onChange={(e) => handleDecisionChange(index, 'text', e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    type="number"
                    label="Impacto Presupuesto"
                    value={decision.impact.budget}
                    onChange={(e) => handleDecisionChange(index, 'impact.budget', parseFloat(e.target.value))}
                    required
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    type="number"
                    label="Puntos"
                    value={decision.impact.score}
                    onChange={(e) => handleDecisionChange(index, 'impact.score', parseInt(e.target.value))}
                    required
                    sx={{ flex: 1 }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Feedback"
                  value={decision.impact.feedback}
                  onChange={(e) => handleDecisionChange(index, 'impact.feedback', e.target.value)}
                  required
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
            sx={{ mb: 3 }}
          >
            Agregar Decisión
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Escenario'}
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/dashboard')}
            >
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateScenario;