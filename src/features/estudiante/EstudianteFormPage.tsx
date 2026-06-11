import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { estudianteApi, type EstudianteSaveDto } from '../../api/estudiante.api';

const initialForm: EstudianteSaveDto = {
  codigo: '', nombres: '', apellido1: '', apellido2: '', sexo: 'M',
  foto: null, tipo_Doc: 1, num_Documento: '', lugar_Nacimiento: '',
  telefono: '', celular: '', nacionalidad: 1, fecha_Nacimiento: '',
  tipo_Sangre: '', email: '', direccion: '', provincia: null,
  municipio: null, sector: null, alergico: 'Ninguna', medicamentos_que_usa: 'Ninguno',
  idcliente: null, parentesco: 1, estado: 'A'
};

export default function EstudianteFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<EstudianteSaveDto>(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fotoPreview, setFotoPreview] = useState<string>('');

  // Cargar datos si es edición
  useEffect(() => {
    if (!isEditing) return;

    const cargarEstudiante = async () => {
      setLoading(true);
      try {
        const { data } = await estudianteApi.getById(parseInt(id!));
        setForm({
          ...data,
          fecha_Nacimiento: data.fecha_Nacimiento ? String(data.fecha_Nacimiento).split('T')[0] : ''
        });
        
        if (data.tieneFoto) {
          const res = await estudianteApi.getFoto(parseInt(id!));
          setFotoPreview(`data:image/jpeg;base64,${res.data.foto}`);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar');
      } finally {
        setLoading(false);
      }
    };
    cargarEstudiante();
  }, [id, isEditing]);

  // ═══ Handlers ═══
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ['tipo_Doc', 'nacionalidad', 'provincia', 'municipio', 'sector', 'idcliente', 'parentesco'].includes(name)
        ? (value === '' ? null : parseInt(value))
        : value
    }));
  };

  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFotoPreview(base64String);
      // Extraer solo la parte base64 sin el prefijo "data:image/..."
      setForm(prev => ({ ...prev, foto: base64String.split(',')[1] }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!form.nombres.trim() || !form.apellido1.trim()) throw new Error('Nombres y Apellido son obligatorios');

      if (isEditing) {
        await estudianteApi.update(parseInt(id!), form);
        setSuccess('✅ Estudiante actualizado correctamente');
      } else {
        await estudianteApi.create(form);
        setSuccess('✅ Estudiante registrado correctamente');
      }
      setTimeout(() => navigate('/educacion/estudiantes'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500"><div className="animate-spin text-3xl inline-block mb-2">⏳</div><br/>Cargando...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-3">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">{isEditing ? '✏️ Editar Estudiante' : '➕ Nuevo Estudiante'}</h1>
              <p className="text-emerald-100 text-xs">{isEditing ? 'Modifica los datos del estudiante' : 'Registra un nuevo estudiante en el sistema'}</p>
            </div>
            <button onClick={() => navigate('/educacion/estudiantes')} className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 shadow">← Volver</button>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs text-center">⚠️ {error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs text-center animate-bounce">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sección 1: Datos Personales y Foto */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-emerald-800 pb-2 border-b mb-4">👤 Datos Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Foto */}
              <div className="md:col-span-1 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden mb-2">
                  {fotoPreview ? <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" /> : <span className="text-gray-400 text-xs text-center">Sin foto</span>}
                </div>
                <label className="cursor-pointer px-3 py-1.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-100 border border-emerald-200">
                  📷 Subir Foto
                  <input type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
                </label>
              </div>

              {/* Campos */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Nombres <span className="text-red-500">*</span></label>
                  <input type="text" name="nombres" value={form.nombres} onChange={handleChange} required className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Primer Apellido <span className="text-red-500">*</span></label>
                  <input type="text" name="apellido1" value={form.apellido1} onChange={handleChange} required className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Segundo Apellido</label>
                  <input type="text" name="apellido2" value={form.apellido2} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Sexo</label>
                  <select name="sexo" value={form.sexo} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Fecha de Nacimiento</label>
                  <input type="date" name="fecha_Nacimiento" value={form.fecha_Nacimiento || ''} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Tipo de Sangre</label>
                  <select name="tipo_Sangre" value={form.tipo_Sangre} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                    <option value="">Seleccionar</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Documento y Contacto */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-emerald-800 pb-2 border-b mb-4">📄 Documento y Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Tipo Documento</label>
                <select name="tipo_Doc" value={form.tipo_Doc} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                  <option value={1}>Cédula</option>
                  <option value={2}>Pasaporte</option>
                  <option value={3}>Acta de Nacimiento</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Número de Documento</label>
                <input type="text" name="num_Documento" value={form.num_Documento} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Lugar de Nacimiento</label>
                <input type="text" name="lugar_Nacimiento" value={form.lugar_Nacimiento} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Teléfono</label>
                <input type="text" name="telefono" value={form.telefono} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Celular</label>
                <input type="text" name="celular" value={form.celular} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Dirección</label>
                <input type="text" name="direccion" value={form.direccion} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>

          {/* Sección 3: Salud y Tutor */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-emerald-800 pb-2 border-b mb-4">🏥 Salud y Tutor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Alergico a</label>
                <input type="text" name="alergico" value={form.alergico} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Ej: Penicilina, Maní..." />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Medicamentos que usa</label>
                <input type="text" name="medicamentos_que_usa" value={form.medicamentos_que_usa} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" placeholder="Ej: Ninguno, Inhalador..." />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">ID Cliente (Tutor/Padre)</label>
                <input type="number" name="idcliente" value={form.idcliente || ''} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono" placeholder="ID del cliente en el sistema" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Parentesco</label>
                <select name="parentesco" value={form.parentesco || ''} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                  <option value="">Seleccionar</option>
                  <option value={1}>Padre</option>
                  <option value={2}>Madre</option>
                  <option value={3}>Tutor Legal</option>
                  <option value={4}>Abuelo/a</option>
                  <option value={5}>Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                  <option value="A">✅ Activo</option>
                  <option value="E">❌ Inactivo / Retirado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('/educacion/estudiantes')} className="px-6 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow">
              {saving ? '⏳ Guardando...' : isEditing ? '💾 Actualizar Estudiante' : '💾 Guardar Estudiante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}