import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Grid, Card, CardContent, CardActionArea, Chip, CircularProgress } from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import PeopleIcon from '@mui/icons-material/People';
import { courseService } from '../../services/courseService';
import { Curso } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getMisCursos().then(setCursos).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Bienvenido, Prof. {user?.first_name} {user?.last_name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Selecciona un curso para gestionar asistencia, actividades y calificaciones
        </Typography>
      </Box>

      {cursos.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <BookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No tienes cursos asignados actualmente.</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {cursos.map(curso => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={curso.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 2, height: '100%' }}>
                <CardActionArea onClick={() => navigate(`/docente/cursos/${curso.id}`)} sx={{ p: 2, height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{curso.nombre}</Typography>
                      <Chip label={curso.codigo} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {curso.grado?.nombre} • {curso.numero_horas}h semanales
                    </Typography>
                    {curso.descripcion && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {curso.descripcion}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2 }}>
                      <PeopleIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">Ver estudiantes y gestionar</Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
