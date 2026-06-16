import { useState, useEffect, useCallback } from 'react';
import {
  Container, Paper, Typography, Button, Box, Grid, Card, CardContent,
  CardActions, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Alert, Snackbar, CircularProgress, Tooltip,
  IconButton, Avatar, AvatarGroup, Divider, List, ListItem, ListItemAvatar,
  ListItemText, Checkbox, InputAdornment, Tabs, Tab
} from '@mui/material';
import {
  Add, Edit, Delete, School, Person, Groups, CheckCircle, Block,
  Search, MenuBook, Business, AccountBalance, PersonOff
} from '@mui/icons-material';
import { subjectService } from '../../services/subjectService';
import { userService } from '../../services/userService';

const SUBJECT_NAMES = [
  'Proyecto Integrador Intermedio I',
  'Proyecto Integrador Intermedio II',
  'Proyecto Integrador Intermedio III',
  'Proyecto Integrador Final'
];
const CAREERS = ['Ingeniería Comercial', 'Administración de Empresas'];
const CAREER_ICON = {
  'Ingeniería Comercial': <Business fontSize="small" />,
  'Administración de Empresas': <AccountBalance fontSize="small" />
};
const CAREER_COLOR = { 'Ingeniería Comercial': 'primary', 'Administración de Empresas': 'secondary' };

// ─── Modal crear/editar materia ───────────────────────────────────────────────
const SubjectFormDialog = ({ open, onClose, onSaved, editingSubject, teachers }) => {
  const [formData, setFormData] = useState({ name: '', career: '', teacherId: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(editingSubject
      ? { name: editingSubject.name, career: editingSubject.career, teacherId: editingSubject.teacherId || '' }
      : { name: '', career: '', teacherId: '' }
    );
    setError('');
  }, [editingSubject, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = { name: formData.name, career: formData.career, teacherId: formData.teacherId || null };
      editingSubject ? await subjectService.update(editingSubject.id, payload) : await subjectService.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MenuBook color="primary" />
        {editingSubject ? 'Editar materia' : 'Crear nueva materia'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField fullWidth select label="Materia" name="name" value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required sx={{ mb: 2 }}>
            {SUBJECT_NAMES.map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </TextField>
          <TextField fullWidth select label="Carrera" name="career" value={formData.career}
            onChange={e => setFormData(p => ({ ...p, career: e.target.value }))} required sx={{ mb: 2 }}>
            {CAREERS.map(c => (
              <MenuItem key={c} value={c}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{CAREER_ICON[c]} {c}</Box>
              </MenuItem>
            ))}
          </TextField>
          <TextField fullWidth select label="Profesor asignado" name="teacherId" value={formData.teacherId}
            onChange={e => setFormData(p => ({ ...p, teacherId: e.target.value }))}
            helperText="Puedes asignarlo más tarde">
            <MenuItem value=""><em>Sin asignar</em></MenuItem>
            {teachers.map(t => (
              <MenuItem key={t.id} value={t.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" /> {t.name} — {t.email}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" variant="contained" disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}>
            {saving ? 'Guardando...' : editingSubject ? 'Guardar cambios' : 'Crear materia'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

// ─── Modal asignar estudiantes ────────────────────────────────────────────────
const AssignStudentsDialog = ({ open, onClose, onSaved, subject, allStudents }) => {
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (subject) setSelected((subject.students || []).map(s => s.id));
    setSearch(''); setError('');
  }, [subject, open]);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await subjectService.setStudents(subject.id, selected);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al asignar');
    } finally { setSaving(false); }
  };

  // Solo mostrar estudiantes sin materia O ya en esta materia
  const eligibles = allStudents.filter(s => !s.subjectId || s.subjectId === subject?.id);
  const filtered = eligibles.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );
  const otrosAsignados = allStudents.length - eligibles.length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Groups color="primary" />
        Asignar estudiantes — {subject?.name}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth size="small" placeholder="Buscar por nombre o email..."
          value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 1.5 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {selected.length} seleccionado(s)
          {otrosAsignados > 0 && ` · ${otrosAsignados} estudiante(s) en otra materia (no disponibles)`}
        </Typography>
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PersonOff sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {eligibles.length === 0 ? 'No hay estudiantes disponibles' : 'Sin resultados'}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 320, overflowY: 'auto' }}>
            {filtered.map(s => (
              <ListItem key={s.id} onClick={() => toggle(s.id)} sx={{ borderRadius: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                <Checkbox checked={selected.includes(s.id)} tabIndex={-1} disableRipple />
                <ListItemAvatar>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'success.main' }}>
                    {s.name.charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={s.name}
                  secondary={s.email}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
                {s.subjectId === subject?.id && (
                  <Chip label="Ya asignado" size="small" color="success" variant="outlined" />
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}>
          {saving ? 'Guardando...' : 'Guardar asignación'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Confirmar eliminación ────────────────────────────────────────────────────
const ConfirmDeleteSubject = ({ open, subject, onConfirm, onCancel }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>¿Eliminar materia?</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        Vas a eliminar <strong>{subject?.name}</strong> ({subject?.career}).
        Los estudiantes asignados quedarán sin materia. Esta acción no se puede deshacer.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancelar</Button>
      <Button onClick={onConfirm} color="error" variant="contained">Sí, eliminar</Button>
    </DialogActions>
  </Dialog>
);

// ─── Tarjeta de materia ───────────────────────────────────────────────────────
const SubjectCard = ({ subject, onEdit, onAssign, onDelete }) => {
  const careerColor = CAREER_COLOR[subject.career] || 'default';
  const studentCount = subject.studentCount ?? subject.students?.length ?? 0;

  return (
    <Card sx={{
      borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column',
      border: '1px solid', borderColor: 'divider', transition: 'all 0.2s',
      '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' }
    }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Chip icon={CAREER_ICON[subject.career]} label={subject.career}
            color={careerColor} size="small" variant="outlined" />
          {!subject.isActive && <Chip icon={<Block />} label="Inactiva" size="small" />}
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, lineHeight: 1.3 }}>
          {subject.name}
        </Typography>

        {/* Profesor */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1.5, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Avatar sx={{ width: 30, height: 30, fontSize: 12, bgcolor: subject.teacher ? 'warning.main' : 'grey.400' }}>
            <School sx={{ fontSize: 16 }} />
          </Avatar>
          {subject.teacher ? (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{subject.teacher.name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>{subject.teacher.email}</Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.disabled" fontStyle="italic">Sin profesor asignado</Typography>
          )}
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Contador de estudiantes */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Groups fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              <strong>{studentCount}</strong> estudiante{studentCount !== 1 ? 's' : ''}
            </Typography>
          </Box>
          {subject.students?.length > 0 && (
            <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: 10 } }}>
              {subject.students.map(s => (
                <Tooltip key={s.id} title={s.name}>
                  <Avatar sx={{ bgcolor: 'success.main' }}>{s.name.charAt(0).toUpperCase()}</Avatar>
                </Tooltip>
              ))}
            </AvatarGroup>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<Groups />}
          onClick={() => onAssign(subject)} sx={{ borderRadius: 2, flex: 1, fontSize: 12 }}>
          Estudiantes
        </Button>
        <Tooltip title="Editar materia">
          <IconButton size="small" onClick={() => onEdit(subject)}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Eliminar materia">
          <IconButton size="small" color="error" onClick={() => onDelete(subject)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [careerTab, setCareerTab] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assigningSubject, setAssigningSubject] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, subject: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, teachersRes, studentsRes] = await Promise.all([
        subjectService.getAll(),
        userService.getAll({ role: 'TEACHER', limit: 100 }),
        userService.getAll({ role: 'STUDENT', limit: 300 })
      ]);
      setSubjects(subjectsRes.data.subjects);
      setTeachers(teachersRes.data.users);
      setStudents(studentsRes.data.users);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: 'Error al cargar materias', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const showSnackbar = (msg, sev = 'success') => setSnackbar({ open: true, message: msg, severity: sev });

  const handleSaved = (msg) => {
    setFormOpen(false);
    setAssignOpen(false);
    showSnackbar(msg);
    loadAll();
  };

  const handleDeleteConfirm = async () => {
    try {
      await subjectService.delete(deleteDialog.subject.id);
      showSnackbar('Materia eliminada correctamente');
      loadAll();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Error al eliminar', 'error');
    } finally {
      setDeleteDialog({ open: false, subject: null });
    }
  };

  const filteredSubjects = careerTab ? subjects.filter(s => s.career === careerTab) : subjects;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight={700}>Gestión de Materias</Typography>
        <Button variant="contained" startIcon={<Add />}
          onClick={() => { setEditingSubject(null); setFormOpen(true); }} sx={{ borderRadius: 2 }}>
          Nueva materia
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Crea las materias por carrera, asigna un profesor y matricula estudiantes.
        Los escenarios del profesor solo serán visibles para los estudiantes de su materia.
      </Typography>

      <Paper sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs value={careerTab} onChange={(_, v) => setCareerTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab value="" label="Todas" />
          {CAREERS.map(c => <Tab key={c} value={c} label={c} icon={CAREER_ICON[c]} iconPosition="start" />)}
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filteredSubjects.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
          <MenuBook sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No hay materias {careerTab && `para ${careerTab}`} aún.</Typography>
          <Button variant="outlined" startIcon={<Add />}
            onClick={() => { setEditingSubject(null); setFormOpen(true); }}
            sx={{ mt: 2, borderRadius: 2 }}>
            Crear primera materia
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2.5}>
          {filteredSubjects.map(subject => (
            <Grid item xs={12} sm={6} md={4} key={subject.id}>
              <SubjectCard subject={subject}
                onEdit={(s) => { setEditingSubject(s); setFormOpen(true); }}
                onAssign={(s) => { setAssigningSubject(s); setAssignOpen(true); }}
                onDelete={(s) => setDeleteDialog({ open: true, subject: s })}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <SubjectFormDialog open={formOpen} onClose={() => setFormOpen(false)}
        onSaved={() => handleSaved(editingSubject ? 'Materia actualizada' : 'Materia creada')}
        editingSubject={editingSubject} teachers={teachers} />

      <AssignStudentsDialog open={assignOpen} onClose={() => setAssignOpen(false)}
        onSaved={() => handleSaved('Estudiantes asignados correctamente')}
        subject={assigningSubject} allStudents={students} />

      <ConfirmDeleteSubject open={deleteDialog.open} subject={deleteDialog.subject}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, subject: null })} />

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity}
          onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default SubjectManagement;
