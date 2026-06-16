import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Paper, Typography, Box, Grid, Chip, CircularProgress,
  Alert, Avatar, Button, Divider, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, LinearProgress
} from '@mui/material';
import {
  ArrowBack, EmojiEvents, TrendingUp, School, Timer,
  BarChart, CheckCircle, Warning, People
} from '@mui/icons-material';
import api from '../../services/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diffLabel = d => d === 'EASY' ? 'Fácil' : d === 'MEDIUM' ? 'Medio' : 'Difícil';
const diffColor = d => d === 'EASY' ? 'success' : d === 'MEDIUM' ? 'warning' : 'error';
const minutos = s => { if (!s) return '—'; const m = Math.floor(s/60), sg = s%60; return `${m}:${String(sg).padStart(2,'0')} min`; };

const ScoreChip = ({ score }) => {
  if (score == null) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error';
  return <Chip label={`${score} pts`} color={color} size="small" sx={{ fontWeight: 700 }} />;
};

const MetricCard = ({ icon, label, value, color = '#1976d2', sub }) => (
  <Paper sx={{
    p: 2.5, borderRadius: 3, textAlign: 'center',
    background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
    border: `1.5px solid ${color}30`
  }}>
    <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
    <Typography variant="h4" fontWeight={800} sx={{ color }}>{value ?? '—'}</Typography>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
  </Paper>
);

// ─── Gráfica de barras SVG — Distribución de scores ──────────────────────────
const BarChartDistribucion = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  const W = 500, H = 220, PL = 40, PR = 20, PT = 20, PB = 40;
  const cW = W - PL - PR, cH = H - PT - PB;
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const barW = (cW / data.length) * 0.6;
  const gap = cW / data.length;

  const colors = ['#f44336', '#ff9800', '#ff9800', '#4caf50', '#2196f3'];

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        {/* Líneas de referencia */}
        {[0, 25, 50, 75, 100].map(pct => {
          const y = PT + cH - (pct / 100) * cH;
          const val = Math.round((pct / 100) * maxCount);
          return (
            <g key={pct}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#999">{val}</text>
            </g>
          );
        })}

        {/* Barras */}
        {data.map((d, i) => {
          const x = PL + gap * i + gap / 2 - barW / 2;
          const barH = maxCount === 0 ? 0 : (d.count / maxCount) * cH;
          const y = PT + cH - barH;
          const isHovered = hovered === i;
          return (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              <rect x={x} y={y} width={barW} height={barH}
                fill={colors[i]} opacity={isHovered ? 1 : 0.75}
                rx="4" style={{ transition: 'opacity 0.15s' }} />
              {/* Valor encima */}
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="11" fontWeight="700" fill={colors[i]}>
                  {d.count}
                </text>
              )}
              {/* Etiqueta eje X */}
              <text x={x + barW / 2} y={H - PB + 16} textAnchor="middle" fontSize="10" fill="#666">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hovered !== null && (
        <Paper sx={{
          position: 'absolute', top: 8, right: 8,
          px: 1.5, py: 1, borderRadius: 2, boxShadow: 3, pointerEvents: 'none'
        }}>
          <Typography variant="caption" fontWeight={700}>Rango {data[hovered].label} pts</Typography>
          <Typography variant="body2" fontWeight={800} color="primary">{data[hovered].count} estudiante{data[hovered].count !== 1 ? 's' : ''}</Typography>
        </Paper>
      )}
    </Box>
  );
};

// ─── Gráfica de línea SVG — Evolución ────────────────────────────────────────
const LineChartEvolucion = ({ data }) => {
  const [hovered, setHovered] = useState(null);
  if (!data || data.length === 0) return <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>Sin datos de evolución.</Typography>;

  const W = 500, H = 200, PL = 40, PR = 20, PT = 20, PB = 35;
  const cW = W - PL - PR, cH = H - PT - PB;

  const getX = i => data.length <= 1 ? PL + cW / 2 : PL + (i / (data.length - 1)) * cW;
  const getY = s => PT + cH - ((s || 0) / 100) * cH;

  const pts = data.map((d, i) => ({ x: getX(i), y: getY(d.score), score: d.score, intento: d.intento }));
  let lineD = pts.length > 1 ? `M ${pts[0].x} ${pts[0].y}` + pts.slice(1).map(p => ` L ${p.x} ${p.y}`).join('') : '';
  let areaD = pts.length > 1 ? `${lineD} L ${pts[pts.length-1].x} ${PT+cH} L ${pts[0].x} ${PT+cH} Z` : '';

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map(v => (
          <g key={v}>
            <line x1={PL} y1={getY(v)} x2={W-PR} y2={getY(v)} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="4 3" />
            <text x={PL-6} y={getY(v)+4} textAnchor="end" fontSize="10" fill="#999">{v}</text>
          </g>
        ))}
        {pts.length > 1 && <path d={areaD} fill="url(#areaGrad)" />}
        {pts.length > 1 && <path d={lineD} fill="none" stroke="#667eea" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={hovered === i ? 8 : 5}
              fill={p.score >= 80 ? '#4caf50' : p.score >= 60 ? '#ff9800' : '#f44336'}
              stroke="#fff" strokeWidth="2.5" style={{ cursor: 'pointer', transition: 'r 0.15s' }}
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
            {data.length <= 10 && (
              <text x={p.x} y={H - PB + 16} textAnchor="middle" fontSize="9" fill="#888">#{p.intento}</text>
            )}
          </g>
        ))}
      </svg>
      {hovered !== null && (
        <Paper sx={{ position: 'absolute', top: 4, right: 4, px: 1.5, py: 1, borderRadius: 2, boxShadow: 3, pointerEvents: 'none' }}>
          <Typography variant="caption" color="text.secondary">Intento #{pts[hovered].intento}</Typography>
          <Typography variant="body2" fontWeight={800} color="primary">{pts[hovered].score} pts</Typography>
        </Paper>
      )}
    </Box>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const ScenarioReport = () => {
  const { scenarioId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/reports/scenario/${scenarioId}`)
      .then(res => setData(res.data.data))
      .catch(() => setError('Error al cargar el reporte del escenario'))
      .finally(() => setLoading(false));
  }, [scenarioId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>;
  if (error) return <Container sx={{ pt: 4 }}><Alert severity="error">{error}</Alert></Container>;

  const { scenario, resumen, distribucionScores, topEstudiantes, evolucion } = data;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', py: 4 }}>
      <Container maxWidth="lg">

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} variant="outlined" sx={{ borderRadius: 2 }}>
            Volver
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={800}>{scenario.title}</Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <Chip label={diffLabel(scenario.difficulty)} color={diffColor(scenario.difficulty)} size="small" sx={{ fontWeight: 600 }} />
              <Chip label={scenario.isActive ? 'Publicado' : 'Borrador'} color={scenario.isActive ? 'success' : 'default'} size="small" variant="outlined" />
            </Box>
          </Box>
        </Box>

        {/* Métricas resumen */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard icon={<People />} label="Simulaciones" value={resumen.totalSimulaciones} color="#1976d2" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard icon={<BarChart />} label="Score promedio" value={resumen.scorePromedio} color="#9c27b0" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard icon={<EmojiEvents />} label="Mejor score" value={resumen.mejorScore} color="#f57c00" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard icon={<Warning />} label="Peor score" value={resumen.peorScore} color="#d32f2f" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard icon={<CheckCircle />} label="Tasa éxito" value={resumen.tasaExito != null ? `${resumen.tasaExito}%` : null} color="#2e7d32" sub="(≥70 pts)" />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <MetricCard icon={<Timer />} label="Tiempo prom." value={minutos(resumen.tiempoPromedio)} color="#0288d1" />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Distribución de scores — Barras */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChart color="primary" /> Distribución de Scores
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Cantidad de estudiantes por rango de puntuación
              </Typography>
              {resumen.totalSimulaciones === 0
                ? <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">Aún no hay simulaciones.</Typography></Box>
                : <BarChartDistribucion data={distribucionScores} />
              }
              {/* Leyenda */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                {[
                  { label: '0-20', color: '#f44336' }, { label: '21-40', color: '#ff9800' },
                  { label: '41-60', color: '#ff9800' }, { label: '61-80', color: '#4caf50' },
                  { label: '81-100', color: '#2196f3' }
                ].map(l => (
                  <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: l.color }} />
                    <Typography variant="caption">{l.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Evolución cronológica — Línea */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="secondary" /> Evolución de Scores
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                Últimas {evolucion.length} simulaciones en orden cronológico
              </Typography>
              <LineChartEvolucion data={evolucion} />
            </Paper>
          </Grid>

          {/* Tasa de éxito barra */}
          {resumen.tasaExito != null && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Tasa de Éxito Global (≥70 pts)</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress variant="determinate" value={resumen.tasaExito}
                    color={resumen.tasaExito >= 70 ? 'success' : resumen.tasaExito >= 40 ? 'warning' : 'error'}
                    sx={{ flex: 1, height: 14, borderRadius: 7 }} />
                  <Typography variant="h6" fontWeight={800}>{resumen.tasaExito}%</Typography>
                </Box>
              </Paper>
            </Grid>
          )}

          {/* Top estudiantes */}
          <Grid item xs={12}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents color="warning" /> Top 5 Estudiantes
                </Typography>
              </Box>
              {topEstudiantes.length === 0
                ? <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="text.secondary">Sin simulaciones completadas aún.</Typography></Box>
                : (
                  <TableContainer>
                    <Table>
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Score</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Tiempo</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topEstudiantes.map((est, i) => (
                          <TableRow key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                            <TableCell>
                              <Chip label={`#${i+1}`} size="small"
                                color={i === 0 ? 'warning' : 'default'}
                                variant={i === 0 ? 'filled' : 'outlined'}
                                sx={{ fontWeight: 700 }} />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: 'primary.main' }}>
                                  {est.name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>{est.name}</Typography>
                                  <Typography variant="caption" color="text.secondary">{est.email}</Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell><ScoreChip score={est.score} /></TableCell>
                            <TableCell>{minutos(est.timeTakenSeconds)}</TableCell>
                            <TableCell>
                              <Typography variant="caption">
                                {new Date(est.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              }
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ScenarioReport;