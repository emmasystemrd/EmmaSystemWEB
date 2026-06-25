import apiClient from './client';

// DTOs para Artículo (Cabecera)
export interface ArticuloDto {
  idarticulo: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha1: string;
  idcategoria: number;
  idmedida: number;
  costo: number;
  precio: number;
  comision: number;
  exist: number;
  tipo: string;
  categoria?: number;
  maximo: number;
  minimo: number;
  tax: number;
  isVencimiento: boolean;
  fecha_vencimiento?: string;
  cta_Inventario: string;
  cta_Costo: string;
  cta_Ingreso: string;
  cta_VentaAF?: string;
  facturar_Sin_Existencia: string;
  estado: string;
  existencia?: string;
  fotoBase64?: string; // ← AGREGAR
}



// ✅ DTO específico para búsqueda en ventas (devuelve tax correctamente)
export interface ArticuloVentaDto {
  idArticulo: number;
  código: string;
  artículo: string;
  precio: number;
  exist: number;
  gravado: number;           // ✅ Tasa de ITBIS (0.18, 0.16, 0)
  mayor: string;
  idmedida?: number;
  contenido: number;
  facturar_Sin_Existencia: string;
}

export interface ArticuloSaveDto {
  codigo: string;
  nombre: string;
  descripcion: string;
  fecha1: string;
  idcategoria: number;
  idmedida: number;
  costo: number;
  precio: number;
  comision: number;
  balance_inicial: number;
  tipo: string;
  categoriaAF?: number;
  maximo: number;
  minimo: number;
  tax: number;
  isVencimiento: boolean;
  fecha_vencimiento?: string;
  cta_Inventario: string;
  cta_Costo: string;
  cta_Ingreso: string;
  cta_VentaAF?: string;
  facturar_Sin_Existencia: string;
  codigo_barra?: string;
  unidades?: number;
  fotoBase64?: string; // ← AGREGAR
  estado?: string; // ← AGREGAR
}
// ✅ DTO para la PRIMERA API (solo llena el select)
export interface MedidaDetalleProductoDto {
  idmedida: number;
  nombre: string | null;   // Nombre de la presentación (ej: "CAJA x24", "UNIDAD")
  unidades: number;
}

// ✅ DTO para la SEGUNDA API (trae precio e iddetalle)
export interface DetalleProductoPrecioDto {
  iddetalle: number;
  nombre: string | null;
  precio: number;
  medida: string | null;
}

export interface ArticuloVendidoReporteDto {
  codigo: string;
  nombre: string;
  cantidad: number;
  medida: string;
  precio_Venta: number;
  total_Vendido: number;
}

export const articuloApi = {
  getAll: () =>
    apiClient.get<ArticuloDto[]>('/articulo'),

  search: (texto: string) =>
    apiClient.get<ArticuloDto[]>(`/articulo/buscar?texto=${encodeURIComponent(texto)}`),

  searchForSales: (texto: string) =>
    apiClient.get<ArticuloVentaDto[]>(
      `/articulo/buscar/venta?texto=${encodeURIComponent(texto)}`
    ),

  // ✅ NUEVO: Obtener producto por ID para edición
  getById: (idArticulo: number) =>
    apiClient.get<ArticuloDto>(`/articulo/${idArticulo}`),

  create: (dto: ArticuloSaveDto) =>
    apiClient.post<{ message: string; idArticulo: number }>('/articulo', dto),

  update: (idArticulo: number, dto: ArticuloSaveDto) =>
    apiClient.put(`/articulo/${idArticulo}`, dto),

  delete: (idArticulo: number) =>
    apiClient.delete(`/articulo/${idArticulo}`),

  getDetallesByProducto: (idproducto: number) =>
    apiClient.get<MedidaDetalleProductoDto[]>(`/medida/detalle-producto/${idproducto}`),

  getDetallePrecios: (idArticulo: number, idMedida: number, nombre: string) =>
    apiClient.get<DetalleProductoPrecioDto[]>(
      `/articulo/${idArticulo}/detalle-precio?idMedida=${idMedida}&nombre=${encodeURIComponent(nombre)}`
    ),
    getSecuencia: (tipo: string) =>
  apiClient.get<number>(`/articulo/secuencia/${tipo}`),
    // Agregar dentro del objeto articuloApi:
reporteArticulosVendidos: (fecha1: string, fecha2: string) =>
  apiClient.get<ArticuloVendidoReporteDto[]>('/reporte/articulos-vendidos', {
    params: { fecha1, fecha2 }
  }),
};