import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clienteApi } from '../../api/cliente.api';
import type { ClienteDto } from '../../api/cliente.api';

export default function ClienteListPage() {
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const fetchClientes = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await clienteApi.getAll();
      setClientes(data || []);
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
      setError(err.message || 'No se pudieron cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleDelete = async (id: number, nombre: string) => {
    if (!confirm(`¿Estás seguro de eliminar a "${nombre}"?`)) return;
    try {
      await clienteApi.delete(id);
      setClientes(prev => prev.filter(c => c.idcliente !== id));
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message || 'Intente nuevamente'}`);
    }
  };

  // Filtrado seguro contra valores nulos
  const clientesFiltrados = clientes.filter(c => {
    const razon = (c.razon_Social ?? '').toLowerCase();
    const documento = String(c.num_Documento ?? '');
    const term = busqueda.toLowerCase();
    return razon.includes(term) || documento.includes(term);
  });

    const formatMoney = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0.00';
    return new Intl.NumberFormat('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header compacto EmmaSystem */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-1">👥 Clientes</h1>
              <p className="text-emerald-100 text-[11px]">Gestión de cartera de clientes y límites de crédito.</p>
            </div>
            <Link
              to="/clientes/nuevo"
              className="px-3 py-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1"
            >
              ➕ Nuevo Cliente
            </Link>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-2 text-xs text-red-700 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Buscador compacto */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="p-3">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por razón social o documento..."
                className="w-full pl-8 pr-8 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <button onClick={() => setBusqueda('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <div className="mt-1 text-[10px] text-gray-500">
              {clientesFiltrados.length} de {clientes.length} clientes
            </div>
          </div>
        </div>

        {/* Tabla compacta con iconos profesionales */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50">
                <tr>
                  <th className="py-2 pl-3 pr-2 text-left text-xs font-semibold text-emerald-800">Código</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-emerald-800">Razón Social</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-emerald-800">Documento</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-emerald-800">Balance</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-emerald-800">Estado</th>
                  <th className="relative py-2 pr-3 pl-2 text-right text-xs font-semibold text-emerald-800">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-gray-500">Cargando...</td>
                  </tr>
                ) : clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-gray-500">No se encontraron clientes.</td>
                  </tr>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <tr key={cliente.idcliente} className="hover:bg-orange-50 transition-colors">
                      <td className="whitespace-nowrap py-2 pl-3 pr-2 text-xs font-medium text-gray-800">
                        {cliente.codigo}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600">
                        <div className="font-medium text-gray-800">{cliente.razon_Social}</div>
                        <div className="text-[10px] text-gray-400">{cliente.nombre_Comercial}</div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-xs font-mono text-gray-600">
                        {cliente.num_Documento}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-xs font-medium text-emerald-700 text-right">
                        {formatMoney(cliente.balance)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-xs">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          cliente.estado === 'A' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {cliente.estado === 'A' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 pl-2 text-right text-xs font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Editar con icono SVG */}
                          <Link
                            to={`/clientes/editar/${cliente.idcliente}`}
                            className="p-1.5 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                            title="Modificar cliente"
                          >
                            <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Link>
                          {/* Botón Eliminar con icono SVG */}
                          <button
                            onClick={() => handleDelete(cliente.idcliente, cliente.razon_Social)}
                            className="p-1.5 rounded-md bg-red-50 hover:bg-red-100 transition-colors"
                            title={cliente.balance !== 0 ? 'Únicamente los clientes con balance igual a cero pueden ser eliminados.' : 'Eliminar cliente'}
disabled={cliente.balance !== 0}
                          >
                            <svg className="w-3.5 h-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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