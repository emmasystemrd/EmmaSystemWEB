import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // ← AGREGAR si no está
import { 
  asistenciaApi, 
  type EstudianteAsistenciaDto, 
  type AsistenciaSaveDto,  
} from '../../api/asistencia.api';
import { cursoApi, type CursoListadoDto } from '../../api/curso.api';
import { cotizacionApi, type VendedorDto } from '../../api/cotizacion.api';
import { useAuthStore } from '../../store/authStore';

// Opciones de asistencia con sus colores y etiquetas
const OPCIONES_ASISTENCIA = [
  { value: 'P', label: 'Presente', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'A', label: 'Ausente', color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'E', label: 'Excusa', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'T', label: 'Tardanza', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'M', label: 'Media Pres.', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'N', label: 'No Laborable', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

export default function AsistenciaPage() {
  const { user } = useAuthStore();
  const idEmpresa = user?.idempresa ?? 1;
  const navigate = useNavigate(); // ← AGREGAR ESTA LÍNEA
  // Filtros
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [idCurso, setIdCurso] = useState<number>(0);
  const [idInstructor, setIdInstructor] = useState<number>(0);
  const [idDetalleCurso, setIdDetalleCurso] = useState<number | null>(null);

  // Estado de datos
  const [estudiantes, setEstudiantes] = useState<EstudianteAsistenciaDto[]>([]);
  const [idAsistenciaActual, setIdAsistenciaActual] = useState<number>(0);
  
  // Estado de selects
  const [cursos, setCursos] = useState<CursoListadoDto[]>([]);
  const [instructores, setInstructores] = useState<VendedorDto[]>([]);
  
  // Estado de UI
  const [loading, setLoading] = useState(false);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ═══ Cargar Selects al montar el componente ═══
  useEffect(() => {
    const cargarSelects = async () => {
      setLoadingSelects(true);
      try {
        const cursosRes = await cursoApi.getAll();
        setCursos(cursosRes.data);

        const instructoresRes = await cotizacionApi.getVendedores(idEmpresa);
        setInstructores(instructoresRes.data);
      } catch (err) {
        console.error('Error cargando selects:', err);
        setError('⚠️ Error al cargar la lista de cursos o instructores');
      } finally {
        setLoadingSelects(false);
      }
    };
    cargarSelects();
  }, [idEmpresa]);

  // ═══ AUTO-CARGA: Detectar cambios en fecha/curso/instructor ═══
  useEffect(() => {
    // Solo auto-cargar si todos los filtros están seleccionados
    if (idCurso <= 0 || idInstructor <= 0 || !fecha) return;

    const timeoutId = setTimeout(async () => {
      await cargarAsistenciaAutomatica();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [fecha, idCurso, idInstructor, idDetalleCurso]);

  const cargarAsistenciaAutomatica = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Buscar si ya existe una asistencia registrada para esta combinación
      const idExistente = await asistenciaApi.getExistingId({
        fecha,
        idCurso,
        idDetalleCurso,
        idInstructor,
      });

      if (idExistente && idExistente > 0) {
        // 2. Si existe, cargar la asistencia con sus detalles
        setIdAsistenciaActual(idExistente);
        
        const { data } = await asistenciaApi.getEstudiantes({
          idAsistencia: idExistente,
          fecha,
          idCurso,
          idDetalleCurso,
          idInstructor,
        });
        
        setEstudiantes(data);
        setSuccess('📝 Asistencia previamente registrada cargada. Puedes modificarla según necesites.');
      } else {
        // 3. Si no existe, cargar la lista vacía de estudiantes
        setIdAsistenciaActual(0);
        
        const { data } = await asistenciaApi.getEstudiantes({
          idAsistencia: 0,
          fecha,
          idCurso,
          idDetalleCurso,
          idInstructor,
        });
        
        setEstudiantes(data);
        setSuccess('');
      }
    } catch (err: any) {
      console.error('Error en auto-carga:', err);
      setError(err.response?.data?.message || 'Error al cargar la lista de estudiantes');
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  };

  // ═══ Handler manual (botón Cargar Lista) ═══
  const handleCargar = async () => {
    if (idCurso <= 0 || idInstructor <= 0) {
      setError('⚠️ Debes seleccionar un curso y un instructor');
      return;
    }
    await cargarAsistenciaAutomatica();
  };

  const handleMarcarAsistencia = (index: number, valor: string) => {
    setEstudiantes(prev => {
      const nuevos = [...prev];
      nuevos[index] = { ...nuevos[index], asistencia: valor };
      return nuevos;
    });
  };

  const handleGuardar = async () => {
    if (idCurso <= 0) {
      setError('⚠️ Debes seleccionar un curso');
      return;
    }
    if (idInstructor <= 0) {
      setError('⚠️ Debes seleccionar un instructor');
      return;
    }
    if (!fecha) {
      setError('⚠️ Debes seleccionar una fecha');
      return;
    }

    const sinMarcar = estudiantes.filter(e => !e.asistencia);
    if (sinMarcar.length > 0) {
      if (!window.confirm(`Hay ${sinMarcar.length} estudiantes sin asistencia marcada. Se marcarán como "Ausente" (A) automáticamente. ¿Deseas continuar?`)) {
        return;
      }
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload: AsistenciaSaveDto = {
        idAsistencia: idAsistenciaActual > 0 ? idAsistenciaActual : null,
        fecha: fecha,
        idcurso: idCurso,
        iddetalle_Curso: idDetalleCurso || 0,
        idinstructor: idInstructor,
        detalles: estudiantes.map(e => ({
          iddetalle: e.iddetalle ?? 0,
          idestudiante: e.idestudiante,
          asistencia: e.asistencia || 'A'
        }))
      };

      const { data } = await asistenciaApi.saveAsistencia(payload);
      setIdAsistenciaActual(data.idAsistencia);
      
      // ✅ MENSAJE AMIGABLE Y CLARO
      const nombreCurso = cursos.find(c => c.idcurso === idCurso)?.curso || 'el curso';
      const fechaFormateada = new Date(fecha).toLocaleDateString('es-DO', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      setSuccess(
        `✅ ¡Asistencia registrada exitosamente! Se guardaron ${estudiantes.length} estudiantes para ${nombreCurso} del ${fechaFormateada}.`
      );
      
      // Recargar para obtener los Iddetalle correctos
      await cargarAsistenciaAutomatica();
    } catch (err: any) {
      console.error("Error al guardar:", err);
      
      const errorMsg = err.response?.data?.errors 
        ? Object.values(err.response.data.errors).flat().join(', ')
        : (err.response?.data?.message || err.message || 'Error al guardar la asistencia');
      
      setError(`⚠️ ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const getOpcionColor = (valor: string) => {
    return OPCIONES_ASISTENCIA.find(o => o.value === valor)?.color || 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getNombreInstructor = (inst: VendedorDto) => {
    return `${inst.nombres || ''}`.trim() || inst.nombres || `Vendedor #${inst.idempleado}`;
  };

  if (loadingSelects) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="animate-spin text-3xl inline-block mb-2">⏳</div>
        <br />Cargando datos del sistema...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-3">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-white">📋 Toma de Asistencia</h1>
            <p className="text-emerald-100 text-xs">Registra la asistencia diaria de los estudiantes por curso</p>
          </div>
        </div>
        <div className="flex gap-2">
  <button
    onClick={() => navigate(`/educacion/asistencia-formulario/${idCurso}/${idInstructor}/${fecha}`)}
    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-1"
  >
    🖨️ Ver Formulario
  </button>
</div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Fecha</label>
              <input 
                type="date" 
                value={fecha} 
                onChange={(e) => setFecha(e.target.value)} 
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Curso</label>
              <select 
                value={idCurso} 
                onChange={(e) => setIdCurso(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value={0}>-- Seleccionar Curso --</option>
                {cursos.map(c => (
                  <option key={c.idcurso} value={c.idcurso}>{c.curso}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Instructor</label>
              <select 
                value={idInstructor} 
                onChange={(e) => setIdInstructor(parseInt(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
              >
                <option value={0}>-- Seleccionar Instructor --</option>
                {instructores.map(i => (
                  <option key={i.idempleado} value={i.idempleado}>
                    {getNombreInstructor(i)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Sección/Detalle (Opcional)</label>
              <input 
                type="number" 
                value={idDetalleCurso || ''} 
                onChange={(e) => setIdDetalleCurso(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="ID Detalle"
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <button 
              onClick={handleCargar}
              disabled={loading}
              className="w-full px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loading ? <span className="animate-spin">⏳</span> : '🔍'} Cargar Lista
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
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs text-center">
            {success}
          </div>
        )}

        {/* Tabla de Asistencia */}
        {estudiantes.length > 0 && (
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            {/* ✅ INDICADOR DE MODO EDICIÓN */}
            {idAsistenciaActual > 0 && (
              <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
                <div className="flex items-center gap-2 text-xs text-amber-800">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="font-semibold">Modo Edición:</span>
                  <span>Estás modificando una asistencia previamente registrada.</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-700 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-3 text-left w-16">Código</th>
                    <th className="px-3 py-3 text-left">Estudiante</th>
                    <th className="px-3 py-3 text-center w-48">Estado de Asistencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {estudiantes.map((est, index) => (
                    <tr key={est.idestudiante} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-emerald-700">{est.codigo}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{est.estudiante}</td>
                      <td className="px-3 py-2">
                        <select
                          value={est.asistencia}
                          onChange={(e) => handleMarcarAsistencia(index, e.target.value)}
                          className={`w-full px-2 py-1.5 text-xs font-bold rounded-lg border outline-none transition-colors cursor-pointer ${getOpcionColor(est.asistencia)}`}
                        >
                          <option value="">-- Seleccionar --</option>
                          {OPCIONES_ASISTENCIA.map(op => (
                            <option key={op.value} value={op.value}>{op.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer con botón de guardar */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
              <span className="text-[10px] text-gray-500">
                Total estudiantes: <strong>{estudiantes.length}</strong> | 
                Marcados: <strong className="text-emerald-600">{estudiantes.filter(e => e.asistencia).length}</strong>
              </span>
              <button
                onClick={handleGuardar}
                disabled={saving || estudiantes.length === 0}
                className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
              >
                {saving ? <span className="animate-spin">⏳</span> : '💾'} 
                {saving ? 'Guardando...' : (idAsistenciaActual > 0 ? 'Actualizar Asistencia' : 'Guardar Asistencia')}
              </button>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && estudiantes.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3 opacity-30">📋</div>
            <p className="text-sm text-gray-500">Selecciona un curso, instructor y fecha para cargar la lista automáticamente</p>
          </div>
        )}
      </div>
    </div>
  );
}