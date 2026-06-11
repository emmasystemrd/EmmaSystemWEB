import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════

export interface CobroListadoDto {
  idcobro: number;
  codigo: string;
  fecha: string;
  razon_Social: string;
  balance: number;
  descuento: number;
  valor: number;
  pendiente: number;
  tienePDF: boolean;
}

export interface DetalleCobroSaveDto {
  iddetalle: number;
  iddocumento: number;
  balance: number;
  p_descuento: number;
  descuento: number;
  idretencion_ITBIS: number;
  idretencion_ISR: number;
  p_isr: number;
  p_itr: number;
  isr: number;
  itr: number;
  interes: number;
  cargos: number;
  monto: number;
}

export interface CobroSaveDto {
  codigo: string;
  no_Cuota: number;
  fecha: string;
  idcliente: number;
  balance: number;
  descuento: number;
  retencion_ITBIS: number;
  retencion_ISR: number;
  efectivo: number;
  cheque: number;
  banco_Ck: number | null;
  num_Ck: string;
  transferencia: number;
  banco_Transf: number | null;
  ref_Transf: string;
  tarjeta: number;
  tipo_Tarjeta: number | null;
  ref_Tarjeta: string;
  devuelta: number;
  detalles: DetalleCobroSaveDto[];
}

export interface DetalleCobroDto {
  iddetalle: number;
  iddocumento: number;
  fecha: string;
  detalle: string;
  saldo: number;
  p_descuento: number;
  descuento: number;
  p_itr: number;
  itr: number;
  p_isr: number;
  isr: number;
  interes: number;
  cargos: number;
  pago: number;
  seleccionar: boolean;
  pendiente: number;
  itbis: number;
  subtotal: number;
  idretencion_ITBIS: number;
  idretencion_ISR: number;
  monto: number;
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const cobroApi = {
  // ═══ COBROS NORMALES ═══
  getAll: () =>
    apiClient.get<CobroListadoDto[]>('/cobros'),

  search: (params: {
    fecha1?: string;
    fecha2?: string;
    isFecha?: boolean;
    texto?: string;
    columna?: string;
    adjunto?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.fecha1) query.append('fecha1', params.fecha1);
    if (params.fecha2) query.append('fecha2', params.fecha2);
    if (params.isFecha !== undefined) query.append('isFecha', String(params.isFecha));
    if (params.texto) query.append('texto', params.texto);
    if (params.columna) query.append('columna', params.columna);
    if (params.adjunto !== undefined) query.append('adjunto', String(params.adjunto));
    return apiClient.get<CobroListadoDto[]>(`/cobros/buscar?${query.toString()}`);
  },

  getById: (id: number) =>
    apiClient.get(`/cobros/${id}`),

  getByCodigo: (codigo: string) =>
    apiClient.get(`/cobros/codigo/${encodeURIComponent(codigo)}`),

  getPdf: (id: number) =>
    apiClient.get<{ pdf: string }>(`/cobros/${id}/pdf`),

  create: (data: CobroSaveDto) =>
    apiClient.post<number>('/cobros', data),

  update: (id: number, data: CobroSaveDto) =>
    apiClient.put(`/cobros/${id}`, data),

  delete: (id: number) =>
    apiClient.delete(`/cobros/${id}`),

  // ═══ AVANCES DE CLIENTE ═══
  getAllAvances: () =>
    apiClient.get<CobroListadoDto[]>('/cobros/avances'),

  searchAvances: (params: {
    fecha1?: string;
    fecha2?: string;
    isFecha?: boolean;
    texto?: string;
    columna?: string;
    adjunto?: number;
  }) => {
    const query = new URLSearchParams();
    if (params.fecha1) query.append('fecha1', params.fecha1);
    if (params.fecha2) query.append('fecha2', params.fecha2);
    if (params.isFecha !== undefined) query.append('isFecha', String(params.isFecha));
    if (params.texto) query.append('texto', params.texto);
    if (params.columna) query.append('columna', params.columna);
    if (params.adjunto !== undefined) query.append('adjunto', String(params.adjunto));
    return apiClient.get<CobroListadoDto[]>(`/cobros/avances/buscar?${query.toString()}`);
  },

  createAvance: (data: any) =>
    apiClient.post<number>('/cobros/avances', data),

  updateAvance: (id: number, data: any) =>
    apiClient.put(`/cobros/avances/${id}`, data),

  // ═══ DETALLES Y DOCUMENTOS ═══
  getDetalles: (idCobro: number, idCliente: number, fecha: string) =>
    apiClient.get<DetalleCobroDto[]>(
      `/cobros/${idCobro}/detalles?idCliente=${idCliente}&fecha=${encodeURIComponent(fecha)}`
    ),

  // ✅ MÉTODO CLAVE: Obtener ID de documento por NCF
  getIdDocumento: (tipo: string, noFactura: string) =>
    apiClient.get<number>(
      `/cobros/documento?tipo=${encodeURIComponent(tipo)}&noFactura=${encodeURIComponent(noFactura)}`
    ),

  // ═══ REPORTE ═══
  getReporte: (fecha1: string, fecha2: string, idUsuario: number = 0) =>
    apiClient.get(
      `/cobros/reporte?fecha1=${encodeURIComponent(fecha1)}&fecha2=${encodeURIComponent(fecha2)}&idUsuario=${idUsuario}`
    ),
    
};