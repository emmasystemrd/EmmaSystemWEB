import { useState, useEffect, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cursoApi, type CursoSaveDto, type CursoDetalleItemDto } from '../../api/curso.api';

const initialForm: CursoSaveDto = {
  codigo: '',
  curso: '',
  descripcion: '',
  nivel: 'Básico',
  horario: '',
  valor_Inscripcion: 0,
  valor_Mensual: 0,
  tipo_Duracion: 'M',
  duracion: 1,
  cupo_Maximo: 10,
  idinstructor: 0,
  estado: 'A',
  detalles: [],
};

const NIVELES = ['Básico', 'Intermedio', 'Avanzado', 'Experto'];
const TIPOS_DURACION = [
  { value: 'M', label: 'Meses' },
  { value: 'S', label: 'Semanas' },
  { value: 'D', label: 'Días' },
  { value: 'H', label: 'Horas' },
];

export default function CursoFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState<CursoSaveDto>(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cargar datos si es edición
  useEffect(() => {
    if (!isEditing) {
      // Generar código automático
      cursoApi.getSecuencia()
        .then(({ data }) => {
          setForm(prev => ({ ...prev, codigo: `CUR${String(data).padStart(4, '0')}` }));
        })
        .catch(() => {});
      return;
    }

    const cargarCurso = async () => {
      setLoading(true);
      try {
        const { data } = await cursoApi.getById(parseInt(id!));
        setForm({
          codigo: data.codigo,
          curso: data.curso,
          descripcion: data.descripcion,
          nivel: data.nivel,
          horario: data.horario,
          valor_Inscripcion: data.valor_Inscripcion,
          valor_Mensual: data.valor_Mensual,
          tipo_Duracion: data.tipo_Duracion,
          duracion: data.duracion,
          cupo_Maximo: data.cupo_Maximo,
          idinstructor: data.idinstructor,
          estado: data.estado,
          detalles: data.detalles || [],
        });
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar el curso');
      } finally {
        setLoading(false);
      }
    };

    cargarCurso();
  }, [id, isEditing]);

  // ═══ Handlers ═══
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ['valor_Inscripcion', 'valor_Mensual', 'duracion', 'cupo_Maximo', 'idinstructor'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  const agregarDetalle = () => {
    setForm(prev => ({
      ...prev,
      detalles: [...prev.detalles, { nombre: '' }]
    }));
  };

  const actualizarDetalle = (index: number, nombre: string) => {
    setForm(prev => {
      const nuevosDetalles = [...prev.detalles];
      nuevosDetalles[index] = { ...nuevosDetalles[index], nombre };
      return { ...prev, detalles: nuevosDetalles };
    });
  };

  const eliminarDetalle = (index: number) => {
    setForm(prev => ({
      ...prev,
      detalles: prev.detalles.filter((_, i) => i !== index)
    }));
  };

  const moverDetalle = (index: number, direccion: 'up' | 'down') => {
    setForm(prev => {
      const nuevosDetalles = [...prev.detalles];
      const newIndex = direccion === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= nuevosDetalles.length) return prev;
      [nuevosDetalles[index], nuevosDetalles[newIndex]] = [nuevosDetalles[newIndex], nuevosDetalles[index]];
      return { ...prev, detalles: nuevosDetalles };
    });
  };

  // ═══ Guardar ═══
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validaciones
      if (!form.codigo.trim()) throw new Error('El código es obligatorio');
      if (!form.curso.trim()) throw new Error('El nombre del curso es obligatorio');
      if (form.idinstructor <= 0) throw new Error('Debe seleccionar un instructor');

      // Filtrar detalles vacíos
      const datosEnviar: CursoSaveDto = {
        ...form,
        detalles: form.detalles.filter(d => d.nombre.trim() !== '')
      };

      if (isEditing) {
        await cursoApi.update(parseInt(id!), datosEnviar);
        setSuccess('✅ Curso actualizado correctamente');
      } else {
        await cursoApi.create(datosEnviar);
        setSuccess('✅ Curso creado correctamente');
      }

      setTimeout(() => navigate('/cursos'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="animate-spin text-3xl inline-block mb-2">⏳</div>
        <br />Cargando curso...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-3">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">
                {isEditing ? '✏️ Editar Curso' : '➕ Nuevo Curso'}
              </h1>
              <p className="text-emerald-100 text-xs">
                {isEditing ? 'Modifica los datos del curso' : 'Registra un nuevo curso en el sistema'}
              </p>
            </div>
            <button
              onClick={() => navigate('/cursos')}
              className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 shadow"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs text-center">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs text-center animate-bounce">
            {success}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Información Básica */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-emerald-800 pb-2 border-b mb-4">
              📋 Información Básica
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                  placeholder="Ej: CUR0001"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Nombre del Curso <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="curso"
                  value={form.curso}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Ej: Inglés Básico"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none resize-none"
                  placeholder="Breve descripción del curso..."
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Nivel
                </label>
                <select
                  name="nivel"
                  value={form.nivel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                >
                  {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Horario
                </label>
                <input
                  type="text"
                  name="horario"
                  value={form.horario}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  placeholder="Ej: Lunes y Miércoles 6-8PM"
                />
              </div>
            </div>
          </div>

          {/* Valores y Duración */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-emerald-800 pb-2 border-b mb-4">
              💰 Valores y Duración
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Inscripción (RD$)
                </label>
                <input
                  type="number"
                  name="valor_Inscripcion"
                  value={form.valor_Inscripcion}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Mensualidad (RD$)
                </label>
                <input
                  type="number"
                  name="valor_Mensual"
                  value={form.valor_Mensual}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Duración
                </label>
                <input
                  type="number"
                  name="duracion"
                  value={form.duracion}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Tipo Duración
                </label>
                <select
                  name="tipo_Duracion"
                  value={form.tipo_Duracion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                >
                  {TIPOS_DURACION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Cupo Máximo
                </label>
                <input
                  type="number"
                  name="cupo_Maximo"
                  value={form.cupo_Maximo}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  ID Instructor <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="idinstructor"
                  value={form.idinstructor}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                  placeholder="ID del empleado"
                />
                <p className="text-[9px] text-gray-500 mt-1">
                  💡 ID del empleado que será el instructor
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="A">✅ Activo</option>
                  <option value="I">⏸️ Inactivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Temario / Detalles */}
          <div className="bg-white rounded-xl shadow border border-gray-100 p-5">
            <div className="flex justify-between items-center pb-2 border-b mb-4">
              <h3 className="text-sm font-bold text-emerald-800">
                📚 Temario del Curso
              </h3>
              <button
                type="button"
                onClick={agregarDetalle}
                className="px-3 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700"
              >
                ➕ Agregar Tema
              </button>
            </div>

            {form.detalles.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                <div className="text-3xl mb-2">📖</div>
                No hay temas agregados. Haz clic en "Agregar Tema" para comenzar.
              </div>
            ) : (
              <div className="space-y-2">
                {form.detalles.map((detalle, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <span className="text-xs font-bold text-emerald-700 w-8 text-center">
                      {index + 1}.
                    </span>
                    <input
                      type="text"
                      value={detalle.nombre}
                      onChange={(e) => actualizarDetalle(index, e.target.value)}
                      placeholder={`Tema ${index + 1}`}
                      className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => moverDetalle(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-gray-600 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover arriba"
                    >
                      ⬆️
                    </button>
                    <button
                      type="button"
                      onClick={() => moverDetalle(index, 'down')}
                      disabled={index === form.detalles.length - 1}
                      className="p-1.5 text-gray-600 hover:text-emerald-700 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Mover abajo"
                    >
                      ⬇️
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarDetalle(index)}
                      className="p-1.5 text-red-600 hover:text-red-800"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.detalles.length > 0 && (
              <div className="mt-3 pt-3 border-t text-[10px] text-gray-500">
                📊 Total de temas: <strong>{form.detalles.filter(d => d.nombre.trim()).length}</strong>
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/cursos')}
              className="px-6 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {saving ? '⏳ Guardando...' : isEditing ? '💾 Actualizar Curso' : '💾 Guardar Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}