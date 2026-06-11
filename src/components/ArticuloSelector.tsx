import { useState, useEffect, useRef } from 'react';
import { articuloApi, type ArticuloVentaDto } from '../api/articulo.api';

export interface ArticuloSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (articulo: ArticuloVentaDto) => void;
  idEmpresa: number;
  initialSearch?: string;
}

export default function ArticuloSelector({ 
  isOpen, 
  onClose, 
  onSelect, 
  idEmpresa,
  initialSearch = ''
}: ArticuloSelectorProps) {
  
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [articulos, setArticulos] = useState<ArticuloVentaDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizarTasaItbis = (tax: number | null | undefined): number => {
    if (tax == null || isNaN(tax)) return 0;
    return tax > 1 ? tax / 100 : tax;
  };

  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        if (searchTerm.trim()) {
          const { data } = await articuloApi.searchForSales(searchTerm, idEmpresa);
          setArticulos(data);
        } else {
          const { data } = await articuloApi.searchForSales('', idEmpresa);
          setArticulos(data.slice(0, 50));
        }
      } catch (err: any) {
        console.error('Error al buscar artículos:', err);
        if (!searchTerm.trim()) {
          try {
            const { data } = await articuloApi.getAll(idEmpresa);
            setArticulos(data.slice(0, 50) as unknown as ArticuloVentaDto[]);
          } catch {
            setError('No se pudieron cargar los productos');
            setArticulos([]);
          }
        } else {
          setError('No se pudieron cargar los productos');
          setArticulos([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm, idEmpresa, isOpen]);

  const handleSelect = (articulo: ArticuloVentaDto) => {
    onSelect(articulo);
    onClose();
    setSearchTerm('');
    setArticulos([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter' && articulos.length > 0 && !loading) {
      handleSelect(articulos[0]);
    }
  };

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatMoney = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0.00';
    return new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="articulo-selector-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compacto */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-yellow-50 rounded-t-xl">
          <h2 id="articulo-selector-title" className="text-sm font-bold text-emerald-800 flex items-center gap-1">
            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
            Seleccionar Producto / Servicio
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-md transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Barra de búsqueda compacta */}
        <div className="p-2 border-b border-gray-100">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por código, nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              aria-label="Buscar producto"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Limpiar búsqueda"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
            <span>
              {loading 
                ? 'Buscando...' 
                : `${articulos.length} producto${articulos.length !== 1 ? 's' : ''} encontrado${articulos.length !== 1 ? 's' : ''}`
              }
            </span>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Ver todos
              </button>
            )}
          </div>
        </div>

        {/* Lista de resultados compacta */}
        <div className="flex-1 overflow-y-auto p-1">
          {error && (
            <div className="p-2 text-center text-red-600 bg-red-50 rounded-lg text-xs m-1">{error}</div>
          )}
          
          {loading && articulos.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="animate-spin w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              <span className="text-xs">Buscando productos...</span>
            </div>
          ) : articulos.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-xs font-medium">
                {searchTerm ? `No se encontró "${searchTerm}"` : 'No hay productos registrados'}
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {articulos.map((art) => {
                const tasaItbis = normalizarTasaItbis(art.gravado);
                return (
                  <li key={art.idArticulo}>
                    <button
                      onClick={() => handleSelect(art)}
                      className="w-full text-left p-2 rounded-lg hover:bg-orange-50 border border-transparent hover:border-emerald-100 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <h3 className="font-semibold text-xs text-gray-900 truncate group-hover:text-emerald-700">
                              {art.artículo}
                            </h3>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-mono rounded">
                              {art.código}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500 mt-0.5">
                            {art.exist != null && (
                              <span className="flex items-center gap-0.5">📦 {Number(art.exist).toFixed(2)}</span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                              tasaItbis > 0 
                                ? 'bg-blue-100 text-blue-700' 
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              ITBIS: {(tasaItbis * 100).toFixed(0)}%
                            </span>
                            {art.mayor && (
                              <span className="text-gray-400">📏 {art.mayor}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold text-emerald-700 font-mono">
                            {formatMoney(art.precio)}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer compacto */}
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}