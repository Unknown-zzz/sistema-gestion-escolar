import api from './api';
import { Estudiante, Grado } from '../types';

export const studentService = {
  async getEstudiantes(params?: { estado?: string; grado?: number }): Promise<Estudiante[]> {
    const { data } = await api.get<Estudiante[]>('/api/v1/auth/estudiantes/', { params });
    return data;
  },
  async getEstudiante(id: number): Promise<Estudiante> {
    const { data } = await api.get<Estudiante>(`/api/v1/auth/estudiantes/${id}/`);
    return data;
  },
  async createEstudiante(payload: any): Promise<Estudiante> {
    const { data } = await api.post<Estudiante>('/api/v1/auth/estudiantes/', payload);
    return data;
  },
  async updateEstudiante(id: number, payload: any): Promise<Estudiante> {
    const { data } = await api.put<Estudiante>(`/api/v1/auth/estudiantes/${id}/`, payload);
    return data;
  },
  async deleteEstudiante(id: number): Promise<void> {
    await api.delete(`/api/v1/auth/estudiantes/${id}/`);
  },

  async getGrados(): Promise<Grado[]> {
    const { data } = await api.get<Grado[]>('/api/v1/auth/grados/');
    return data;
  },
  async createGrado(payload: any): Promise<Grado> {
    const { data } = await api.post<Grado>('/api/v1/auth/grados/', payload);
    return data;
  },
};
