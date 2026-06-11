import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════

export interface EstudianteListadoDto {
  idEstudiante: number;
  codigo: string;
  estudiante: string;
  num_Documento: string;
  fecha_Nacimiento: string | null;
  telefono: string;
  estado: string;
}

export interface EstudianteSaveDto {
  codigo: string;
  nombres: string;
  apellido1: string;
  apellido2: string;
  sexo: string;
  foto?: string | null; // Base64 string
  tipo_Doc: number;
  num_Documento: string;
  lugar_Nacimiento: string;
  telefono: string;
  celular: string;
  nacionalidad?: number | null;
  fecha_Nacimiento?: string | null;
  tipo_Sangre: string;
  email: string;
  direccion: string;
  provincia?: number | null;
  municipio?: number | null;
  sector?: number | null;
  alergico: string;
  medicamentos_que_usa: string;
  idcliente?: number | null;
  parentesco?: number | null;
  estado: string;
}

export interface EstudianteDetalleDto extends EstudianteSaveDto {
  idEstudiante: number;
  tieneFoto: boolean;
  codigo_Padre: string;
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const estudianteApi = {
  getAll: () =>
    apiClient.get<EstudianteListadoDto[]>('/estudiantes'),

  getById: (id: number) =>
    apiClient.get<EstudianteDetalleDto>(`/estudiantes/${id}`),

  getFoto: (id: number) =>
    apiClient.get<{ foto: string }>(`/estudiantes/${id}/foto`),

  search: (texto: string) =>
    apiClient.get<EstudianteListadoDto[]>(`/estudiantes/buscar?texto=${encodeURIComponent(texto)}`),

  create: (data: EstudianteSaveDto) =>
    apiClient.post<number>('/estudiantes', data),

  update: (id: number, data: EstudianteSaveDto) =>
    apiClient.put(`/estudiantes/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/estudiantes/${id}`),
};