import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { inscripcionApi, type InscripcionSaveDto, type EstudianteBusquedaDto } from '../../api/inscripcion.api';
// Importa tus APIs de curso y empleado aquí. Ejemplo:
// import { cursoApi } from '../../api/curso.api';
// import { empleadoApi } from '../../api/empleado.api';

const initialForm: InscripcionSaveDto = {
  fecha: new Date().toISOString().split('T')[0],
  idEstudiante: 0,
  idcurso: 0,
  fecha1: null,
  fecha2: null,
  idinstructor: 0,
  isFacturaAutomatica: false,
};

export default function InscripcionFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<InscripcionSaveDto>(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estado para la búsqueda de estudiante
  const [busquedaEstudiante, setBusquedaEstudiante] = useState('');
  const [estudianteEncontrado, setEstudianteEncontrado] = useState<EstudianteBusquedaDto | null>(null);
  const [buscandoEstudiante, setBuscandoEstudiante] = useState(false);

  // Estados mock para selects (Reemplazar con llamadas reales a tu API)
  //const [cursos, setCursos] = useState<any[]>([]); 
  //const [instructores, setInstructores] = useState<any[]>([]);

  // Cargar datos si es edición
  useEffect(() => {
    // TODO: Cargar listas de cursos e instructores aquí
    // const loadData = async () => { ... }
    
    if (!isEditing) return;

    const cargarInscripcion = async () => {
      setLoading(true);
      try {
        const { data } = await inscripcionApi.getById(parseInt(id!));
       // setForm({
       //   ...data,
       //   fecha: data.fecha ? String(data.fecha).split('T')[0] : '',
        //  fecha1: data.fecha1 ? String(data.fecha1).split('T')[0] : null,
        //  fecha2: data.fecha2 ? String(data.fecha2).split('T')[0] : null,
          
       // });
        setBusquedaEstudiante(data.codigo_Estudiante);
        // Simular que encontramos el estudiante para mostrar sus datos
        setEstudianteEncontrado({ 
          idEstudiante: data.idestudiante, // Asegúrate de que el backend devuelva esto o haz una llamada extra
          codigo: data.codigo_Estudiante,
          estudiante: 'Cargando nombre...', 
          num_Documento: '', telefono: '', codigo_Padre: '' 
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar');
      } finally {
        setLoading(false);
      }
    };
    cargarInscripcion();
  }, [id, isEditing]);

  // ═══ Handlers ═══
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              ['idEstudiante', 'idcurso', 'idinstructor'].includes(name) ? parseInt(value) || 0 : value
    }));
  };

  const handleBuscarEstudiante = async () => {
    if (!busquedaEstudiante.trim()) return;
    setBuscandoEstudiante(true);
    setEstudianteEncontrado(null);
    setError('');

    try {
      const { data } = await inscripcionApi.getEstudianteByCodigo(busquedaEstudiante.trim());
      setEstudianteEncontrado(data);
      setForm(prev => ({ ...prev, idEstudiante: data.idEstudiante }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Estudiante no encontrado. Verifica el código o documento.');
      setForm(prev => ({ ...prev, idEstudiante: 0 }));
    } finally {
      setBuscandoEstudiante(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (form.idEstudiante <= 0) throw new Error('Debes buscar y seleccionar un estudiante válido');
      if (form.idcurso <= 0) throw new Error('Debes seleccionar un curso');
      if (form.idinstructor <= 0) throw new Error('Debes seleccionar un instructor');

      if (isEditing) {
        await inscripcionApi.update(parseInt(id!), form);
        setSuccess('✅ Inscripción actualizada correctamente');
      } else {
        await inscripcionApi.create(form);
        setSuccess('✅ Inscripción registrada correctamente');
      }
      setTimeout(() => navigate('/educacion/inscripciones'), 1500);
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
              <h1 className="text-xl font-bold text-white">{isEditing ? '✏️ Editar Inscripción' : '➕ Nueva Inscripción'}</h1>
              <p className="text-emerald-100 text-xs">{isEditing ? 'Modifica los datos de la inscripción' : 'Registra un nuevo estudiante en un curso'}</p>
            </div>
            <button onClick={() => navigate('/educacion/inscripciones')} className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 shadow">← Volver</button>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs text-center">⚠️ {error}</div>}
        {success && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs text-center animate-bounce">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Sección 1: Búsqueda de Estudiante */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-emerald-800 pb-2 border-b mb-4">👤 1. Buscar Estudiante</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={busquedaEstudiante}
                onChange={(e) => setBusquedaEstudiante(e.target.value)}
                placeholder="Ingresa Código o Cédula del estudiante y presiona Buscar"
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleBuscarEstudiante())}
              />
              <button
                type="button"
                onClick={handleBuscarEstudiante}
                disabled={buscandoEstudiante || !busquedaEstudiante.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {buscandoEstudiante ? '🔍 Buscando...' : '🔍 Buscar'}
              </button>
            </div>

            {estudianteEncontrado && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Código</p>
                  <p className="font-mono font-bold text-emerald-700">{estudianteEncontrado.codigo}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Nombre Completo</p>
                  <p className="font-semibold text-gray-900">{estudianteEncontrado.estudiante}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Documento</p>
                  <p className="font-mono">{estudianteEncontrado.num_Documento || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Teléfono</p>
                  <p className="font-mono">{estudianteEncontrado.telefono || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Padre/Tutor (Código)</p>
                  <p className="font-mono">{estudianteEncontrado.codigo_Padre || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sección 2: Datos de la Inscripción */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-emerald-800 pb-2 border-b mb-4">📚 2. Datos de la Inscripción</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Curso <span className="text-red-500">*</span></label>
                <select name="idcurso" value={form.idcurso} onChange={handleChange} required className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                  <option value={0}>-- Seleccionar Curso --</option>
                  {/* Mapear cursos reales aquí: {cursos.map(c => <option key={c.idcurso} value={c.idcurso}>{c.curso}</option>)} */}
                  <option value={1}>Ejemplo: Inglés Básico (Reemplazar con API)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Instructor / Facilitador <span className="text-red-500">*</span></label>
                <select name="idinstructor" value={form.idinstructor} onChange={handleChange} required className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                  <option value={0}>-- Seleccionar Instructor --</option>
                  {/* Mapear instructores reales aquí */}
                  <option value={1}>Ejemplo: Juan Pérez (Reemplazar con API)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Fecha de Inscripción <span className="text-red-500">*</span></label>
                <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="flex items-center pt-5">
                <input type="checkbox" id="isFacturaAutomatica" name="isFacturaAutomatica" checked={form.isFacturaAutomatica} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
                <label htmlFor="isFacturaAutomatica" className="ml-2 text-xs font-medium text-gray-700 cursor-pointer">
                  Generar factura automáticamente al inscribir
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Fecha de Inicio del Curso</label>
                <input type="date" name="fecha1" value={form.fecha1 || ''} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Fecha de Fin del Curso</label>
                <input type="date" name="fecha2" value={form.fecha2 || ''} onChange={handleChange} className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
              </div>

            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => navigate('/educacion/inscripciones')} className="px-6 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow">
              {saving ? '⏳ Guardando...' : isEditing ? '💾 Actualizar Inscripción' : '💾 Guardar Inscripción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}