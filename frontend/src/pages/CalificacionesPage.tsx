import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CircularProgress, MenuItem, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Alert,
} from '@mui/material';
import { courseService } from '../services/courseService';
import { Curso, CentroNotas } from '../types';

function notaDisplay(nota: number | null | undefined) {
  if (nota === null || nota === undefined) return <Typography variant="body2" color="text.disabled">—</Typography>;
  const color = nota >= 14 ? '#2e7d32' : nota >= 11 ? '#e65100' : '#c62828';
  return <Typography variant="body2" sx={{ fontWeight: 700, color }}>{nota.toFixed(1)}</Typography>;
}

export default function CalificacionesPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState<string>('');
  const [centroNotas, setCentroNotas] = useState<CentroNotas | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingNotas, setLoadingNotas] = useState(false);

  useEffect(() => {
    courseService.getCursos().then(setCursos).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!cursoId) { setCentroNotas(null); return; }
    setLoadingNotas(true);
    courseService.getCentroNotas(Number(cursoId))
      .then(setCentroNotas)
      .catch(() => setCentroNotas(null))
      .finally(() => setLoadingNotas(false));
  }, [cursoId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Calificaciones por Curso</Typography>
        <TextField
          select
          label="Seleccionar curso"
          value={cursoId}
          onChange={e => setCursoId(e.target.value)}
          sx={{ minWidth: 300 }}
        >
          <MenuItem value=""><em>— Selecciona un curso —</em></MenuItem>
          {cursos.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.nombre} ({c.codigo})</MenuItem>)}
        </TextField>
      </Box>

      {cursoId && (
        <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
          {loadingNotas ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
          ) : !centroNotas || centroNotas.actividades.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <Alert severity="info">No hay actividades registradas para este curso.</Alert>
            </Box>
          ) : (
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 180, bgcolor: 'grey.50', position: 'sticky', left: 0, zIndex: 3 }}>
                      Estudiante
                    </TableCell>
                    {centroNotas.actividades.map(act => (
                      <TableCell key={act.id} align="center" sx={{ fontWeight: 700, minWidth: 110, bgcolor: 'grey.50' }}>
                        <Typography variant="caption" noWrap sx={{ display: 'block', maxWidth: 100 }}>{act.nombre}</Typography>
                        <Typography variant="caption" color="text.secondary">{act.ponderacion}%</Typography>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {centroNotas.filas.map(fila => (
                    <TableRow key={fila.estudiante_id} hover>
                      <TableCell sx={{ position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1, fontWeight: 500 }}>
                        {fila.nombre}
                      </TableCell>
                      {centroNotas.actividades.map(act => (
                        <TableCell key={act.id} align="center">
                          {notaDisplay(fila.notas[String(act.id)])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {!cursoId && (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, boxShadow: 1 }}>
          <Typography color="text.secondary">Selecciona un curso para ver el centro de notas.</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Las notas las ingresa el docente desde su portal de cursos.
          </Typography>
        </Card>
      )}
    </Box>
  );
}
