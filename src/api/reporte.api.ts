import apiClient from './client';

// ═══ DTOs ═══
export interface VentaDepartamentoReporteDto {
  fecha: string;
  condicion: string;
  num_Documento: string | null;
  razon_Social: string;
  ncf: string;
  subtotal: number;
  itbis: number;
  descuento: number;
}

export interface UtilidadProductoReporteDto {
  cliente: string;
  ncf: string;
  nombre: string;
  cantidad: number;
  venta: number;
  costo: number;
  utilidad: number;
}

export interface ComisionVentaReporteDto {
  codigo: string;
  empleado: string;
  porcentaje: number;
  ventas: number;
  comision: number;
}

export interface ComisionProductoReporteDto {
  codigo: string;
  producto: string;
  porcentaje: number;
  ventas: number;
  comision: number;
}

export interface CotizacionReporteDto {
  fecha: string;
  no_Cotizacion: string;
  num_Documento: string | null;
  cliente: string;
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  proceso: string;
}

export interface PedidoReporteDto {
  fecha: string;
  no_Pedido: string;
  num_Documento: string | null;
  cliente: string;
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
  proceso: string;
}

export interface ConduceReporteDto {
  fecha: string;
  no_Conduce: string;
  num_Documento: string | null;
  cliente: string;
  subtotal: number;
  itbis: number;
  descuento: number;
  total: number;
}

// ═══ API ═══
export const reporteApi = {
  ventaDepartamento: (fecha1: string, fecha2: string, idDepartamento: number = 0) =>
    apiClient.get<VentaDepartamentoReporteDto[]>('/reporte/venta-departamento', {
      params: { fecha1, fecha2, idDepartamento }
    }),

  utilidadProducto: (fecha1: string, fecha2: string) =>
    apiClient.get<UtilidadProductoReporteDto[]>('/reporte/utilidad-producto', {
      params: { fecha1, fecha2 }
    }),

  comisionVenta: (fecha1: string, fecha2: string) =>
    apiClient.get<ComisionVentaReporteDto[]>('/reporte/comision-venta', {
      params: { fecha1, fecha2 }
    }),

  comisionProducto: (fecha1: string, fecha2: string, idEmpleado: number) =>
    apiClient.get<ComisionProductoReporteDto[]>('/reporte/comision-producto', {
      params: { fecha1, fecha2, idEmpleado }
    }),

  cotizaciones: (fecha1: string, fecha2: string, proceso?: string) =>
    apiClient.get<CotizacionReporteDto[]>('/reporte/cotizaciones', {
      params: { fecha1, fecha2, proceso: proceso || '' }
    }),

  pedidos: (fecha1: string, fecha2: string, proceso?: string) =>
    apiClient.get<PedidoReporteDto[]>('/reporte/pedidos', {
      params: { fecha1, fecha2, proceso: proceso || '' }
    }),

  conduce: (fecha1: string, fecha2: string, idCliente?: number) =>
    apiClient.get<ConduceReporteDto[]>('/reporte/conduce', {
      params: { fecha1, fecha2, idCliente: idCliente || 0 }
    }),
};

// ═══ DTOs DE REPORTES DE CLIENTES ═══
export interface SaldosAntiguedadReporteDto {
  num_Documento: string;
  razon_Social: string;
  ultCobro: string | null;
  no_Vencida: number;
  dias_30: number;
  dias_60: number;
  dias_90: number;
  dias_120: number;
  mas_120: number;
  balance: number;
}


export interface MovimientoClienteReporteDto {
  fecha: string;
  tipo: string;
  detalle: string;
  vence: string;
  valor: number;
  pago: number;
  balance: number;
}


export interface ReciboCobroReporteDto {
  idcobro: number;
  codigo: string;
  fecha: string;
  num_Documento: string;
  razon_Social: string;
  balance: number;
  descuento: number;
  retencion_ITBIS: number;
  retencion_ISR: number;
  valor: number;
  pendiente: number;
  efectivo: number;
  cheque: number;
  banco_Ck: number | null;
  num_Ck: string | null;
  transferencia: number;
  banco_Transf: number | null;
  ref_Transf: string | null;
  tarjeta: number;
  tipo_Tarjeta: number | null;
  ref_Tarjeta: string | null;
  devuelta: number;
}


export interface EstadoCuentaReporteDto {
  razon_Social: string;
  num_Documento: string | null;
  direccion: string | null;
  telefono: string | null;
  condicion: string;
  limite: number;
  no_Vencida: number;
  dias_30: number;
  dias_60: number;
  dias_90: number;
  dias_120: number;
  mas_120: number;
  balanceTotal: number;
  movimientos: MovimientoClienteReporteDto[];
}


// ═══ API DE REPORTES DE CLIENTES ═══
export const reporteClientesApi = {
  saldosAntiguedad: (fecha: string) =>
    apiClient.get<SaldosAntiguedadReporteDto[]>('/reporte/saldos-antiguedad', {
      params: { fecha }
    }),


  movimientoCliente: (fecha1: string, fecha2: string, idCliente: number) =>
    apiClient.get<MovimientoClienteReporteDto[]>('/reporte/movimiento-cliente', {
      params: { fecha1, fecha2, idCliente }
    }),


  recibosCobro: (fecha1: string, fecha2: string, idUsuario?: number) =>
    apiClient.get<ReciboCobroReporteDto[]>('/reporte/recibos-cobro', {
      params: { fecha1, fecha2, idUsuario: idUsuario || 0 }
    }),


  estadoCuenta: (idCliente: number, fecha: string, fecha1: string, fecha2: string) =>
    apiClient.get<EstadoCuentaReporteDto>('/reporte/estado-cuenta', {
      params: { idCliente, fecha, fecha1, fecha2 }
    }),
};