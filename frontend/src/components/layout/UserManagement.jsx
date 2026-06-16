import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Switch,
  FormControlLabel,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import {
  PersonAdd,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Person,
  School,
  AdminPanelSettings,
  Email,
  Lock,
  Badge,
  CheckCircle,
  Block
} from '@mui/icons-material';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  ADMIN:   { label: 'Administrador', color: 'error',   icon: <AdminPanelSettings fontSize="small" /> },
  TEACHER: { label: 'Profesor',      color: 'warning', icon: <School fontSize="small" /> },
  STUDENT: { label: 'Estudiante',    color: 'success', icon: <Person fontSize="small" /> }
};

const TABS = [
  { value: '', label: 'Todos' },
  { value: 'TEACHER', label: 'Profesores' },
  { value: 'STUDENT', label: 'Estudiantes' },
  { value: 'ADMIN', label: 'Administradores' }
];

const emptyForm = { name: '', email: '', password: '', role: 'STUDENT', isActive: true };

// ─── Modal: Crear / Editar usuario ───────────────────────────────────────────
const UserFormDialog = ({ open, onClose, onSaved, editingUser }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        role: editingUser.role,
        isActive: editingUser.isActive
      });
    } else {
      setFormData(emptyForm);
    }
    setError('');
    setShowPassword(false);
  }, [editingUser, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingUser) {
        // En edición, solo enviar password si el admin escribió una nueva
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await userService.update(editingUser.id, payload);
      } else {
        await userService.create(formData);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar el usuario');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonAdd color="primary" />
        {editingUser ? 'Editar usuario' : 'Crear nuevo usuario'}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <TextField
            fullWidth
            label="Nombre completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Badge fontSize="small" /></InputAdornment>
            }}
          />

          <TextField
            fullWidth
            type="email"
            label="Correo electrónico"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment>
            }}
          />

          <TextField
            fullWidth
            select
            label="Rol"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          >
            <MenuItem value="STUDENT">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person fontSize="small" color="success" /> Estudiante
              </Box>
            </MenuItem>
            <MenuItem value="TEACHER">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <School fontSize="small" color="warning" /> Profesor
              </Box>
            </MenuItem>
            <MenuItem value="ADMIN">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AdminPanelSettings fontSize="small" color="error" /> Administrador
              </Box>
            </MenuItem>
          </TextField>

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label={editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!editingUser}
            helperText={
              editingUser
                ? 'Déjalo en blanco para mantener la contraseña actual'
                : 'Mínimo 6 caracteres. Compártela con el usuario por un canal seguro.'
            }
            sx={{ mb: editingUser ? 2 : 0 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(s => !s)} edge="end" size="small">
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {editingUser && (
            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  color="success"
                />
              }
              label={formData.isActive ? 'Cuenta activa' : 'Cuenta desactivada'}
            />
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
          >
            {saving ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

// ─── Modal: confirmar eliminación ────────────────────────────────────────────
const ConfirmDelete = ({ open, user, onConfirm, onCancel }) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>¿Eliminar usuario?</DialogTitle>
    <DialogContent>
      <Typography variant="body2" color="text.secondary">
        Vas a eliminar a <strong>{user?.name}</strong> ({user?.email}). Esta acción no se puede deshacer.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Cancelar</Button>
      <Button onClick={onConfirm} color="error" variant="contained">Sí, eliminar</Button>
    </DialogActions>
  </Dialog>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getAll({ role: tab || undefined, limit: 100 });
      setUsers(res.data.users);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
      setSnackbar({ open: true, message: 'Error al cargar usuarios', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showSnackbar = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const handleCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    showSnackbar(editingUser ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente');
    loadUsers();
  };

  const handleDeleteConfirm = async () => {
    try {
      await userService.delete(deleteDialog.user.id);
      showSnackbar('Usuario eliminado correctamente');
      loadUsers();
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Error al eliminar usuario', 'error');
    } finally {
      setDeleteDialog({ open: false, user: null });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" fontWeight={700}>
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={handleCreate}
          sx={{ borderRadius: 2 }}
        >
          Nuevo usuario
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Crea cuentas para profesores y estudiantes. El registro público está deshabilitado;
        comparte las credenciales generadas aquí de forma segura con cada usuario.
      </Typography>

      <Paper sx={{ borderRadius: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          {TABS.map(t => <Tab key={t.value} value={t.value} label={t.label} />)}
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No hay usuarios en esta categoría.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(u => {
                    const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.STUDENT;
                    return (
                      <TableRow key={u.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: `${cfg.color}.main`, fontSize: 14, fontWeight: 700 }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {u.name}
                                {u.id === currentUser.id && (
                                  <Chip label="Tú" size="small" sx={{ ml: 1, height: 18, fontSize: 10 }} />
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip icon={cfg.icon} label={cfg.label} color={cfg.color} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            icon={u.isActive ? <CheckCircle /> : <Block />}
                            label={u.isActive ? 'Activo' : 'Inactivo'}
                            color={u.isActive ? 'success' : 'default'}
                            size="small"
                            variant={u.isActive ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Editar usuario">
                            <IconButton size="small" onClick={() => handleEdit(u)}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={u.id === currentUser.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}>
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setDeleteDialog({ open: true, user: u })}
                                disabled={u.id === currentUser.id}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        editingUser={editingUser}
      />

      <ConfirmDelete
        open={deleteDialog.open}
        user={deleteDialog.user}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialog({ open: false, user: null })}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default UserManagement;
