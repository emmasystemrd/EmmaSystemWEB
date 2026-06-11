import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { terminoApi, type TerminoDto } from '../../api/termino.api';
import { useAuthStore } from '../../store/authStore';

export default function TerminoListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [allTerminos, setAllTerminos] = useState<TerminoDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const idEmpresa = user?.idempresa ?? 1;

  useEffect(() => {
    const loadTerminos = async () => {
      setLoading(true);
      try {
        const { data } = await terminoApi.getAll(idEmpresa);
        setAllTerminos(data);
      } catch (err: any) {
        console.error('❌ Error al cargar términos:', err);
        setError('No se pudieron cargar los términos de pago');
      } finally {
        setLoading(false);
      }
    };
    loadTerminos();
  }, [idEmpresa]);

  const terminosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return allTerminos;
    const term = searchTerm.toLowerCase();
    return allTerminos.filter(t => 
      t.nombre.toLowerCase().includes(term) ||
      (t.tipo === 'C' ? 'crédito' : t.tipo === 'P' ? 'plazo' : t.tipo.toLowerCase()).includes(term)
    );
  }, [searchTerm, allTerminos]);

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar el término "${nombre}"?`)) return;
    try {
      await terminoApi.delete(id);
      setAllTerminos(prev => prev.filter(t => t.idtermino !== id));
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-1">
                💰 Términos de Pago
              </h1>
              <p className="text-emerald-100 text-[11px]">Configura las condiciones de pago para clientes</p>
            </div>
            <button
              onClick={() => navigate('/terminos/nuevo')}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1"
            >
              ➕ Nuevo Término
            </button>
          </div>
        </div>

        {/* Error compacto */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-2 text-xs text-red-700 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Barra de búsqueda compacta */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="p-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                {terminosFiltrados.length} de {allTerminos.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla compacta */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Cargando términos...</div>
          ) : terminosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              {searchTerm ? `No se encontró "${searchTerm}"` : 'No hay términos registrados'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Nombre</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Tipo</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Tiempo (Días)</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Tasa %</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Pagos</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Descuento</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {terminosFiltrados.map((t) => (
                    <tr key={t.idtermino} className="hover:bg-orange-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-xs text-gray-800">{t.nombre}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          t.tipo === 'C' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {t.tipo === 'C' ? 'Crédito' : t.tipo === 'P' ? 'Plazo' : t.tipo}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-gray-700">{t.tiempo}</td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-gray-700">{((t.tasa ?? 0) * 100).toFixed(2)}%</td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-gray-700">{t.no_Pagos}</td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-gray-700">{((t.p_descuento ?? 0) * 100).toFixed(2)}%</td>
                      <td className="px-3 py-2 text-right space-x-1.5 whitespace-nowrap">
                        <button onClick={() => navigate(`/terminos/editar/${t.idtermino}`)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-blue-50">
                          ✏️ Editar
                        </button>
                        <button onClick={() => handleDelete(t.idtermino, t.nombre)} className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-red-50">
                          🗑️ Eliminar
                        </button>
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