import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  Button,
  Card,
  CardContent
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  EmojiEvents,
  Warning,
  School,
  BarChart,
  Person,
  SmartToy,
  Close,
  Timer,
  AttachMoney,
  History,
  ArrowForward,
  OpenInNew
} from '@mui/icons-material';
import { reportsService } from '../../services/reportsService';
import { aiService } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const diffLabel = (d) =>
  d === 'EASY' ? 'Fácil' : d === 'MEDIUM' ? 'Medio' : 'Difícil';

const diffColor = (d) =>
  d === 'EASY' ? 'success' : d === 'MEDIUM' ? 'warning' : 'error';

const segundosAMinutos = (s) => {
  if (s === null || s === undefined) return '—';
  const m = Math.floor(s / 60);
  const seg = s % 60;
  return `${m}:${String(seg).padStart(2, '0')} min`;
};

const TendenciaIcon = ({ tendencia }) => {
  if (tendencia === 'mejorando') return <TrendingUp sx={{ color: 'success.main' }} />;
  if (tendencia === 'empeorando') return <TrendingDown sx={{ color: 'error.main' }} />;
  return <TrendingFlat sx={{ color: 'text.secondary' }} />;
};

const ScoreChip = ({ score }) => {
  if (score === null || score === undefined) return <Typography variant="caption" color="text.secondary">—</Typography>;
  const color = score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error';
  return <Chip label={`${score} pts`} color={color} size="small" sx={{ fontWeight: 600 }} />;
};

// ─── Mini barra de progreso ───────────────────────────────────────────────────
const MiniProgress = ({ value }) => {
  if (value === null || value === undefined) return <Typography color="text.secondary">—</Typography>;
  const color = value >= 80 ? 'success' : value >= 60 ? 'warning' : 'error';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={value}
        color={color}
        sx={{ flex: 1, height: 6, borderRadius: 3 }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
        {value}%
      </Typography>
    </Box>
  );
};

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, sub, color = 'primary.main' }) => (
  <Paper sx={{ p: 2.5, borderRadius: 3, textAlign: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
    <Box sx={{ color, mb: 0.5 }}>{icon}</Box>
    <Typography variant="h4" fontWeight={700} sx={{ color }}>
      {value ?? '—'}
    </Typography>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    {sub && (
      <Typography variant="caption" color="text.secondary">{sub}</Typography>
    )}
  </Paper>
);

// ─── Componente de Gráfico de Progreso SVG interactivo ───────────────────────
const StudentProgressChart = ({ student }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  if (!student || !student.simulaciones || student.simulaciones.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">Sin datos de simulación.</Typography>
      </Box>
    );
  }

  // Ordenar cronológicamente (más antiguo a más reciente) para la línea de tiempo
  const simsSorted = [...student.simulaciones].sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

  const width = 600;
  const height = 250;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getX = (index) => {
    if (simsSorted.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (simsSorted.length - 1)) * chartWidth;
  };

  const getY = (score) => {
    return paddingTop + chartHeight - ((score || 0) / 100) * chartHeight;
  };

  const points = simsSorted.map((s, idx) => ({
    x: getX(idx),
    y: getY(s.score),
    score: s.score,
    title: s.scenarioTitle,
    date: new Date(s.completedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
    fullDate: new Date(s.completedAt).toLocaleString('es-ES')
  }));

  // Generar d para el path SVG
  let lineD = '';
  let areaD = '';
  if (points.length > 0) {
    lineD = `M ${points[0].x} ${points[0].y}`;
    points.slice(1).forEach(p => {
      lineD += ` L ${p.x} ${p.y}`;
    });
    
    // Para el gradiente de fondo bajo la línea
    areaD = `${lineD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
  }

  return (
    <Box sx={{ position: 'relative', width: '100%', mt: 2, mb: 1 }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#667eea" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#667eea" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
        </defs>

        {/* Líneas horizontales de referencia (puntuación) */}
        {[0, 25, 50, 75, 100].map(val => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#e0e0e0"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#888"
                fontWeight="500"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Etiquetas del eje X (intentos) */}
        {points.map((p, idx) => (
          <text
            key={idx}
            x={p.x}
            y={height - paddingBottom + 20}
            textAnchor="middle"
            fontSize="10"
            fill="#888"
            fontWeight="500"
          >
            Int. {idx + 1}
          </text>
        ))}

        {/* Sombreado de área (si hay más de 1 punto) */}
        {points.length > 1 && (
          <path d={areaD} fill="url(#chartGradient)" />
        )}

        {/* Línea principal conectora */}
        {points.length > 1 && (
          <path
            d={lineD}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Puntos de datos */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredPoint?.index === idx ? 8 : 5}
            fill={p.score >= 80 ? '#4caf50' : p.score >= 60 ? '#ff9800' : '#f44336'}
            stroke="#fff"
            strokeWidth="2.5"
            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            onMouseEnter={() => setHoveredPoint({ ...p, index: idx })}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* Tooltip de Datos en HTML */}
      {hoveredPoint && (
        <Card
          sx={{
            position: 'absolute',
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100 - 15}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
            minWidth: 160
          }}
        >
          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Intento #{hoveredPoint.index + 1} — {hoveredPoint.date}
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5, lineHeight: 1.2 }}>
              {hoveredPoint.title}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={`${hoveredPoint.score} pts`}
                size="small"
                color={hoveredPoint.score >= 80 ? 'success' : hoveredPoint.score >= 60 ? 'warning' : 'error'}
                sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

// ─── Modal de progreso del estudiante ─────────────────────────────────────────
const ProgresoModal = ({ student, open, onClose }) => {
  if (!student) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 700
            }}
          >
            {student.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Progreso de {student.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {student.email}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 3 }}>
        {/* KPI Panel */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3, border: '1px solid #f0f0f0' }}>
              <Typography variant="h5" fontWeight={800} color="primary.main">
                {student.scorePromedio ?? '—'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Score Promedio
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3, border: '1px solid #f0f0f0' }}>
              <Typography variant="h5" fontWeight={800} color="success.main">
                {student.mejorScore ?? '—'} pts
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Mejor Puntuación
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={4}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3, border: '1px solid #f0f0f0' }}>
              <Typography variant="h5" fontWeight={800} color="secondary.main">
                {student.totalSimulaciones}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Intentos Totales
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Gráfico SVG */}
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1, color: 'text.primary' }}>
          📈 Gráfico de Progreso (Evolución de Puntuaciones)
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Pasa el cursor por los puntos de color para ver los detalles de cada intento.
        </Typography>
        
        <StudentProgressChart student={student} />

        {/* Historial Detallado */}
        <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 4, mb: 2, color: 'text.primary' }}>
          📜 Detalle de Intentos
        </Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Intento</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Escenario</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Puntuación</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tiempo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {student.simulaciones && [...student.simulaciones]
                .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)) // Mostrar el más reciente primero
                .map((sim, idx, arr) => (
                  <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>#{arr.length - idx}</TableCell>
                    <TableCell>{sim.scenarioTitle}</TableCell>
                    <TableCell><ScoreChip score={sim.score} /></TableCell>
                    <TableCell>{segundosAMinutos(sim.timeTakenSeconds)}</TableCell>
                    <TableCell>
                      {new Date(sim.completedAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
          Cerrar Reporte
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Panel de análisis IA ─────────────────────────────────────────────────────
const AIInsight = ({ datos }) => {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [generado, setGenerado] = useState(false);

  const generar = async () => {
    setLoading(true);
    try {
      const pregunta = `Analiza estos datos de rendimiento de la clase y da 3 recomendaciones concretas para el docente:
      - Score promedio: ${datos.scorePromedio ?? 'N/A'}
      - Total simulaciones: ${datos.totalSimulaciones ?? 'N/A'}
      - Estudiantes con bajo rendimiento (< 60 pts): ${datos.estudiantesBajos ?? 'N/A'}
      - Escenario con peor desempeño: ${datos.peorEscenario ?? 'N/A'}
      Responde en español, de forma directa y útil.`;

      const res = await aiService.studentAssist(pregunta, {});
      setInsight(res?.data?.respuesta ?? 'Sin respuesta del modelo.');
      setGenerado(true);
    } catch {
      setInsight('No se pudo conectar con Ollama. Verifica que esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1.5px solid',
        borderColor: 'primary.light',
        bgcolor: 'primary.50',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.05)'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <SmartToy color="primary" />
        <Typography variant="subtitle2" fontWeight={600}>
          Análisis IA — Ollama
        </Typography>
        <Chip label="llama3.2" size="small" variant="outlined" sx={{ fontSize: 10 }} />
      </Box>

      {!generado ? (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            La IA puede analizar el rendimiento del grupo y darte recomendaciones concretas.
          </Typography>
          <Chip
            label={loading ? 'Analizando...' : '🤖 Generar análisis'}
            onClick={!loading ? generar : undefined}
            color="primary"
            clickable={!loading}
            icon={loading ? <CircularProgress size={14} /> : undefined}
            sx={{ fontWeight: 600, py: 1.8, cursor: 'pointer' }}
          />
        </Box>
      ) : (
        <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {insight}
        </Typography>
      )}
    </Paper>
  );
};


// ─── Mini gráfica de barras SVG para scores de escenarios ────────────────────
const MiniBarChart = ({ escenarios }) => {
  const [hovered, setHovered] = useState(null);
  if (!escenarios || escenarios.length === 0) return null;
  const data = escenarios.filter(e => e.scorePromedio != null).slice(0, 8);
  if (data.length === 0) return null;

  const W = 560, H = 180, PL = 40, PR = 10, PT = 20, PB = 60;
  const cW = W - PL - PR, cH = H - PT - PB;
  const barW = Math.min(40, (cW / data.length) * 0.55);
  const gap = cW / data.length;
  const colors = data.map(e => e.scorePromedio >= 80 ? '#4caf50' : e.scorePromedio >= 60 ? '#ff9800' : '#f44336');

  return (
    <Box sx={{ width: '100%', position: 'relative', mb: 1 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto">
        {[0,25,50,75,100].map(v => {
          const y = PT + cH - (v/100)*cH;
          return (
            <g key={v}>
              <line x1={PL} y1={y} x2={W-PR} y2={y} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="3 3"/>
              <text x={PL-6} y={y+4} textAnchor="end" fontSize="9" fill="#aaa">{v}</text>
            </g>
          );
        })}
        {data.map((esc, i) => {
          const x = PL + gap*i + gap/2 - barW/2;
          const bH = (esc.scorePromedio/100)*cH;
          const y = PT + cH - bH;
          const isH = hovered === i;
          const title = esc.title.length > 14 ? esc.title.slice(0,13)+'…' : esc.title;
          return (
            <g key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)} style={{cursor:'pointer'}}>
              <rect x={x} y={y} width={barW} height={bH} fill={colors[i]} opacity={isH?1:0.72} rx="3"/>
              <text x={x+barW/2} y={y-5} textAnchor="middle" fontSize="10" fontWeight="700" fill={colors[i]}>{esc.scorePromedio}</text>
              <text x={x+barW/2} y={H-PB+14} textAnchor="middle" fontSize="9" fill="#666"
                transform={`rotate(-30, ${x+barW/2}, ${H-PB+14})`}>{title}</text>
            </g>
          );
        })}
      </svg>
      {hovered !== null && (
        <Paper sx={{position:'absolute',top:4,right:4,px:1.5,py:1,borderRadius:2,boxShadow:3,pointerEvents:'none',zIndex:10}}>
          <Typography variant="caption" color="text.secondary" display="block">{data[hovered].title}</Typography>
          <Typography variant="body2" fontWeight={800} color="primary">{data[hovered].scorePromedio} pts prom.</Typography>
          <Typography variant="caption" color="text.secondary">{data[hovered].totalSimulaciones} simulaciones</Typography>
        </Paper>
      )}
    </Box>
  );
};

// ─── Tab: Reporte por escenarios ─────────────────────────────────────────────
const TabEscenarios = ({ escenarios }) => {
  const navigate = useNavigate();
  return (
    <Box>
      {/* Gráfica de barras comparativa */}
      {escenarios.some(e => e.scorePromedio != null) && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart fontSize="small" color="primary" /> Score Promedio por Escenario
          </Typography>
          <MiniBarChart escenarios={escenarios} />
        </Paper>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Escenario</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Dificultad</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Simulaciones</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Score promedio</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tasa de éxito</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tiempo promedio</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reporte</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {escenarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  No hay datos aún. Los reportes aparecerán cuando los estudiantes completen simulaciones.
                </TableCell>
              </TableRow>
            ) : (
              escenarios.map(esc => (
                <TableRow key={esc.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{esc.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={diffLabel(esc.difficulty)} color={diffColor(esc.difficulty)} size="small" sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>{esc.totalSimulaciones}</TableCell>
                  <TableCell><ScoreChip score={esc.scorePromedio} /></TableCell>
                  <TableCell><MiniProgress value={esc.tasaExito} /></TableCell>
                  <TableCell>{segundosAMinutos(esc.tiempoPromedioSegundos)}</TableCell>
                  <TableCell>
                    <Chip
                      label={esc.isActive ? 'Publicado' : 'Borrador'}
                      color={esc.isActive ? 'success' : 'default'}
                      size="small"
                      variant={esc.isActive ? 'filled' : 'outlined'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" endIcon={<OpenInNew />}
                      onClick={() => navigate(`/scenarios/${esc.id}/report`)}
                      sx={{ borderRadius: 2, fontSize: 11, textTransform: 'none', fontWeight: 600 }}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

// ─── Tab: Reporte por estudiantes ────────────────────────────────────────────
const TabEstudiantes = ({ estudiantes, onVerProgreso }) => (
  <Box>
    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'grey.50' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Estudiante</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Simulaciones</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Score promedio</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Mejor score</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Tendencia</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700 }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {estudiantes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                Aún no hay estudiantes con simulaciones completadas.
              </TableCell>
            </TableRow>
          ) : (
            estudiantes.map(est => (
              <TableRow key={est.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: est.scorePromedio >= 70 ? 'success.main' : 'error.main',
                        fontSize: '0.9rem',
                        fontWeight: 700
                      }}
                    >
                      {est.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{est.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{est.email}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{est.totalSimulaciones}</TableCell>
                <TableCell><ScoreChip score={est.scorePromedio} /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EmojiEvents sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="body2" fontWeight={600}>{est.mejorScore ?? '—'}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TendenciaIcon tendencia={est.tendencia} />
                    <Typography variant="caption" color="text.secondary">
                      {est.tendencia === 'mejorando' ? 'Mejorando'
                        : est.tendencia === 'empeorando' ? 'Empeorando'
                        : 'Estable'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  {est.scorePromedio !== null && est.scorePromedio < 60 ? (
                    <Tooltip title="Estudiante con bajo rendimiento — considera contactarlo">
                      <Chip
                        icon={<Warning />}
                        label="Atención"
                        color="error"
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </Tooltip>
                  ) : (
                    <Chip label="Normal" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<BarChart />}
                    onClick={() => onVerProgreso(est)}
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
                    Ver Progreso
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Box>
);

// ─── Vista para DOCENTE ───────────────────────────────────────────────────────
const ReporteDocente = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    reportsService.getTeacherReport()
      .then(res => setData(res.data))
      .catch(() => setError('Error cargando el reporte'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { escenarios = [], estudiantes = [] } = data;
  const scores = escenarios.map(e => e.scorePromedio).filter(s => s !== null);
  const scoreGlobal = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;
  const totalSims = escenarios.reduce((a, e) => a + e.totalSimulaciones, 0);
  const estudiantesBajos = estudiantes.filter(e => (e.scorePromedio ?? 100) < 60).length;
  const peorEscenario = escenarios.sort((a, b) => (a.scorePromedio ?? 100) - (b.scorePromedio ?? 100))[0]?.title;

  const handleVerProgreso = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  return (
    <Box>
      {/* Métricas resumen */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <MetricCard icon={<BarChart />} label="Mis escenarios" value={escenarios.length} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard icon={<School />} label="Simulaciones totales" value={totalSims} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard
            icon={<TrendingUp />}
            label="Score promedio global"
            value={scoreGlobal ?? '—'}
            color={scoreGlobal >= 70 ? 'success.main' : 'error.main'}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard
            icon={<Warning />}
            label="Estudiantes en riesgo"
            value={estudiantesBajos}
            color={estudiantesBajos > 0 ? 'error.main' : 'success.main'}
          />
        </Grid>
      </Grid>

      {/* Análisis IA */}
      <Box sx={{ mb: 3 }}>
        <AIInsight datos={{ scorePromedio: scoreGlobal, totalSimulaciones: totalSims, estudiantesBajos, peorEscenario }} />
      </Box>

      {/* Tabs */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab icon={<BarChart />} iconPosition="start" label="Por escenarios" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab icon={<Person />} iconPosition="start" label="Por estudiantes" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tab === 0 && <TabEscenarios escenarios={escenarios} />}
          {tab === 1 && <TabEstudiantes estudiantes={estudiantes} onVerProgreso={handleVerProgreso} />}
        </Box>
      </Paper>

      {/* Modal de progreso para estudiantes */}
      <ProgresoModal
        student={selectedStudent}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
};

// ─── Vista para ADMIN ─────────────────────────────────────────────────────────
const ReporteAdmin = () => {
  const [adminData, setAdminData] = useState(null);
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      reportsService.getAdminReport(),
      reportsService.getTeacherReport()
    ])
      .then(([adminRes, detailedRes]) => {
        setAdminData(adminRes.data);
        setDetailedData(detailedRes.data);
      })
      .catch(() => setError('Error cargando los reportes'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { resumen, topDocentes = [], topEscenarios = [] } = adminData;
  const { escenarios = [], estudiantes = [] } = detailedData || {};

  const handleVerProgreso = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  return (
    <Box>
      {/* Indicadores resumen globales */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <MetricCard icon={<Person />} label="Estudiantes activos" value={resumen.totalUsuarios} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard icon={<School />} label="Docentes" value={resumen.totalDocentes} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard icon={<BarChart />} label="Escenarios totales" value={resumen.totalEscenarios} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <MetricCard
            icon={<TrendingUp />}
            label="Score global"
            value={resumen.scorePromedioGlobal ?? '—'}
            color={resumen.scorePromedioGlobal >= 70 ? 'success.main' : 'error.main'}
          />
        </Grid>
      </Grid>

      {/* Tabs Administrativos Integrados */}
      <Paper sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab icon={<School />} iconPosition="start" label="Resumen Global" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab icon={<BarChart />} iconPosition="start" label="Todos los escenarios" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab icon={<Person />} iconPosition="start" label="Reportes de estudiantes" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* TAB 0: Resumen Global Administrativo */}
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <EmojiEvents color="warning" /> Top docentes por impacto
                  </Typography>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Docente</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Estudiantes</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Score prom.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topDocentes.slice(0, 5).map((doc, i) => (
                        <TableRow key={doc.id || i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell>
                            <Chip label={`#${i + 1}`} size="small"
                              color={i === 0 ? 'warning' : 'default'}
                              variant={i === 0 ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{doc.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{doc.email}</Typography>
                          </TableCell>
                          <TableCell>{doc.totalEstudiantes}</TableCell>
                          <TableCell><ScoreChip score={doc.scorePromedio} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <BarChart color="primary" /> Escenarios más jugados
                  </Typography>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Escenario</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Usos</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Score prom.</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topEscenarios.map((esc, idx) => (
                        <TableRow key={esc.id || idx} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{esc.title}</Typography>
                            <Chip label={diffLabel(esc.difficulty)} color={diffColor(esc.difficulty)} size="small" sx={{ mt: 0.5, fontSize: 10, fontWeight: 600 }} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{esc.totalUsos}</TableCell>
                          <TableCell><ScoreChip score={esc.scorePromedio} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* TAB 1: Por Escenarios (Globales) */}
          {tab === 1 && <TabEscenarios escenarios={escenarios} />}

          {/* TAB 2: Por Estudiantes (Globales) */}
          {tab === 2 && <TabEstudiantes estudiantes={estudiantes} onVerProgreso={handleVerProgreso} />}
        </Box>
      </Paper>

      {/* Modal de progreso para estudiantes */}
      <ProgresoModal
        student={selectedStudent}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </Box>
  );
};

// ─── Componente raíz ──────────────────────────────────────────────────────────
const Reports = () => {
  const { user } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ color: 'text.primary' }}>
          📊 Panel de Reportes y Rendimiento
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          {user?.role === 'ADMIN'
            ? 'Análisis global de la plataforma para el administrador'
            : 'Análisis detallado de tus cursos, escenarios y rendimiento estudiantil'}
        </Typography>

        {user?.role === 'ADMIN' && <ReporteAdmin />}
        {user?.role === 'TEACHER' && <ReporteDocente />}
        {user?.role === 'STUDENT' && (
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Los reportes de estudiantes individuales están disponibles en tu dashboard principal o en la pestaña "Mi Historial".
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default Reports;