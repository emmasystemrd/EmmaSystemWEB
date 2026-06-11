import apiClient from './client';

export interface TerminoDto {
  idtermino: number;
  nombre: string;
  tipo: string;
  tiempo: number;
  tasa: number;
  no_Pagos: number;
  dias_desc: number;
  p_descuento: number;
  estado?: string;
}

export interface TerminoSaveDto {
  nombre: string;
  tipo: string;
  tiempo: number;
  tasa: number;
  no_Pagos: number;
  dias_desc: number;
  p_descuento: number;
}

export const terminoApi = {
  getAll: (idEmpresa: number) => 
    apiClient.get<TerminoDto[]>(`/termino?Idempresa=${idEmpresa}`),
  
  search: (texto: string, idEmpresa: number) => 
    apiClient.get<TerminoDto[]>(`/termino/buscar?textobuscar=${encodeURIComponent(texto)}&Idempresa=${idEmpresa}`),
  
  getById: (idTermino: number, idEmpresa: number) => 
    apiClient.get<TerminoDto>(`/termino/${idTermino}?Idempresa=${idEmpresa}`),
  
  create: (dto: TerminoSaveDto, idEmpresa: number) => 
    apiClient.post('/termino', { ...dto, idEmpresa }),
  
  update: (idTermino: number, dto: TerminoSaveDto) => 
    apiClient.put(`/termino/${idTermino}`, dto),
  
  delete: (idTermino: number) => 
    apiClient.delete(`/termino/${idTermino}`),
};