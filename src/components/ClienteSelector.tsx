import { useState, useEffect, useRef } from 'react';
import { clienteApi, type ClienteDto } from '../api/cliente.api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cliente: ClienteDto) => void;
  idEmpresa?: number;
}

export default function ClienteSelector({ 
  isOpen, 
  onClose, 
  onSelect,
  idEmpresa = 1 
}: Props) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<ClienteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seleccionado, setSeleccionado] = useState<ClienteDto | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // ═══ Enfocar input al abrir modal ═══
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setTexto('');
      setResultados([]);
      setSeleccionado(null);
      setError('');
    }
  }, [isOpen]);

  // ═══ Búsqueda con debounce (300ms) ═══
  useEffect(() => {
    if (!isOpen) return;
    
    if (texto.trim().length < 2) {
      setResultados([]);
      setError('');
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await clienteApi.buscarActivos(texto.trim());
        setResultados(data);
        
        if (data.length === 0) {
          setError('No se encontraron clientes');
        }
      } catch (err: any) {
        console.error('❌ Error buscando clientes:', err);
        setError(err.response?.data?.message || 'Error al buscar clientes');
        setResultados([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [texto, isOpen, idEmpresa]);

  // ═══ Seleccionar cliente ═══
  const handleSelect = (cliente: ClienteDto) => {
    setSeleccionado(cliente);
  };

  // ═══ Confirmar selección ═══
  const handleConfirmar = () => {
    if (seleccionado) {
      onSelect(seleccionado);
    }
  };

  // ═══ Cerrar con ESC ═══
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-t-xl">
          <div className="flex items-center gap-2">
            <span className="text-white text-lg">👥</span>
            <h3 className="text-sm font-bold text-white">Selector de Clientes</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-emerald-800 rounded-lg p-1 transition-colors"
            title="Cerrar (ESC)"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input de búsqueda */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="🔍 Buscar por código, nombre, RNC o cédula..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⏳</span>
            )}
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            {resultados.length > 0 
              ? `${resultados.length} cliente(s) encontrado(s)`
              : texto.length < 2 
                ? 'Escribe al menos 2 caracteres para buscar'
                : ''}
          </p>
        </div>

        {/* Lista de resultados */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin text-3xl mb-2">⏳</div>
                <p className="text-sm text-gray-500">Buscando clientes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">🔍</div>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          ) : resultados.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm text-gray-500">
                {texto.length < 2 
                  ? 'Comienza a escribir para buscar clientes'
                  : 'No se encontraron clientes'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {resultados.map((cliente) => (
                <button
                  key={cliente.idcliente}
                  type="button"
                  onClick={() => handleSelect(cliente)}
                  className={`w-full px-3 py-2 text-left rounded-lg transition-colors border ${
                    seleccionado?.idcliente === cliente.idcliente
                      ? 'bg-emerald-100 border-emerald-400'
                      : 'bg-white border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-emerald-700">
                          {cliente.codigo}
                        </span>
                        <span className="text-sm text-gray-900 font-medium truncate">
                          {cliente.razon_Social || cliente.nombre_Comercial}
                        </span>
                        {seleccionado?.idcliente === cliente.idcliente && (
                          <span className="text-emerald-600 text-xs">✓ Seleccionado</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-gray-600">
                        {cliente.num_Documento && (
                          <span className="font-mono">📋 {cliente.num_Documento}</span>
                        )}
                        {cliente.telefono && (
                          <span>📞 {cliente.telefono}</span>
                        )}
                        {cliente.email && (
                          <span>✉️ {cliente.email}</span>
                        )}
                      </div>
                    </div>
                    {cliente.limite && cliente.limite > 0 && (
                      <div className="text-right shrink-0">
                        <p className="text-[9px] text-gray-500 uppercase">Límite</p>
                        <p className="text-xs font-bold text-emerald-700">
                          {new Intl.NumberFormat('es-DO', {
                            style: 'currency',
                            currency: 'DOP'
                          }).format(cliente.limite)}
                        </p>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-between items-center">
          <div className="text-xs text-gray-600">
            {seleccionado ? (
              <span className="text-emerald-700 font-medium">
                ✓ {seleccionado.codigo} - {seleccionado.razon_Social || seleccionado.nombre_Comercial}
              </span>
            ) : (
              <span>Selecciona un cliente para continuar</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmar}
              disabled={!seleccionado}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ✓ Confirmar Selección
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}