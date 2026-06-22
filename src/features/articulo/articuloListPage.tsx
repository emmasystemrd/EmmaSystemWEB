import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { articuloApi, type ArticuloDto } from '../../api/articulo.api';

const PAGE_SIZES = [10, 25, 50];

export default function ArticuloListPage() {
  const navigate = useNavigate();

  const [allArticulos, setAllArticulos] = useState<ArticuloDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadArticulos = async () => {
      setLoading(true);
      try {
        const { data } = await articuloApi.getAll();
        setAllArticulos(data);
      } catch (err: any) {
        console.error('Error al cargar productos:', err);
        setError('No se pudieron cargar los productos');
      } finally {
        setLoading(false);
      }
    };
    loadArticulos();
  }, []);

  // Filtrado client-side
  const articulosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return allArticulos;
    const term = searchTerm.toLowerCase();
    return allArticulos.filter(a =>
      a.codigo.toLowerCase().includes(term) ||
      a.nombre.toLowerCase().includes(term) ||
      a.descripcion?.toLowerCase().includes(term)
    );
  }, [searchTerm, allArticulos]);

  // Resetear página cuando cambia búsqueda o tamaño
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(articulosFiltrados.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const articulosPagina = articulosFiltrados.slice(startIndex, startIndex + pageSize);

  // Generar números de página con ellipsis
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handleDelete = async (idArticulo: number, nombre: string) => {
    if (!confirm(`¿Eliminar el producto "${nombre}"?`)) return;
    try {
      await articuloApi.delete(idArticulo);
      setAllArticulos(prev => prev.filter(a => a.idarticulo !== idArticulo));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const getTipoTexto = (tipo: string) => {
    switch (tipo) {
      case 'P': return 'Mercancía';
      case 'M': return 'Material';
      default: return tipo;
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-4">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">📦 Productos</h1>
              <p className="text-emerald-100 text-xs">Gestiona artículos y servicios del inventario</p>
            </div>
            <button
              onClick={() => navigate('/productos/nuevo')}
              className="px-4 py-2 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1.5"
            >
              ➕ Nuevo Producto
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 text-sm text-red-700 shadow-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Barra de búsqueda + controles de paginación */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1 w-full">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Items por página */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-500 whitespace-nowrap">Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                {PAGE_SIZES.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                de {articulosFiltrados.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-200 border-t-emerald-600 mb-3" />
              <p className="text-sm text-gray-500">Cargando productos...</p>
            </div>
          ) : articulosPagina.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                {searchTerm ? `No se encontró "${searchTerm}"` : 'No hay productos registrados'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate('/productos/nuevo')}
                  className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Crear primer producto →
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider hidden md:table-cell">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-emerald-800 uppercase tracking-wider">Producto</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider">Precio</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider">Existencia</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-800 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-800 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {articulosPagina.map((art) => (
                    <tr key={art.idarticulo} className="hover:bg-orange-50/60 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-gray-900">{art.codigo}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium">
                          {getTipoTexto(art.tipo)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-semibold text-gray-800">{art.nombre}</p>
                        {art.descripcion && (
                          <p className="text-[10px] text-gray-500 truncate max-w-xs">{art.descripcion}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-emerald-700 font-bold">
                        {formatMoney(art.precio)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-mono text-gray-700">
                        {art.existencia ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${getEstadoColor(art.estado)}`}>
                          {art.estado === 'A' ? 'Activo' : art.estado === 'I' ? 'Inactivo' : art.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/productos/editar/${art.idarticulo}`)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(art.idarticulo, art.nombre)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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

        {/* Paginación - Opción B: Botones numerados con ellipsis */}
        {!loading && articulosFiltrados.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-xl shadow-sm border border-emerald-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Mostrando <span className="font-semibold text-gray-700">{startIndex + 1}</span>–<span className="font-semibold text-gray-700">{Math.min(startIndex + pageSize, articulosFiltrados.length)}</span> de <span className="font-semibold text-gray-700">{articulosFiltrados.length}</span> productos
            </p>

            <nav className="flex items-center gap-1">
              {/* Anterior */}
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                ← Anterior
              </button>

              {/* Números de página */}
              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition ${
                      currentPage === page
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              {/* Siguiente */}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                Siguiente →
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}