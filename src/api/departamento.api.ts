import apiClient from './client';

// DTOs para Departamentos (Centros de Costos)
export interface DepartamentoDto {
  iddepartamento: number;
  nombre: string;
  descripcion: string;
}

export interface DepartamentoCreateDto {
  nombre: string;
  descripcion: string;
}

export interface DepartamentoUpdateDto {
  nombre: string;
  descripcion: string;
}

export const departamentoApi = {
  // Listado general para administración
  getAll: (idEmpresa: number) => 
    apiClient.get<DepartamentoDto[]>(`/departamento?Idempresa=${idEmpresa}`),
  
  // Búsqueda por texto (Nombre o Descripción)
  search: (texto: string, idEmpresa: number) => 
    apiClient.get<DepartamentoDto[]>(`/departamento/buscar?TextoBuscar=${encodeURIComponent(texto)}&Idempresa=${idEmpresa}`),
  
  // Crear nuevo departamento
  create: (dto: DepartamentoCreateDto, idEmpresa: number) => 
    apiClient.post('/departamento', { ...dto, idEmpresa }),
  
  // Actualizar departamento existente
  update: (idDepartamento: number, dto: DepartamentoUpdateDto) => 
    apiClient.put(`/departamento/${idDepartamento}`, dto),
  
  // Eliminar departamento (soft delete)
  delete: (idDepartamento: number) => 
    apiClient.delete(`/departamento/${idDepartamento}`),
};