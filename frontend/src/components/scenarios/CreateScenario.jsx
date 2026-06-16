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
  Alert,
  Chip,
  Divider,
  CircularProgress,
  Collapse,
  Tooltip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableRow
} from '@mui/material';
import {
  Add,
  Delete,
  SmartToy,
  AutoFixHigh,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Lightbulb,
  DriveFileRenameOutline,
  Psychology,
  ContentPasteGo
} from '@mui/icons-material';
import { scenarioService } from '../../services/scenarioService';
import { aiService } from '../../services/aiService';

const SECTORES = [
  'Tecnología / SaaS', 'Retail / Comercio', 'Manufactura',
  'Finanzas / Banca', 'Salud / Farmacéutica', 'Educación',
  'Logística / Transporte', 'Agroindustria', 'Turismo / Hotelería',
  'Construcción / Inmobiliaria', 'Energía / Minería', 'Startup / Emprendimiento'
];

// ─── Parsear respuesta de Ollama en campos estructurados ─────────────────────
const parsearRespuestaIA = (texto) => {
  const resultado = {
    title: '',
    description: '',
    timeLimitMinutes: null,
    initialBudget: null,
    decisions: []
  };

  if (!texto) return resultado;

  // Limpiar markdown: quitar **, ## , ###, *, etc.
  const limpiar = (s) => s.replace(/\*{1,2}/g, '').replace(/#{1,3}\s*/g, '').trim();

  const lineas = texto.split('\n');

  // ── Título ──
  for (const linea of lineas) {
    const m = linea.match(/(?:título|title|escenario)[:\s]+(.+)/i);
    if (m) { resultado.title = limpiar(m[1]); break; }
  }
  // Si no encontró título, tomar la primera línea no vacía
  if (!resultado.title) {
    const primera = lineas.find(l => l.trim().length > 5 && !/^[#\-*]/.test(l.trim()));
    if (primera) resultado.title = limpiar(primera).slice(0, 120);
  }

  // ── Descripción ──
  const descIdx = lineas.findIndex(l => /descripci[oó]n|contexto|situaci[oó]n/i.test(l));
  if (descIdx !== -1) {
    const bloque = [];
    for (let i = descIdx + 1; i < lineas.length; i++) {
      const l = lineas[i].trim();
      if (!l) { if (bloque.length > 0) break; continue; }
      // Parar si encontramos otra sección
      if (/^(?:métricas|opciones|decisiones|opción|tiempo|presupuesto|#)/i.test(l)) break;
      bloque.push(limpiar(l));
    }
    resultado.description = bloque.join(' ');
  }
  // Fallback: párrafo más largo del texto
  if (!resultado.description) {
    const parrafos = texto.split(/\n\n+/).map(p => limpiar(p.replace(/\n/g, ' ')));
    const masLargo = parrafos.reduce((a, b) => b.length > a.length ? b : a, '');
    resultado.description = masLargo.slice(0, 800);
  }

  // ── Tiempo ──
  const tMatch = texto.match(/(\d+)\s*minutos?/i);
  if (tMatch) {
    const v = parseInt(tMatch[1]);
    if (v >= 5 && v <= 120) resultado.timeLimitMinutes = v;
  }

  // ── Presupuesto — busca el primer número grande con $ ──
  const budgetMatches = [...texto.matchAll(/\$\s*([\d.,]+)/g)];
  for (const m of budgetMatches) {
    const v = parseFloat(m[1].replace(/[.,]/g, (c, i, s) => {
      // Distinguir separador decimal de miles
      const lastDot = s.lastIndexOf('.');
      const lastComma = s.lastIndexOf(',');
      if (c === '.' && i < lastDot) return ''; // separador de miles
      if (c === ',' && i < lastComma) return ''; // separador de miles
      if (c === ',' && i === lastComma && lastDot === -1) return '.'; // coma decimal
      return c === '.' ? '.' : '';
    }));
    if (v >= 1000) { resultado.initialBudget = v; break; }
  }

  // ── Decisiones — captura "Opción A:", "Decisión 1:", "A)", "1." al inicio ──
  const decisionRegex = /(?:opci[oó]n\s*[abc123]|decisi[oó]n\s*\d+|\b[abc]\)|\b[123]\.)[\s:]+(.+)/gi;
  const matches = [...texto.matchAll(decisionRegex)];
  if (matches.length >= 2) {
    resultado.decisions = matches.slice(0, 5).map((m, i) => ({
      id: i + 1,
      text: limpiar(m[1]).slice(0, 300),
      impact: { budget: 0, score: Math.max(40, 100 - i * 20), feedback: '' }
    }));
  }

  return resultado;
};

// ─── Panel IA con preview editable antes de aplicar ─────────────────────────
const AIScenarioAssistant = ({ formData, onApply }) => {
  const [open, setOpen] = useState(true);
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [rawText, setRawText] = useState('');       // texto crudo de Ollama
  const [parsed, setParsed] = useState(null);       // campos parseados
  const [error, setError] = useState('');
  const [aplicado, setAplicado] = useState(false);

  const handleGenerar = async () => {
    setLoading(true);
    setError('');
    setRawText('');
    setParsed(null);
    setAplicado(false);
    try {
      const res = await aiService.completeScenario({
        title: formData.title || '',
        description: formData.description || '',
        sector: sector || 'no especificado',
        difficulty: formData.difficulty
      });
      const texto = res?.data?.sugerencia ?? '';
      setRawText(texto);
      const campos = parsearRespuestaIA(texto);
      setParsed(campos);
    } catch {
      setError('No se pudo conectar con Ollama. Verifica que esté corriendo en localhost:11434');
    } finally {
      setLoading(false);
    }
  };

  const handleAplicar = () => {
    if (!parsed) return;
    onApply(parsed);
    setAplicado(true);
  };

  return (
    <Paper sx={{ borderRadius: 3, border: '1.5px solid', borderColor: 'secondary.light', overflow: 'hidden', mb: 3 }}>
      {/* Header */}
      <Box
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, bgcolor: 'secondary.main', cursor: 'pointer' }}
        onClick={() => setOpen(o => !o)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy sx={{ color: '#fff', fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={600} color="#fff">
            Asistente IA — Generar escenario con Ollama
          </Typography>
          <Chip label="llama3.2" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10 }} />
        </Box>
        <IconButton size="small" sx={{ color: '#fff' }}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={open}>
        <Box sx={{ p: 2.5 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecciona un sector y haz clic en generar. La IA creará un escenario realista con datos de empresas reales, métricas concretas y decisiones.
          </Typography>

          {/* Selector de sector + botón */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
            <TextField
              select label="Sector empresarial" name="ai-sector" id="ai-sector"
              value={sector} onChange={e => setSector(e.target.value)} size="small" sx={{ flex: 1 }}
            >
              {SECTORES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            <Tooltip title={!formData.title && !sector ? 'Ingresa un título o selecciona un sector' : 'Generar escenario'}>
              <span>
                <Button
                  variant="contained" color="secondary"
                  startIcon={loading ? null : <AutoFixHigh />}
                  onClick={handleGenerar}
                  disabled={loading || (!formData.title && !sector)}
                  sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                >
                  {loading
                    ? <><CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />Generando...</>
                    : 'Generar con IA'
                  }
                </Button>
              </span>
            </Tooltip>
          </Box>

          {/* Chips sugerencias rápidas */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {['Crisis de liquidez', 'Expansión internacional', 'Reducción de costos', 'Negociación con proveedor', 'Pivote de negocio'].map(sug => (
              <Chip key={sug} label={sug} size="small" icon={<Lightbulb />} variant="outlined" clickable
                onClick={() => {
                  onApply({ title: sug });
                  if (!sector) setSector('Tecnología / SaaS');
                }}
              />
            ))}
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {/* Vista previa de campos parseados */}
          {parsed && (
            <Box>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology color="secondary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={600}>
                    Campos detectados — revisa y aplica
                  </Typography>
                </Box>
                {aplicado
                  ? <Chip icon={<CheckCircle />} label="Aplicado al formulario" color="success" size="small" />
                  : <Button size="small" variant="contained" color="secondary"
                      startIcon={<ContentPasteGo />} onClick={handleAplicar}
                      sx={{ borderRadius: 2 }}>
                      Aplicar al formulario
                    </Button>
                }
              </Box>

              {/* Tabla de preview de lo que se va a llenar */}
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 1.5 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ width: 130, fontWeight: 600, fontSize: 12, color: 'text.secondary' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <DriveFileRenameOutline fontSize="small" /> Título
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {parsed.title || <Typography variant="caption" color="text.disabled">No detectado</Typography>}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', verticalAlign: 'top', pt: 1.5 }}>
                        Descripción
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: 'text.secondary', maxHeight: 80, overflow: 'hidden' }}>
                        {parsed.description
                          ? parsed.description.slice(0, 200) + (parsed.description.length > 200 ? '...' : '')
                          : <Typography variant="caption" color="text.disabled">No detectada</Typography>
                        }
                      </TableCell>
                    </TableRow>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary' }}>
                        Tiempo / Presupuesto
                      </TableCell>
                      <TableCell sx={{ fontSize: 13 }}>
                        {parsed.timeLimitMinutes ? `${parsed.timeLimitMinutes} min` : '—'}
                        {' · '}
                        {parsed.initialBudget ? `$${parsed.initialBudget.toLocaleString()}` : '—'}
                      </TableCell>
                    </TableRow>
                    {parsed.decisions.length > 0 && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', verticalAlign: 'top', pt: 1.5 }}>
                          {parsed.decisions.length} decisión(es)
                        </TableCell>
                        <TableCell>
                          {parsed.decisions.map((d, i) => (
                            <Typography key={i} variant="caption" display="block" sx={{ mb: 0.5, color: 'text.secondary' }}>
                              <strong>{String.fromCharCode(65 + i)})</strong> {d.text.slice(0, 100)}{d.text.length > 100 ? '...' : ''}
                            </Typography>
                          ))}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>

              <Typography variant="caption" color="text.secondary">
                Después de aplicar, puedes editar manualmente cualquier campo.
              </Typography>

              {/* Respuesta completa colapsable */}
              <Box sx={{ mt: 1 }}>
                <Typography
                  variant="caption" color="primary" sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => setRawText(prev => prev === rawText ? '' : rawText)}
                >
                  Ver respuesta completa de Ollama
                </Typography>
                {rawText && (
                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'grey.50', borderRadius: 2, maxHeight: 200, overflowY: 'auto' }}>
                    <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {rawText}
                    </Typography>
                  </Paper>
                )}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
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
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDecisionChange = (index, field, value) => {
    setFormData(prev => {
      const newDecisions = prev.decisions.map((d, i) => {
        if (i !== index) return d;
        if (field.includes('.')) {
          const [parent, child] = field.split('.');
          return { ...d, [parent]: { ...d[parent], [child]: value } };
        }
        return { ...d, [field]: value };
      });
      return { ...prev, decisions: newDecisions };
    });
  };

  const addDecision = () => {
    setFormData(prev => ({
      ...prev,
      decisions: [...prev.decisions, { id: prev.decisions.length + 1, text: '', impact: { budget: 0, score: 0, feedback: '' } }]
    }));
  };

  const removeDecision = (index) => {
    if (formData.decisions.length === 1) { alert('Debe haber al menos una decisión'); return; }
    setFormData(prev => ({ ...prev, decisions: prev.decisions.filter((_, i) => i !== index) }));
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

  // ── Aplicar campos de la IA al formulario ─────────────────────────────────
  // Recibe campos ya parseados (objeto estructurado), NO texto crudo
  const handleApplyIA = (campos) => {
    setFormData(prev => ({
      ...prev,
      ...(campos.title        ? { title: campos.title }                                   : {}),
      ...(campos.description  ? { description: campos.description }                        : {}),
      ...(campos.timeLimitMinutes ? { timeLimitMinutes: campos.timeLimitMinutes }          : {}),
      ...(campos.initialBudget    ? { initialBudget: campos.initialBudget }                : {}),
      ...(campos.decisions?.length >= 2 ? { decisions: campos.decisions }                 : {})
    }));
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>

      <AIScenarioAssistant formData={formData} onApply={handleApplyIA} />

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" gutterBottom fontWeight={700}>
          Crear Nuevo Escenario
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Completa los campos o usa el asistente IA de arriba para generar el contenido.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>

          <TextField
            fullWidth label="Título del escenario" name="title"
            value={formData.title} onChange={handleChange} required
            placeholder="Ej: Crisis de liquidez en startup SaaS" sx={{ mb: 2 }}
          />

          <TextField
            fullWidth label="Descripción / Contexto" name="description"
            value={formData.description} onChange={handleChange} required
            multiline rows={4}
            placeholder="Describe la situación empresarial con datos concretos..."
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <TextField select fullWidth label="Dificultad" name="difficulty"
                value={formData.difficulty} onChange={handleChange}>
                <MenuItem value="EASY">Fácil</MenuItem>
                <MenuItem value="MEDIUM">Medio</MenuItem>
                <MenuItem value="HARD">Difícil</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Presupuesto inicial ($)"
                name="initialBudget" value={formData.initialBudget ?? ''}
                onChange={handleChange} required inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="number" label="Tiempo límite (min)"
                name="timeLimitMinutes" value={formData.timeLimitMinutes ?? ''}
                onChange={handleChange} required inputProps={{ min: 5, max: 120 }}
                helperText="Entre 5 y 120 minutos" />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600}>Decisiones</Typography>
            <Typography variant="caption" color="text.secondary">Mínimo 2 recomendadas</Typography>
          </Box>

          {formData.decisions.map((decision, index) => (
            <Card key={index} sx={{ mb: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.light' }, transition: 'border-color 0.2s' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip label={`Decisión ${String.fromCharCode(65 + index)}`} color="primary" size="small" variant="outlined" />
                  <Tooltip title={formData.decisions.length === 1 ? 'Mínimo una decisión' : 'Eliminar'}>
                    <span>
                      <IconButton color="error" size="small" onClick={() => removeDecision(index)} disabled={formData.decisions.length === 1}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                <TextField fullWidth label="Texto de la decisión" value={decision.text}
                  onChange={(e) => handleDecisionChange(index, 'text', e.target.value)}
                  required placeholder="Ej: Reducir el equipo en un 30%..." sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth type="number" label="Impacto en presupuesto ($)"
                      value={decision.impact.budget}
                      onChange={(e) => handleDecisionChange(index, 'impact.budget', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      required helperText="Negativo = gasto, Positivo = ingreso" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth type="number" label="Puntuación (0–100)"
                      value={decision.impact.score}
                      onChange={(e) => handleDecisionChange(index, 'impact.score', e.target.value === '' ? '' : parseInt(e.target.value))}
                      required inputProps={{ min: 0, max: 100 }} helperText="100 = decisión óptima" />
                  </Grid>
                </Grid>

                <TextField fullWidth label="Feedback para el estudiante"
                  value={decision.impact.feedback}
                  onChange={(e) => handleDecisionChange(index, 'impact.feedback', e.target.value)}
                  required multiline rows={2}
                  placeholder="¿Por qué es buena o mala esta decisión?"
                  sx={{ mt: 2 }} />
              </CardContent>
            </Card>
          ))}

          <Button variant="outlined" startIcon={<Add />} onClick={addDecision}
            sx={{ mb: 3, borderRadius: 2 }} disabled={formData.decisions.length >= 5}>
            Agregar decisión {formData.decisions.length >= 5 && '(máx. 5)'}
          </Button>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={loading} startIcon={loading ? null : <CheckCircle />}
              sx={{ borderRadius: 2, py: 1.5, fontWeight: 600 }}>
              {loading ? 'Creando...' : 'Crear Escenario'}
            </Button>
            <Button variant="outlined" fullWidth size="large"
              onClick={() => navigate('/dashboard')} sx={{ borderRadius: 2, py: 1.5 }}>
              Cancelar
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateScenario;