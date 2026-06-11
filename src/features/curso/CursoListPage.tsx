import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cursoApi, type CursoListadoDto } from '../../api/curso.api';

export default function CursoListPage() {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<CursoListadoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarCursos = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = busqueda.trim()
        ? await cursoApi.search(busqueda)
        : await cursoApi.getAll();
      setCursos(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCursos();
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarCursos();
  };

  const handleEliminar = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el curso "${nombre}"?`)) return;
    try {
      await cursoApi.delete(id);
      cargarCursos();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const formatMoney = (value: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value);

  const getTipoDuracionLabel = (tipo: string) => {
    switch (tipo.toUpperCase()) {
      case 'M': return 'Meses';
      case 'S': return 'Semanas';
      case 'D': return 'Días';
      case 'H': return 'Horas';
      default: return tipo;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-3">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">🎓 Gestión de Cursos</h1>
              <p className="text-emerald-100 text-xs">Administra los cursos, instructores y temarios</p>
            </div>
            <button
              onClick={() => navigate('/cursos/nuevo')}
              className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 shadow"
            >
              ➕ Nuevo Curso
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <form onSubmit={handleBuscar} className="bg-white rounded-xl shadow border border-gray-100 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="🔍 Buscar por código, nombre, instructor..."
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
            >
              Buscar
            </button>
            {busqueda && (
              <button
                type="button"
                onClick={() => { setBusqueda(''); setTimeout(cargarCursos, 0); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300"
              >
                Limpiar
              </button>
            )}
          </div>
        </form>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs text-center">
            ⚠️ {error}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-3 text-left">Código</th>
                  <th className="px-3 py-3 text-left">Curso</th>
                  <th className="px-3 py-3 text-left">Nivel</th>
                  <th className="px-3 py-3 text-left">Horario</th>
                  <th className="px-3 py-3 text-right">Inscripción</th>
                  <th className="px-3 py-3 text-right">Mensual</th>
                  <th className="px-3 py-3 text-center">Duración</th>
                  <th className="px-3 py-3 text-center">Cupo</th>
                  <th className="px-3 py-3 text-left">Instructor</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500">
                      <div className="animate-spin text-2xl inline-block mb-2">⏳</div>
                      <br />Cargando cursos...
                    </td>
                  </tr>
                ) : cursos.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-gray-500">
                      No se encontraron cursos
                    </td>
                  </tr>
                ) : (
                  cursos.map(curso => (
                    <tr key={curso.idcurso} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono font-bold text-emerald-700">
                        {curso.codigo}
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-gray-900">{curso.curso}</div>
                        {curso.descripcion && (
                          <div className="text-[10px] text-gray-500 truncate max-w-xs">
                            {curso.descripcion}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          curso.nivel.toLowerCase().includes('básico') ? 'bg-blue-100 text-blue-700' :
                          curso.nivel.toLowerCase().includes('intermedio') ? 'bg-amber-100 text-amber-700' :
                          curso.nivel.toLowerCase().includes('avanzado') ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {curso.nivel}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{curso.horario}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatMoney(curso.valor_Inscripcion)}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">{formatMoney(curso.valor_Mensual)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className="font-bold">{curso.duracion}</span>
                        <span className="text-[9px] text-gray-500 ml-1">
                          {getTipoDuracionLabel(curso.tipo_Duracion)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{curso.cupo_Maximo}</td>
                      <td className="px-3 py-2 font-mono text-gray-700">{curso.idinstructor}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          curso.estado === 'A' ? 'bg-green-100 text-green-700' :
                          curso.estado === 'I' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {curso.estado === 'A' ? '✅ Activo' : curso.estado === 'I' ? '⏸️ Inactivo' : '❌ Eliminado'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center space-x-1">
                        <button
                          onClick={() => navigate(`/cursos/editar/${curso.idcurso}`)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleEliminar(curso.idcurso, curso.curso)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estadísticas */}
        {!loading && cursos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg shadow border border-gray-100 p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Total Cursos</p>
              <p className="text-2xl font-bold text-emerald-700">{cursos.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-100 p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {cursos.filter(c => c.estado === 'A').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-100 p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Cupo Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {cursos.reduce((sum, c) => sum + c.cupo_Maximo, 0)}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow border border-gray-100 p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Instructores</p>
              <p className="text-2xl font-bold text-purple-600">
                {new Set(cursos.map(c => c.idinstructor)).size}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}