import api from './api';
import { Curso, Matricula, Actividad, Calificacion, Asistencia, Docente,
         ResumenAsistencia, CentroNotas, EstadoAsistencia } from '../types';

export const courseService = {
  // Cursos generales
  async getCursos(): Promise<Curso[]> {
    const { data } = await api.get<Curso[]>('/api/v1/cursos/');
    return data;
  },
  async getMisCursos(): Promise<Curso[]> {
    const { data } = await api.get<Curso[]>('/api/v1/auth/mis-cursos/');
    return data;
  },
  async createCurso(payload: any): Promise<Curso> {
    const { data } = await api.post<Curso>('/api/v1/cursos/', payload);
    return data;
  },
  async updateCurso(id: number, payload: any): Promise<Curso> {
    const { data } = await api.put<Curso>(`/api/v1/cursos/${id}/`, payload);
    return data;
  },
  async deleteCurso(id: number): Promise<void> {
    await api.delete(`/api/v1/cursos/${id}/`);
  },

  // Estudiantes de un curso
  async getCursoEstudiantes(cursoId: number) {
    const { data } = await api.get(`/api/v1/cursos/${cursoId}/estudiantes/`);
    return data;
  },

  // Matrículas
  async getMatriculas(): Promise<Matricula[]> {
    const { data } = await api.get<Matricula[]>('/api/v1/cursos/matriculas/');
    return data;
  },
  async createMatricula(payload: any): Promise<Matricula> {
    const { data } = await api.post<Matricula>('/api/v1/cursos/matriculas/', payload);
    return data;
  },

  // Actividades de un curso
  async getActividades(cursoId: number): Promise<Actividad[]> {
    const { data } = await api.get<Actividad[]>(`/api/v1/cursos/${cursoId}/actividades/`);
    return data;
  },
  async createActividad(cursoId: number, payload: any): Promise<Actividad> {
    const { data } = await api.post<Actividad>(`/api/v1/cursos/${cursoId}/actividades/`, payload);
    return data;
  },
  async updateActividad(id: number, payload: any): Promise<Actividad> {
    const { data } = await api.put<Actividad>(`/api/v1/cursos/actividades/${id}/`, payload);
    return data;
  },
  async deleteActividad(id: number): Promise<void> {
    await api.delete(`/api/v1/cursos/actividades/${id}/`);
  },
  async getMisPlantillas(): Promise<Actividad[]> {
    const { data } = await api.get<Actividad[]>('/api/v1/cursos/actividades/plantillas/');
    return data;
  },
  async guardarComoPlantilla(actividadId: number): Promise<Actividad> {
    const { data } = await api.post<Actividad>(`/api/v1/cursos/actividades/${actividadId}/guardar-plantilla/`);
    return data;
  },
  async usarPlantilla(cursoId: number, plantillaId: number): Promise<Actividad> {
    const { data } = await api.post<Actividad>(`/api/v1/cursos/${cursoId}/actividades/${plantillaId}/usar-plantilla/`);
    return data;
  },

  // Centro de notas
  async getCentroNotas(cursoId: number): Promise<CentroNotas> {
    const { data } = await api.get<CentroNotas>(`/api/v1/cursos/${cursoId}/centro-notas/`);
    return data;
  },
  async guardarNota(estudiante: number, actividad: number, nota: number | null): Promise<Calificacion> {
    const { data } = await api.post<Calificacion>('/api/v1/cursos/notas/', { estudiante, actividad, nota });
    return data;
  },

  // Asistencia
  async getAsistenciaCurso(cursoId: number, fecha?: string): Promise<Asistencia[]> {
    const params = fecha ? { fecha } : {};
    const { data } = await api.get<Asistencia[]>(`/api/v1/cursos/${cursoId}/asistencia/`, { params });
    return data;
  },
  async registrarAsistenciaBulk(cursoId: number, fecha: string, registros: { estudiante: number; estado: EstadoAsistencia; motivo?: string }[]): Promise<Asistencia[]> {
    const { data } = await api.post<Asistencia[]>(`/api/v1/cursos/${cursoId}/asistencia/bulk/`, { fecha, registros });
    return data;
  },
  async getResumenAsistencia(cursoId: number): Promise<ResumenAsistencia[]> {
    const { data } = await api.get<ResumenAsistencia[]>(`/api/v1/cursos/${cursoId}/resumen-asistencia/`);
    return data;
  },

  // Docentes
  async getDocentes(): Promise<Docente[]> {
    const { data } = await api.get<Docente[]>('/api/v1/auth/docentes/');
    return data;
  },
};
