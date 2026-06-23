import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { asistenciaApi, type AsistenciaFormularioDto } from '../../api/asistencia.api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export default function AsistenciaFormularioPage() {
  const { idCurso, idInstructor, fecha } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AsistenciaFormularioDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const fecha1 = new Date(fecha!);
        const fecha2 = new Date(fecha1);
        fecha2.setMonth(fecha2.getMonth() + 1);
        
        const { data } = await asistenciaApi.getAsistenciaSemanal({
          fecha1: fecha1.toISOString().split('T')[0],
          fecha2: fecha2.toISOString().split('T')[0],
          idCurso: parseInt(idCurso!),
          idDetalleCurso: null,
          idInstructor: parseInt(idInstructor!),
        });
        
        setData(data);
      } catch (err) {
        console.error('Error cargando formulario:', err);
      } finally {
        setLoading(false);
      }
    };
    
    cargarDatos();
  }, [idCurso, idInstructor, fecha]);

  // ═══ FUNCIÓN PARA EXPORTAR A EXCEL ═══
  // ═══ FUNCIÓN PARA EXPORTAR A EXCEL ═══
const exportarAExcel = () => {
  if (!data) return;

  // Crear workbook
  const wb = XLSX.utils.book_new();
  
  // Preparar datos para Excel (solo estudiantes)
  const excelData = data.estudiantes.map(est => ({
    'No.': est.no,
    'ALUMNO': est.alumno,
    'EDAD': est.edad,
    'GENERO': est.genero,
    'Semana 1': est.s1_P,
    'Semana 2': est.s2_P,
    'Semana 3': est.s3_P,
    'Semana 4': est.s4_P,
    'Semana 5': est.s5_P,
    'TOTAL': est.total_P
  }));

  // Crear worksheet con datos de estudiantes
  const ws = XLSX.utils.json_to_sheet(excelData);
  
  // Agregar fila de totales manualmente
  const totalRow = [
    '', // No. vacío
    'TOTALES:',
    '', // EDAD vacío
    '', // GENERO vacío
    data.estudiantes.reduce((sum, e) => sum + e.s1_P, 0),
    data.estudiantes.reduce((sum, e) => sum + e.s2_P, 0),
    data.estudiantes.reduce((sum, e) => sum + e.s3_P, 0),
    data.estudiantes.reduce((sum, e) => sum + e.s4_P, 0),
    data.estudiantes.reduce((sum, e) => sum + e.s5_P, 0),
    data.estudiantes.reduce((sum, e) => sum + e.total_P, 0)
  ];
  
  XLSX.utils.sheet_add_aoa(ws, [totalRow], { origin: -1 });
  
  // Configurar anchos de columnas
  ws['!cols'] = [
    { wch: 5 },  // No.
    { wch: 40 }, // Alumno
    { wch: 5 },  // Edad
    { wch: 8 },  // Genero
    { wch: 10 }, // Semana 1
    { wch: 10 }, // Semana 2
    { wch: 10 }, // Semana 3
    { wch: 10 }, // Semana 4
    { wch: 10 }, // Semana 5
    { wch: 10 }  // Total
  ];

  // Agregar worksheet al workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Asistencia');

  // Generar nombre del archivo
  const nombreArchivo = `Asistencia_${data.disciplina.replace(/\s+/g, '_')}_${data.mes}_${data.año}.xlsx`;

  // Guardar archivo
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, nombreArchivo);
};

  if (loading) {
    return <div className="p-12 text-center">Cargando...</div>;
  }

  if (!data) {
    return <div className="p-12 text-center">No hay datos disponibles</div>;
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Botones de acción */}
        <div className="mb-4 no-print flex gap-2">
          <button
            onClick={exportarAExcel}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            📊 Exportar Excel
          </button>
          
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            🖨️ Imprimir PDF
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ← Volver
          </button>
        </div>

        {/* Formulario */}
        <div className="border-2 border-black p-6" id="formulario-asistencia">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {data.logoBase64 && (
                <img src={data.logoBase64} alt="Logo" className="w-24 h-24 object-contain" />
              )}
              <div>
                <h1 className="text-xl font-bold">FORMULARIO DE ASISTENCIA FONDO FORMACION Y DIFUSION</h1>
                <p className="text-sm">INSTITUCION: {data.institucion}</p>
              </div>
            </div>
            {data.logoBase64 && (
              <div className="w-24 h-24 flex items-center justify-center">
                <img 
                  src="https://fondoformacion.gob.do/wp-content/uploads/2020/01/logo-fondo-formacion.png" 
                  alt="Fondo Formacion" 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          {/* Info del curso */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p><strong>Disciplina:</strong> {data.disciplina}</p>
              <p><strong>DÍA/S:</strong> {data.dias}</p>
              <p><strong>MES:</strong> {data.mes}</p>
            </div>
            <div>
              <p><strong>Docente:</strong> {data.docente}</p>
              <p><strong>HORARIO DE CLASES:</strong> {data.horario}</p>
              <p><strong>AÑO:</strong> {data.año}</p>
            </div>
          </div>

          {/* Tabla */}
          <table className="w-full border-collapse border-2 border-black text-xs">
            <thead>
              <tr className="bg-blue-100">
                <th rowSpan={2} className="border-2 border-black px-2 py-1">No.</th>
                <th rowSpan={2} className="border-2 border-black px-2 py-1">ALUMNO</th>
                <th rowSpan={2} className="border-2 border-black px-2 py-1">EDAD</th>
                <th colSpan={2} className="border-2 border-black px-2 py-1">GENERO</th>
                <th colSpan={5} className="border-2 border-black px-2 py-1">ASISTENCIA (SEMANAL)</th>
                <th rowSpan={2} className="border-2 border-black px-2 py-1">Total</th>
              </tr>
              <tr className="bg-blue-100">
                <th className="border-2 border-black px-2 py-1">M</th>
                <th className="border-2 border-black px-2 py-1">F</th>
                {data.fechasSemanas.map((fechaSemana, idx) => (
                  <th key={idx} className="border-2 border-black px-2 py-1 text-center">
                    {idx + 1}ra.<br />{fechaSemana}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.estudiantes.map((est, idx) => (
                <tr key={idx}>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.no}</td>
                  <td className="border-2 border-black px-2 py-1">{est.alumno}</td>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.edad}</td>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.genero === 'M' ? 'X' : ''}</td>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.genero === 'F' ? 'X' : ''}</td>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.s1_P}</td>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.s2_P}</td>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.s3_P}</td>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.s4_P}</td>
                  <td className="border-2 border-black px-2 py-1 text-center">{est.s5_P}</td>
                  <td className="border-2 border-black px-2 py-1 text-center font-bold">{est.total_P}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={4} className="border-2 border-black px-2 py-1 text-right">TOTALES:</td>
                <td className="border-2 border-black px-2 py-1"></td>
                <td className="border-2 border-black px-2 py-1 text-center">
                  {data.estudiantes.reduce((sum, e) => sum + e.s1_P, 0)}
                </td>
                <td className="border-2 border-black px-2 py-1 text-center">
                  {data.estudiantes.reduce((sum, e) => sum + e.s2_P, 0)}
                </td>
                <td className="border-2 border-black px-2 py-1 text-center">
                  {data.estudiantes.reduce((sum, e) => sum + e.s3_P, 0)}
                </td>
                <td className="border-2 border-black px-2 py-1 text-center">
                  {data.estudiantes.reduce((sum, e) => sum + e.s4_P, 0)}
                </td>
                <td className="border-2 border-black px-2 py-1 text-center">
                  {data.estudiantes.reduce((sum, e) => sum + e.s5_P, 0)}
                </td>
                <td className="border-2 border-black px-2 py-1 text-center">
                  {data.estudiantes.reduce((sum, e) => sum + e.total_P, 0)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Firmas */}
          <div className="mt-12 grid grid-cols-2 gap-8 text-center text-sm">
            <div>
              <div className="border-t-2 border-black pt-2 mt-16">
                <p>Firma Coordinador(a)/ Monitor</p>
              </div>
            </div>
            <div>
              <div className="border-t-2 border-black pt-2 mt-16">
                <p>Firma Docente</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .no-print {
            display: none;
          }
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: landscape;
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}