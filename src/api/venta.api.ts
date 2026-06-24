import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════

export interface VentaListadoDto {
  idventa1: number;
  idcliente: number;
  nombre_Cliente: string;
  codigo?: string;
  fecha: string;
  ncf: string;
  tipo: string;
  subtotal: number;
  itbis: number;
  descuento: number;
  monto_Descuento: number;
  total: number;
  estado?: string;
  vencimiento?: string;
  vendedor?: string;
  estadoEcf?: string | null; // ✅ Agregar esta propiedad
}

export interface VentaPendienteDto {
  idventa: number;
  idcliente: number;
  nombre_Cliente: string;
  no_Factura: string;
  ncf: string;
  fecha: string;
  vencimiento: string;
  total: number;
  balance: number;
  diasVencidos?: number;
}

export interface VentaDetalleDto {
  idventa: number;
  idcliente: number;
  nombre_Cliente: string;
  fecha: string;
  contado: string;
  tipo: string;
  ncf: string;
  idtermino: number;
  tipo_Ingreso: number;
  subtotal: number;
  itbis: number;
  descuento: number;
  monto_Descuento: number;
  vencimiento?: string;
  interes: number;
  propina_Legal: number;
  descripcion: string;
  cta_Ingreso: string;
  monto_Servicios: number;
  itbis_Servicios: number;
  iddepartamento: number;
  idlogin: number;
  idvendedor: number;
  detalles?: VentaDetalleItemDto[];
}

// ✅ DTO actualizado con todos los campos necesarios
export interface VentaDetalleItemDto {
  iddetalle: number;
  idarticulo: number;
  codigo: string;
  producto: string;
  cantidad: number;
  medida: string;
  precio_venta1: number;
  p_itbis: number;
  descuento: number;
  valor: number;
  itbis: number;
  presentaciones?: ProductoDetalleDto[]; // ← Agregar este campo
}
// Agregar este DTO si no existe
export interface ProductoDetalleDto {
  iddetalle: number;
  idarticulo: number;
  codigo_Barra: string;
  idmedida: number;
  unidades: number;
  precio: number;
  existencia: number;
}
// ✅ DTO para respuesta de generación de NCF
export interface NcfSecuenciaDto {
  tipo: string;
  desde: number;
  hasta: number;
  secuencia: number;
  secuencia_eCF: number;
  aviso?: string;
  vencimiento?: string;
  ncfGenerado: string;
}

// ✅ DTO ACTUALIZADO: Ahora incluye detalles
export interface VentaSaveDto {
  fecha: string;
  idcliente: number;
  nombre_Cliente: string;
  contado: string;
  tipo: string;
  ncf: string;
  idtermino: number;
  tipo_Ingreso: number;
  subtotal: number;
  itbis: number;
  descuento: number;
  monto_Descuento: number;
  vencimiento?: string;
  interes: number;
  propina_Legal: number;
  descripcion: string;
  cta_Ingreso: string;
  monto_Servicios: number;
  itbis_Servicios: number;
  iddepartamento: number;
  idlogin: number;
  idvendedor: number;
  detalles: VentaDetalleItemDto[]; // ← NUEVO: Lista de productos
}

export interface VentaPagoDto {
  efectivo:number;
  cheque:number;  
  banco_Ck:number;
  num_Ck: string;
  transferencia: number;
  banco_Transf: number;
  ref_Transf: string;
  tarjeta: number;
  tipo_Tarjeta: number;
  ref_Tarjeta: string;
  idretencion_ITBIS: number;
  tasa_Ret_ITBIS: number;
  retencion_ITBIS: number;
  idretencion_ISR: number;
  tasa_Ret_ISR: number;
  retencion_ISR: number;
  devuelta: number;
  codigo: string;
}

// Agrega estas interfaces al final del archivo (antes de export const ventaApi)

export interface FacturaReporteDto {
  idventa1: number;
  contado: string;
  tipo: string;
  ncf: string;
  vencimiento?: string;
  razon_Social: string;
  nombre_Comercial: string;
  direccion: string;
  num_Documento: string;
  telefono: string;
  fecha: string;
  cajero: string;
  termino: string;
  vendedor: string;
  tiempo: number;
  descuento: number;
  subtotal: number;
  itbis: number;
  desc1: number;
  total: number;
  pagado: number;
  descripcion: string;
  monto_Servicios: number;
  propina_Legal: number;
  retencion_ITBIS: number;
  retencion_ISR: number;
  itbis_Servicios: number;
}

export interface FacturaDetalleReporteDto {
  codigo: string;
  descripcion: string;
  cantidad: number;
  medida: string;
  precio_Venta1: number;
  importe: number;
  itbis: number;
  descuento: number;
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const ventaApi = {
  // ═══ LISTADOS ═══
  getAll: () =>
    apiClient.get<VentaListadoDto[]>(`/venta/listado`),

  getPendientes: (idEmpresa: number) =>
    apiClient.get<VentaPendienteDto[]>(`/venta/pendientes?Idempresa=${idEmpresa}`),

  searchPendientes: (idEmpresa: number, texto: string) =>
    apiClient.get<VentaPendienteDto[]>(
      `/venta/pendientes/buscar?Idempresa=${idEmpresa}&texto=${encodeURIComponent(texto)}`
    ),

  // ═══ CONSULTAS DETALLADAS ═══
  getByNcf: (idEmpresa: number, ncf: string) =>
    apiClient.get<VentaDetalleDto>(
      `/venta/ncf/${encodeURIComponent(ncf)}?Idempresa=${idEmpresa}`
    ),

  getById: (idEmpresa: number, idVenta: number) =>
    apiClient.get<VentaDetalleDto>(
      `/venta/${idVenta}?Idempresa=${idEmpresa}`
    ),

  getByDetalleId: (idEmpresa: number, idDetalle: number) =>
    apiClient.get<VentaDetalleDto>(
      `/venta/detalle/${idDetalle}?Idempresa=${idEmpresa}`
    ),

  getPagoInfo: (noFactura: string) =>
    apiClient.get<VentaPagoDto>(
      `/venta/${encodeURIComponent(noFactura)}/pago`
    ),

  // ═══ CRUD ═══
  create: (data: VentaSaveDto, idEmpresa: number) =>
    apiClient.post<number>(`/venta?Idempresa=${idEmpresa}`, data),

  update: (idVenta: number, data: VentaSaveDto) =>
    apiClient.put(`/venta/${idVenta}`, data),

  delete: (idVenta: number, idLogin: number) =>
    apiClient.delete(`/venta/${idVenta}?idLogin=${idLogin}`),

  // ═══ DETALLES ═══
  getDetalles: (idVenta: number) =>
    apiClient.get<VentaDetalleItemDto[]>(`/venta/${idVenta}/detalles`),

  // ═══ BÚSQUEDA ═══
  searchByColumn: (params: {
  columna: string;
  isFecha: string;
  fecha1: string;
  fecha2: string;
  texto: string;
  page?: number;
  pageSize?: number;
}) => apiClient.get<{
  items: VentaListadoDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>('/venta/buscar', { 
  params: {
    columna: params.columna,
    isFecha: params.isFecha === 'true',  // Convertir string a boolean
    fecha1: params.fecha1,
    fecha2: params.fecha2,
    texto: params.texto || '',
    page: params.page || 1,
    pageSize: params.pageSize || 25
  }
}),

  searchByIdWithVencimiento: (texto: string) =>
    apiClient.get<VentaDetalleDto>(
      `/venta/buscar/id/${encodeURIComponent(texto)}`
    ),

  generarNcf: (tipo: string) =>
    apiClient.post<NcfSecuenciaDto>(
      `/venta/generar-ncf?tipo=${encodeURIComponent(tipo)}`
    ),

    // Dentro del objeto `export const ventaApi = { ... }`, agrega:


  // ═══ REPORTES DE IMPRESIÓN ═══
  
  /** Obtiene la cabecera de la factura para impresión */
  getFacturaReporte: (noFactura: string) =>
    apiClient.get<FacturaReporteDto>(`/venta/reporte/${encodeURIComponent(noFactura)}`),


  /** Obtiene el detalle de la factura para impresión */
  getFacturaDetalle: (idVenta: number) =>
    apiClient.get<FacturaDetalleReporteDto[]>(`/venta/reporte/${idVenta}/detalle`),

// ✅ DESPUÉS (tipo completo)
firmarYEnviarEcf: (idVenta: number, ambiente: number) =>
  apiClient.post<{ 
    trackId: string; 
    estado: string; 
    mensaje?: string;
    codigo?: string;
    idEcf?: number;
    xmlFirmado?: string;
  }>(
    `/venta/${idVenta}/firmar-enviar?ambiente=${ambiente}`
  ),
consultarEstadosEcf: (ncfs: string[]) =>
  apiClient.post<Record<string, string>>('/venta/ecf/estados', ncfs),
// Agregar esta función
obtenerDatosEcf: (ncf: string) =>
  apiClient.get<{
    secuencia: string;
    codigoSeguridad: string | null;
    fechaFirma: string | null;
    ambiente: number;
    estadoEcf: string | null;
  }>(`/venta/${ncf}/ecf-datos`),
};