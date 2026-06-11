import { useState, useEffect, useRef } from 'react';
import { cuentaContableApi, type CuentaContableDto } from '../api/cuentacontable.api';

interface Props {
  value: string;
  onChange: (codigo: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function CuentaContableSelector({
  value,
  onChange,
  disabled = false,
  placeholder = 'Buscar cuenta contable...'
}: Props) {
  const [texto, setTexto] = useState('');
  const [resultados, setResultados] = useState<CuentaContableDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaContableDto | null>(null);
  const [error, setError] = useState('');
  
  // ═══ Estados para el MODAL ═══
  const [showModal, setShowModal] = useState(false);
  const [todasLasCuentas, setTodasLasCuentas] = useState<CuentaContableDto[]>([]);
  const [filtroModal, setFiltroModal] = useState('');
  const [loadingModal, setLoadingModal] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // ═══════════════════════════════════════════════════════════════
  // 📥 Cargar cuenta inicial si ya hay un valor
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (value && !cuentaSeleccionada) {
      cuentaContableApi.buscar(value)
        .then(({ data }) => {
          const cuenta = data.find(c => c.num_Cuenta === value);
          if (cuenta) {
            setCuentaSeleccionada(cuenta);
            setTexto(`${cuenta.num_Cuenta} - ${cuenta.nombre}`);
          } else {
            setTexto(value);
          }
        })
        .catch(() => setTexto(value));
    }
  }, [value]);

  // ═══════════════════════════════════════════════════════════════
  // 🔍 Búsqueda con debounce (300ms)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (texto.length < 2) {
      setResultados([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await cuentaContableApi.buscar(texto);
        setResultados(data.slice(0, 20));
        setShowDropdown(data.length > 0);
        
        if (data.length === 0) {
          setError('No se encontraron cuentas');
        }
      } catch (err: any) {
        console.error('❌ Error buscando cuentas:', err);
        setError(err.response?.data?.message || 'Error al buscar');
        setResultados([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [texto]);

  // ═══════════════════════════════════════════════════════════════
  // 📥 Cargar todas las cuentas al abrir el modal
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (showModal && todasLasCuentas.length === 0) {
      setLoadingModal(true);
      cuentaContableApi.getAll()
        .then(({ data }) => {
          setTodasLasCuentas(data);
        })
        .catch((err) => {
          console.error('❌ Error cargando cuentas:', err);
        })
        .finally(() => {
          setLoadingModal(false);
        });
    }
    
    // Enfocar el input del modal cuando se abre
    if (showModal) {
      setTimeout(() => modalInputRef.current?.focus(), 100);
    }
  }, [showModal]);

  // ═══════════════════════════════════════════════════════════════
  // 🖱️ Cerrar dropdown al hacer clic fuera
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // ✅ Seleccionar cuenta
  // ═══════════════════════════════════════════════════════════════
  const handleSelect = (cuenta: CuentaContableDto) => {
    setCuentaSeleccionada(cuenta);
    setTexto(`${cuenta.num_Cuenta} - ${cuenta.nombre}`);
    onChange(cuenta.num_Cuenta);
    setShowDropdown(false);
    setShowModal(false);
    setError('');
  };

  // ═══════════════════════════════════════════════════════════════
  // ❌ Limpiar selección
  // ═══════════════════════════════════════════════════════════════
  const handleClear = () => {
    setCuentaSeleccionada(null);
    setTexto('');
    onChange('');
    setResultados([]);
    setError('');
    inputRef.current?.focus();
  };

  // ═══════════════════════════════════════════════════════════════
  // 🔍 Filtrar cuentas en el modal
  // ═══════════════════════════════════════════════════════════════
  const cuentasFiltradas = todasLasCuentas.filter(cuenta => {
    if (!filtroModal) return true;
    const filtro = filtroModal.toLowerCase();
    return (
      cuenta.num_Cuenta.toLowerCase().includes(filtro) ||
      cuenta.nombre.toLowerCase().includes(filtro) ||
      cuenta.descripcion?.toLowerCase().includes(filtro) ||
      cuenta.grupo?.toLowerCase().includes(filtro)
    );
  });

  return (
    <>
      <div ref={containerRef} className="relative">
        <div className="flex gap-1">
          {/* Input de búsqueda */}
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value);
                if (cuentaSeleccionada) {
                  setCuentaSeleccionada(null);
                  onChange('');
                }
              }}
              onFocus={() => texto.length >= 2 && setShowDropdown(true)}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none pr-7 ${
                error ? 'border-red-300' : 'border-gray-200'
              } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
            />
            
            {loading && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                ⏳
              </span>
            )}
            
            {cuentaSeleccionada && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                title="Limpiar selección"
              >
                ✕
              </button>
            )}
          </div>

          {/* ═══ BOTÓN PARA ABRIR MODAL ═══ */}
          <button
            type="button"
            onClick={() => !disabled && setShowModal(true)}
            disabled={disabled}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 ${
              disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
            title="Abrir selector de cuentas contables"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden sm:inline">Buscar</span>
          </button>
        </div>

        {/* ═══ Información de la cuenta seleccionada ═══ */}
        {cuentaSeleccionada && (
          <div className="mt-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-[10px] flex items-center gap-1">
            <span className="text-emerald-600">✅</span>
            <span className="font-mono font-bold text-emerald-800">
              {cuentaSeleccionada.num_Cuenta}
            </span>
            <span className="text-gray-600">— {cuentaSeleccionada.nombre}</span>
          </div>
        )}

        {/* ═══ Dropdown de resultados ═══ */}
        {showDropdown && resultados.length > 0 && (
          <div className="absolute z-30 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {resultados.map((cuenta) => (
              <button
                key={cuenta.num_Cuenta}
                type="button"
                onClick={() => handleSelect(cuenta)}
                className="w-full px-3 py-2 text-left hover:bg-emerald-50 border-b last:border-0 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-700">
                        {cuenta.num_Cuenta}
                      </span>
                      <span className="text-xs text-gray-900 truncate">
                        {cuenta.nombre}
                      </span>
                    </div>
                    {cuenta.descripcion && (
                      <div className="text-[10px] text-gray-500 truncate mt-0.5">
                        {cuenta.descripcion}
                      </div>
                    )}
                  </div>
                  {cuenta.grupo && (
                    <span className="px-1.5 py-0.5 text-[9px] bg-gray-100 text-gray-600 rounded shrink-0">
                      {cuenta.grupo}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ═══ Mensaje de error ═══ */}
        {error && texto.length >= 2 && !loading && (
          <div className="mt-1 text-[10px] text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* ═══ Helper text ═══ */}
        {!cuentaSeleccionada && !error && (
          <p className="text-[10px] text-gray-400 mt-0.5">
            💡 Escribe para buscar o haz clic en <strong>Buscar</strong> para ver todas
          </p>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MODAL DE SELECCIÓN DE CUENTAS
          ═══════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            
            {/* Header del modal */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="text-white text-lg">📊</span>
                <h3 className="text-sm font-bold text-white">Selector de Cuentas Contables</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-emerald-800 rounded-lg p-1 transition-colors"
                title="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Input de búsqueda en el modal */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={modalInputRef}
                  type="text"
                  value={filtroModal}
                  onChange={(e) => setFiltroModal(e.target.value)}
                  placeholder="Filtrar por código, nombre o descripción..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {filtroModal && (
                  <button
                    type="button"
                    onClick={() => setFiltroModal('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Mostrando {cuentasFiltradas.length} de {todasLasCuentas.length} cuentas
              </p>
            </div>

            {/* Lista de cuentas */}
            <div className="flex-1 overflow-y-auto p-2">
              {loadingModal ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin text-3xl mb-2">⏳</div>
                    <p className="text-sm text-gray-500">Cargando cuentas contables...</p>
                  </div>
                </div>
              ) : cuentasFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm text-gray-500">
                    {filtroModal ? 'No se encontraron cuentas con ese filtro' : 'No hay cuentas disponibles'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {cuentasFiltradas.map((cuenta) => (
                    <button
                      key={cuenta.num_Cuenta}
                      type="button"
                      onClick={() => handleSelect(cuenta)}
                      className={`w-full px-3 py-2 text-left rounded-lg transition-colors border ${
                        cuentaSeleccionada?.num_Cuenta === cuenta.num_Cuenta
                          ? 'bg-emerald-100 border-emerald-400'
                          : 'bg-white border-gray-200 hover:bg-emerald-50 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-emerald-700">
                              {cuenta.num_Cuenta}
                            </span>
                            <span className="text-sm text-gray-900 font-medium">
                              {cuenta.nombre}
                            </span>
                            {cuentaSeleccionada?.num_Cuenta === cuenta.num_Cuenta && (
                              <span className="text-emerald-600 text-xs">✓ Seleccionada</span>
                            )}
                          </div>
                          {cuenta.descripcion && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {cuenta.descripcion}
                            </div>
                          )}
                        </div>
                        {cuenta.grupo && (
                          <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded-full shrink-0">
                            {cuenta.grupo}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer del modal */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              {cuentaSeleccionada && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-4 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  🗑️ Limpiar selección
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}