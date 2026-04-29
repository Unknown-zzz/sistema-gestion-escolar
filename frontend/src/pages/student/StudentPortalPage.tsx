import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea, Chip,
  CircularProgress, Tabs, Tab, Table, TableHead, TableBody, TableRow,
  TableCell, TableContainer, Paper, Divider, Alert,
} from '@mui/material';
import BookIcon from '@mui/icons-material/Book';
import GradeIcon from '@mui/icons-material/Grade';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { courseService } from '../../services/courseService';
import { Curso, CentroNotas, ResumenAsistencia } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

function GradeChip({ nota }: { nota: number | null }) {
  if (nota === null) return <Typography variant="body2" color="text.disabled">—</Typography>;
  const color = nota >= 14 ? '#2e7d32' : nota >= 11 ? '#e65100' : '#c62828';
  return (
    <Typography variant="body2" sx={{ fontWeight: 700, color }}>{nota.toFixed(1)}</Typography>
  );
}

function CourseDetail({ curso }: { curso: Curso }) {
  const [tab, setTab] = useState(0);
  const [centroNotas, setCentroNotas] = useState<CentroNotas | null>(null);
  const [resumen, setResumen] = useState<ResumenAsistencia | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      courseService.getCentroNotas(curso.id),
      courseService.getResumenAsistencia(curso.id),
    ]).then(([notas, asistencias]) => {
      setCentroNotas(notas);
      // Filter only the current student's row — backend returns all students
      // We match by the single row that matches our own data (filas has 1 entry for students)
      setResumen(asistencias[0] ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [curso.id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>;

  return (
    <Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tab label="Mis Notas" icon={<GradeIcon />} iconPosition="start" />
        <Tab label="Mi Asistencia" icon={<EventAvailableIcon />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <>
          {!centroNotas || centroNotas.actividades.length === 0 ? (
            <Alert severity="info">No hay actividades registradas aún.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Actividad</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Pond. (%)</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Nota</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {centroNotas.actividades.map(act => {
                    const fila = centroNotas.filas[0];
                    const nota = fila ? (fila.notas[String(act.id)] ?? null) : null;
                    return (
                      <TableRow key={act.id} hover>
                        <TableCell>{act.nombre}</TableCell>
                        <TableCell>
                          <Chip label={act.tipo} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>{act.ponderacion}%</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <GradeChip nota={nota} />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {centroNotas.filas[0] && (
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Promedio ponderado</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <GradeChip nota={calcularPromedio(centroNotas)} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          {!resumen ? (
            <Alert severity="info">No hay registros de asistencia aún.</Alert>
          ) : (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#2e7d32' }}>{resumen.presentes}</Typography>
                    <Typography variant="caption" color="text.secondary">Presentes</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#c62828' }}>{resumen.faltas}</Typography>
                    <Typography variant="caption" color="text.secondary">Faltas</Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, textAlign: 'center', p: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#e65100' }}>{resumen.licencias}</Typography>
                    <Typography variant="caption" color="text.secondary">Licencias</Typography>
                  </Card>
                </Grid>
              </Grid>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Total clases registradas: {resumen.presentes + resumen.faltas + resumen.licencias}
              </Typography>
              {resumen.faltas + resumen.licencias > 0 && (
                <Alert severity={resumen.faltas >= 3 ? 'warning' : 'info'} sx={{ mt: 2 }}>
                  {resumen.faltas >= 3
                    ? `Tienes ${resumen.faltas} falta(s). Considera hablar con tu docente.`
                    : `Tienes ${resumen.faltas} falta(s) y ${resumen.licencias} licencia(s).`}
                </Alert>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

function calcularPromedio(centro: CentroNotas): number | null {
  const fila = centro.filas[0];
  if (!fila) return null;
  let totalPond = 0;
  let sumaNotas = 0;
  let hayNotas = false;
  for (const act of centro.actividades) {
    const nota = fila.notas[String(act.id)];
    if (nota !== null && nota !== undefined) {
      sumaNotas += nota * (act.ponderacion / 100);
      totalPond += act.ponderacion;
      hayNotas = true;
    }
  }
  if (!hayNotas || totalPond === 0) return null;
  return (sumaNotas / totalPond) * 100;
}

export default function StudentPortalPage() {
  const { user } = useAuth();
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseService.getMisCursos().then(setCursos).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Bienvenido, {user?.first_name} {user?.last_name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Selecciona un curso para ver tus notas y asistencia
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          {cursos.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <BookIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">No estás matriculado en ningún curso.</Typography>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {cursos.map(curso => (
                <Card
                  key={curso.id}
                  sx={{
                    borderRadius: 3,
                    boxShadow: selectedCurso?.id === curso.id ? 4 : 1,
                    border: selectedCurso?.id === curso.id ? '2px solid' : '2px solid transparent',
                    borderColor: selectedCurso?.id === curso.id ? 'primary.main' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <CardActionArea onClick={() => setSelectedCurso(curso)} sx={{ p: 1 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{curso.nombre}</Typography>
                        <Chip label={curso.codigo} size="small" variant="outlined" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {curso.grado?.nombre}
                      </Typography>
                      {curso.docente && (
                        <Typography variant="caption" color="text.secondary">
                          Prof. {curso.docente.user.first_name} {curso.docente.user.last_name}
                        </Typography>
                      )}
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          {selectedCurso ? (
            <Card sx={{ borderRadius: 3, boxShadow: 2, p: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{selectedCurso.nombre}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedCurso.grado?.nombre} • {selectedCurso.numero_horas}h semanales
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <CourseDetail curso={selectedCurso} />
            </Card>
          ) : (
            <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, boxShadow: 1 }}>
              <BookIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">Selecciona un curso para ver el detalle</Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
