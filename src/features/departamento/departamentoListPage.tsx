import { useState, useEffect, useMemo } from 'react';
import { departamentoApi, type DepartamentoDto, type DepartamentoCreateDto, type DepartamentoUpdateDto } from '../../api/departamento.api';
import { useAuthStore } from '../../store/authStore';

export default function DepartamentoListPage() {
  const { user } = useAuthStore();
  
  const [allDepartamentos, setAllDepartamentos] = useState<DepartamentoDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<DepartamentoDto | null>(null);
  
  const [form, setForm] = useState<{ nombre: string; descripcion: string }>({
    nombre: '',
    descripcion: '',
  });

  const idEmpresa = user?.idempresa ?? 1;

  useEffect(() => {
    const loadDepartamentos = async () => {
      setLoading(true);
      try {
        const { data } = await departamentoApi.getAll(idEmpresa);
        setAllDepartamentos(data);
      } catch (err: any) {
        console.error('❌ Error al cargar centros de costos:', err);
        setError('No se pudieron cargar los centros de costos');
      } finally {
        setLoading(false);
      }
    };
    loadDepartamentos();
  }, [idEmpresa]);

  const departamentosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return allDepartamentos;
    const term = searchTerm.toLowerCase();
    return allDepartamentos.filter(d => 
      d.nombre.toLowerCase().includes(term) ||
      d.descripcion?.toLowerCase().includes(term)
    );
  }, [searchTerm, allDepartamentos]);

  const openModal = (departamento?: DepartamentoDto) => {
    if (departamento) {
      setEditingDepartamento(departamento);
      setForm({
        nombre: departamento.nombre,
        descripcion: departamento.descripcion || '',
      });
    } else {
      setEditingDepartamento(null);
      setForm({ nombre: '', descripcion: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (editingDepartamento) {
        const updateDto: DepartamentoUpdateDto = {
          nombre: form.nombre,
          descripcion: form.descripcion,
        };
        await departamentoApi.update(editingDepartamento.iddepartamento, updateDto);
      } else {
        const createDto: DepartamentoCreateDto = {
          nombre: form.nombre,
          descripcion: form.descripcion,
        };
        await departamentoApi.create(createDto, idEmpresa);
      }
      setShowModal(false);
      const { data } = await departamentoApi.getAll(idEmpresa);
      setAllDepartamentos(data);
    } catch (err: any) {
      console.error('❌ Error al guardar:', err);
      setError(err.response?.data?.message || 'Error al guardar el centro de costos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idDepartamento: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar el centro de costos "${nombre}"?`)) return;
    setLoading(true);
    try {
      await departamentoApi.delete(idDepartamento);
      const { data } = await departamentoApi.getAll(idEmpresa);
      setAllDepartamentos(data);
    } catch (err: any) {
      console.error('❌ Error al eliminar:', err);
      setError(err.response?.data?.message || 'Error al eliminar el centro de costos');
    } finally {
      setLoading(false);
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
                🏢 Centros de Costos
              </h1>
              <p className="text-emerald-100 text-[11px]">Gestiona los departamentos para asignación de costos</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1"
            >
              ➕ Nuevo Centro de Costos
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
                  placeholder="Buscar por nombre o descripción..."
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
                {departamentosFiltrados.length} de {allDepartamentos.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla compacta */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Cargando centros de costos...</div>
          ) : departamentosFiltrados.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-xs text-gray-500">
                {searchTerm ? `No se encontró "${searchTerm}"` : 'No hay centros de costos registrados'}
              </p>
              {!searchTerm && (
                <button onClick={() => openModal()} className="mt-2 text-orange-600 hover:text-orange-700 text-xs font-medium">
                  + Crear primer centro de costos
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Centro de Costos</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Descripción</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {departamentosFiltrados.map((dep) => (
                    <tr key={dep.iddepartamento} className="hover:bg-orange-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-xs text-gray-800">{dep.nombre}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">{dep.descripcion || '-'}</td>
                      <td className="px-3 py-2 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => openModal(dep)}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-blue-50"
                          title="Editar"
                        >
                          ✏️ Modificar
                        </button>
                        <button
                          onClick={() => handleDelete(dep.iddepartamento, dep.nombre)}
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

        {/* Modal compacto con estilo Emma */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2 rounded-t-xl border-b border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                  <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                  {editingDepartamento ? 'Editar Centro de Costos' : 'Nuevo Centro de Costos'}
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
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    placeholder="Ej. Administración, Ventas, Producción..."
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
                    placeholder="Descripción opcional del centro de costos..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-2.5 py-1 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:opacity-50 transition"
                  >
                    {loading ? 'Guardando...' : editingDepartamento ? 'Actualizar' : 'Crear'}
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