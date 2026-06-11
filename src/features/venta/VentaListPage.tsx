import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ventaApi, type VentaListadoDto, type VentaPendienteDto } from '../../api/venta.api';
import { useAuthStore } from '../../store/authStore';

type VistaMode = 'activas' | 'pendientes';

export default function VentaListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const idEmpresa = user?.idempresa ?? 1;
  const idLogin = user?.idusuario ?? 1;

  const [vista, setVista] = useState<VistaMode>('activas');
  const [ventas, setVentas] = useState<VentaListadoDto[]>([]);
  const [pendientes, setPendientes] = useState<VentaPendienteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [textoBusqueda, setTextoBusqueda] = useState('');

  // ═══ Cargar datos ═══
  useEffect(() => {
    cargarDatos();
  }, [vista, idEmpresa]);

  const cargarDatos = async () => {
    setLoading(true);
    setError('');
    try {
      if (vista === 'activas') {
        const { data } = await ventaApi.getAll();
        setVentas(data);
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

  // ═══ Eliminar venta ═══
  const handleDelete = async (idVenta: number, ncf: string) => {
    if (!confirm(`¿Eliminar la venta NCF: ${ncf}?`)) return;
    try {
      await ventaApi.delete(idVenta, idLogin);
      setVentas(prev => prev.filter(v => v.idventa1 !== idVenta));
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  // ═══ Formateadores ═══
    const formatMoney = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0.00';
    return new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('es-DO');
  };
  const handleSearch = () => {
    loadVentas();
  };

    const loadVentas = async () => {
    setLoading(true);
    setError('');
    
    console.log('🔍 Buscando con filtros:', filters);
    console.log('🏢 idEmpresa:', idEmpresa);
    
    try {
      const searchParams = {
        columna: filters.columna,
        isFecha: filters.fecha1 ? 'true':'false',
        fecha1: filters.fecha1 ? filters.fecha1:new Date().toISOString().split('T')[0],
        fecha2: filters.fecha2 ? filters.fecha2:new Date().toISOString().split('T')[0],
        texto: filters.texto.trim()
      };
      console.log('📡 Llamando a API con params:', searchParams);
      
      const { data } = await ventaApi.searchByColumn(searchParams);
      console.log('✅ Respuesta de API:', data);
      
      setVentas(data);
    } catch (err: any) {
      console.error('Error al cargar cotizaciones:', err);
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const [filters, setFilters] = useState({
    fecha1: '',
    fecha2: '',
    isFecha:'false',
    texto: '',
    columna: 'v.Nombre_Cliente',  
    
  });

  const handleClearFilters = () => {
    setFilters({
      fecha1: '',
fecha2: '',
isFecha:'false',
texto: '',
columna: 'v.Nombre_Cliente',  
    });
    loadVentas();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">💰 Gestión de Ventas</h1>
              <p className="text-emerald-100 text-xs">Administra las ventas de tu empresa</p>
            </div>
            <button
              onClick={() => navigate('/ventas/nueva')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-lg transition-colors"
            >
              ➕ Nueva Venta
            </button>
          </div>
        </div>

                {/* TARJETAS ESTADÍSTICAS COMPACTAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg p-2 shadow">
            <p className="text-[10px] opacity-90">Total</p>
            <p className="text-xl font-bold">{18}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg p-2 shadow">
            <p className="text-[10px] opacity-90">Aceptada</p>
            <p className="text-xl font-bold">{10}</p>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg p-2 shadow">
            <p className="text-[10px] opacity-90">Rechazada</p>
            <p className="text-xl font-bold">{3}</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-2 shadow">
            <p className="text-[10px] opacity-90">Pendiente</p>
            <p className="text-xl font-bold">{5}</p>
          </div>
        </div>

        {/* FILTROS COMPACTOS */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-3 py-1.5 border-b border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
              Filtros de Búsqueda
            </h2>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Buscar</label>
                <select
  value={filters.columna}
onChange={(e) => setFilters(prev => ({ ...prev, columna: e.target.value }))}
  
  className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
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
                
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filters.texto}
                  onChange={(e) => setFilters(prev => ({ ...prev, texto: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Fecha Desde</label>
                <input
                  type="date"
                  value={filters.fecha1}
                  onChange={(e) => setFilters(prev => ({ ...prev, fecha1: e.target.value }))}
                  className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Fecha Hasta</label>
                <input
                  type="date"
                  value={filters.fecha2}
                  onChange={(e) => setFilters(prev => ({ ...prev, fecha2: e.target.value }))}
                  className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-1 justify-end">
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Limpiar
                </button>
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="px-3 py-1 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full"></span>
                      Buscando
                    </>
                  ) : (
                    <>🔍 Buscar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de vista */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="border-b border-gray-100 px-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setVista('activas')}
                className={`py-2 px-4 text-xs font-medium border-b-2 transition-all ${
                  vista === 'activas'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                📋 Ventas Activas ({ventas.length})
              </button>
              <button
                onClick={() => setVista('pendientes')}
                className={`py-2 px-4 text-xs font-medium border-b-2 transition-all ${
                  vista === 'pendientes'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                ⏳ Pendientes ({pendientes.length})
              </button>
            </div>

            {vista === 'pendientes' && (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={textoBusqueda}
                  onChange={(e) => setTextoBusqueda(e.target.value)}
                  placeholder="🔍 Buscar cliente o NCF..."
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none w-64"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="m-3 p-2 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-700">
              ⚠️ {error}
            </div>
          )}

          {/* ═══ VISTA: VENTAS ACTIVAS ═══ */}
          {vista === 'activas' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Cargando ventas...</div>
              ) : ventas.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No hay ventas registradas
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">NCF</th>
                      
                      <th className="px-4 py-3 text-left">Cliente</th>
                      
                      <th className="px-4 py-3 text-right">Subtotal</th>
                      <th className="px-4 py-3 text-right">ITBIS</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ventas.map(v => (
                      <tr key={v.idventa1} className="hover:bg-emerald-50 transition-colors">
                        <td className="px-4 py-3">{formatDate(v.fecha)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-emerald-700">{v.ncf}</td>
                        
                        <td className="px-4 py-3 font-medium">{v.nombre_Cliente}</td>
        
        
        
        
        
                        <td className="px-4 py-3 text-right font-mono">{formatMoney(v.subtotal)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatMoney(v.itbis)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-green-700">
                          {formatMoney(v.total)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <button
                              onClick={() => navigate(`/ventas/${v.idventa1}/editar`)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button

                              onClick={() => navigate(`/ventas/${v.ncf}/imprimir`)}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded"
                              title="Imprimir"
                            >
                              🖨️
                            </button>
                            <button
                              onClick={() => handleDelete(v.idventa1, v.ncf)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-200 text-red-700 rounded"
                              title="Anular"
                            >
                              <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
</svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ═══ VISTA: VENTAS PENDIENTES ═══ */}
          {vista === 'pendientes' && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Cargando pendientes...</div>
              ) : pendientes.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  🎉 No hay ventas pendientes de pago
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left">No. Factura</th>
                      <th className="px-4 py-3 text-left">NCF</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Fecha</th>
                      <th className="px-4 py-3 text-left">Vencimiento</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Balance</th>
                      <th className="px-4 py-3 text-center">Días Venc.</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendientes.map(p => (
                      <tr
                        key={p.idventa}
                        className={`hover:bg-orange-50 transition-colors ${
                          (p.diasVencidos ?? 0) > 0 ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-mono font-bold">{p.no_Factura}</td>
                        <td className="px-4 py-3 font-mono text-emerald-700">{p.ncf}</td>
                        <td className="px-4 py-3 font-medium">{p.nombre_Cliente}</td>
                        <td className="px-4 py-3">{formatDate(p.fecha)}</td>
                        <td className="px-4 py-3">{formatDate(p.vencimiento)}</td>
                        <td className="px-4 py-3 text-right font-mono">{formatMoney(p.total)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-red-600">
                          {formatMoney(p.balance)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {(p.diasVencidos ?? 0) > 0 ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
                              {p.diasVencidos} días
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px]">
                              Al día
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => navigate(`/ventas/cobrar/${p.idventa}`)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold"
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
      </div>
    </div>
  );
}