import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { estudianteApi, type EstudianteListadoDto } from '../../api/estudiante.api';

export default function EstudianteListPage() {
  const navigate = useNavigate();
  const [estudiantes, setEstudiantes] = useState<EstudianteListadoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cargarEstudiantes = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = busqueda.trim()
        ? await estudianteApi.search(busqueda)
        : await estudianteApi.getAll();
      setEstudiantes(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEstudiantes();
  }, []);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarEstudiantes();
  };

  const handleEliminar = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar al estudiante "${nombre}"?`)) return;
    try {
      await estudianteApi.delete(id);
      cargarEstudiantes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
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
              <h1 className="text-xl font-bold text-white">🎓 Gestión de Estudiantes</h1>
              <p className="text-emerald-100 text-xs">Administra la información de los estudiantes</p>
            </div>
            <button
              onClick={() => navigate('/educacion/estudiantes/nuevo')}
              className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 shadow"
            >
              ➕ Nuevo Estudiante
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
              placeholder="🔍 Buscar por nombre, documento, teléfono, padre..."
              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">
              Buscar
            </button>
            {busqueda && (
              <button type="button" onClick={() => { setBusqueda(''); setTimeout(cargarEstudiantes, 0); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-300">
                Limpiar
              </button>
            )}
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
                  <th className="px-3 py-3 text-left">Estudiante</th>
                  <th className="px-3 py-3 text-left">Documento</th>
                  <th className="px-3 py-3 text-left">Fecha Nac.</th>
                  <th className="px-3 py-3 text-left">Teléfono</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500"><div className="animate-spin text-2xl inline-block mb-2">⏳</div><br/>Cargando...</td></tr>
                ) : estudiantes.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-500">No se encontraron estudiantes</td></tr>
                ) : (
                  estudiantes.map(est => (
                    <tr key={est.idEstudiante} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono font-bold text-emerald-700">{est.codigo}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{est.estudiante}</td>
                      <td className="px-3 py-2 font-mono text-gray-600">{est.num_Documento}</td>
                      <td className="px-3 py-2">{formatDate(est.fecha_Nacimiento)}</td>
                      <td className="px-3 py-2 font-mono">{est.telefono}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          est.estado === 'A' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {est.estado === 'A' ? '✅ Activo' : '❌ Inactivo'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center space-x-1">
                        <button onClick={() => navigate(`/educacion/estudiantes/editar/${est.idEstudiante}`)}
                          className="text-blue-600 hover:text-blue-800" title="Editar">✏️</button>
                        <button onClick={() => handleEliminar(est.idEstudiante, est.estudiante)}
                          className="text-red-600 hover:text-red-800" title="Eliminar">🗑️</button>
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