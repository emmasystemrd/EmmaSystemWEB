import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// DTOs DE CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════

export interface ConfEmpresaDto {
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
  logo?: string;
  version:string;
  registrado: boolean;
  fecha_cierre?: string;
}

export interface ConfProveedorClienteDto {
  idproveedor: string;
  cxP: string;
  dev_Compra: string;
  desc_Compra: string;
  gastoI: string;
  idcliente: string;
  caja: string;
  cxC_Cia: string;
  cxC: string;
  devoluciones: string;
  descuentos: string;
  ingresoI: string;
  cliente_Cumple: boolean;
  capital: string;
  cuenta_Cierre: string;
}

export interface ConfImpuestoDto {
  itbis: string;
  itbisc: string;
  itbiss: string;
  itbisr: string;
  isrr: string;
  isc: string;
  otros_IMP: string;
  propina_Legal: string;
  impuesto_Cheque: string;
  comisiones_Bancarias: string;
  interes_Prestamos_Bancarios: string;
  retencion_Interes_Ganado: string;
  itbis_Costo: string;
}

export interface ConfEmpleadoDto {
  gasto_Sueldo: string;
  aportacion_TSS: string;
  aporte_INFOTEP: string;
  retencion_SFS: string;
  retencion_AFP: string;
  afp: string;
  ars: string;
  riesgo_Laboral: string;
  infotep: string;
  isra: string;
  nomina: string;
  cxC_Empleado: string;
}

export interface ConfTssDto {
  arst: number;
  arse: number;
  afpt: number;
  afpe: number;
  arl: number;
  infotep: number;
  tope_AFP: number;
  tope_ARS: number;
  tope_ARL: number;
}

export interface ConfFacturacionDto {
  idconf: number;
  tipo: number;
  vista_Previa: boolean;
  ancho_Papel: number;
  margen_Papel: number;
  impresora: string;
  mensaje: string;
  copia: number;
  propina_Legal: number;
  cod_Propina_Legal: string;
  itbis_Incluido: number;
}

export interface ConfFactElectronicaDto {
  id: number;
  envio_Inmediato: number;
  ambiente: number | null;
  email: string;
  fechaExpira: string | null;
  tieneCertificado: boolean;
  tieneClaveCertificado: boolean;
  tieneClaveEmail: boolean;
}

export interface ConfFactElectronicaSaveDto {
  envio_Inmediato: number;
  ambiente: number | null;
  certificado_Digital?: File | null;
  clave?: string;
  email: string;
  clave_Email?: string;
  fechaExpira: string | null;
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const configApi = {
  
  proveedorCliente: {
    get: () => apiClient.get<ConfProveedorClienteDto>('/configuracion/proveedor-cliente'),
    update: (data: ConfProveedorClienteDto) => apiClient.put('/configuracion/proveedor-cliente', data),
  },
  impuestos: {
    get: () => apiClient.get<ConfImpuestoDto>('/configuracion/impuestos'),
  },
  empleado: {
    get: () => apiClient.get<ConfEmpleadoDto>('/configuracion/empleado'),
  },
  tss: {
    get: () => apiClient.get<ConfTssDto>('/configuracion/tss'),
  },
  facturacion: {
    get: () => apiClient.get<ConfFacturacionDto>('/configuracion/facturacion'),
    update: (data: ConfFacturacionDto) => apiClient.put('/configuracion/facturacion', data),
  },
  factElectronica: {
  get: () => apiClient.get<ConfFactElectronicaDto>('/configuracion/facturacion-electronica'),
  // ✅ CAMBIO: Aceptar FormData en lugar de ConfFactElectronicaSaveDto
  update: (data: FormData) => 
    apiClient.put('/configuracion/facturacion-electronica', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
}
  };