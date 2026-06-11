import { useState, useEffect, type FormEvent } from 'react';
import { type MedidaDto, type MedidaSaveDto } from '../../api/medida.api';

interface MedidaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MedidaSaveDto) => Promise<void>;
  initialData?: MedidaDto | null;
  loading?: boolean;
}

export default function MedidaFormModal({ 
  isOpen, onClose, onSubmit, initialData, loading = false 
}: MedidaFormModalProps) {
  
  const [form, setForm] = useState<MedidaSaveDto>({
    mayor: '',
    detalle: '',
    contenido: 1,
    descripcion: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        mayor: initialData.mayor,
        detalle: initialData.detalle,
        contenido: initialData.contenido,
        descripcion: initialData.descripcion || '',
      });
    } else {
      setForm({ mayor: '', detalle: '', contenido: 1, descripcion: '' });
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
      aria-labelledby="medida-modal-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-md w-full" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header compacto con gradiente Emma */}
        <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2 rounded-t-xl border-b border-emerald-100">
          <h3 id="medida-modal-title" className="text-sm font-bold text-emerald-800 flex items-center gap-1">
            <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
            {initialData ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
              Unidad Principal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.mayor}
              onChange={(e) => setForm({ ...form, mayor: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
              placeholder="Ej. Litro, Kilogramo, Metro..."
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
                Abreviatura <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.detalle}
                onChange={(e) => setForm({ ...form, detalle: e.target.value })}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Ej. L, kg, m"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
                Contenido <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="1"
                value={form.contenido}
                onChange={(e) => setForm({ ...form, contenido: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="1000, 0.5"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={2}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
              placeholder="Descripción opcional..."
            />
          </div>

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