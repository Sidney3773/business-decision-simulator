import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import CreateScenario from './components/scenarios/CreateScenario';
import RunSimulation from './components/simulations/RunSimulation';
import SimulationResult from './components/simulations/SimulationResult';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/scenarios/create"
              element={
                <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                  <CreateScenario />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/simulation/:scenarioId"
              element={
                <ProtectedRoute>
                  <RunSimulation />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/simulation-result/:simulationId"
              element={
                <ProtectedRoute>
                  <SimulationResult />
                </ProtectedRoute>
              }
            />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;