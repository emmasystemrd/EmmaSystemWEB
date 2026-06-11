import { useState, useEffect, type FormEvent } from 'react';
import { type CategoriaDto, type CategoriaSaveDto } from '../../api/categoria.api';

interface CategoriaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoriaSaveDto) => Promise<void>;
  initialData?: CategoriaDto | null;
  loading?: boolean;
}

export default function CategoriaFormModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData, 
  loading = false 
}: CategoriaFormModalProps) {
  
  const [form, setForm] = useState<CategoriaSaveDto>({
    nombre: '',
    descripcion: '',
    tipo: 'A',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        nombre: initialData.nombre,
        descripcion: initialData.descripcion || '',
        tipo: initialData.tipo,
      });
    } else {
      setForm({ nombre: '', descripcion: '', tipo: 'A' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compacto con gradiente Emma */}
        <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2 rounded-t-xl border-b border-emerald-100">
          <h3 id="modal-title" className="text-sm font-bold text-emerald-800 flex items-center gap-1">
            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
            {initialData ? 'Editar Categoría' : 'Nueva Categoría'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Campo Nombre */}
          <div>
            <label htmlFor="categoria-nombre" className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              id="categoria-nombre"
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Ej. Electrónica, Ropa, Consultoría..."
              autoFocus
            />
          </div>
          
          {/* Campo Descripción */}
          <div>
            <label htmlFor="categoria-descripcion" className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
              Descripción
            </label>
            <textarea
              id="categoria-descripcion"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
              placeholder="Descripción opcional de la categoría..."
            />
          </div>
          
          {/* Campo Tipo */}
          <div>
            <label htmlFor="categoria-tipo" className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              id="categoria-tipo"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value="A">Ambos</option>
              <option value="S">Servicio</option>
              <option value="P">Producto</option>
            </select>
          </div>

          {/* Botones de acción compactos */}
          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-2.5 py-1 text-xs font-medium text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:opacity-50 transition flex items-center gap-1"
            >
              {loading && (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}