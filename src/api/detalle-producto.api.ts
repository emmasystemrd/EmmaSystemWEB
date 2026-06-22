import apiClient from './client';

export interface DetalleProductoDto {
  iddetalle: number;
  idarticulo: number;
  codigo_barra: string;
  nombre: string; // Nombre de la presentación (ej: "Mayor", "Detalle")
  idmedida: number;
  unidades: number;
  costo: number;
  margen: number;
  precio: number;
  existencia: number;
  medida_nombre?: string;
}

export interface DetalleProductoSaveDto {
  idarticulo: number;
  codigoBarra: string;
  nombre: string;
  idmedida: number;
  unidades: number;
  costo: number;
  margen: number;
  precio: number;
  existencia:number;
}

export const detalleProductoApi = {
  // ✅ GET: /api/articulo/{idArticulo}/presentaciones
  getByArticulo: (idArticulo: number) => 
    apiClient.get<DetalleProductoDto[]>(`/articulo/${idArticulo}/presentaciones`),
  
  // ✅ POST: /api/articulo/{idArticulo}/presentaciones
  create: (idArticulo: number, dto: DetalleProductoSaveDto) => 
    apiClient.post(`/articulo/${idArticulo}/presentaciones`, dto),
  
  // ✅ PUT: /api/articulo/{idArticulo}/presentaciones/{idDetalle}
  update: (idArticulo: number, idDetalle: number, dto: DetalleProductoSaveDto) => 
    apiClient.put(`/articulo/${idArticulo}/presentaciones/${idDetalle}`, dto),
  
  // ✅ DELETE: /api/articulo/{idArticulo}/presentaciones/{idDetalle}
  delete: (idArticulo: number, idDetalle: number) => 
    apiClient.delete(`/articulo/${idArticulo}/presentaciones/${idDetalle}`),
};