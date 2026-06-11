import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inscripcionApi, type InscripcionListadoDto } from '../../api/inscripcion.api';

export default function InscripcionListPage() {
  const navigate = useNavigate();
  const [inscripciones, setInscripciones] = useState<InscripcionListadoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtros
  const [isFecha, setIsFecha] = useState(false);
  const [fecha1, setFecha1] = useState('');
  const [fecha2, setFecha2] = useState('');
  const [texto, setTexto] = useState('');
  const [columna, setColumna] = useState('e.Nombres');

  const cargarInscripciones = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await inscripcionApi.search({
        fecha1: isFecha ? fecha1 : undefined,
        fecha2: isFecha ? fecha2 : undefined,
        isFecha,
        texto,
        columna
      });
      setInscripciones(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar inscripciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarInscripciones();
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarInscripciones();
  };

  const handleEliminar = async (id: number, codigo: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar la inscripción #${codigo}?`)) return;
    try {
      await inscripcionApi.delete(id);
      cargarInscripciones();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const handleImprimir = (id: number) => {
    // Abre una nueva pestaña con la vista de impresión (asumiendo que tienes una ruta para esto)
    window.open(`/educacion/inscripciones/imprimir/${id}`, '_blank');
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-DO');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-3">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">📝 Gestión de Inscripciones</h1>
              <p className="text-emerald-100 text-xs">Administra las inscripciones de los estudiantes a los cursos</p>
            </div>
            <button
              onClick={() => navigate('/educacion/inscripciones/nueva')}
              className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 shadow"
            >
              ➕ Nueva Inscripción
            </button>
          </div>
        </div>

        {/* Filtros de Búsqueda */}
        <form onSubmit={handleBuscar} className="bg-white rounded-xl shadow border border-gray-100 p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFecha"
                checked={isFecha}
                onChange={(e) => setIsFecha(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600"
              />
              <label htmlFor="isFecha" className="text-xs font-semibold text-gray-700">Filtrar por Fecha</label>
            </div>
            
            {isFecha && (
              <>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Desde</label>
                  <input type="date" value={fecha1} onChange={(e) => setFecha1(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Hasta</label>
                  <input type="date" value={fecha2} onChange={(e) => setFecha2(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
              </>
            )}

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Buscar en</label>
              <select value={columna} onChange={(e) => setColumna(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white">
                <option value="e.Nombres">Nombre del Estudiante</option>
                <option value="e.Apellido1">Apellido</option>
                <option value="e.Num_Documento">Documento</option>
                <option value="u.Curso">Nombre del Curso</option>
                <option value="i.Codigo">Código de Inscripción</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-0.5">Texto a buscar</label>
              <input type="text" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe para buscar..."
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
            </div>

            <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 h-[34px]">
              🔍 Buscar
            </button>
          </div>
        </form>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs text-center">⚠️ {error}</div>}

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-3 text-left">Código</th>
                  <th className="px-3 py-3 text-left">Fecha Inscripción</th>
                  <th className="px-3 py-3 text-left">Estudiante</th>
                  <th className="px-3 py-3 text-left">Curso</th>
                  <th className="px-3 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500"><div className="animate-spin text-2xl inline-block mb-2">⏳</div><br/>Cargando...</td></tr>
                ) : inscripciones.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">No se encontraron inscripciones</td></tr>
                ) : (
                  inscripciones.map(ins => (
                    <tr key={ins.idInscripcion} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono font-bold text-emerald-700">{ins.codigo}</td>
                      <td className="px-3 py-2">{formatDate(ins.fecha)}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{ins.estudiante}</td>
                      <td className="px-3 py-2 text-gray-600">{ins.curso}</td>
                      <td className="px-3 py-2 text-center space-x-1">
                        <button onClick={() => handleImprimir(ins.idInscripcion)} className="text-purple-600 hover:text-purple-800" title="Imprimir">🖨️</button>
                        <button onClick={() => navigate(`/educacion/inscripciones/editar/${ins.idInscripcion}`)} className="text-blue-600 hover:text-blue-800" title="Editar">✏️</button>
                        <button onClick={() => handleEliminar(ins.idInscripcion, ins.codigo)} className="text-red-600 hover:text-red-800" title="Eliminar">🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}