// ✅ IMPORTAR el tipo desde articulo.api.ts (ya existe allí)
import type { MedidaDetalleProductoDto } from './articulo.api';

// DTO genérico que funciona para Cotización, Venta, Devolución, Nota de Débito
export interface DetalleDocumentoDto {
  // Identificadores
  iddetalle: number;
  idDocumento: number;
  iddetalle_Producto: number;
  idArticuloOriginal?: number;
  
  // Datos del producto
  codigo: string;
  producto: string;
  nombreProducto?: string;
  
  // Cantidades y precios
  cantidad: number;
  medida: string;
  precio_Venta1: number;
  p_Itbis: number;
  descuento: number;
  
  // Cálculos
  subtotal: number;
  itbis: number;
  total: number;
  
  // Metadatos para UI
  medidasDisponibles?: MedidaDetalleProductoDto[]; // ← Ahora usa el tipo importado
  __modified?: boolean;
  __new?: boolean;
}

// ✅ RE-EXPORTAR para que otros archivos puedan importarlo desde aquí si lo prefieren
export type { MedidaDetalleProductoDto };

// Tipo de documento soportado
export type TipoDocumento = 'cotizacion' | 'venta' | 'devolucion' | 'nota_debito' | 'nota_credito';