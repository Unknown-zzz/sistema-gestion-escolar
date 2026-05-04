import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EstudiantesPage from './pages/EstudiantesPage';
import DocentesPage from './pages/DocentesPage';
import CursosPage from './pages/CursosPage';
import CalificacionesPage from './pages/CalificacionesPage';
import AsistenciaPage from './pages/AsistenciaPage';
import PagosPage from './pages/PagosPage';
import InscripcionesPage from './pages/InscripcionesPage';
import HorarioPage from './pages/HorarioPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherCoursePage from './pages/teacher/TeacherCoursePage';
import StudentPortalPage from './pages/student/StudentPortalPage';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

function RoleRedirect() {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === 'docente') return <Navigate to="/docente" replace />;
  if (user.role === 'estudiante') return <Navigate to="/estudiante" replace />;
  return <DashboardPage />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Shared layout for all authenticated users */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<RoleRedirect />} />

              {/* Admin / Directivo routes */}
              <Route path="estudiantes" element={<EstudiantesPage />} />
              <Route path="docentes" element={<DocentesPage />} />
              <Route path="cursos" element={<CursosPage />} />
              <Route path="calificaciones" element={<CalificacionesPage />} />
              <Route path="asistencia" element={<AsistenciaPage />} />
              <Route path="pagos" element={<PagosPage />} />
              <Route path="inscripciones" element={<InscripcionesPage />} />
              <Route path="horario" element={<HorarioPage />} />

              {/* Teacher routes */}
              <Route path="docente" element={<TeacherDashboard />} />
              <Route path="docente/cursos/:id" element={<TeacherCoursePage />} />

              {/* Student routes */}
              <Route path="estudiante" element={<StudentPortalPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
