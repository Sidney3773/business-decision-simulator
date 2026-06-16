import { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Card, CardContent, Box,
  Button, Chip, Avatar, Divider, LinearProgress, List,
  ListItem, ListItemAvatar, ListItemText, Skeleton
} from '@mui/material';
import {
  People, School, Assignment, TrendingUp, ManageAccounts,
  MenuBook, Business, AccountBalance, ArrowForward,
  EmojiEvents, Groups, Warning
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, sublabel, loading }) => (
  <Card sx={{
    borderRadius: 3,
    background: `linear-gradient(135deg, ${color}20 0%, ${color}08 100%)`,
    border: `1.5px solid ${color}30`,
    transition: 'transform 0.2s',
    '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${color}25` }
  }}>
    <CardContent sx={{ p: 2.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}20` }}>{icon}</Box>
        <Box>
          {loading
            ? <Skeleton width={50} height={40} />
            : <Typography variant="h3" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value ?? '—'}</Typography>
          }
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{label}</Typography>
          {sublabel && <Typography variant="caption" color="text.disabled">{sublabel}</Typography>}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ─── Dashboard Admin ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, scenariosRes, simsRes, subjectsRes] = await Promise.all([
          api.get('/users', { params: { limit: 300 } }),
          api.get('/scenarios'),
          api.get('/simulations'),
          api.get('/subjects')
        ]);

        const users    = usersRes.data.data.users || [];
        const sims     = simsRes.data.data.simulations || [];
        const subjs    = subjectsRes.data.data.subjects || [];
        const teachers = users.filter(u => u.role === 'TEACHER');
        const students = users.filter(u => u.role === 'STUDENT');
        const scores   = sims.map(s => s.score).filter(s => s != null);
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

        setStats({
          totalTeachers:     teachers.length,
          totalStudents:     students.length,
          totalSubjects:     subjs.length,
          totalSimulations:  sims.length,
          totalScenarios:    scenariosRes.data.data.scenarios?.length || 0,
          avgScore,
          studentsNoSubject: students.filter(u => !u.subjectId).length,
          subjectsNoTeacher: subjs.filter(s => !s.teacherId).length
        });
        setSubjects(subjs.slice(0, 6));
        setRecentUsers(users.slice(0, 5));
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const CAREER_COLOR = {
    'Ingeniería Comercial':     '#1976d2',
    'Administración de Empresas': '#9c27b0'
  };

  const ROLE_CFG = {
    ADMIN:   { color: 'error',   label: 'Admin' },
    TEACHER: { color: 'warning', label: 'Profesor' },
    STUDENT: { color: 'success', label: 'Estudiante' }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8f9fa', py: 4 }}>
      <Container maxWidth="lg">

        {/* Bienvenida */}
        <Box sx={{
          p: 3, mb: 4, borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white', display: 'flex', alignItems: 'center', gap: 2
        }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: 'rgba(255,255,255,0.25)', fontSize: 22, fontWeight: 700 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800}>Panel de Administración</Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Bienvenido, {user?.name}. Gestiona materias, profesores y estudiantes desde aquí.
            </Typography>
          </Box>
        </Box>

        {/* Acciones rápidas */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Gestionar Materias', icon: <MenuBook />,      color: '#1976d2', path: '/subjects' },
            { label: 'Gestionar Usuarios', icon: <ManageAccounts />, color: '#9c27b0', path: '/users' },
            { label: 'Ver Reportes',       icon: <TrendingUp />,     color: '#2e7d32', path: '/reports' }
          ].map(a => (
            <Grid item xs={12} sm={4} key={a.label}>
              <Button fullWidth variant="contained" startIcon={a.icon}
                onClick={() => navigate(a.path)}
                sx={{
                  py: 1.8, borderRadius: 2, fontWeight: 600, fontSize: 15,
                  bgcolor: a.color,
                  '&:hover': { bgcolor: a.color, filter: 'brightness(0.9)', transform: 'translateY(-2px)' },
                  transition: 'all 0.2s'
                }}>
                {a.label}
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* Métricas */}
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Resumen de la plataforma</Typography>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<School sx={{ color: '#f57c00', fontSize: 28 }} />}
              label="Profesores" value={stats?.totalTeachers} color="#f57c00" loading={loading} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<People sx={{ color: '#2e7d32', fontSize: 28 }} />}
              label="Estudiantes" value={stats?.totalStudents} color="#2e7d32" loading={loading} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<MenuBook sx={{ color: '#1565c0', fontSize: 28 }} />}
              label="Materias" value={stats?.totalSubjects} color="#1565c0" loading={loading} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={<Assignment sx={{ color: '#6a1b9a', fontSize: 28 }} />}
              label="Simulaciones" value={stats?.totalSimulations}
              sublabel={stats?.avgScore != null ? `Promedio: ${stats.avgScore} pts` : undefined}
              color="#6a1b9a" loading={loading} />
          </Grid>
        </Grid>

        {/* Alertas pendientes */}
        {!loading && (stats?.studentsNoSubject > 0 || stats?.subjectsNoTeacher > 0) && (
          <Paper sx={{ p: 2.5, mb: 4, borderRadius: 3, border: '1.5px solid', borderColor: 'warning.light', bgcolor: '#fffbf0' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Warning color="warning" />
              <Typography variant="subtitle2" fontWeight={700} color="warning.dark">Atención requerida</Typography>
            </Box>
            <Grid container spacing={2}>
              {stats.studentsNoSubject > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      <strong>{stats.studentsNoSubject}</strong> estudiante{stats.studentsNoSubject !== 1 ? 's' : ''} sin materia
                    </Typography>
                    <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/users')} sx={{ fontSize: 11 }}>
                      Asignar
                    </Button>
                  </Box>
                </Grid>
              )}
              {stats.subjectsNoTeacher > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      <strong>{stats.subjectsNoTeacher}</strong> materia{stats.subjectsNoTeacher !== 1 ? 's' : ''} sin profesor
                    </Typography>
                    <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/subjects')} sx={{ fontSize: 11 }}>
                      Asignar
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        <Grid container spacing={3}>
          {/* Materias activas */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={700}>Materias activas</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/subjects')}>Ver todas</Button>
              </Box>
              {loading ? (
                <Box sx={{ p: 2 }}>
                  {[1, 2, 3].map(i => <Skeleton key={i} height={64} sx={{ mb: 1, borderRadius: 2 }} />)}
                </Box>
              ) : subjects.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <MenuBook sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>No hay materias creadas aún.</Typography>
                  <Button variant="outlined" onClick={() => navigate('/subjects')} sx={{ borderRadius: 2 }}>Crear primera materia</Button>
                </Box>
              ) : (
                <List disablePadding>
                  {subjects.map((subj, idx) => {
                    const cc = CAREER_COLOR[subj.career] || '#666';
                    const cnt = subj.studentCount ?? subj.students?.length ?? 0;
                    return (
                      <Box key={subj.id}>
                        {idx > 0 && <Divider />}
                        <ListItem sx={{ px: 3, py: 1.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 38, height: 38, bgcolor: `${cc}18` }}>
                              {subj.career === 'Ingeniería Comercial'
                                ? <Business sx={{ color: cc, fontSize: 18 }} />
                                : <AccountBalance sx={{ color: cc, fontSize: 18 }} />
                              }
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight={600}>{subj.name}</Typography>
                                <Chip label={subj.career === 'Ingeniería Comercial' ? 'ING' : 'ADM'}
                                  size="small" sx={{ height: 18, fontSize: 10, bgcolor: `${cc}18`, color: cc }} />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', gap: 2, mt: 0.3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <School sx={{ fontSize: 12, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {subj.teacher?.name || 'Sin profesor'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <Groups sx={{ fontSize: 12, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">{cnt} est.</Typography>
                                </Box>
                              </Box>
                            }
                          />
                          {!subj.teacher && (
                            <Chip icon={<Warning />} label="Sin prof." size="small" color="warning" variant="outlined" sx={{ fontSize: 10 }} />
                          )}
                        </ListItem>
                      </Box>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Panel derecho */}
          <Grid item xs={12} md={5}>
            {/* Score global */}
            <Paper sx={{ borderRadius: 3, p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEvents color="warning" />
                <Typography variant="h6" fontWeight={700}>Rendimiento global</Typography>
              </Box>
              {loading ? <Skeleton height={60} /> : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                    <Typography variant="h2" fontWeight={800} color="primary">
                      {stats?.avgScore ?? '—'}
                    </Typography>
                    {stats?.avgScore != null && (
                      <Typography variant="body1" color="text.secondary">/ 100 pts promedio</Typography>
                    )}
                  </Box>
                  {stats?.avgScore != null && (
                    <LinearProgress variant="determinate" value={stats.avgScore}
                      color={stats.avgScore >= 70 ? 'success' : stats.avgScore >= 50 ? 'warning' : 'error'}
                      sx={{ height: 8, borderRadius: 4 }} />
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Basado en {stats?.totalSimulations ?? 0} simulaciones
                  </Typography>
                </>
              )}
            </Paper>

            {/* Últimos usuarios */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight={700}>Últimos usuarios</Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/users')}>Ver todos</Button>
              </Box>
              {loading ? (
                <Box sx={{ p: 2 }}>
                  {[1, 2, 3].map(i => <Skeleton key={i} height={52} sx={{ mb: 0.5, borderRadius: 2 }} />)}
                </Box>
              ) : (
                <List disablePadding>
                  {recentUsers.map((u, idx) => {
                    const cfg = ROLE_CFG[u.role] || { color: 'default', label: u.role };
                    return (
                      <Box key={u.id}>
                        {idx > 0 && <Divider />}
                        <ListItem sx={{ px: 2.5, py: 1 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: `${cfg.color}.main` }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={<Typography variant="body2" fontWeight={600}>{u.name}</Typography>}
                            secondary={<Typography variant="caption" color="text.secondary">{u.email}</Typography>}
                          />
                          <Chip label={cfg.label} color={cfg.color} size="small" />
                        </ListItem>
                      </Box>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;