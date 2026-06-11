import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { terminoApi, type TerminoSaveDto } from '../../api/termino.api';
import { useAuthStore } from '../../store/authStore';

export default function TerminoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const toPercentage = (value: number | null | undefined): number => {
    if (value == null) return 0;
    return parseFloat((value * 100).toFixed(4));
  };

  const toDecimal = (percent: number): number => {
    return parseFloat((percent / 100).toFixed(6));
  };
  
  const [form, setForm] = useState<TerminoSaveDto>({
    nombre: '',
    tipo: 'C',
    tiempo: 0,
    tasa: 0,
    no_Pagos: 1,
    dias_desc: 0,
    p_descuento: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const idEmpresa = user?.idempresa ?? 1;
  const esEdicion = !!id;

  useEffect(() => {
    if (esEdicion && id) {
      const loadTermino = async () => {
        setLoading(true);
        try {
          const { data } = await terminoApi.getById(parseInt(id), idEmpresa);
          setForm({
            nombre: data.nombre || '',
            tipo: data.tipo || 'C',
            tiempo: data.tiempo ?? 0,
            tasa: toPercentage(data.tasa),
            no_Pagos: data.no_Pagos ?? 1,
            dias_desc: data.dias_desc ?? 0,
            p_descuento: toPercentage(data.p_descuento)
          });
        } catch (err: any) {
          console.error('Error al cargar término:', err);
          setError('No se pudieron cargar los datos');
        } finally {
          setLoading(false);
        }
      };
      loadTermino();
    }
  }, [id, esEdicion, idEmpresa]);

  const handleNumberChange = (field: keyof TerminoSaveDto, value: string, min: number = 0) => {
    const num = parseFloat(value);
    setForm(prev => ({
      ...prev,
      [field]: isNaN(num) || num < min ? min : num
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload: TerminoSaveDto = {
        nombre: form.nombre.trim(),
        tipo: form.tipo,
        tiempo: form.tiempo ?? 0,
        tasa: toDecimal(form.tasa),
        no_Pagos: form.no_Pagos ?? 1,
        dias_desc: form.dias_desc ?? 0,
        p_descuento: toDecimal(form.p_descuento)
      };

      if (esEdicion && id) {
        await terminoApi.update(parseInt(id), payload);
      } else {
        await terminoApi.create(payload, idEmpresa);
      }
      alert('✅ Término guardado correctamente');
      navigate('/terminos');
    } catch (err: any) {
      console.error('❌ Error al guardar:', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.errors;
      setError(serverMsg || 'Error al guardar el término. Verifica los campos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-1">
                💰 {esEdicion ? 'Editar Término' : 'Nuevo Término de Pago'}
              </h1>
              <p className="text-emerald-100 text-[11px]">Define las condiciones de pago</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/terminos')}
                className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-white rounded-lg hover:bg-gray-50 transition shadow"
              >
                Cancelar
              </button>
              <button
                form="termino-form"
                type="submit"
                disabled={loading}
                className="px-2.5 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>

        {/* Error compacto */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-2 text-xs text-red-700 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Formulario compacto */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <form id="termino-form" onSubmit={handleSubmit} className="p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Nombre *</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                  placeholder="Ej. Crédito 30 Días"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Tipo *</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value="C">Crédito</option>
                  <option value="P">Plazo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Tiempo (Días)</label>
                <input
                  type="number"
                  min="0"
                  value={form.tiempo}
                  onChange={(e) => handleNumberChange('tiempo', e.target.value, 0)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Tasa Interés (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.tasa}
                  onChange={(e) => handleNumberChange('tasa', e.target.value, 0)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Ej. 2.7"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">No. Pagos</label>
                <input
                  type="number"
                  min="1"
                  value={form.no_Pagos}
                  onChange={(e) => handleNumberChange('no_Pagos', e.target.value, 1)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Días Descuento</label>
                <input
                  type="number"
                  min="0"
                  value={form.dias_desc}
                  onChange={(e) => handleNumberChange('dias_desc', e.target.value, 0)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">% Descuento Pronto Pago</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.p_descuento}
                  onChange={(e) => handleNumberChange('p_descuento', e.target.value, 0)}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Ej. 5"
                />
              </div>
              <div className="flex items-center">
                <div className="w-full bg-gradient-to-r from-emerald-50 to-yellow-50 p-2 rounded-lg border border-emerald-100">
                  <p className="text-[10px] font-semibold text-emerald-800 mb-0.5">Resumen</p>
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-700">
                    <span>Tipo:</span>
                    <span className="font-semibold">{form.tipo === 'C' ? 'Crédito' : 'Plazo'}</span>
                    <span>Tasa:</span>
                    <span className="font-semibold">{form.tasa}%</span>
                    <span>Desc. PP:</span>
                    <span className="font-semibold">{form.p_descuento}%</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}