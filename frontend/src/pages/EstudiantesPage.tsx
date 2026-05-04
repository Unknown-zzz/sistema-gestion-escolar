import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Card, Table, TableHead,
  TableRow, TableCell, TableBody, Chip, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, TableContainer, Tooltip, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { studentService } from '../services/studentService';
import { Estudiante, Curso } from '../types';

const ESTADO_COLOR: Record<string, any> = {
  activo: 'success', inactivo: 'default', retirado: 'warning', egresado: 'info',
};

const emptyForm = { numero_expediente: '', documento: '', fecha_nacimiento: '', curso_id: '', estado: 'activo' };

export default function EstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [est, cur] = await Promise.all([studentService.getEstudiantes(), studentService.getCursos()]);
      setEstudiantes(est);
      setCursos(cur);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setError(''); setOpen(true); };
  const openEdit = (e: Estudiante) => {
    setForm({ numero_expediente: e.numero_expediente, documento: e.documento, fecha_nacimiento: e.fecha_nacimiento, curso_id: e.curso?.id || '', estado: e.estado });
    setEditing(e.id); setError(''); setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) await studentService.updateEstudiante(editing, form);
      else await studentService.createEstudiante(form);
      setOpen(false); load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar este estudiante?')) return;
    await studentService.deleteEstudiante(id);
    load();
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Estudiantes</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>
          Nuevo Estudiante
        </Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Nombre</b></TableCell>
                <TableCell><b>Expediente</b></TableCell>
                <TableCell><b>Documento</b></TableCell>
                <TableCell><b>Curso</b></TableCell>
                <TableCell><b>Estado</b></TableCell>
                <TableCell align="right"><b>Acciones</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {estudiantes.length === 0 && (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay estudiantes registrados</TableCell></TableRow>
              )}
              {estudiantes.map((e) => (
                <TableRow key={e.id} hover>
                  <TableCell>{e.user.first_name} {e.user.last_name}</TableCell>
                  <TableCell>{e.numero_expediente}</TableCell>
                  <TableCell>{e.documento}</TableCell>
                  <TableCell>{e.curso?.nombre || '—'}</TableCell>
                  <TableCell><Chip label={e.estado} color={ESTADO_COLOR[e.estado]} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(e)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Desactivar"><IconButton size="small" color="error" onClick={() => handleDelete(e.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Estudiante' : 'Nuevo Estudiante'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="N° Expediente" value={form.numero_expediente} onChange={e => setForm({ ...form, numero_expediente: e.target.value })} fullWidth />
          <TextField label="Documento" value={form.documento} onChange={e => setForm({ ...form, documento: e.target.value })} fullWidth />
          <TextField label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Curso" select value={form.curso_id} onChange={e => setForm({ ...form, curso_id: e.target.value })} fullWidth>
            <MenuItem value="">Sin asignar</MenuItem>
            {cursos.map(c => <MenuItem key={c.id} value={c.id}>{c.nombre}</MenuItem>)}
          </TextField>
          <TextField label="Estado" select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} fullWidth>
            {['activo', 'inactivo', 'retirado', 'egresado'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
