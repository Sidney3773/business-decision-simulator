import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Chip,
  Divider,
  Collapse,
  Alert
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  ExpandMore,
  ExpandLess,
  FiberManualRecord
} from '@mui/icons-material';
import { aiService } from '../../services/aiService';

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────
const Burbuja = ({ mensaje }) => {
  const esIA = mensaje.rol === 'ia';

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: esIA ? 'flex-start' : 'flex-end',
        mb: 1.5
      }}
    >
      {esIA && (
        <Box
          sx={{
            width: 28, height: 28, borderRadius: '50%',
            bgcolor: 'primary.main', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            mr: 1, mt: 0.5, flexShrink: 0
          }}
        >
          <SmartToy sx={{ fontSize: 16, color: '#fff' }} />
        </Box>
      )}

      <Paper
        sx={{
          px: 2, py: 1.5,
          maxWidth: '85%',
          borderRadius: esIA ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
          bgcolor: esIA ? 'grey.100' : 'primary.main',
          color: esIA ? 'text.primary' : '#fff',
        }}
      >
        <Typography variant="body2" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
          {mensaje.texto}
        </Typography>
        <Typography
          variant="caption"
          sx={{ opacity: 0.6, display: 'block', mt: 0.5, textAlign: 'right' }}
        >
          {mensaje.hora}
        </Typography>
      </Paper>

      {!esIA && (
        <Box
          sx={{
            width: 28, height: 28, borderRadius: '50%',
            bgcolor: 'secondary.main', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            ml: 1, mt: 0.5, flexShrink: 0
          }}
        >
          <Person sx={{ fontSize: 16, color: '#fff' }} />
        </Box>
      )}
    </Box>
  );
};

// ─── Indicador de escritura ───────────────────────────────────────────────────
const Escribiendo = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 2, py: 1 }}>
    <SmartToy sx={{ fontSize: 16, color: 'primary.main' }} />
    <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
      Ollama está pensando
    </Typography>
    {[0, 0.2, 0.4].map((delay, i) => (
      <FiberManualRecord
        key={i}
        sx={{
          fontSize: 8,
          color: 'primary.main',
          animation: 'bounce 0.8s infinite',
          animationDelay: `${delay}s`,
          '@keyframes bounce': {
            '0%, 100%': { opacity: 0.3, transform: 'translateY(0)' },
            '50%': { opacity: 1, transform: 'translateY(-4px)' }
          }
        }}
      />
    ))}
  </Box>
);

// ─── Componente principal ─────────────────────────────────────────────────────
/**
 * Props:
 *   contexto: { scenarioTitle, scenarioDescription, budget }
 *   collapsed: bool (opcional, para iniciar colapsado)
 */
const AIAssistant = ({ contexto = {}, collapsed: initCollapsed = false }) => {
  const [mensajes, setMensajes] = useState([
    {
      rol: 'ia',
      texto: `Hola 👋 Soy tu asistente IA para este escenario.\n\nPuedo ayudarte a pensar mejor, pero no voy a decirte cuál decisión elegir. Hazme las preguntas que necesites sobre el contexto empresarial.`,
      hora: new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const [collapsed, setCollapsed] = useState(initCollapsed);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (!collapsed) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, collapsed]);

  const hora = () =>
    new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || cargando) return;

    // Agrega mensaje del usuario
    setMensajes(prev => [...prev, { rol: 'usuario', texto, hora: hora() }]);
    setInput('');
    setCargando(true);
    setError('');

    try {
      const res = await aiService.studentAssist(texto, contexto);
      const respuesta = res?.data?.respuesta ?? 'Sin respuesta del modelo.';
      setMensajes(prev => [...prev, { rol: 'ia', texto: respuesta, hora: hora() }]);
    } catch (err) {
      console.error('Error IA:', err);
      setError('No se pudo conectar con Ollama. Verifica que esté corriendo en localhost:11434');
    } finally {
      setCargando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviar();
    }
  };

  return (
    <Paper
      sx={{
        borderRadius: 3,
        border: '1.5px solid',
        borderColor: 'primary.light',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          bgcolor: 'primary.main',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToy sx={{ color: '#fff', fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={600} color="#fff">
            Asistente IA — Ollama
          </Typography>
          <Chip
            label="llama3.2"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 10 }}
          />
        </Box>
        <IconButton size="small" sx={{ color: '#fff' }}>
          {collapsed ? <ExpandMore /> : <ExpandLess />}
        </IconButton>
      </Box>

      <Collapse in={!collapsed}>
        {/* ── Mensajes ── */}
        <Box
          sx={{
            height: 280,
            overflowY: 'auto',
            p: 2,
            bgcolor: 'background.default'
          }}
        >
          {mensajes.map((m, i) => (
            <Burbuja key={i} mensaje={m} />
          ))}
          {cargando && <Escribiendo />}
          {error && (
            <Alert severity="error" sx={{ mt: 1, fontSize: 12 }}>
              {error}
            </Alert>
          )}
          <div ref={endRef} />
        </Box>

        <Divider />

        {/* ── Sugerencias rápidas ── */}
        <Box sx={{ px: 2, pt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            '¿Cuál es el mayor riesgo?',
            '¿Qué haría una empresa real?',
            '¿Cómo afecta al flujo de caja?'
          ].map(sug => (
            <Chip
              key={sug}
              label={sug}
              size="small"
              variant="outlined"
              onClick={() => { setInput(sug); }}
              sx={{ cursor: 'pointer', fontSize: 11 }}
            />
          ))}
        </Box>

        {/* ── Input ── */}
        <Box sx={{ display: 'flex', gap: 1, p: 2, pt: 1 }}>
          <TextField
            fullWidth
            size="small"
            multiline
            maxRows={3}
            placeholder="Pregunta algo sobre el escenario... (Enter para enviar)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={cargando}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
          />
          <IconButton
            color="primary"
            onClick={enviar}
            disabled={!input.trim() || cargando}
            sx={{
              bgcolor: 'primary.main',
              color: '#fff',
              borderRadius: 2,
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'action.disabledBackground' }
            }}
          >
            {cargando ? <CircularProgress size={18} color="inherit" /> : <Send fontSize="small" />}
          </IconButton>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
          pb={1}
        >
          La IA orienta, pero no revela la respuesta correcta
        </Typography>
      </Collapse>
    </Paper>
  );
};

export default AIAssistant;