import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, CircularProgress, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  IconButton, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { courseService } from '../services/courseService';
import { studentService } from '../services/studentService';
import { Inscripcion, Estudiante, Curso } from '../types';

const ESTADO_COLOR: Record<string, 'success' | 'error' | 'default'> = {
  activo: 'success',
  retirado: 'error',
  culminado: 'default',
};

export default function InscripcionesPage() {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ estudiante_id: '', curso_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [insc, est, cur] = await Promise.all([
        courseService.getInscripciones(),
        studentService.getEstudiantes(),
        studentService.getCursos(),
      ]);
      setInscripciones(insc);
      setEstudiantes(est);
      setCursos(cur);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const selectedCurso = cursos.find(c => String(c.id) === form.curso_id);

  const openForm = () => { setForm({ estudiante_id: '', curso_id: '' }); setError(''); setOpen(true); };

  const handleSave = async () => {
    if (!form.estudiante_id || !form.curso_id) { setError('Selecciona un estudiante y un curso.'); return; }
    setSaving(true); setError('');
    try {
      await courseService.createInscripcion({
        estudiante_id: Number(form.estudiante_id),
        curso_id: Number(form.curso_id),
      });
      setOpen(false);
      load();
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data
        ? JSON.stringify(err.response.data)
        : 'Error al inscribir.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleRetirar = async (id: number) => {
    if (!window.confirm('¿Retirar esta inscripción? Las matrículas asociadas pasarán a estado retirado.')) return;
    await courseService.deleteInscripcion(id);
    load();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Inscripciones</Typography>
          <Typography variant="body2" color="text.secondary">
            Inscribe estudiantes a un curso y se matriculan automáticamente en todas sus materias
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openForm} sx={{ borderRadius: 2 }}>
          Nueva Inscripción
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Estudiante', 'Expediente', 'Curso', 'Período', 'Fecha', 'Estado', 'Registrada por', 'Acciones'].map(h => (
                  <TableCell key={h} align={h === 'Acciones' ? 'right' : 'left'}><b>{h}</b></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {inscripciones.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No hay inscripciones registradas
                  </TableCell>
                </TableRow>
              )}
              {inscripciones.map(ins => (
                <TableRow key={ins.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {ins.estudiante.user.first_name} {ins.estudiante.user.last_name}
                  </TableCell>
                  <TableCell>
                    <Chip label={ins.estudiante.numero_expediente} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{ins.curso.nombre}</TableCell>
                  <TableCell>
                    {ins.curso.periodo
                      ? <Chip label={ins.curso.periodo} size="small" color="primary" variant="outlined" />
                      : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell>{new Date(ins.fecha_inscripcion).toLocaleDateString('es-PE')}</TableCell>
                  <TableCell>
                    <Chip
                      label={ins.estado}
                      size="small"
                      color={ESTADO_COLOR[ins.estado] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>{ins.registrada_por ?? '—'}</TableCell>
                  <TableCell align="right">
                    {ins.estado === 'activo' && (
                      <Tooltip title="Retirar inscripción">
                        <IconButton size="small" color="error" onClick={() => handleRetirar(ins.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon color="primary" /> Nueva Inscripción
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Estudiante"
            value={form.estudiante_id}
            onChange={e => setForm({ ...form, estudiante_id: e.target.value })}
            fullWidth
          >
            <MenuItem value=""><em>— Selecciona un estudiante —</em></MenuItem>
            {estudiantes
              .filter(e => e.estado === 'activo')
              .map(e => (
                <MenuItem key={e.id} value={String(e.id)}>
                  {e.user.first_name} {e.user.last_name} — {e.numero_expediente}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            select
            label="Curso"
            value={form.curso_id}
            onChange={e => setForm({ ...form, curso_id: e.target.value })}
            fullWidth
          >
            <MenuItem value=""><em>— Selecciona un curso —</em></MenuItem>
            {cursos
              .filter(c => c.estado)
              .map(c => (
                <MenuItem key={c.id} value={String(c.id)}>
                  {c.nombre}
                  {c.periodo ? ` — ${c.periodo}` : ''}
                </MenuItem>
              ))}
          </TextField>

          {selectedCurso && selectedCurso.periodo && (
            <Alert severity="info" icon={false}>
              Período del curso: <strong>{selectedCurso.periodo}</strong>
            </Alert>
          )}

          {selectedCurso && !selectedCurso.periodo && (
            <Alert severity="warning">
              Este curso no tiene un período asignado. Configúralo desde la gestión de cursos.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Inscribiendo...' : 'Inscribir'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
