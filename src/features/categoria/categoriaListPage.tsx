import { useState, useEffect, useMemo } from 'react';
import { categoriaApi, type CategoriaDto, type CategoriaSaveDto } from '../../api/categoria.api';
import { useAuthStore } from '../../store/authStore';

export default function CategoriaListPage() {
  const { user } = useAuthStore();
  
  const [allCategorias, setAllCategorias] = useState<CategoriaDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaDto | null>(null);
  
  const [form, setForm] = useState<CategoriaSaveDto>({
    nombre: '',
    descripcion: '',
    tipo: 'A',
  });

  const idEmpresa = user?.idempresa ?? 1;

  useEffect(() => {
    const loadCategorias = async () => {
      setLoading(true);
      try {
        const { data } = await categoriaApi.getAll(idEmpresa);
        setAllCategorias(data);
      } catch (err: any) {
        console.error('❌ Error al cargar categorías:', err);
        setError('No se pudieron cargar las categorías');
      } finally {
        setLoading(false);
      }
    };
    loadCategorias();
  }, [idEmpresa]);

  const categoriasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return allCategorias;
    const term = searchTerm.toLowerCase();
    return allCategorias.filter(c => 
      c.nombre.toLowerCase().includes(term) ||
      c.descripcion?.toLowerCase().includes(term) ||
      c.tipo.toLowerCase().includes(term)
    );
  }, [searchTerm, allCategorias]);

  const openModal = (categoria?: CategoriaDto) => {
    if (categoria) {
      setEditingCategoria(categoria);
      setForm({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        tipo: categoria.tipo,
      });
    } else {
      setEditingCategoria(null);
      setForm({ nombre: '', descripcion: '', tipo: 'A' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategoria) {
        await categoriaApi.update(editingCategoria.idcategoria, form);
      } else {
        await categoriaApi.create(form, idEmpresa);
      }
      setShowModal(false);
      const { data } = await categoriaApi.getAll(idEmpresa);
      setAllCategorias(data);
    } catch (err: any) {
      console.error('❌ Error al guardar:', err);
      setError(err.response?.data?.message || 'Error al guardar la categoría');
    }
  };

  const handleDelete = async (idCategoria: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) return;
    try {
      await categoriaApi.delete(idCategoria);
      const { data } = await categoriaApi.getAll(idEmpresa);
      setAllCategorias(data);
    } catch (err: any) {
      console.error('❌ Error al eliminar:', err);
      setError(err.response?.data?.message || 'Error al eliminar la categoría');
    }
  };

  const TipoBadge = ({ tipo }: { tipo: string }) => {
    const colors: Record<string, string> = {
      'A': 'bg-emerald-100 text-emerald-800',
      'S': 'bg-orange-100 text-orange-800',
      'P': 'bg-amber-100 text-amber-800',
    };
    const labels: Record<string, string> = {
      'A': 'Ambos',
      'S': 'Servicio',
      'P': 'Producto',
    };
    return (
      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${colors[tipo] || 'bg-gray-100 text-gray-800'}`}>
        {labels[tipo] || tipo}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-1">
                📁 Categorías
              </h1>
              <p className="text-emerald-100 text-[11px]">Gestiona las categorías de artículos y servicios</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1"
            >
              ➕ Nueva Categoría
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
                  placeholder="Buscar por nombre, descripción o tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">{categoriasFiltradas.length} de {allCategorias.length}</span>
            </div>
          </div>
        </div>

        {/* Tabla compacta */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Cargando categorías...</div>
          ) : categoriasFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-xs text-gray-500">
                {searchTerm ? `No se encontró "${searchTerm}"` : 'No hay categorías registradas'}
              </p>
              {!searchTerm && (
                <button onClick={() => openModal()} className="mt-2 text-orange-600 hover:text-orange-700 text-xs font-medium">
                  + Crear primera categoría
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Nombre</th>
                    
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Descripción</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categoriasFiltradas.map((cat) => (
                    <tr key={cat.idcategoria} className="hover:bg-orange-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-xs text-gray-800">{cat.nombre}</td>
                      
                      <td className="px-3 py-2"><TipoBadge tipo={cat.tipo} /></td>
                      <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">{cat.descripcion || '-'}</td>
                      <td className="px-3 py-2 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openModal(cat)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-blue-50"
                          title="Modificar"
                        >
                          ✏️ Modificar
                        </button>
                        <button
                          onClick={() => handleDelete(cat.idcategoria, cat.nombre)}
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

        {/* Modal compacto con colores Emma */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2 rounded-t-xl border-b border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                  <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                  {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="Ej. Electrónica, Ropa, Consultoría..."
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Descripción</label>
                  <textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                    placeholder="Descripción opcional de la categoría..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Tipo *</label>
                  <select
                    value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="A">Ambos</option>
                    <option value="S">Servicio</option>
                    <option value="P">Producto</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition"
                  >
                    {editingCategoria ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}