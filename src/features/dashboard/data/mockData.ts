export interface DashboardMetrics {
  facturasHoy: number;
  facturasMes: number;
  clientesActivos: number;
  ingresosMes: number;
  pendientesCobro: number;
}

export interface RecentActivity {
  id: number;
  tipo: 'factura' | 'pago' | 'cliente' | 'ajuste';
  descripcion: string;
  fecha: string;
  monto?: number;
  usuario: string;
}

export interface QuickAction {
  id: string;
  titulo: string;
  icono: string;
  ruta: string;
  color: string;
}

export const mockMetrics: DashboardMetrics = {
  facturasHoy: 12,
  facturasMes: 247,
  clientesActivos: 89,
  ingresosMes: 1250000.00,
  pendientesCobro: 325000.00,
};

export const mockRecentActivity: RecentActivity[] = [
  {
    id: 1,
    tipo: 'factura',
    descripcion: 'Factura electrónica F01-000001234 emitida',
    fecha: '2026-05-27T10:30:00',
    monto: 15000.00,
    usuario: 'EMMANUEL VASQUEZ',
  },
  {
    id: 2,
    tipo: 'pago',
    descripcion: 'Pago recibido - Cliente SUPERMERCADO NACIONAL',
    fecha: '2026-05-27T09:15:00',
    monto: 50000.00,
    usuario: 'EMMANUEL VASQUEZ',
  },
  {
    id: 3,
    tipo: 'cliente',
    descripcion: 'Nuevo cliente registrado: DISTRIBUIDORA ABC SRL',
    fecha: '2026-05-27T08:45:00',
    usuario: 'EMMANUEL VASQUEZ',
  },
  {
    id: 4,
    tipo: 'factura',
    descripcion: 'Factura electrónica F01-000001233 emitida',
    fecha: '2026-05-26T16:20:00',
    monto: 8500.00,
    usuario: 'EMMANUEL VASQUEZ',
  },
  {
    id: 5,
    tipo: 'ajuste',
    descripcion: 'Ajuste de inventario - Producto: Celular Samsung A15',
    fecha: '2026-05-26T14:10:00',
    usuario: 'EMMANUEL VASQUEZ',
  },
];

export const mockQuickActions: QuickAction[] = [
  {
    id: '1',
    titulo: 'Nueva Factura',
    icono: 'document',
    ruta: '/ventas/facturas/nueva',
    color: 'blue',
  },
  {
    id: '2',
    titulo: 'Nuevo Cliente',
    icono: 'user',
    ruta: '/clientes/nuevo',
    color: 'green',
  },
  {
    id: '3',
    titulo: 'Reporte 607',
    icono: 'chart',
    ruta: '/reportes/607',
    color: 'purple',
  },
  {
    id: '4',
    titulo: 'Cobros',
    icono: 'cash',
    ruta: '/cobros',
    color: 'orange',
  },
];