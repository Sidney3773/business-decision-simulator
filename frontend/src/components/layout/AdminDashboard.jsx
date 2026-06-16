import { useState, useEffect } from 'react';
import {
  Container, Grid, Paper, Typography, Box, Button, Chip, Avatar,
  Divider, LinearProgress, List, ListItem, ListItemAvatar,
  ListItemText, Skeleton
} from '@mui/material';
import {
  People, School, Assignment, TrendingUp, ManageAccounts, MenuBook,
  Business, AccountBalance, ArrowForward, EmojiEvents, Groups,
  Warning, BarChart, PersonAdd
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

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
    'Ingeniería Comercial':       '#1976d2',
    'Administración de Empresas': '#9c27b0'
  };

  const ROLE_CFG = {
    ADMIN:   { color: '#f44336', label: 'Admin' },
    TEACHER: { color: '#ff9800', label: 'Profesor' },
    STUDENT: { color: '#4caf50', label: 'Estudiante' }
  };

  if (loading) return <Box sx={{ width: '100%', mt: 4 }}><LinearProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)', py: 4 }}>
      <Container maxWidth="lg">

        {/* Header — mismo patrón que StudentDashboard */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar sx={{
              width: 60, height: 60, fontSize: '1.5rem', fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
              }}>
                Panel de Administración
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bienvenido, {user?.name?.split(' ')[0]}. Gestiona la plataforma desde aquí.
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stat Cards — mismo patrón que StudentDashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{
              p: 3, borderRadius: 3, color: 'white',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              boxShadow: '0 8px 24px rgba(240, 147, 251, 0.4)',
              transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <School sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>{stats?.totalTeachers ?? '—'}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Profesores</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{
              p: 3, borderRadius: 3, color: 'white',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              boxShadow: '0 8px 24px rgba(67, 233, 123, 0.4)',
              transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <People sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>{stats?.totalStudents ?? '—'}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Estudiantes</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{
              p: 3, borderRadius: 3, color: 'white',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              boxShadow: '0 8px 24px rgba(79, 172, 254, 0.4)',
              transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MenuBook sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>{stats?.totalSubjects ?? '—'}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Materias</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{
              p: 3, borderRadius: 3, color: 'white',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              transition: 'transform 0.3s ease', '&:hover': { transform: 'translateY(-5px)' }
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Assignment sx={{ fontSize: 48, opacity: 0.9 }} />
                <Box>
                  <Typography variant="h3" fontWeight={800}>{stats?.totalSimulations ?? '—'}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Simulaciones</Typography>
                  {stats?.avgScore != null && (
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Prom: {stats.avgScore} pts</Typography>
                  )}
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Accesos rápidos */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { label: 'Gestionar Materias', icon: <MenuBook />, gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', shadow: 'rgba(79, 172, 254, 0.4)', path: '/subjects' },
            { label: 'Gestionar Usuarios', icon: <ManageAccounts />, gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', shadow: 'rgba(240, 147, 251, 0.4)', path: '/users' },
            { label: 'Ver Reportes', icon: <BarChart />, gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', shadow: 'rgba(67, 233, 123, 0.4)', path: '/reports' },
          ].map(a => (
            <Grid item xs={12} sm={4} key={a.label}>
              <Button fullWidth variant="contained" startIcon={a.icon}
                onClick={() => navigate(a.path)}
                sx={{
                  py: 1.8, borderRadius: 2, fontWeight: 600, fontSize: 15, textTransform: 'none',
                  background: a.gradient,
                  boxShadow: `0 4px 12px ${a.shadow}`,
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 6px 20px ${a.shadow}` },
                  transition: 'all 0.2s'
                }}>
                {a.label}
              </Button>
            </Grid>
          ))}
        </Grid>

        {/* Alertas pendientes */}
        {(stats?.studentsNoSubject > 0 || stats?.subjectsNoTeacher > 0) && (
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
                    <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/users')} sx={{ fontSize: 11 }}>Asignar</Button>
                  </Box>
                </Grid>
              )}
              {stats.subjectsNoTeacher > 0 && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      <strong>{stats.subjectsNoTeacher}</strong> materia{stats.subjectsNoTeacher !== 1 ? 's' : ''} sin profesor
                    </Typography>
                    <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/subjects')} sx={{ fontSize: 11 }}>Asignar</Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        )}

        <Grid container spacing={3}>
          {/* Materias activas */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <Box sx={{
                px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid', borderColor: 'divider'
              }}>
                <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MenuBook sx={{ color: '#4facfe' }} /> Materias activas
                </Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/subjects')}>Ver todas</Button>
              </Box>

              {subjects.length === 0 ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <MenuBook sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
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
                        <ListItem sx={{
                          px: 3, py: 1.5,
                          transition: 'all 0.3s ease',
                          '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.05)', transform: 'translateX(5px)' }
                        }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 38, height: 38, bgcolor: `${cc}18` }}>
                              {subj.career === 'Ingeniería Comercial'
                                ? <Business sx={{ color: cc, fontSize: 18 }} />
                                : <AccountBalance sx={{ color: cc, fontSize: 18 }} />}
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
                              <Box component="span" sx={{ display: 'flex', gap: 2, mt: 0.3 }}>
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <School sx={{ fontSize: 12, color: 'text.disabled' }} />
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    {subj.teacher?.name || 'Sin profesor'}
                                  </Typography>
                                </Box>
                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <Groups sx={{ fontSize: 12, color: 'text.disabled' }} />
                                  <Typography component="span" variant="caption" color="text.secondary">{cnt} est.</Typography>
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
            <Paper sx={{ borderRadius: 3, p: 3, mb: 3, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents sx={{ color: '#f57c00' }} /> Rendimiento global
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                <Typography variant="h3" fontWeight={800} sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                }}>
                  {stats?.avgScore ?? '—'}
                </Typography>
                {stats?.avgScore != null && (
                  <Typography variant="body2" color="text.secondary">/ 100 pts promedio</Typography>
                )}
              </Box>
              {stats?.avgScore != null && (
                <LinearProgress variant="determinate" value={stats.avgScore}
                  color={stats.avgScore >= 70 ? 'success' : stats.avgScore >= 50 ? 'warning' : 'error'}
                  sx={{ height: 10, borderRadius: 5 }} />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Basado en {stats?.totalSimulations ?? 0} simulaciones
              </Typography>
            </Paper>

            {/* Últimos usuarios */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
              <Box sx={{
                px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderBottom: '1px solid', borderColor: 'divider'
              }}>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAdd sx={{ color: '#f093fb' }} /> Últimos usuarios
                </Typography>
                <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/users')}>Ver todos</Button>
              </Box>
              <List disablePadding>
                {recentUsers.map((u, idx) => {
                  const cfg = ROLE_CFG[u.role] || { color: '#9e9e9e', label: u.role };
                  return (
                    <Box key={u.id}>
                      {idx > 0 && <Divider />}
                      <ListItem sx={{
                        px: 2.5, py: 1.2,
                        transition: 'all 0.3s ease',
                        '&:hover': { bgcolor: 'rgba(240, 147, 251, 0.05)', transform: 'translateX(5px)' }
                      }}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 36, height: 36, fontSize: 13, fontWeight: 700, bgcolor: cfg.color }}>
                            {u.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={600}>{u.name}</Typography>}
                          secondary={<Typography variant="caption" color="text.secondary">{u.email}</Typography>}
                        />
                        <Chip label={cfg.label} size="small"
                          sx={{ bgcolor: `${cfg.color}20`, color: cfg.color, fontWeight: 600, fontSize: 10 }} />
                      </ListItem>
                    </Box>
                  );
                })}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AdminDashboard;