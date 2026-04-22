import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box  //  AGREGAR ESTE IMPORT
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { scenarioService } from '../../services/scenarioService';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scenarios, setScenarios] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadScenarios = async () => {
    try {
      const res = await scenarioService.getAll();
      // Filtrar solo escenarios creados por el profesor actual
      const myScenarios = res.data.scenarios.filter(s => s.createdBy === user.id);
      setScenarios(myScenarios);
    } catch (error) {
      console.error('Error cargando escenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este escenario?')) return;

    try {
      await scenarioService.delete(id);
      loadScenarios();
    } catch (error) {
      console.error('Error eliminando escenario:', error);
      alert('Error al eliminar el escenario');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard - Profesor
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Bienvenido, {user?.name}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Mis Escenarios</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/scenarios/create')}
              >
                Crear Escenario
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Título</TableCell>
                    <TableCell>Dificultad</TableCell>
                    <TableCell>Presupuesto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scenarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No has creado escenarios aún
                      </TableCell>
                    </TableRow>
                  ) : (
                    scenarios.map((scenario) => (
                      <TableRow key={scenario.id}>
                        <TableCell>{scenario.title}</TableCell>
                        <TableCell>
                          <Chip
                            label={scenario.difficulty}
                            size="small"
                            color={
                              scenario.difficulty === 'EASY'
                                ? 'success'
                                : scenario.difficulty === 'MEDIUM'
                                ? 'warning'
                                : 'error'
                            }
                          />
                        </TableCell>
                        <TableCell>${parseFloat(scenario.initialBudget).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={scenario.isActive ? 'Activo' : 'Inactivo'}
                            size="small"
                            color={scenario.isActive ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/scenarios/${scenario.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/scenarios/edit/${scenario.id}`)}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(scenario.id)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TeacherDashboard;