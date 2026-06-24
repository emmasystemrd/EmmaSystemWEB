import apiClient from './client';

export interface ConfCertificadoDto {
  ambiente: number;
  ambienteNombre: string;
  tieneCertificado: boolean;
  tieneClave: boolean;
  email?: string;
  tieneClaveEmail: boolean;
  fechaExpira?: string;
}

export interface EcfEstadoDto {
  idEcf: number;
  tipoComprobante: string;
  secuencia: string;
  ncfModificado?: string;
  rncReceptor?: string;
  montoTotal: number;
  fechaComprobante: string;
  estadoEcf: string;
  trackId?: string;
  codigoRespuesta?: string;
  mensajeError?: string;
  fechaEnvio?: string;
  tieneResumen: boolean;
}

export interface RespuestaConsultaDgiiDto {
  trackId?: string;
  estado?: string;
  codigo?: string;
  mensaje?: string;
}

export const ecfApi = {
  getConfiguracion: () =>
    apiClient.get<ConfCertificadoDto>('/venta/ecf/configuracion'),

  listar: (params?: {
    fechaInicio?: string;
    fechaFin?: string;
    estado?: string;
    tipoComprobante?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.fechaInicio) query.append('fechaInicio', params.fechaInicio);
    if (params?.fechaFin) query.append('fechaFin', params.fechaFin);
    if (params?.estado) query.append('estado', params.estado);
    if (params?.tipoComprobante) query.append('tipoComprobante', params.tipoComprobante);
    return apiClient.get<EcfEstadoDto[]>(`/venta/ecf/listado?${query.toString()}`);
  },

  consultarEstadoDgii: (idEcf: number) =>
    apiClient.get<RespuestaConsultaDgiiDto>(`/venta/ecf/${idEcf}/estado-dgii`),

  obtenerXml: async (idEcf: number): Promise<string> => {
    const response = await apiClient.get(`/venta/ecf/${idEcf}/xml`, {
      responseType: 'text',
      transformResponse: [(data) => data],
    });
    return response.data;
  },
  consultarEstadoEcf: (ncf: string) =>
  apiClient.get<{ estadoEcf: string }>(`/venta/ecf/estado?ncf=${ncf}`),
// Agregar esta nueva función al final del objeto ecfApi
consultarEstadoPorNcf: (ncf: string) =>
  apiClient.get<{ estadoEcf: string; trackId?: string }>(`/venta/ecf/estado-por-ncf?ncf=${ncf}`),
};