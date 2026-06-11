import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════

export interface InscripcionListadoDto {
  idInscripcion: number;
  codigo: string;
  fecha: string | null;
  estudiante: string;
  curso: string;
}

export interface InscripcionSaveDto {
  codigo?: string; // Se genera en el backend, pero lo dejamos opcional
  fecha: string;
  idEstudiante: number;
  idcurso: number;
  fecha1?: string | null;
  fecha2?: string | null;
  idinstructor: number;
  idlogin?: number; // Lo asigna el backend desde el JWT
  isFacturaAutomatica: boolean;
}

export interface InscripcionDetalleDto {
  idInscripcion: number;
  codigo: string;
  codigo_Curso: string;
  nivel: string;
  isFacturaAutomatica: boolean;
  valor_Inscripcion: number;
  valor_Mensual: number;
  fecha: string | null;
  fecha1: string | null;
  fecha2: string | null;
  horario: string;
  idestudiante:number;
  codigo_Estudiante: string;
  codigo_Facilitador: string;
}

export interface EstudianteBusquedaDto {
  idEstudiante: number;
  codigo: string;
  estudiante: string;
  num_Documento: string;
  telefono: string;
  codigo_Padre: string;
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const inscripcionApi = {
  getAll: () =>
    apiClient.get<InscripcionListadoDto[]>('/inscripciones'),

  search: (params: {
    fecha1?: string;
    fecha2?: string;
    isFecha: boolean;
    texto: string;
    columna: string;
  }) => {
    const query = new URLSearchParams();
    if (params.fecha1) query.append('fecha1', params.fecha1);
    if (params.fecha2) query.append('fecha2', params.fecha2);
    query.append('isFecha', String(params.isFecha));
    query.append('texto', params.texto);
    query.append('columna', params.columna);
    
    return apiClient.get<InscripcionListadoDto[]>(`/inscripciones/buscar?${query.toString()}`);
  },

  getById: (id: number) =>
    apiClient.get<InscripcionDetalleDto>(`/inscripciones/${id}`),

  getEstudianteByCodigo: (texto: string) =>
    apiClient.get<EstudianteBusquedaDto>(`/inscripciones/estudiante/${encodeURIComponent(texto)}`),

  create: (data: InscripcionSaveDto) =>
    apiClient.post<number>('/inscripciones', data),

  update: (id: number, data: InscripcionSaveDto) =>
    apiClient.put(`/inscripciones/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/inscripciones/${id}`),

  getPrintData: (id: number) =>
    apiClient.get(`/inscripciones/${id}/imprimir`),
};