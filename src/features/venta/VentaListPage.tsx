import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ventaApi, type VentaListadoDto, type VentaPendienteDto } from '../../api/venta.api';
import { useAuthStore } from '../../store/authStore';

type VistaMode = 'activas' | 'pendientes';

// ═══ Constantes de paginación ═══
const PAGE_SIZES = [10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 25;

export default function VentaListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const idEmpresa = user?.idempresa ?? 1;
  const idLogin = user?.idusuario ?? 1;

  // ═══ Estados principales ═══
  const [vista, setVista] = useState<VistaMode>('activas');
  const [ventas, setVentas] = useState<VentaListadoDto[]>([]);
  const [pendientes, setPendientes] = useState<VentaPendienteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [textoBusqueda, setTextoBusqueda] = useState('');

  // ═══ Estados de paginación ═══
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // ═══ Estado para filtro de tarjeta ═══
const [filtroEstado, setFiltroEstado] = useState<string | null>(null);

  // ═══ Estados de filtros ═══
  const [filters, setFilters] = useState({
    fecha1: '',
    fecha2: '',
    texto: '',
    columna: 'v.Nombre_Cliente',
  });

// ═══ Cargar estados ECF en lote ═══
// ═══ Cargar estados ECF en lote ═══
const cargarEstadosEcf = async (ventasLista: VentaListadoDto[]) => {
  // ✅ Filtrar solo NCFs electrónicos con type guard
  const ncfsEcf = ventasLista
    .filter(v => !!v.ncf && v.ncf.startsWith('E') && v.ncf.length === 13)
    .map(v => v.ncf as string);

  if (ncfsEcf.length === 0) return;

  try {
    const { data } = await ventaApi.consultarEstadosEcf(ncfsEcf);
    
    // Actualizar las ventas con el estado ECF
    setVentas(prev => prev.map(v => ({
      ...v,
      estadoEcf: data[v.ncf] || null
    })));
  } catch (err: any) {
    console.error('Error al cargar estados ECF:', err);
  }
};

// ═══ Handler para clic en tarjeta ═══
const handleCardClick = (tipo: string) => {
  // Si ya está seleccionado el mismo filtro, desactivarlo
  if (filtroEstado === tipo) {
    setFiltroEstado(null);
  } else {
    if (tipo === 'pendientes-cobro') {
      // Cambiar a vista de pendientes
      setVista('pendientes');
      setFiltroEstado(null);
    } else {
      setFiltroEstado(tipo);
    }
  }
};

// ═══ Ventas filtradas según tarjeta seleccionada ═══
const ventasFiltradas = useMemo(() => {
  if (!filtroEstado) return ventas;
  
  return ventas.filter(v => {
    const estado = v.estadoEcf?.toUpperCase();
    switch (filtroEstado) {
      case 'aceptadas':
        return estado === 'ACEPTADO' || estado === 'ACEPTADO CONDICIONAL';
      case 'rechazadas':
        return estado === 'RECHAZADO' || estado === 'ERROR';
      case 'en-proceso':
        return estado === 'EN PROCESO' || estado === 'PENDIENTE';
      default:
        return true;
    }
  });
}, [ventas, filtroEstado]);

  // ═══ Calcular totales de páginas ═══
  useEffect(() => {
    setTotalPages(Math.ceil(totalItems / pageSize) || 1);
  }, [totalItems, pageSize]);

  // ═══ Cargar datos ═══
  useEffect(() => {
    cargarDatos();
  }, [vista, idEmpresa, currentPage, pageSize]);
const cargarDatos = async () => {
  setLoading(true);
  setError('');
  try {
    if (vista === 'activas') {
      const searchParams = {
        columna: filters.columna,
        isFecha: filters.fecha1 ? 'true' : 'false',
        fecha1: filters.fecha1 || new Date().toISOString().split('T')[0],
        fecha2: filters.fecha2 || new Date().toISOString().split('T')[0],
        texto: filters.texto.trim(),
        page: currentPage,
        pageSize: pageSize,
      };
      const { data } = await ventaApi.searchByColumn(searchParams);
      
      // ✅ La API devuelve { items, total, page, pageSize, totalPages }
      setVentas(data.items);
      setTotalItems(data.total);
      
      // Cargar estados ECF después de cargar las ventas
      cargarEstadosEcf(data.items);
    } else {
      if (textoBusqueda.trim()) {
        const { data } = await ventaApi.searchPendientes(idEmpresa, textoBusqueda);
        setPendientes(data);
      } else {
        const { data } = await ventaApi.getPendientes(idEmpresa);
        setPendientes(data);
      }
    }
  } catch (err: any) {
    console.error('❌ Error al cargar ventas:', err);
    setError(err.response?.data?.message || 'Error al cargar las ventas');
  } finally {
    setLoading(false);
  }
};

  // ═══ Estadísticas dinámicas ═══
  const stats = useMemo(() => {
    const total = ventas.length;
    const aceptadas = ventas.filter(v => v.estadoEcf?.toUpperCase() === 'ACEPTADO').length;
    const rechazadas = ventas.filter(v => v.estadoEcf?.toUpperCase() === 'RECHAZADO').length;
    const pendientes = ventas.filter(v => 
      !v.estadoEcf || 
      v.estadoEcf.toUpperCase() === 'PENDIENTE' || 
      v.estadoEcf.toUpperCase() === 'EN PROCESO'
    ).length;
    const montoTotal = ventas.reduce((sum, v) => sum + (v.total || 0), 0);
    
    return { total, aceptadas, rechazadas, pendientes, montoTotal };
  }, [ventas]);

  // ═══ Eliminar venta ═══
  const handleDelete = async (idVenta: number, ncf: string) => {
    if (!confirm(`¿Estás seguro de eliminar la venta NCF: ${ncf}?\n\nEsta acción no se puede deshacer.`)) return;
    try {
      await ventaApi.delete(idVenta, idLogin);
      setVentas(prev => prev.filter(v => v.idventa1 !== idVenta));
      setTotalItems(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  // ═══ Formateadores ═══
  const formatMoney = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return 'RD$ 0.00';
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-DO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // ═══ Handlers de búsqueda y filtros ═══
  const handleSearch = () => {
    setCurrentPage(1); // Reiniciar a página 1 al buscar
    cargarDatos();
  };

  const handleClearFilters = () => {
    setFilters({
      fecha1: '',
      fecha2: '',
      texto: '',
      columna: 'v.Nombre_Cliente',
    });
    setCurrentPage(1);
    setTimeout(() => cargarDatos(), 0);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // ═══ Determinar si es NCF electrónico ═══
  const esNcfElectronico = (ncf: string): boolean => {
    if (!ncf) return false;
    return ncf.trim().startsWith('E') && ncf.trim().length === 13;
  };

  // ═══ Obtener badge de estado ECF ═══
  const getEstadoEcfBadge = (estado: string | null | undefined) => {
    if (!estado) return null;
    
    const estadoUpper = estado.toUpperCase();
    const config: Record<string, { bg: string; text: string; icon: string }> = {
      'ACEPTADO': { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
      'ACEPTADO CONDICIONAL': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⚠️' },
      'EN PROCESO': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '⏳' },
      'RECHAZADO': { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' },
      'PENDIENTE': { bg: 'bg-gray-100', text: 'text-gray-700', icon: '⏸️' },
      'ERROR': { bg: 'bg-red-100', text: 'text-red-700', icon: '💥' },
    };

    const c = config[estadoUpper] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '❓' };
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${c.bg} ${c.text}`}>
        <span>{c.icon}</span>
        {estado}
      </span>
    );
  };

  // ═══ Generar números de página ═══
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  // ═══ Rango de registros mostrados ═══
  const totalMostrado = filtroEstado ? ventasFiltradas.length : totalItems;
const rangoInicio = totalMostrado === 0 ? 0 : (currentPage - 1) * pageSize + 1;
const rangoFin = Math.min(currentPage * pageSize, totalMostrado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* ═══ HEADER ═══ */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <span>💰</span> Gestión de Ventas
              </h1>
              <p className="text-emerald-100 text-sm mt-0.5">Administra las ventas de tu empresa</p>
            </div>
            <button
              onClick={() => navigate('/ventas/nueva')}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-lg shadow-lg transition-all hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <span className="text-lg">➕</span>
              Nueva Venta
            </button>
          </div>
        </div>

{/* ═══ TARJETAS ESTADÍSTICAS CLICKEABLES ═══ */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
  {/* Total Ventas */}
  <button
    onClick={() => handleCardClick('total')}
    className={`bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-4 shadow-lg transition-all text-left ${
      filtroEstado === 'total' 
        ? 'ring-4 ring-emerald-300 scale-105' 
        : 'hover:shadow-xl hover:scale-102'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs opacity-90 uppercase font-semibold">Total Ventas</p>
        <p className="text-2xl font-bold mt-1">{stats.total}</p>
      </div>
      <div className="text-3xl opacity-50">📊</div>
    </div>
    <p className="text-xs mt-2 opacity-90">{formatMoney(stats.montoTotal)}</p>
  </button>
  
  {/* Aceptadas */}
  <button
    onClick={() => handleCardClick('aceptadas')}
    className={`bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 shadow-lg transition-all text-left ${
      filtroEstado === 'aceptadas' 
        ? 'ring-4 ring-green-300 scale-105' 
        : 'hover:shadow-xl hover:scale-102'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs opacity-90 uppercase font-semibold">Aceptadas</p>
        <p className="text-2xl font-bold mt-1">{stats.aceptadas}</p>
      </div>
      <div className="text-3xl opacity-50">✅</div>
    </div>
    <p className="text-xs mt-2 opacity-90">DGII Aceptado</p>
  </button>
  
  {/* Rechazadas */}
  <button
    onClick={() => handleCardClick('rechazadas')}
    className={`bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 shadow-lg transition-all text-left ${
      filtroEstado === 'rechazadas' 
        ? 'ring-4 ring-red-300 scale-105' 
        : 'hover:shadow-xl hover:scale-102'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs opacity-90 uppercase font-semibold">Rechazadas</p>
        <p className="text-2xl font-bold mt-1">{stats.rechazadas}</p>
      </div>
      <div className="text-3xl opacity-50">❌</div>
    </div>
    <p className="text-xs mt-2 opacity-90">Requiere atención</p>
  </button>
  
  {/* En Proceso */}
  <button
    onClick={() => handleCardClick('en-proceso')}
    className={`bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl p-4 shadow-lg transition-all text-left ${
      filtroEstado === 'en-proceso' 
        ? 'ring-4 ring-yellow-300 scale-105' 
        : 'hover:shadow-xl hover:scale-102'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs opacity-90 uppercase font-semibold">En Proceso</p>
        <p className="text-2xl font-bold mt-1">{stats.pendientes}</p>
      </div>
      <div className="text-3xl opacity-50">⏳</div>
    </div>
    <p className="text-xs mt-2 opacity-90">Pendientes DGII</p>
  </button>

  {/* Pendientes Cobro */}
  <button
    onClick={() => handleCardClick('pendientes-cobro')}
    className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 shadow-lg transition-all text-left col-span-2 md:col-span-1 ${
      vista === 'pendientes' 
        ? 'ring-4 ring-blue-300 scale-105' 
        : 'hover:shadow-xl hover:scale-102'
    }`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs opacity-90 uppercase font-semibold">Pendientes Cobro</p>
        <p className="text-2xl font-bold mt-1">{pendientes.length}</p>
      </div>
      <div className="text-3xl opacity-50">💵</div>
    </div>
    <p className="text-xs mt-2 opacity-90">Por cobrar</p>
  </button>
</div>

{/* ═══ INDICADOR DE FILTRO ACTIVO ═══ */}
{filtroEstado && (
  <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-lg">🔍</span>
      <span className="text-sm font-semibold text-blue-800">
        Filtro activo: 
        <span className="ml-1 px-2 py-0.5 bg-blue-200 text-blue-900 rounded-full text-xs">
          {filtroEstado === 'aceptadas' && '✅ Aceptadas'}
          {filtroEstado === 'rechazadas' && '❌ Rechazadas'}
          {filtroEstado === 'en-proceso' && '⏳ En Proceso'}
          {filtroEstado === 'total' && '📊 Todas'}
        </span>
      </span>
      <span className="text-xs text-blue-600">
        ({ventasFiltradas.length} de {ventas.length} registros)
      </span>
    </div>
    <button
      onClick={() => setFiltroEstado(null)}
      className="px-3 py-1 text-xs font-semibold text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition"
    >
      ✕ Quitar filtro
    </button>
  </div>
)}

        {/* ═══ FILTROS ═══ */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2 border-b border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              🔍 Filtros de Búsqueda
            </h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Buscar por
                </label>
                <select
                  value={filters.columna}
                  onChange={(e) => setFilters(prev => ({ ...prev, columna: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                >
                  <option value="c.Codigo">Código</option>
                  <option value="v.Nombre_Cliente">Cliente</option>
                  <option value="v.NCF">No. Factura</option>
                  <option value="v.Descripcion">Descripción</option>
                  <option value="e.Nombres">Vendedor</option>
                  <option value="d.Nombre">Centro de Costo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Texto
                </label>
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filters.texto}
                  onChange={(e) => setFilters(prev => ({ ...prev, texto: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={filters.fecha1}
                  onChange={(e) => setFilters(prev => ({ ...prev, fecha1: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={filters.fecha2}
                  onChange={(e) => setFilters(prev => ({ ...prev, fecha2: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  🗑️ Limpiar
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm hover:shadow"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                      Buscando...
                    </>
                  ) : (
                    <>🔍 Buscar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ TABS Y TABLA ═══ */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="border-b border-gray-100 px-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => setVista('activas')}
                className={`py-3 px-5 text-xs font-bold border-b-2 transition-all ${
                  vista === 'activas'
                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                📋 Ventas Activas
                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px]">
                  {totalItems}
                </span>
              </button>
              <button
                onClick={() => setVista('pendientes')}
                className={`py-3 px-5 text-xs font-bold border-b-2 transition-all ${
                  vista === 'pendientes'
                    ? 'border-orange-500 text-orange-600 bg-orange-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                ⏳ Pendientes de Cobro
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px]">
                  {pendientes.length}
                </span>
              </button>
            </div>

            {vista === 'pendientes' && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={textoBusqueda}
                  onChange={(e) => setTextoBusqueda(e.target.value)}
                  placeholder="🔍 Buscar cliente o NCF..."
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none w-64"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="m-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* ═══ VISTA: VENTAS ACTIVAS ═══ */}
          {vista === 'activas' && (
            <>
              {/* Controles de paginación superior */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
      <div className="text-xs text-gray-600">
        Mostrando <span className="font-bold text-emerald-700">{rangoInicio}</span> - 
        <span className="font-bold text-emerald-700">{rangoFin}</span> de 
        <span className="font-bold text-emerald-700"> {filtroEstado ? ventasFiltradas.length : totalItems}</span> registros
        {filtroEstado && (
          <span className="ml-2 text-blue-600">(filtrado de {totalItems} totales)</span>
        )}
      </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Mostrar:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    {PAGE_SIZES.map(size => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-600">por página</span>
                </div>
              </div>
    <div className="overflow-x-auto">
      {loading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          <p className="text-gray-500 text-sm mt-3">Cargando ventas...</p>
        </div>
      ) : ventasFiltradas.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-sm font-medium">
            {filtroEstado 
              ? `No hay ventas con estado "${filtroEstado}"` 
              : 'No hay ventas registradas'}
          </p>
          <p className="text-xs mt-1">
            {filtroEstado 
              ? 'Intenta seleccionar otra tarjeta o quitar el filtro' 
              : 'Intenta ajustar los filtros o crea una nueva venta'}
          </p>
        </div>
                ) : (
                  <table className="w-full text-xs">
                    <thead className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold">Fecha</th>
                        <th className="px-3 py-3 text-left font-semibold">NCF</th>
                        <th className="px-3 py-3 text-left font-semibold">Cliente</th>
                        <th className="px-3 py-3 text-center font-semibold">Estado DGII</th>
                        <th className="px-3 py-3 text-right font-semibold">Subtotal</th>
                        <th className="px-3 py-3 text-right font-semibold">ITBIS</th>
                        <th className="px-3 py-3 text-right font-semibold">Total</th>
                        <th className="px-3 py-3 text-center font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ventasFiltradas.map((v, idx) => {
                        const isEcf = esNcfElectronico(v.ncf);
                        return (
                          <tr 
                            key={v.idventa1} 
                            className={`hover:bg-emerald-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <td className="px-3 py-3 text-gray-700">{formatDate(v.fecha)}</td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-emerald-700">{v.ncf}</span>
                                {isEcf && (
                                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-bold">
                                    ECF
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 font-medium text-gray-800">{v.nombre_Cliente}</td>
                            <td className="px-3 py-3 text-center">
                              {isEcf ? (
                                getEstadoEcfBadge(v.estadoEcf) || (
                                  <span className="text-[10px] text-gray-400">Sin estado</span>
                                )
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px]">
                                  No ECF
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right font-mono text-gray-700">{formatMoney(v.subtotal)}</td>
                            <td className="px-3 py-3 text-right font-mono text-gray-700">{formatMoney(v.itbis)}</td>
                            <td className="px-3 py-3 text-right font-mono font-bold text-green-700 text-sm">
                              {formatMoney(v.total)}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-center gap-1">
                                <button
                                  onClick={() => navigate(`/ventas/${v.idventa1}/editar`)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => navigate(`/ventas/${v.ncf}/imprimir`)}
                                  className="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded transition-colors"
                                  title="Imprimir"
                                >
                                  🖨️
                                </button>
                                <button
                                  onClick={() => handleDelete(v.idventa1, v.ncf)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded transition-colors"
                                  title="Anular"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ═══ PAGINACIÓN INFERIOR ═══ */}
              {totalPages > 1 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs text-gray-600">
                    Página <span className="font-bold text-emerald-700">{currentPage}</span> de{' '}
                    <span className="font-bold text-emerald-700">{totalPages}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Botón Anterior */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      ◀ Anterior
                    </button>

                    {/* Números de página */}
                    {getPageNumbers().map((page, idx) => (
                      <button
                        key={idx}
                        onClick={() => typeof page === 'number' && handlePageChange(page)}
                        disabled={page === '...' || loading}
                        className={`min-w-[32px] px-2 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          page === currentPage
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : page === '...'
                            ? 'bg-transparent text-gray-400 cursor-default'
                            : 'bg-white border border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Botón Siguiente */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                      className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Siguiente ▶
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ VISTA: VENTAS PENDIENTES ═══ */}
          {vista === 'pendientes' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
                  <p className="text-gray-500 text-sm mt-3">Cargando pendientes...</p>
                </div>
              ) : pendientes.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="text-sm font-medium">No hay ventas pendientes de pago</p>
                  <p className="text-xs mt-1">¡Todo al día!</p>
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold">No. Factura</th>
                      <th className="px-3 py-3 text-left font-semibold">NCF</th>
                      <th className="px-3 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-3 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-3 py-3 text-left font-semibold">Vencimiento</th>
                      <th className="px-3 py-3 text-right font-semibold">Total</th>
                      <th className="px-3 py-3 text-right font-semibold">Balance</th>
                      <th className="px-3 py-3 text-center font-semibold">Días Venc.</th>
                      <th className="px-3 py-3 text-center font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendientes.map((p, idx) => (
                      <tr
                        key={p.idventa}
                        className={`hover:bg-orange-50 transition-colors ${
                          (p.diasVencidos ?? 0) > 0 
                            ? 'bg-red-50/50' 
                            : idx % 2 === 0 
                            ? 'bg-white' 
                            : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-3 py-3 font-mono font-bold text-gray-800">{p.no_Factura}</td>
                        <td className="px-3 py-3 font-mono text-emerald-700 font-semibold">{p.ncf}</td>
                        <td className="px-3 py-3 font-medium text-gray-800">{p.nombre_Cliente}</td>
                        <td className="px-3 py-3 text-gray-700">{formatDate(p.fecha)}</td>
                        <td className="px-3 py-3 text-gray-700">{formatDate(p.vencimiento)}</td>
                        <td className="px-3 py-3 text-right font-mono text-gray-700">{formatMoney(p.total)}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-red-600">
                          {formatMoney(p.balance)}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {(p.diasVencidos ?? 0) > 0 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                              ⚠️ {p.diasVencidos} días
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                              ✅ Al día
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => navigate(`/ventas/cobrar/${p.idventa}`)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm hover:shadow"
                          >
                            💵 Cobrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="text-center text-xs text-gray-500 py-2">
          💡 Tip: Presiona <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300 text-[10px]">Enter</kbd> en el campo de búsqueda para buscar rápidamente
        </div>
      </div>
    </div>
  );
}