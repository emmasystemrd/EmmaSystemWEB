import apiClient from './client';

// DTOs para Medidas (Unidades de Medida)
export interface MedidaDto {
  idmedida: number;
  mayor: string;        // Ej: "Litro", "Kilogramo", "Metro"
  detalle: string;      // Ej: "ml", "g", "cm"
  contenido: number;    // Ej: 1000, 0.5, 100
  descripcion: string;
  estado?: string;
  fechaCreacion?: string;
}

// DTO simplificado para combos en Artículos
export interface MedidaArticuloDto {
  idmedida: number;
  nombre: string;       // Formato: "Mayor (Detalle)" ej: "Litro (ml)"
  contenido: number;
}

export interface MedidaSaveDto {
  mayor: string;
  detalle: string;
  contenido: number;
  descripcion: string;
}
// ✅ Al final del archivo
export const medidaApi = {
  getAll: (idEmpresa: number) => apiClient.get<MedidaDto[]>(`/medida?Idempresa=${idEmpresa}`),
  getForArticulo: (idEmpresa: number) => apiClient.get<MedidaArticuloDto[]>(`/medida/articulo?Idempresa=${idEmpresa}`),
  search: (texto: string, idEmpresa: number) => apiClient.get<MedidaDto[]>(`/medida/buscar?TextoBuscar=${encodeURIComponent(texto)}&Idempresa=${idEmpresa}`),
  getById: (idMedida: number) => apiClient.get<MedidaDto>(`/medida/${idMedida}`),
  create: (dto: MedidaSaveDto, idEmpresa: number) => apiClient.post('/medida', { ...dto, idEmpresa }),
  update: (idMedida: number, dto: MedidaSaveDto) => apiClient.put(`/medida/${idMedida}`, dto),
  delete: (idMedida: number) => apiClient.delete(`/medida/${idMedida}`),
};