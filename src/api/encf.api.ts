import apiClient from './client';

export interface ENcfDto {
  ideNCF?: number;
  tipo: string;
  desde: number;
  hasta: number;
  secuencia: string;
  aviso: number;
  vencimiento?: string | null;
}

export const encfApi = {
  getAll: () => apiClient.get<ENcfDto[]>('/encf'),
  search: (tipo: string) => apiClient.get<ENcfDto[]>(`/encf/buscar?tipo=${tipo}`),
  create: (data: ENcfDto) => apiClient.post('/encf', data),
  update: (id: number, data: ENcfDto) => apiClient.put(`/encf/${id}`, data),
  delete: (id: number) => apiClient.delete(`/encf/${id}`),
};