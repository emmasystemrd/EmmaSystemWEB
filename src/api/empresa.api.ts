import apiClient from './client';

export interface EmpresaDto {
  idempresa: number;
  nombre: string;
  tipo: string;
  rnc: string;
  direccion: string;
  telefono: string;
  email: string;
  url: string;
  instagram: string;
  facebook: string;
  registrado: boolean;
  fecha_Cierre?: string;  // Viene como ISO string del backend
  logoBase64?: string | null;
  tieneLogo?: boolean;
}

export const empresaApi = {
  getById: (id: number) =>
    apiClient.get<EmpresaDto>(`/empresa/${id}`),

  getLogo: (id: number) =>
    apiClient.get<{ logo: string }>(`/empresa/${id}/logo`),

  update: (id: number, data: FormData) =>
    apiClient.put(`/empresa/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};