import { useState, useEffect } from 'react';
import { asistenciaApi, type AsistenciaMatrixDto } from '../../api/asistencia.api';
import { cursoApi, type CursoListadoDto } from '../../api/curso.api';
import { cotizacionApi, type VendedorDto } from '../../api/cotizacion.api';
import { useAuthStore } from '../../store/authStore';

// Mapeo de colores para los códigos de asistencia
const getColorAsistencia = (codigo: string | null) => {
  switch (codigo) {
    case 'P': return 'bg-green-100 text-green-800 font-bold'; // Presente
    case 'T': return 'bg-amber-100 text-amber-800 font-bold'; // Tardanza
    case 'M': return 'bg-purple-100 text-purple-800 font-bold'; // Media Presencia
    case 'A': return 'bg-red-100 text-red-800 font-bold'; // Ausente
    case 'E': return 'bg-blue-100 text-blue-800 font-bold'; // Excusa
    case 'N': return 'bg-gray-100 text-gray-600'; // No Laborable
    default: return 'text-gray-300'; // Vacío
  }
};

export default function AsistenciaReportPage() {
  const { user } = useAuthStore();
  const idEmpresa = user?.idempresa ?? 1;

  // Filtros (Por defecto, el mes actual)
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0];
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0];

  const [fecha1, setFecha1] = useState(primerDiaMes);
  const [fecha2, setFecha2] = useState(ultimoDiaMes);
  const [idCurso, setIdCurso] = useState<number>(0);
  const [idInstructor, setIdInstructor] = useState<number>(0);
  const [idDetalleCurso, setIdDetalleCurso] = useState<number | null>(null);

  // Datos
  const [matrixData, setMatrixData] = useState<AsistenciaMatrixDto[]>([]);
  const [activeDays, setActiveDays] = useState<number[]>([]); // Días que sí tuvieron asistencia
  
  // Selects
  const [cursos, setCursos] = useState<CursoListadoDto[]>([]);
  const [instructores, setInstructores] = useState<VendedorDto[]>([]);
  
  // UI
  const [loading, setLoading] = useState(false);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [error, setError] = useState('');

  // ═══ Cargar Selects al montar ═══
  useEffect(() => {
    const cargarSelects = async () => {
      try {
        const [cursosRes, instructoresRes] = await Promise.all([
          cursoApi.getAll(),
          cotizacionApi.getVendedores(idEmpresa)
        ]);
        setCursos(cursosRes.data);
        setInstructores(instructoresRes.data);
      } catch (err) {
        console.error('Error cargando selects:', err);
      } finally {
        setLoadingSelects(false);
      }
    };
    cargarSelects();
  }, [idEmpresa]);

  // ═══ Generar Reporte ═══
  const handleGenerarReporte = async () => {
    if (idCurso <= 0 || idInstructor <= 0) {
      setError('⚠️ Debes seleccionar un curso y un instructor');
      return;
    }
    if (fecha1 > fecha2) {
      setError('⚠️ La fecha inicial no puede ser mayor a la fecha final');
      return;
    }

    setLoading(true);
    setError('');
    setMatrixData([]);
    setActiveDays([]);

    try {
      const { data } = await asistenciaApi.getMatrix({
        fecha1,
        fecha2,
        idCurso,
        idDetalleCurso,
        idInstructor
      });

      setMatrixData(data);

      // 🔍 LÓGICA CLAVE: Determinar qué días (1-31) tuvieron al menos un registro
      const daysWithData: number[] = [];
      for (let i = 1; i <= 31; i++) {
        const key = `dia_${i}` as keyof AsistenciaMatrixDto;
        // Si algún estudiante tiene un valor distinto de null o vacío en este día, lo incluimos
        const tieneRegistros = data.some(student => {
          const val = student[key] as string | null;
          return val !== null && val !== '';
        });
        
        if (tieneRegistros) {
          daysWithData.push(i);
        }
      }
      setActiveDays(daysWithData);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  // ═══ Calcular Porcentaje de Asistencia ═══
  const calcularPorcentaje = (estudiante: AsistenciaMatrixDto) => {
    if (activeDays.length === 0) return 0;

    let diasAsistidos = 0;
    activeDays.forEach(dia => {
      const key = `dia_${dia}` as keyof AsistenciaMatrixDto;
      const estado = estudiante[key] as string;
      // Consideramos 'P' (Presente), 'T' (Tardanza) y 'M' (Media Presencia) como asistencia válida
      if (estado === 'P' || estado === 'T' || estado === 'M') {
        diasAsistidos++;
      }
    });

    return Math.round((diasAsistidos / activeDays.length) * 100);
  };

  const getNombreInstructor = (inst: VendedorDto) => {
    return `${inst.nombres || ''}`.trim() || `Instructor #${inst.idempleado}`;
  };

  if (loadingSelects) {
    return <div className="p-12 text-center text-gray-500"><div className="animate-spin text-3xl inline-block mb-2">⏳</div><br/>Cargando...</div>;
  }

// ═══ Estilos específicos para que la impresión salga perfecta ═══
  const printStyles = `
    @media print {
      @page {
        size: landscape; /* Fuerza orientación horizontal para que quepan los días */
        margin: 1cm;
      }
      body {
        background: white !important;
        -webkit-print-color-adjust: exact; /* Obliga a imprimir los colores de fondo */
        print-color-adjust: exact;
      }
      /* Evita que una fila de estudiante se corte entre dos hojas */
      tbody tr {
        page-break-inside: avoid;
      }
    }
  `;
return (
  <>
    <style>{printStyles}</style>
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-3">
      <div className="max-w-[95vw] mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden print:hidden">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">📊 Reporte de Asistencia (Matriz)</h1>
              <p className="text-emerald-100 text-xs">Visualiza la asistencia mensual por día y el porcentaje final</p>
            </div>
            <button 
              onClick={() => window.print()} 
              className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 shadow flex items-center gap-1"
            >
              🖨️ Imprimir / PDF
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow border border-gray-100 p-4 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Desde</label>
              <input type="date" value={fecha1} onChange={(e) => setFecha1(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Hasta</label>
              <input type="date" value={fecha2} onChange={(e) => setFecha2(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Curso</label>
              <select value={idCurso} onChange={(e) => setIdCurso(parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                <option value={0}>-- Seleccionar --</option>
                {cursos.map(c => <option key={c.idcurso} value={c.idcurso}>{c.curso}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Instructor</label>
              <select value={idInstructor} onChange={(e) => setIdInstructor(parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                <option value={0}>-- Seleccionar --</option>
                {instructores.map(i => <option key={i.idempleado} value={i.idempleado}>{getNombreInstructor(i)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">Sección (Opcional)</label>
              <input type="number" value={idDetalleCurso || ''} onChange={(e) => setIdDetalleCurso(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
            </div>
            <button onClick={handleGenerarReporte} disabled={loading}
              className="w-full px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-1">
              {loading ? <span className="animate-spin">⏳</span> : '📊'} Generar
            </button>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs text-center print:hidden">⚠️ {error}</div>}

        {/* Tabla de Reporte */}
        {matrixData.length > 0 && (
          <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-gray-100 text-gray-700 uppercase">
                  <tr>
                    <th className="px-2 py-2 border text-left sticky left-0 bg-gray-100 z-10">Estudiante</th>
                    <th className="px-2 py-2 border text-center">Sexo</th>
                    <th className="px-2 py-2 border text-center">Edad</th>
                    
                    {/* Columnas dinámicas de días */}
                    {activeDays.map(dia => (
                      <th key={dia} className="px-1 py-2 border text-center w-8 min-w-[2rem]">
                        {dia}
                      </th>
                    ))}
                    
                    <th className="px-2 py-2 border text-center font-bold bg-emerald-50 text-emerald-800 sticky right-0 z-10">
                      % Asist.
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {matrixData.map((est, index) => {
                    const porcentaje = calcularPorcentaje(est);
                    const colorPorcentaje = porcentaje >= 80 ? 'text-green-600' : porcentaje >= 60 ? 'text-amber-600' : 'text-red-600';
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-2 py-1.5 border font-semibold text-gray-900 sticky left-0 bg-white z-10">
                          {est.estudiante}
                        </td>
                        <td className="px-2 py-1.5 border text-center text-gray-600">{est.sexo}</td>
                        <td className="px-2 py-1.5 border text-center text-gray-600">{est.edad}</td>
                        
                        {/* Datos de asistencia por día */}
                        {activeDays.map(dia => {
                          const key = `dia_${dia}` as keyof AsistenciaMatrixDto;
                          const valor = est[key] as string | null;
                          return (
                            <td key={dia} className="px-1 py-1.5 border text-center">
                              <span className={`inline-block w-6 h-6 leading-6 rounded text-[10px] ${getColorAsistencia(valor)}`}>
                                {valor || '-'}
                              </span>
                            </td>
                          );
                        })}
                        
                        {/* Columna de Porcentaje */}
                        <td className={`px-2 py-1.5 border text-center font-bold text-sm sticky right-0 bg-white z-10 ${colorPorcentaje}`}>
                          {porcentaje}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Leyenda */}
                <tfoot className="bg-gray-50 text-gray-600">
                  <tr>
                    <td colSpan={3 + activeDays.length + 1} className="px-2 py-2 border text-[10px]">
                      <strong>Leyenda:</strong> P = Presente | T = Tardanza | M = Media Presencia | A = Ausente | E = Excusa | N = No Laborable
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && matrixData.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3 opacity-30">📊</div>
            <p className="text-sm text-gray-500">Selecciona los filtros y presiona "Generar" para ver el reporte</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
}