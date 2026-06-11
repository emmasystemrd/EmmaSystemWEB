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
  balance_inicial: number;
  tipo: string;
  categoriaAF?: number;
  maximo: number;
  minimo: number;
  tax: number;
  isVencimiento: boolean;
  fecha_vencimiento?: string;
  cta_inventario: string;
  cta_costo: string;
  cta_ingreso: string;
  cta_ventaAF?: string;
  facturar_sin_existencia: string;
  foto?: string;
  estado: string;
  existencia?: string;
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
  cta_inventario: string;
  cta_costo: string;
  cta_ingreso: string;
  cta_ventaAF?: string;
  facturar_sin_existencia: string;
  codigo_barra?: string;
  unidades?: number;
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

export const articuloApi = {
  getAll: (idEmpresa: number) => 
    apiClient.get<ArticuloDto[]>(`/articulo?Idempresa=${idEmpresa}`),
  
  // Búsqueda genérica (NO devuelve tax correctamente)
  search: (texto: string, idEmpresa: number) => 
    apiClient.get<ArticuloDto[]>(`/articulo/buscar?textobuscar=${encodeURIComponent(texto)}&Idempresa=${idEmpresa}`),
  
  // ✅ NUEVO: Búsqueda específica para ventas CON tax correcto
  searchForSales: (texto: string, idEmpresa: number) => 
    apiClient.get<ArticuloVentaDto[]>(
      `/articulo/buscar/venta?texto=${encodeURIComponent(texto)}&Idempresa=${idEmpresa}`
    ),
  
  getById: (idArticulo: number) => 
    apiClient.get<ArticuloDto>(`/articulo/${idArticulo}`),
  
  create: (dto: ArticuloSaveDto, idEmpresa: number, idLogin: number) => 
    apiClient.post<number>('/articulo', { ...dto, idEmpresa, idLogin }),
  
  update: (idArticulo: number, dto: ArticuloSaveDto, idLogin: number) => 
    apiClient.put(`/articulo/${idArticulo}`, { ...dto, idLogin }),
  
  delete: (idArticulo: number, idLogin: number) => 
    apiClient.delete(`/articulo/${idArticulo}`, { data: { idLogin } }),
   // Primera API: Llenar select (sin precio, sin iddetalle)
  getDetallesByProducto: (idproducto: number) =>
    apiClient.get<MedidaDetalleProductoDto[]>(`/medida/detalle-producto/${idproducto}`),

  // Segunda API: Obtener precio específico por Idmedida + Nombre
getDetallePrecios: (idArticulo: number, idMedida: number, nombre: string) =>
  apiClient.get<DetalleProductoPrecioDto[]>(
    `/articulo/${idArticulo}/detalle-precio?idMedida=${idMedida}&nombre=${encodeURIComponent(nombre)}`
  ),
};