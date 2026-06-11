import apiClient from './client';
// ✅ Tipo para la respuesta de creación (objeto, no número directo)

export interface CreateCotizacionResponse {
  message: string;
  idCotizacion: number;
}
// ✅ Agregar esta interfaz si no existe
export interface SecuenciaCotizacionDto {
  tipo: string;
  siguienteNumero: string;
}
// DTOs para Cotización (Cabecera)
export interface CotizacionDto {
  idcotizacion: number;
  tipo: string;
  no_Cotizacion: string;
  fecha: string;
  idcliente: number;
  razon_Social: string;
  num_Documento: string;
  descripcion: string;
  descuento: number;
  itbis: number;
  subtotal: number;
  total: number;
  proceso: string;
  idvendedor?: number;
  idempresa: number;
}

export interface CotizacionSaveDto {
  tipo: string;
  no_Cotizacion?: string;
  fecha: string;
  idcliente: number;
  nombre_Cliente:string;
  descripcion: string;
  descuento: number;
  itbis: number;
  subtotal: number;
}

// DTOs para Detalle de Cotización
export interface CotizacionDetalleDto {
  iddetalle: number;
  idcotizacion: number;
  iddetalle_Producto: number;
  codigo: string;
  producto: string;
  cantidad: number;
  medida: string;
  precio: number;
  p_Itbis: number;
  descuento: number;
  subtotal: number;
  itbis: number;
  total: number;
}

export interface CotizacionDetalleSaveDto {
  idcotizacion: number;
  idarticulo: number;
  cantidad: number;
  medida: string;
  precio: number;
  itbis: number;
  descuento: number;
}

export interface VendedorDto {
  idempleado: number;
  nombres: string;
}

// src/api/cotizacion.api.ts
export interface CotizacionDetalleImpresionDto {
  codigo: string;
  producto: string;
  cantidad: number;
  medida: string;
  precio: number;
  descuento: number;
  itbis: number;
  subtotal: number;
  total: number;
}

export interface CotizacionImpresionDto {
  idcotizacion: number; 
  no_Cotizacion: string;
  tipo: string;
  fecha: string;
  idcliente: number;
  razon_Social: string;
  num_Documento: string;
  direccionCliente: string;
  descripcion: string;
  subtotal: number;
  descuento: number;
  itbis: number;
  total: number;
}


export const cotizacionApi = {
  // === CABECERA ===
  
  // ✅ Nueva firma: acepta un objeto de parámetros
getAll: (params: { idEmpresa: number; tipo?: string }) => 
  apiClient.get<CotizacionDto[]>(
    `/cotizacion?Idempresa=${params.idEmpresa}&Tipo=${params.tipo ?? 'C'}`
  ),
  
  // Agregar al final de cotizacionApi

  // ✅ NUEVO: Búsqueda avanzada con filtros
  search: (params: {
    texto?: string;
    tipo?: string;
    fecha1?: string;
    fecha2?: string;
    proceso?: string;
    idEmpresa?: number;  // ← Requerido
  }) => {
    const queryParams = new URLSearchParams();
    
    if (params.texto) queryParams.append('texto', params.texto);
    if (params.tipo) queryParams.append('tipo', params.tipo);
    if (params.fecha1) queryParams.append('fecha1', params.fecha1);
    if (params.fecha2) queryParams.append('fecha2', params.fecha2);
    if (params.proceso) queryParams.append('proceso', params.proceso);
    // ✅ idEmpresa: solo agregar si se proporciona explícitamente
    if (params.idEmpresa) {
      queryParams.append('idEmpresa', params.idEmpresa.toString());
    } 



    // ✅ Construir URL final
    const queryString = queryParams.toString();
    const url = `/cotizacion/buscar${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔍 API Search URL:', url); // ← Debug para verificar
    return apiClient.get<CotizacionDto[]>(url);
  },
  
  getById: (idCotizacion: number, idEmpresa: number) => 
    apiClient.get<CotizacionDto>(`/cotizacion/${idCotizacion}?Idempresa=${idEmpresa}`),
  
 // create: (dto: CotizacionSaveDto, idEmpresa: number) => 
  //  apiClient.post<number>('/cotizacion', { ...dto, idEmpresa }),
  
create: (dto: CotizacionSaveDto, idEmpresa: number) => 
    apiClient.post<CreateCotizacionResponse>('/cotizacion', { ...dto, idEmpresa }),

  update: (idCotizacion: number, dto: CotizacionSaveDto) => 
    apiClient.put(`/cotizacion/${idCotizacion}`, dto),
  
  delete: (idCotizacion: number) => 
    apiClient.delete(`/cotizacion/${idCotizacion}`),
  
  // ✅ Cambiar a PATCH para coincidir con [HttpPatch] del backend
  close: (id: number) => apiClient.patch(`/cotizacion/${id}/cerrar`),
  
  // === DETALLES ===
  
 // getDetails: (idCotizacion: number) => 
   // apiClient.get<CotizacionDetalleDto[]>(`/cotizacion/${idCotizacion}/detalle`),
  
  addDetail: (idCotizacion: number, dto: CotizacionDetalleSaveDto) => 
    apiClient.post('/cotizacion/detalle', { 
      ...dto, 
      Idcotizacion: idCotizacion  // ✅ Incluir ID en el body
    }),

    // ✅ CORREGIDO: PUT /api/cotizacion/detalle/{idDetalle}
  updateDetail: (idDetalle: number, dto: CotizacionDetalleSaveDto) => 
    apiClient.put(`/cotizacion/detalle/${idDetalle}`, dto),
  
  // ✅ CORREGIDO: DELETE /api/cotizacion/detalle/{idDetalle}
  deleteDetail: (idDetalle: number) => 
    apiClient.delete(`/cotizacion/detalle/${idDetalle}`),
  
  // ✅ CORREGIDO: GET /api/cotizacion/{id}/detalle
  getDetails: (idCotizacion: number) => 
    apiClient.get<CotizacionDetalleDto[]>(`/cotizacion/${idCotizacion}/detalle`),
  //addDetail: (idCotizacion: number, dto: CotizacionDetalleSaveDto) => 
  //  apiClient.post(`/cotizacion/  ${idCotizacion}/detalle`, dto),
  
  
  // === UTILIDADES ===
  
  getVendedores: (idEmpresa: number) => 
    apiClient.get<VendedorDto[]>(`/cotizacion/vendedores?Idempresa=${idEmpresa}`),
  
  getCotizacionPrintData: (noCotizacion: string, tipo: string) =>
apiClient.get<CotizacionImpresionDto>(
`/cotizacion/imprimir?noCotizacion=${encodeURIComponent(noCotizacion)}&tipo=${encodeURIComponent(tipo)}`
),
// 👇 NUEVA FUNCIÓN PARA OBTENER SECUENCIA 👇
  getSecuencia: async (tipo: string, idEmpresa: number): Promise<{ data: SecuenciaCotizacionDto }> => {
    const response = await apiClient.get(`/cotizacion/secuencia`, {
      params: { tipo, idEmpresa }
    });
    return response;
  },
  // ✅ En cotizacion.api.ts - Agregar esta función
getCotizacionById: (idCotizacion: number) =>
  apiClient.get<CotizacionDto>(
    `/cotizacion/${idCotizacion}/getcotizacion`
  ),
};