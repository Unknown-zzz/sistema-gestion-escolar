import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Tabs, Tab, CircularProgress, Button, Paper,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer,
  ToggleButton, ToggleButtonGroup, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Chip, IconButton, Tooltip,
  Card, CardContent, Alert, Divider, Select, FormControl, InputLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { courseService } from '../../services/courseService';
import { Curso, Estudiante, Actividad, EstadoAsistencia, ResumenAsistencia, CentroNotas } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const today = new Date().toISOString().split('T')[0];

const ESTADO_COLORS: Record<EstadoAsistencia, string> = { P: '#4caf50', F: '#f44336', L: '#2196f3' };
const ESTADO_LABELS: Record<EstadoAsistencia, string> = { P: 'Presente', F: 'Falta', L: 'Licencia' };

// ── Tab 1: Asistencia ─────────────────────────────────────────────────────────

function TabAsistencia({ cursoId }: { cursoId: number }) {
  const { user } = useAuth();
  const [fecha, setFecha] = useState(today);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estados, setEstados] = useState<Record<number, EstadoAsistencia>>({});
  const [motivos, setMotivos] = useState<Record<number, string>>({});
  const [resumen, setResumen] = useState<ResumenAsistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'tomar' | 'resumen'>('tomar');

  const loadEstudiantes = useCallback(async () => {
    const est = await courseService.getCursoEstudiantes(cursoId);
    setEstudiantes(est);
    const defaultEstados: Record<number, EstadoAsistencia> = {};
    est.forEach((e: Estudiante) => { defaultEstados[e.id] = 'P'; });
    setEstados(defaultEstados);
    setLoading(false);
  }, [cursoId]);

  const loadAsistenciaFecha = useCallback(async () => {
    const asis = await courseService.getAsistenciaCurso(cursoId, fecha);
    if (asis.length > 0) {
      const nuevoEstados: Record<number, EstadoAsistencia> = {};
      const nuevosMotivos: Record<number, string> = {};
      asis.forEach(a => { nuevoEstados[a.estudiante] = a.estado; nuevosMotivos[a.estudiante] = a.motivo || ''; });
      setEstados(prev => ({ ...prev, ...nuevoEstados }));
      setMotivos(nuevosMotivos);
    }
  }, [cursoId, fecha]);

  const loadResumen = useCallback(async () => {
    const res = await courseService.getResumenAsistencia(cursoId);
    setResumen(res);
  }, [cursoId]);

  useEffect(() => { loadEstudiantes(); }, [loadEstudiantes]);
  useEffect(() => { if (estudiantes.length > 0) loadAsistenciaFecha(); }, [fecha, loadAsistenciaFecha, estudiantes.length]);
  useEffect(() => { if (tab === 'resumen') loadResumen(); }, [tab, loadResumen]);

  const handleSave = async () => {
    setSaving(true);
    const registros = Object.entries(estados).map(([id, estado]) => ({
      estudiante: Number(id), estado, motivo: motivos[Number(id)] || '',
    }));
    await courseService.registrarAsistenciaBulk(cursoId, fecha, registros);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant={tab === 'tomar' ? 'contained' : 'outlined'} onClick={() => setTab('tomar')}>Tomar lista</Button>
        <Button variant={tab === 'resumen' ? 'contained' : 'outlined'} onClick={() => setTab('resumen')}>Resumen de asistencia</Button>
      </Box>

      {tab === 'tomar' && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField label="Fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} size="small" />
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['P', 'F', 'L'] as EstadoAsistencia[]).map(e => (
                <Chip key={e} label={`${e} = ${ESTADO_LABELS[e]}`} size="small" sx={{ bgcolor: ESTADO_COLORS[e], color: 'white' }} />
              ))}
            </Box>
          </Box>

          {estudiantes.length === 0 ? (
            <Alert severity="info">No hay estudiantes matriculados en este curso.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><b>#</b></TableCell>
                    <TableCell><b>Estudiante</b></TableCell>
                    <TableCell align="center"><b>Asistencia</b></TableCell>
                    <TableCell><b>Motivo (F/L)</b></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {estudiantes.map((e, i) => (
                    <TableRow key={e.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.secondary' }}>{i + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{e.user.first_name} {e.user.last_name}</TableCell>
                      <TableCell align="center">
                        <ToggleButtonGroup
                          exclusive
                          size="small"
                          value={estados[e.id] || 'P'}
                          onChange={(_, val) => { if (val) setEstados(prev => ({ ...prev, [e.id]: val })); }}
                        >
                          {(['P', 'F', 'L'] as EstadoAsistencia[]).map(est => (
                            <ToggleButton
                              key={est} value={est}
                              sx={{
                                px: 2, fontWeight: 700,
                                '&.Mui-selected': { bgcolor: ESTADO_COLORS[est], color: 'white', '&:hover': { bgcolor: ESTADO_COLORS[est] } },
                              }}
                            >
                              {est}
                            </ToggleButton>
                          ))}
                        </ToggleButtonGroup>
                      </TableCell>
                      <TableCell>
                        {(estados[e.id] === 'F' || estados[e.id] === 'L') && (
                          <TextField
                            size="small" placeholder="Motivo..."
                            value={motivos[e.id] || ''}
                            onChange={ev => setMotivos(prev => ({ ...prev, [e.id]: ev.target.value }))}
                            sx={{ width: 200 }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 3, alignItems: 'center' }}>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving || estudiantes.length === 0}>
              {saving ? 'Guardando...' : 'Guardar asistencia'}
            </Button>
            {saved && <Chip label="¡Guardado!" color="success" size="small" />}
          </Box>
        </>
      )}

      {tab === 'resumen' && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Estudiante</b></TableCell>
                <TableCell align="center"><b>Presentes</b></TableCell>
                <TableCell align="center"><b>Faltas (F)</b></TableCell>
                <TableCell align="center"><b>Licencias (L)</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {resumen.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>Sin registros de asistencia</TableCell></TableRow>
              )}
              {resumen.map(r => (
                <TableRow key={r.estudiante_id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{r.nombre}</TableCell>
                  <TableCell align="center"><Chip label={r.presentes} color="success" size="small" /></TableCell>
                  <TableCell align="center"><Chip label={r.faltas} color={r.faltas > 0 ? 'error' : 'default'} size="small" /></TableCell>
                  <TableCell align="center"><Chip label={r.licencias} color={r.licencias > 0 ? 'info' : 'default'} size="small" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

// ── Tab 2: Actividades ────────────────────────────────────────────────────────

const emptyActForm = { nombre: '', descripcion: '', tipo: 'tarea', fecha: '', ponderacion: 0 };

function TabActividades({ cursoId }: { cursoId: number }) {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [plantillas, setPlantillas] = useState<Actividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyActForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [plantillaDialogOpen, setPlantillaDialogOpen] = useState(false);
  const [selectedPlantilla, setSelectedPlantilla] = useState('');

  const load = useCallback(async () => {
    const [acts, plants] = await Promise.all([
      courseService.getActividades(cursoId),
      courseService.getMisPlantillas(),
    ]);
    setActividades(acts); setPlantillas(plants); setLoading(false);
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setError('');
    try {
      if (editing) await courseService.updateActividad(editing, form);
      else await courseService.createActividad(cursoId, form);
      setOpen(false); load();
    } catch (err: any) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Error al guardar.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta actividad?')) return;
    await courseService.deleteActividad(id);
    load();
  };

  const handleGuardarPlantilla = async (id: number) => {
    await courseService.guardarComoPlantilla(id);
    load();
    alert('Guardada como plantilla.');
  };

  const handleUsarPlantilla = async () => {
    if (!selectedPlantilla) return;
    await courseService.usarPlantilla(cursoId, Number(selectedPlantilla));
    setPlantillaDialogOpen(false);
    setSelectedPlantilla('');
    load();
  };

  const TIPOS = ['tarea', 'examen', 'proyecto', 'participacion', 'otro'];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(emptyActForm); setEditing(null); setError(''); setOpen(true); }}>
          Nueva Actividad
        </Button>
        <Button variant="outlined" startIcon={<StarIcon />} onClick={() => setPlantillaDialogOpen(true)} disabled={plantillas.length === 0}>
          Usar plantilla ({plantillas.length})
        </Button>
      </Box>

      {actividades.length === 0 ? (
        <Alert severity="info">No hay actividades creadas para este curso.</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell><b>Nombre</b></TableCell>
                <TableCell><b>Tipo</b></TableCell>
                <TableCell><b>Fecha</b></TableCell>
                <TableCell align="right"><b>Ponderación</b></TableCell>
                <TableCell align="right"><b>Acciones</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actividades.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{a.nombre}</Typography>
                    {a.descripcion && <Typography variant="caption" color="text.secondary">{a.descripcion}</Typography>}
                  </TableCell>
                  <TableCell><Chip label={a.tipo} size="small" variant="outlined" /></TableCell>
                  <TableCell>{a.fecha || '—'}</TableCell>
                  <TableCell align="right">{a.ponderacion}%</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Guardar como plantilla">
                      <IconButton size="small" onClick={() => handleGuardarPlantilla(a.id)}><StarBorderIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => { setForm({ nombre: a.nombre, descripcion: a.descripcion, tipo: a.tipo, fecha: a.fecha || '', ponderacion: a.ponderacion }); setEditing(a.id); setError(''); setOpen(true); }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog nueva/editar actividad */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Editar Actividad' : 'Nueva Actividad'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} fullWidth />
          <TextField label="Descripción" multiline rows={2} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} fullWidth />
          <TextField label="Tipo" select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} fullWidth>
            {TIPOS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          <TextField label="Ponderación (%)" type="number" value={form.ponderacion} onChange={e => setForm({ ...form, ponderacion: Number(e.target.value) })} fullWidth slotProps={{ htmlInput: { min: 0, max: 100 } }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>{editing ? 'Actualizar' : 'Crear'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog usar plantilla */}
      <Dialog open={plantillaDialogOpen} onClose={() => setPlantillaDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Usar Plantilla</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Selecciona plantilla</InputLabel>
            <Select value={selectedPlantilla} label="Selecciona plantilla" onChange={e => setSelectedPlantilla(e.target.value as string)}>
              {plantillas.map(p => <MenuItem key={p.id} value={p.id}>{p.nombre} ({p.tipo})</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPlantillaDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleUsarPlantilla} disabled={!selectedPlantilla}>Usar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ── Tab 3: Centro de Notas ─────────────────────────────────────────────────────

function TabCentroNotas({ cursoId }: { cursoId: number }) {
  const { user } = useAuth();
  const [data, setData] = useState<CentroNotas | null>(null);
  const [editingCell, setEditingCell] = useState<{ estId: number; actId: number } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const d = await courseService.getCentroNotas(cursoId);
    setData(d); setLoading(false);
  }, [cursoId]);

  useEffect(() => { load(); }, [load]);

  const handleCellClick = (estId: number, actId: number, currentNota: number | null) => {
    setEditingCell({ estId, actId });
    setCellValue(currentNota !== null && currentNota !== undefined ? String(currentNota) : '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    setSaving(true);
    const nota = cellValue === '' ? null : parseFloat(cellValue);
    await courseService.guardarNota(editingCell.estId, editingCell.actId, nota);
    setEditingCell(null);
    await load();
    setSaving(false);
  };

  const notaColor = (nota: number | null) => {
    if (nota === null || nota === undefined) return 'inherit';
    if (nota >= 14) return '#e8f5e9';
    if (nota >= 11) return '#fff8e1';
    return '#ffebee';
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (!data) return null;

  const { actividades, filas } = data;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Haz clic en una celda para editar la nota. Escala 0–20.
      </Typography>

      {actividades.length === 0 ? (
        <Alert severity="info">Primero crea actividades en la pestaña "Actividades" para poder registrar notas.</Alert>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" component={Paper} sx={{ borderRadius: 2 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700, minWidth: 180, position: 'sticky', left: 0, bgcolor: 'primary.main', zIndex: 1 }}>
                  Estudiante
                </TableCell>
                {actividades.map(a => (
                  <TableCell key={a.id} align="center" sx={{ color: 'white', fontWeight: 700, minWidth: 120 }}>
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{a.nombre}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>{a.ponderacion}%</Typography>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filas.map(fila => (
                <TableRow key={fila.estudiante_id} hover>
                  <TableCell sx={{ fontWeight: 500, position: 'sticky', left: 0, bgcolor: 'white', zIndex: 1, borderRight: '1px solid #e0e0e0' }}>
                    {fila.nombre}
                  </TableCell>
                  {actividades.map(a => {
                    const nota = fila.notas[String(a.id)];
                    const isEditing = editingCell?.estId === fila.estudiante_id && editingCell?.actId === a.id;
                    return (
                      <TableCell
                        key={a.id} align="center"
                        sx={{ bgcolor: notaColor(nota), cursor: 'pointer', '&:hover': { bgcolor: '#e3f2fd' } }}
                        onClick={() => !isEditing && handleCellClick(fila.estudiante_id, a.id, nota)}
                      >
                        {isEditing ? (
                          <TextField
                            autoFocus size="small" type="number" value={cellValue}
                            onChange={e => setCellValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={e => { if (e.key === 'Enter') handleCellSave(); if (e.key === 'Escape') setEditingCell(null); }}
                            slotProps={{ htmlInput: { min: 0, max: 20, step: 0.5 } }}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: nota !== null ? 600 : 400, color: nota === null ? 'text.disabled' : 'inherit' }}>
                            {nota !== null && nota !== undefined ? nota : '—'}
                          </Typography>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function TeacherCoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const cursoId = Number(id);

  useEffect(() => {
    courseService.getMisCursos().then(cursos => {
      const c = cursos.find(c => c.id === cursoId);
      setCurso(c || null);
      setLoading(false);
    });
  }, [cursoId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (!curso) return <Alert severity="error">Curso no encontrado o no tienes acceso.</Alert>;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/docente')}><ArrowBackIcon /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{curso.nombre}</Typography>
          <Typography variant="body2" color="text.secondary">{curso.grado?.nombre} • {curso.codigo}</Typography>
        </Box>
      </Box>

      <Paper sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label="Asistencia" />
          <Tab label="Actividades" />
          <Tab label="Centro de Notas" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tab === 0 && <TabAsistencia cursoId={cursoId} />}
          {tab === 1 && <TabActividades cursoId={cursoId} />}
          {tab === 2 && <TabCentroNotas cursoId={cursoId} />}
        </Box>
      </Paper>
    </Box>
  );
}
