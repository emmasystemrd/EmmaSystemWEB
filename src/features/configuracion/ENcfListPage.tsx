import { useState, useEffect, type FormEvent, type ChangeEvent, type FocusEvent } from 'react';
import { encfApi, type ENcfDto } from '../../api/encf.api';

const initialForm: ENcfDto = {
  tipo: '31',
  desde: 1,
  hasta: 1000000,
  secuencia: '1',
  aviso: 80,
  vencimiento: '',
};

// Tipos que NO requieren vencimiento según tu SP
const TIPOS_SIN_VENCIMIENTO = ['02', '04', '32', '34'];

// ═══ Mapa de nombres descriptivos para cada tipo de comprobante
const TIPOS_COMPROBANTE: Record<string, string> = {
  '01': 'Crédito Fiscal',
  '02': 'Consumo',
  '03': 'Nota de Débito',
  '04': 'Nota de Crédito',
  '11': 'Comprobante de Compras',
  '12': 'Registro Único de Ingresos',
  '13': 'Gasto Menor',
  '14': 'Régimen Especial',
  '15': 'Gubernamental',
  '16': 'Exportación',
  '17': 'Pagos al Exterior',
  '31': 'Crédito Fiscal Electrónico',
  '32': 'Consumo Electrónico',
  '33': 'Nota de Débito Electrónico',
  '34': 'Nota de Crédito Electrónico',
  '41': 'Compra Electrónico',
  '43': 'Gastos Menor Electrónico',
  '44': 'Régimen Especial Electrónico',
  '45': 'Gubernamental Electrónico',
  '46': 'Exportación Electrónico',
  '47': 'Pagos al Exterior Electrónico',
};

// ═══ Función para determinar si un tipo es electrónico
const esElectronico = (tipo: string): boolean => {
  return tipo.startsWith('3') || tipo.startsWith('4');
};

// ═══ Función para formatear secuencia con ceros a la izquierda
const formatearSecuencia = (secuencia: string, tipo: string): string => {
  const longitud = esElectronico(tipo) ? 10 : 8;
  const num = secuencia.replace(/\D/g, ''); // Solo dígitos
  if (!num) return ''; // Si está vacío, no formatear
  return num.padStart(longitud, '0');
};

export default function ENcfListPage() {
  const [lista, setLista] = useState<ENcfDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ENcfDto>(initialForm);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const { data } = await encfApi.getAll();
      setLista(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // ═══ MODIFICADO: handleChange ya NO formatea la secuencia al escribir
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const nuevoEstado = { ...prev, [name]: value };
      
      // Si cambia el tipo, formatear la secuencia según el nuevo tipo (esto sí al cambiar)
      if (name === 'tipo') {
        nuevoEstado.secuencia = formatearSecuencia(prev.secuencia, value);
        
        // Si cambia a un tipo que no lleva vencimiento, lo limpiamos
        if (TIPOS_SIN_VENCIMIENTO.includes(value)) {
          nuevoEstado.vencimiento = null;
        }
      }
      
      // ⚠️ Si cambia la secuencia, NO formatear (solo guardar el valor tal cual)
      // El formateo se hará en el onBlur
      
      return nuevoEstado;
    });
  };

  // ═══ NUEVO: Handler para formatear la secuencia al perder el focus
  const handleSecuenciaBlur = (e: FocusEvent<HTMLInputElement>) => {
    const valorFormateado = formatearSecuencia(e.target.value, formData.tipo);
    setFormData(prev => ({ ...prev, secuencia: valorFormateado }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing && formData.ideNCF) {
        await encfApi.update(formData.ideNCF, formData);
      } else {
        await encfApi.create(formData);
      }
      setShowModal(false);
      setFormData(initialForm);
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: ENcfDto) => {
    setFormData({
      ...item,
      vencimiento: item.vencimiento ? item.vencimiento.split('T')[0] : null
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar esta secuencia?')) return;
    try {
      await encfApi.delete(id);
      cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const formatFecha = (fecha?: string | null) => 
    fecha ? new Date(fecha).toLocaleDateString('es-DO') : 'N/A';

  const getNombreTipo = (tipo: string): string => {
    return TIPOS_COMPROBANTE[tipo] || `Tipo ${tipo}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-emerald-800">Gestión de Secuencias eNCF</h1>
        <button
          onClick={() => { setFormData(initialForm); setIsEditing(false); setShowModal(true); }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-bold"
        >
          ➕ Nueva Secuencia
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">⚠️ {error}</div>}

      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-right">Desde</th>
              <th className="px-4 py-3 text-right">Hasta</th>
              <th className="px-4 py-3 text-left">Secuencia Actual</th>
              <th className="px-4 py-3 text-right">Aviso</th>
              <th className="px-4 py-3 text-left">Vencimiento</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">Cargando...</td></tr>
            ) : lista.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">No hay secuencias registradas</td></tr>
            ) : (
              lista.map(item => (
                <tr key={item.ideNCF} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-emerald-700">{item.tipo}</div>
                    <div className="text-xs text-gray-600">{getNombreTipo(item.tipo)}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{item.desde.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-mono">{item.hasta.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono">
  <span 
    className={`inline-block px-1.5 py-0.5 mr-1 rounded text-[10px] font-bold ${
      esElectronico(item.tipo) 
        ? 'bg-blue-100 text-blue-700' 
        : 'bg-emerald-100 text-emerald-700'
    }`}
  >
    {esElectronico(item.tipo) ? 'E' : 'B'}
  </span>
  <span className="text-gray-500">{item.tipo}</span>
  <span className="font-bold text-gray-900">{item.secuencia}</span>
</td>
                  <td className="px-4 py-3 text-right">{item.aviso}</td>
                  <td className="px-4 py-3">{formatFecha(item.vencimiento)}</td>
                  <td className="px-4 py-3 text-center space-x-2">
                    <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-800" title="Editar">✏️</button>
                    <button onClick={() => item.ideNCF && handleDelete(item.ideNCF)} className="text-red-600 hover:text-red-800" title="Eliminar">🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ═══ MODAL DE FORMULARIO ═══ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {isEditing ? 'Editar Secuencia eNCF' : 'Nueva Secuencia eNCF'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Tipo de Comprobante *</label>
                <select name="tipo" value={formData.tipo} onChange={handleChange} required className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-1 focus:ring-emerald-500">
                  <option value="31">31 - Crédito Fiscal Electrónico</option>
                  <option value="32">32 - Consumo Electrónico</option>
                  <option value="33">33 - Nota de Débito Electrónico</option>
                  <option value="34">34 - Nota de Crédito Electrónico</option>
                  <option value="41">41 - Compra Electrónico</option>
                  <option value="43">43 - Gastos Menor Electrónico</option>
                  <option value="44">44 - Régimen Especial Electrónico</option>
                  <option value="45">45 - Gubernamental Electrónico</option>
                  <option value="46">46 - Exportación Electrónico</option>
                  <option value="47">47 - Pagos al Exterior Electrónico</option>
                  <option value="01">01 - Crédito Fiscal (Impreso)</option>
                  <option value="02">02 - Consumo (Impreso)</option>
                  <option value="12">12 - Registro Único de Ingresos (Impreso)</option>
                  <option value="13">13 - Gasto Menor (Impreso)</option>
                  <option value="14">14 - Régimen Especial (Impreso)</option>
                  <option value="15">15 - Gubernamental (Impreso)</option>
                  <option value="16">16 - Exportación (Impreso)</option>
                  <option value="17">17 - Pagos al Exterior (Impreso)</option>
                </select>
                {TIPOS_SIN_VENCIMIENTO.includes(formData.tipo) && (
                  <p className="text-[10px] text-amber-600 mt-1">⚠️ Este tipo de comprobante no requiere fecha de vencimiento.</p>
                )}
                <p className="text-[10px] text-blue-600 mt-1">
                  ℹ️ Secuencia de {esElectronico(formData.tipo) ? '10' : '8'} dígitos
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Desde *</label>
                  <input type="number" name="desde" value={formData.desde} onChange={handleChange} required className="w-full px-3 py-2 text-sm border rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Hasta *</label>
                  <input type="number" name="hasta" value={formData.hasta} onChange={handleChange} required className="w-full px-3 py-2 text-sm border rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Secuencia Actual * ({esElectronico(formData.tipo) ? '10' : '8'} dígitos)
                </label>
                <input 
                  type="text" 
                  name="secuencia" 
                  value={formData.secuencia} 
                  onChange={handleChange}
                  onBlur={handleSecuenciaBlur}
                  required 
                  maxLength={esElectronico(formData.tipo) ? 10 : 8}
                  className="w-full px-3 py-2 text-sm border rounded-lg font-mono" 
                  placeholder={esElectronico(formData.tipo) ? "Ej: 1" : "Ej: 1"}
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  💡 Escribe el número y al salir del campo se rellenará con ceros automáticamente
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Aviso (Cuando falten) *</label>
                <input type="number" name="aviso" value={formData.aviso} onChange={handleChange} required min="1" max="100" className="w-full px-3 py-2 text-sm border rounded-lg" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Vencimiento {TIPOS_SIN_VENCIMIENTO.includes(formData.tipo) ? '(No aplica)' : '*'}
                </label>
                <input 
                  type="date" 
                  name="vencimiento" 
                  value={formData.vencimiento || ''} 
                  onChange={handleChange} 
                  required={!TIPOS_SIN_VENCIMIENTO.includes(formData.tipo)}
                  disabled={TIPOS_SIN_VENCIMIENTO.includes(formData.tipo)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${TIPOS_SIN_VENCIMIENTO.includes(formData.tipo) ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}