import { useState, useEffect, useMemo } from 'react';
import { medidaApi, type MedidaDto, type MedidaSaveDto } from '../../api/medida.api';
import { useAuthStore } from '../../store/authStore';

export default function MedidaListPage() {
  const { user } = useAuthStore();
  
  const [allMedidas, setAllMedidas] = useState<MedidaDto[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedida, setEditingMedida] = useState<MedidaDto | null>(null);
  
  const [form, setForm] = useState<MedidaSaveDto>({
    mayor: '', detalle: '', contenido: 1, descripcion: '',
  });

  const idEmpresa = user?.idempresa ?? 1;

  useEffect(() => {
    const loadMedidas = async () => {
      setLoading(true);
      try {
        const { data } = await medidaApi.getAll(idEmpresa);
        setAllMedidas(data);
      } catch (err: any) {
        console.error('❌ Error al cargar medidas:', err);
        setError('No se pudieron cargar las unidades de medida');
      } finally {
        setLoading(false);
      }
    };
    loadMedidas();
  }, [idEmpresa]);

  const medidasFiltradas = useMemo(() => {
    if (!searchTerm.trim()) return allMedidas;
    const term = searchTerm.toLowerCase();
    return allMedidas.filter(m => 
      m.mayor.toLowerCase().includes(term) ||
      m.detalle.toLowerCase().includes(term) ||
      m.descripcion?.toLowerCase().includes(term) ||
      m.contenido.toString().includes(term)
    );
  }, [searchTerm, allMedidas]);

  const openModal = (medida?: MedidaDto) => {
    if (medida) {
      setEditingMedida(medida);
      setForm({
        mayor: medida.mayor,
        detalle: medida.detalle,
        contenido: medida.contenido,
        descripcion: medida.descripcion || '',
      });
    } else {
      setEditingMedida(null);
      setForm({ mayor: '', detalle: '', contenido: 1, descripcion: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMedida) {
        await medidaApi.update(editingMedida.idmedida, form);
      } else {
        await medidaApi.create(form, idEmpresa);
      }
      setShowModal(false);
      const { data } = await medidaApi.getAll(idEmpresa);
      setAllMedidas(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (idMedida: number, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await medidaApi.delete(idMedida);
      const { data } = await medidaApi.getAll(idEmpresa);
      setAllMedidas(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const formatContenido = (v: number) => Number.isInteger(v) ? v.toString() : v.toFixed(2).replace(/\.?0+$/, '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-1">
                📏 Unidades de Medida
              </h1>
              <p className="text-emerald-100 text-[11px]">Gestiona las unidades para artículos y servicios</p>
            </div>
            <button
              onClick={() => openModal()}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1"
            >
              ➕ Nueva Unidad
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
                  placeholder="Buscar unidad, abreviatura, descripción..."
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
              <span className="text-[11px] text-gray-500 whitespace-nowrap">
                {medidasFiltradas.length} de {allMedidas.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla compacta */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Cargando unidades...</div>
          ) : medidasFiltradas.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              {searchTerm ? `No se encontró "${searchTerm}"` : 'No hay unidades registradas'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Unidad</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Abreviatura</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800">Contenido</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-emerald-800 hidden md:table-cell">Descripción</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-emerald-800">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {medidasFiltradas.map((med) => (
                    <tr key={med.idmedida} className="hover:bg-orange-50 transition-colors">
                      <td className="px-3 py-2 font-medium text-xs text-gray-800">{med.mayor}</td>
                      <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">{med.detalle}</span></td>
                      <td className="px-3 py-2 text-xs text-gray-700 font-mono">{formatContenido(med.contenido)}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 truncate hidden md:table-cell">{med.descripcion || '-'}</td>
                      <td className="px-3 py-2 text-right space-x-1.5 whitespace-nowrap">
                        <button onClick={() => openModal(med)} className="text-blue-600 hover:text-blue-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-blue-50">✏️ Modificar</button>
                        <button onClick={() => handleDelete(med.idmedida, med.mayor)} className="text-red-600 hover:text-red-800 text-xs font-medium px-1.5 py-0.5 rounded hover:bg-red-50">🗑️ Eliminar</button>
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
                  {editingMedida ? 'Editar Unidad' : 'Nueva Unidad'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Unidad Principal *</label>
                  <input type="text" required value={form.mayor} onChange={(e) => setForm({ ...form, mayor: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Abreviatura *</label>
                    <input type="text" required value={form.detalle} onChange={(e) => setForm({ ...form, detalle: e.target.value })} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Ej. L, kg" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Contenido *</label>
                    <input type="number" required min="1" step="any" value={form.contenido} onChange={(e) => { const v = e.target.value; setForm({ ...form, contenido: v === '' ? 0 : parseFloat(v) || 0 }); }} onBlur={(e) => { if (parseFloat(e.target.value) < 1) setForm({ ...form, contenido: 1 }); }} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Descripción</label>
                  <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} rows={2} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none resize-none" />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setShowModal(false)} className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition">Cancelar</button>
                  <button type="submit" className="px-2.5 py-1 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 transition">{editingMedida ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}