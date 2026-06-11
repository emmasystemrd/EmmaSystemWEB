import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════

export interface CursoListadoDto {
  idcurso: number;
  codigo: string;
  curso: string;
  descripcion: string;
  nivel: string;
  horario: string;
  valor_Inscripcion: number;
  valor_Mensual: number;
  tipo_Duracion: string;
  duracion: number;
  cupo_Maximo: number;
  idinstructor: string; // Num_Doc del empleado
  estado: string;
}

export interface CursoDetalleItemDto {
  iddetalle?: number;
  nombre: string;
}

export interface CursoSaveDto {
  codigo: string;
  curso: string;
  descripcion: string;
  nivel: string;
  horario: string;
  valor_Inscripcion: number;
  valor_Mensual: number;
  tipo_Duracion: string;
  duracion: number;
  cupo_Maximo: number;
  idinstructor: number;
  estado: string;
  detalles: CursoDetalleItemDto[];
}

export interface CursoDetalleDto extends CursoSaveDto {
  idcurso: number;
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const cursoApi = {
  getAll: () =>
    apiClient.get<CursoListadoDto[]>('/cursos'),

  getById: (id: number) =>
    apiClient.get<CursoDetalleDto>(`/cursos/${id}`),

  getByCodigo: (codigo: string) =>
    apiClient.get<CursoListadoDto>(`/cursos/codigo/${encodeURIComponent(codigo)}`),

  search: (texto: string) =>
    apiClient.get<CursoListadoDto[]>(`/cursos/buscar?texto=${encodeURIComponent(texto)}`),

  searchActivos: (texto: string) =>
    apiClient.get<CursoListadoDto[]>(`/cursos/buscar/activos?texto=${encodeURIComponent(texto)}`),

  getSecuencia: () =>
    apiClient.get<number>('/cursos/secuencia'),

  getDetalles: (idCurso: number) =>
    apiClient.get<CursoDetalleItemDto[]>(`/cursos/${idCurso}/detalles`),

  create: (data: CursoSaveDto) =>
    apiClient.post<number>('/cursos', data),

  update: (id: number, data: CursoSaveDto) =>
    apiClient.put(`/cursos/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/cursos/${id}`),
};