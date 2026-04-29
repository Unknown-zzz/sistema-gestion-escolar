import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CircularProgress, MenuItem, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  Chip, Alert,
} from '@mui/material';
import { courseService } from '../services/courseService';
import { Curso, ResumenAsistencia } from '../types';

const ESTADO_COLOR: Record<string, 'success' | 'error' | 'info'> = { P: 'success', F: 'error', L: 'info' };
const ESTADO_LABEL: Record<string, string> = { P: 'Presente', F: 'Falta', L: 'Licencia' };

export default function AsistenciaPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursoId, setCursoId] = useState<string>('');
  const [resumen, setResumen] = useState<ResumenAsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResumen, setLoadingResumen] = useState(false);

  useEffect(() => {
    courseService.getCursos().then(setCursos).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!cursoId) { setResumen([]); return; }
    setLoadingResumen(true);
    courseService.getResumenAsistencia(Number(cursoId))
      .then(setResumen)
      .catch(() => setResumen([]))
      .finally(() => setLoadingResumen(false));
  }, [cursoId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Asistencia por Curso</Typography>
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
          {loadingResumen ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={28} /></Box>
          ) : resumen.length === 0 ? (
            <Box sx={{ p: 4 }}>
              <Alert severity="info">No hay registros de asistencia para este curso.</Alert>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>Estudiante</b></TableCell>
                    <TableCell align="center"><b>Presentes</b></TableCell>
                    <TableCell align="center"><b>Faltas</b></TableCell>
                    <TableCell align="center"><b>Licencias</b></TableCell>
                    <TableCell align="center"><b>Total</b></TableCell>
                    <TableCell align="center"><b>% Asistencia</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumen.map(r => {
                    const total = r.presentes + r.faltas + r.licencias;
                    const pct = total > 0 ? Math.round((r.presentes / total) * 100) : 0;
                    return (
                      <TableRow key={r.estudiante_id} hover>
                        <TableCell>{r.nombre}</TableCell>
                        <TableCell align="center">
                          <Chip label={r.presentes} color="success" size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={r.faltas} color={r.faltas > 0 ? 'error' : 'default'} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={r.licencias} color={r.licencias > 0 ? 'info' : 'default'} size="small" />
                        </TableCell>
                        <TableCell align="center">{total}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${pct}%`}
                            color={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {!cursoId && (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, boxShadow: 1 }}>
          <Typography color="text.secondary">Selecciona un curso para ver el resumen de asistencia.</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            El registro de asistencia diaria lo realiza el docente desde su portal de cursos.
          </Typography>
        </Card>
      )}
    </Box>
  );
}
