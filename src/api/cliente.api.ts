import apiClient from './client';

// ✅ DTO para Tipo de Comprobante (ajusta las propiedades según tu backend)
export interface TipoComprobanteDto {
  id: string;      // Ej: "01", "31"
  nombre: string;      // Ej: "Crédito Fiscal", "Crédito Fiscal Electrónico"
  descripcion?: string;
  esElectronico?: boolean;
}

// DTO para Retención
export interface RetencionDto {
  idretencion: number;
  codigo: string;
  nombre: string;
  porcentaje: number;
  tipo: 'ITBIS' | 'ISR';
}

// Interfaces basadas en la respuesta real de tu API
export interface ClienteDto {
  idcliente: number;
  codigo: string;
  razon_Social: string;
  nombre_Comercial: string;
  tipo: number;
  tipo_Id: number;
  num_Documento: string;
  direccion: string;
  telefono: string;
  email: string;
  limite: number;
  balance: number;
  estado?: string;
  // Campos adicionales que puede devolver la API
  fecha_Nacimiento?: string;
  num_Cuenta?: string;
  tipo_Ingreso?: number;
  tax?: boolean;
  tipo_Comprobante?: string;
  retencion_ITBIS?: number;
  retencion_ISR?: number;
  termino?: number;
  descuento?: number;
  forma_Pago?: number;
  departamento?: number;
  vendedor?: number;
  lista_Precio?: number;
  comentario?: string;
  // Campos que el frontend necesita pero la API podría no devolver
  fecha1?: string;
  idprovincia: number;
  idmunicipio: number;
  idsector: number;
  ruta: string;
}

export interface ClienteSaveDto {
  codigo?: string;
  razon_Social: string;
  nombre_Comercial: string;
  tipo: number;
  tipo_Id: number;
  num_Documento: string;
  direccion: string;
  telefono: string;
  email: string;
  tipo_Ingreso: number;
  tax: boolean;
  tipo_Comprobante: string;
  retencion_ITBIS: number;
  retencion_ISR: number;
  limite: number;
  balance: number;
  fecha1?: string;
  num_Cuenta: string;
  termino: number;
  descuento: number;
  forma_Pago: number;
  departamento: number;
  vendedor: number;
  lista_Precio: number;
  comentario: string;
  idprovincia: number;
  idmunicipio: number;
  idsector: number;
  ruta: string;
}

export const clienteApi = {
  // Listar todos los clientes
  getAll: () => apiClient.get<ClienteDto[]>('/cliente'),
  
   // ✅ BUSCAR CLIENTES ACTIVOS POR TEXTO (si está vacío, devuelve todos)
  buscarActivos: (texto: string = '') =>
    apiClient.get<ClienteDto[]>(
      `/cliente/buscar-activos?texto=${encodeURIComponent(texto)}`
    ),

  // ✅ OBTENER CLIENTE POR ID
  getById: (id: number) =>
    apiClient.get<ClienteDto>(`/cliente/${id}`),
  // Crear nuevo cliente
  create: (data: ClienteSaveDto) => apiClient.post('/cliente', data),
  
  // Actualizar cliente existente
  update: (id: number, data: ClienteSaveDto) => apiClient.put(`/cliente/${id}`, data),
  
  // Eliminar cliente
  delete: (id: number) => apiClient.delete(`/cliente/${id}`),

  // ✅ NUEVO: Obtener tipos de comprobante para ventas
  getTiposComprobante: (esVenta: boolean = true) =>
    apiClient.get<TipoComprobanteDto[]>(
      `/cliente/tipos-comprobante?esVenta=${esVenta}`
    ),
    // Retenciones
  getRetencionesItbis: () => apiClient.get<RetencionDto[]>('/cliente/retenciones/itbis'),
  getRetencionesIsr: () => apiClient.get<RetencionDto[]>('/cliente/retenciones/isr'),
};