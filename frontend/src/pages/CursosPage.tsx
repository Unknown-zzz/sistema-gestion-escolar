import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, TableContainer, Card, Tooltip, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { courseService } from '../services/courseService';
import { studentService } from '../services/studentService';
import { Curso, Grado, Docente } from '../types';

const emptyForm = { nombre: '', codigo: '', grado_id: '', docente_id: '', descripcion: '', numero_horas: '', creditos: 0 };

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const [cur, gr, doc] = await Promise.all([courseService.getCursos(), studentService.getGrados(), courseService.getDocentes()]);
      setCursos(cur); setGrados(gr); setDocentes(doc);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditing(null); setError(''); setOpen(true); };
  const openEdit = (c: Curso) => {
    setForm({ nombre: c.nombre, codigo: c.codigo, grado_id: c.grado?.id || '', docente_id: c.docente?.id || '', descripcion: c.descripcion, numero_horas: c.numero_horas, creditos: c.creditos });
    setEditing(c.id); setError(''); setOpen(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) await courseService.updateCurso(editing, form);
      else await courseService.createCurso(form);
      setOpen(false); load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Desactivar este curso?')) return;
    await courseService.deleteCurso(id);
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
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Cursos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ borderRadius: 2 }}>Nuevo Curso</Button>
      </Box>

      <Card sx={{ borderRadius: 3, boxShadow: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Nombre', 'Código', 'Grado', 'Docente', 'Horas', 'Estado', 'Acciones'].map(h => (
                  <TableCell key={h} align={h === 'Acciones' ? 'right' : 'left'}><b>{h}</b></TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {cursos.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No hay cursos registrados</TableCell></TableRow>
              )}
              {cursos.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell><Chip label={c.codigo} size="small" variant="outlined" /></TableCell>
                  <TableCell>{c.grado?.nombre || '—'}</TableCell>
                  <TableCell>{c.docente ? `${c.docente.user.first_name} ${c.docente.user.last_name}` : '—'}</TableCell>
                  <TableCell>{c.numero_horas}h</TableCell>
                  <TableCell><Chip label={c.estado ? 'Activo' : 'Inactivo'} color={c.estado ? 'success' : 'default'} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => openEdit(c)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Desactivar"><IconButton size="small" color="error" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Curso' : 'Nuevo Curso'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} fullWidth />
          <TextField label="Código" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} fullWidth />
          <TextField label="Grado" select value={form.grado_id} onChange={e => setForm({ ...form, grado_id: e.target.value })} fullWidth>
            {grados.map(g => <MenuItem key={g.id} value={g.id}>{g.nombre}</MenuItem>)}
          </TextField>
          <TextField label="Docente" select value={form.docente_id} onChange={e => setForm({ ...form, docente_id: e.target.value })} fullWidth>
            <MenuItem value="">Sin asignar</MenuItem>
            {docentes.map(d => <MenuItem key={d.id} value={d.id}>{d.user.first_name} {d.user.last_name}</MenuItem>)}
          </TextField>
          <TextField label="N° de horas" type="number" value={form.numero_horas} onChange={e => setForm({ ...form, numero_horas: e.target.value })} fullWidth />
          <TextField label="Créditos" type="number" value={form.creditos} onChange={e => setForm({ ...form, creditos: e.target.value })} fullWidth />
          <TextField label="Descripción" multiline rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} fullWidth />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
