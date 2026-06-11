import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cotizacionApi, type CotizacionDto } from '../../api/cotizacion.api';
import { useAuthStore } from '../../store/authStore';

export default function CotizacionListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [cotizaciones, setCotizaciones] = useState<CotizacionDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [filters, setFilters] = useState({
    texto: '',
    tipo: 'C',
    fecha1: '',
    fecha2: '',
    proceso: '',
  });

  const idEmpresa = user?.idempresa ?? 1;

  useEffect(() => {
    loadCotizaciones();
  }, []);

  const loadCotizaciones = async () => {
    setLoading(true);
    setError('');
    
    console.log('🔍 Buscando con filtros:', filters);
    console.log('🏢 idEmpresa:', idEmpresa);
    
    try {
      const searchParams = {
        tipo: filters.tipo || undefined,
        proceso: filters.proceso || undefined,
        fecha1: filters.fecha1 || undefined,
        fecha2: filters.fecha2 || undefined,
        texto: filters.texto.trim() || undefined,
        idEmpresa: idEmpresa,
      };
      console.log('📡 Llamando a API con params:', searchParams);
      
      const { data } = await cotizacionApi.search(searchParams);
      console.log('✅ Respuesta de API:', data);
      
      setCotizaciones(data);
    } catch (err: any) {
      console.error('Error al cargar cotizaciones:', err);
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadCotizaciones();
  };

  const handleClearFilters = () => {
    setFilters({
      texto: '',
      tipo: 'C',
      fecha1: '',
      fecha2: '',
      proceso: '',
    });
    loadCotizaciones();
  };

  const handleDelete = async (id: number, numero: string) => {
    if (!confirm(`¿Eliminar la cotización No. ${numero}?`)) return;
    try {
      await cotizacionApi.delete(id);
      setCotizaciones(prev => prev.filter(c => c.idcotizacion !== id));
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleClose = async (id: number) => {
    if (!confirm('¿Cerrar esta cotización? No podrá modificarse después.')) return;
    try {
      await cotizacionApi.close(id);
      setCotizaciones(prev => prev.map(c => 
        c.idcotizacion === id ? { ...c, proceso: 'C' } : c
      ));
    } catch (err: any) {
      console.error('Error al cerrar:', err);
      setError(err.response?.data?.message || 'Error al cerrar');
    }
  };

  const EstadoBadge = ({ proceso }: { proceso?: string }) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      'A': { bg: 'bg-green-100', text: 'text-green-800', label: 'Abierta' },
      'C': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cerrada' },
      'E': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Facturada' },
    };
    const c = config[proceso || 'A'];
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  const abiertas = cotizaciones.filter(x => x.proceso === 'A').length;
  const cerradas = cotizaciones.filter(x => x.proceso === 'C').length;
  const facturadas = cotizaciones.filter(x => x.proceso === 'E').length;

    const formatMoney = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0.00';
    return new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-2">
        
        {/* HEADER COMPACTO */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-1">
                📋 Gestión de Cotizaciones
              </h1>
              <p className="text-emerald-100 text-[11px]">Administra y da seguimiento a las cotizaciones</p>
            </div>
            <button
              onClick={() => navigate('/cotizaciones/nueva')}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1"
            >
              ➕ Nueva Cotización
            </button>
          </div>
        </div>

        {/* TARJETAS ESTADÍSTICAS COMPACTAS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg p-2 shadow">
            <p className="text-[10px] opacity-90">Total</p>
            <p className="text-xl font-bold">{cotizaciones.length}</p>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-2 shadow">
            <p className="text-[10px] opacity-90">Abiertas</p>
            <p className="text-xl font-bold">{abiertas}</p>
          </div>
          <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg p-2 shadow">
            <p className="text-[10px] opacity-90">Cerradas</p>
            <p className="text-xl font-bold">{cerradas}</p>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg p-2 shadow">
            <p className="text-[10px] opacity-90">Facturadas</p>
            <p className="text-xl font-bold">{facturadas}</p>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-2 text-xs text-red-700 shadow-sm">
            ⚠️ {error}
          </div>
        )}

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
                <input
                  type="text"
                  placeholder="Cliente o N° Cotización"
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
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Estado</label>
                <select
                  value={filters.proceso}
                  onChange={(e) => setFilters(prev => ({ ...prev, proceso: e.target.value }))}
                  className="w-full px-2 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="">Todos</option>
                  <option value="A">Abierta</option>
                  <option value="C">Cerrada</option>
                  <option value="F">Facturada</option>
                </select>
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

        {/* TABLA COMPACTA */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Cargando cotizaciones...</div>
          ) : cotizaciones.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {filters.texto || filters.fecha1 || filters.proceso 
                ? 'No se encontraron resultados con los filtros aplicados' 
                : 'No hay cotizaciones registradas'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-orange-500 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Número</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">Cliente</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold">Total</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold">Estado</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cotizaciones.map((c) => (
                    <tr key={c.idcotizacion} className="border-b hover:bg-orange-50 transition-colors">
                      <td className="px-3 py-2 font-semibold text-xs">{c.no_Cotizacion}</td>
                      <td className="px-3 py-2 text-xs">{new Date(c.fecha).toLocaleDateString('es-DO')}</td>
                      <td className="px-3 py-2 text-xs font-medium">{c.razon_Social}</td>
                      <td className="px-3 py-2 text-right text-xs font-bold text-emerald-700">
                        {formatMoney(c.total)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <EstadoBadge proceso={c.proceso} />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => navigate(`/cotizaciones/editar/${c.idcotizacion}`)}
                            className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 disabled:opacity-50"
                            title={c.proceso !== 'A' ? 'Solo abiertas pueden editarse' : 'Editar'}
                            disabled={c.proceso !== 'A'}
                          >
                            ✏️
                          </button>
                          {c.proceso === 'A' && (
                            <>
                              <button
                                onClick={() => handleClose(c.idcotizacion)}
                                className="p-1.5 rounded-md bg-yellow-50 hover:bg-yellow-100"
                                title="Cerrar"
                              >
                                🔒
                              </button>
                              <button
                                onClick={() => handleDelete(c.idcotizacion, c.no_Cotizacion || '')}
                                className="p-1.5 rounded-md bg-red-50 hover:bg-red-100"
                                title="Eliminar"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => navigate(`/cotizaciones/${c.no_Cotizacion}/imprimir/${c.tipo || 'C'}`)}
                            className="p-1.5 rounded-md bg-green-50 hover:bg-green-100"
                            title="Imprimir"
                          >
                            🖨️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}