import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import CreateScenario from './components/scenarios/CreateScenario';
import EditScenario from './components/scenarios/EditScenario';
import RunSimulation from './components/simulations/RunSimulation';
import SimulationResult from './components/simulations/SimulationResult';
import MySimulations from './components/simulations/MySimulations';
import Reports from './components/layout/Reports';
import UserManagement from './components/layout/UserManagement';
import SubjectManagement from './components/layout/SubjectManagement';
import ScenarioReport from './components/scenarios/ScenarioReport';


const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Navbar />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />

            {/* Gestión de usuarios (solo ADMIN) */}
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <UserManagement />
              </ProtectedRoute>
            } />

            {/* Gestión de materias (solo ADMIN) */}
            <Route path="/subjects" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SubjectManagement />
              </ProtectedRoute>
            } />

            {/* Reportes */}
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <Reports />
              </ProtectedRoute>
            } />

            {/* Crear escenario */}
            <Route path="/scenarios/create" element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <CreateScenario />
              </ProtectedRoute>
            } />

            {/* Editar escenario */}
            <Route path="/scenarios/edit/:scenarioId" element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <EditScenario />
              </ProtectedRoute>
            } />

            {/* Ejecutar simulación */}
            <Route path="/simulation/:scenarioId" element={
              <ProtectedRoute><RunSimulation /></ProtectedRoute>
            } />

            {/* Resultado de simulación */}
            <Route path="/simulation-result/:simulationId" element={
              <ProtectedRoute><SimulationResult /></ProtectedRoute>
            } />

            {/* Reporte de escenario */}
            <Route path="/scenarios/:scenarioId/report" element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <ScenarioReport />
              </ProtectedRoute>
            } />

            {/* Mis simulaciones */}
            <Route path="/my-simulations" element={
              <ProtectedRoute><MySimulations /></ProtectedRoute>
            } />

            {/* Redirecciones */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;