import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { articuloApi, type ArticuloDto } from '../../api/articulo.api';
import { useAuthStore } from '../../store/authStore';

export default function ArticuloListPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [allArticulos, setAllArticulos] = useState<ArticuloDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const idEmpresa = user?.idempresa ?? 1;

  useEffect(() => {
    const loadArticulos = async () => {
      setLoading(true);
      try {
        const { data } = await articuloApi.getAll(idEmpresa);
        setAllArticulos(data);
      } catch (err: any) {
        console.error('❌ Error al cargar productos:', err);
        setError('No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    loadArticulos();
  }, [idEmpresa]);

  const articulosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return allArticulos;
    const term = searchTerm.toLowerCase();
    return allArticulos.filter(a => 
      a.codigo.toLowerCase().includes(term) ||
      a.nombre.toLowerCase().includes(term) ||
      a.descripcion?.toLowerCase().includes(term)
    );
  }, [searchTerm, allArticulos]);

  const handleDelete = async (idArticulo: number, nombre: string) => {
    if (!confirm(`¿Eliminar el producto "${nombre}"?`)) return;
    const idLogin = user?.idusuario ?? 1;
    try {
      await articuloApi.delete(idArticulo, idLogin);
      setAllArticulos(prev => prev.filter(a => a.idarticulo !== idArticulo));
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  // Helper para tipo
  const getTipoTexto = (tipo: string) => {
    switch (tipo) {
      case 'P': return 'Mercancía';
      case 'M': return 'Material';
      default: return tipo;
    }
  };

  // Helper para estado
  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'A': return 'Activo';
      case 'I': return 'Inactivo';
      default: return estado;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'A': return 'bg-green-100 text-green-700';
      case 'I': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

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
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-1">📦 Productos</h1>
              <p className="text-emerald-100 text-[11px]">Gestiona artículos y servicios del inventario</p>
            </div>
            <button
              onClick={() => navigate('/productos/nuevo')}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1"
            >
              ➕ Nuevo Producto
            </button>
          </div>
        </div>

        {/* Mensaje de error compacto */}
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
                  placeholder="Buscar por código, nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">{articulosFiltrados.length} de {allArticulos.length}</span>
            </div>
          </div>
        </div>

        {/* Tabla compacta */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Cargando productos...</div>
          ) : articulosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              {searchTerm ? `No se encontró "${searchTerm}"` : 'No hay productos registrados'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Código</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800 hidden md:table-cell">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Producto</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Precio</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Existencia</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Estado</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articulosFiltrados.map((art) => (
                    <tr key={art.idarticulo} className="hover:bg-orange-50 transition-colors">
                      <td className="px-3 py-2 font-mono text-xs text-gray-900">{art.codigo}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 hidden md:table-cell">
                        {getTipoTexto(art.tipo)}
                      </td>
                      <td className="px-3 py-2 text-xs font-medium text-gray-800">{art.nombre}</td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-emerald-700 font-semibold">
                        {formatMoney(art.precio)}
                      </td>
                      <td className="px-3 py-2 text-right text-xs font-mono text-gray-700">{art.existencia}</td>
                      <td className="px-3 py-2 text-right text-xs">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getEstadoColor(art.estado)}`}>
                          {getEstadoTexto(art.estado)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/productos/editar/${art.idarticulo}`)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(art.idarticulo, art.nombre)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-red-50"
                          title="Eliminar"
                        >
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