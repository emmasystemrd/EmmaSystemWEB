import apiClient from './client';

// DTOs para Categorías
export interface CategoriaDto {
  idcategoria: number;
  nombre: string;
  descripcion: string;
  tipo: string; // 'A'=Artículo, 'S'=Servicio, etc.
  estado?: string;
  fechaCreacion?: string;
}

export interface CategoriaSaveDto {
  nombre: string;
  descripcion: string;
  tipo: string;
}

export const categoriaApi = {
  // Listado general para administración (CRUD)
  getAll: (idEmpresa: number) => 
    apiClient.get<CategoriaDto[]>(`/categoria?Idempresa=${idEmpresa}`),
  
  // Listado simplificado para combos en Artículos (filtra Tipo='A')
  getForArticulo: (idEmpresa: number) => 
    apiClient.get<CategoriaDto[]>(`/categoria/articulo?Idempresa=${idEmpresa}`),
  
  // Búsqueda por texto (Nombre, Descripción o Tipo)
  search: (texto: string, idEmpresa: number) => 
    apiClient.get<CategoriaDto[]>(`/categoria/buscar?TextoBuscar=${encodeURIComponent(texto)}&Idempresa=${idEmpresa}`),
  
  // Crear nueva categoría
  create: (dto: CategoriaSaveDto, idEmpresa: number) => 
    apiClient.post('/categoria', { ...dto, idEmpresa }),
  
  // Actualizar categoría existente
  update: (idCategoria: number, dto: CategoriaSaveDto) => 
    apiClient.put(`/categoria/${idCategoria}`, dto),
  
  // Eliminar categoría (soft delete o físico según tu SP)
  delete: (idCategoria: number) => 
    apiClient.delete(`/categoria/${idCategoria}`),
};