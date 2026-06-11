import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  cotizacionApi, 
  type CotizacionSaveDto, 
  type CotizacionDetalleSaveDto,
  type VendedorDto
} from '../../api/cotizacion.api';
import { clienteApi, type ClienteDto } from '../../api/cliente.api';
import { useAuthStore } from '../../store/authStore';
import CotizacionDetalleTable, { type CotizacionDetalleDtoWithMeta } from '../../components/CotizacionDetalleTable';
import ClienteSelector from '../../components/ClienteSelector';

export default function CotizacionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [form, setForm] = useState({
    tipo: 'P',
    no_Cotizacion: '',
    fecha: new Date().toISOString().split('T')[0],
    idcliente: 0,
    descripcion: '',
    tasaItbis: 0.18,
    tasaDescuentoGlobal: 0,
    subtotal: 0,
    montoDescuento: 0,
    montoItbis: 0,
    total: 0,
  });
  
  const [detalles, setDetalles] = useState<CotizacionDetalleDtoWithMeta[]>([]);
  const [detallesAEliminar, setDetallesAEliminar] = useState<number[]>([]);
  const [vendedores, setVendedores] = useState<VendedorDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savedIdCotizacion, setSavedIdCotizacion] = useState<number | null>(null);
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);
  const [esExento, setEsExento] = useState(false);
  const [secuenciaCargada, setSecuenciaCargada] = useState(false);
  
  const idEmpresa = user?.idempresa ?? 1;
  const esEdicion = !!id;

  const extractIdFromResponse = (response: any): number | null => {
    if (typeof response === 'number' && response > 0) return response;
    const data = response?.data || response;
    if (data?.idCotizacion && typeof data.idCotizacion === 'number' && data.idCotizacion > 0) return data.idCotizacion;
    if (data?.id && typeof data.id === 'number' && data.id > 0) return data.id;
    return null;
  };

  const getSafeIdCotizacion = (): number | null => {
    if (esEdicion && id) {
      const parsed = parseInt(id, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (savedIdCotizacion !== null && savedIdCotizacion !== undefined) {
      const parsed = Number(savedIdCotizacion);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
  };

  useEffect(() => {
    if (esEdicion && id) {
      loadCotizacion(parseInt(id, 10));
    }
    loadVendedores();
  }, [id, esEdicion, idEmpresa]);

  useEffect(() => {
    const cargarSecuencia = async () => {
      if (!esEdicion && !secuenciaCargada) {
        try {
          const { data } = await cotizacionApi.getSecuencia(form.tipo, idEmpresa);
          setForm(prev => ({ ...prev, no_Cotizacion: data.siguienteNumero }));
          setSecuenciaCargada(true);
        } catch (err) {
          console.warn('No se pudo cargar la secuencia:', err);
          setForm(prev => ({ ...prev, no_Cotizacion: '0000000001' }));
        }
      }
    };
    cargarSecuencia();
  }, [esEdicion, form.tipo, idEmpresa, secuenciaCargada]);

  const loadCotizacion = async (idCotizacion: number) => {
    setLoading(true);
    try {
      const { data: cotizacion } = await cotizacionApi.getCotizacionById(idCotizacion);
      
      if (cotizacion.idcliente > 0) {
        try {
          const { data: clienteData } = await clienteApi.getById(cotizacion.idcliente);
          setClienteSeleccionado(clienteData);
        } catch (err) { 
          console.warn('No se pudo cargar el cliente:', err); 
        }
      }
      
      setForm({
        tipo: cotizacion.tipo?.toString() || 'P',
        no_Cotizacion: cotizacion.no_Cotizacion || '',
        fecha: cotizacion.fecha?.split('T')[0] || new Date().toISOString().split('T')[0],
        idcliente: cotizacion.idcliente,
        descripcion: cotizacion.descripcion || '',
        tasaDescuentoGlobal: cotizacion.descuento != null && cotizacion.descuento > 1 
          ? cotizacion.descuento / (cotizacion.subtotal || 1)
          : (cotizacion.descuento ?? 0),
        tasaItbis: cotizacion.itbis != null && cotizacion.itbis > 1 
          ? cotizacion.itbis / (cotizacion.subtotal || 1)
          : (cotizacion.itbis ?? 0.18),
        subtotal: cotizacion.subtotal ?? 0,
        montoDescuento: cotizacion.descuento != null && cotizacion.descuento > 1
          ? cotizacion.descuento
          : (cotizacion.subtotal || 0) * (cotizacion.descuento ?? 0),
        montoItbis: cotizacion.itbis != null && cotizacion.itbis > 1
          ? cotizacion.itbis
          : (cotizacion.subtotal || 0) * (cotizacion.itbis ?? 0.18),
        total: cotizacion.total ?? 0,
      });
      
      const { data: detallesData } = await cotizacionApi.getDetails(idCotizacion);
      setDetalles(detallesData.map(d => ({ ...d, __modified: false })));
      setSavedIdCotizacion(cotizacion.idcotizacion);
      
    } catch (err: any) {
      console.error('Error al cargar pedido:', err);
      setError('No se pudieron cargar los datos: ' + (err.message || 'Error desconocido'));
    } finally { 
      setLoading(false); 
    }
  };

  const loadVendedores = async () => {
    try {
      const { data } = await cotizacionApi.getVendedores(idEmpresa);
      setVendedores(data);
    } catch (err) { 
      console.error('Error al cargar vendedores:', err); 
    }
  };

  const handleClienteSelect = (cliente: ClienteDto) => {
    setClienteSeleccionado(cliente);
    setForm(prev => ({
      ...prev,
      idcliente: cliente.idcliente,
      tasaDescuentoGlobal: (cliente.descuento ?? 0) <= 1 
        ? cliente.descuento ?? 0 
        : prev.tasaDescuentoGlobal,
    }));
  };

  const handleRemoveCliente = () => {
    setClienteSeleccionado(null);
    setForm(prev => ({ ...prev, idcliente: 0 }));
  };

  const totals = useMemo(() => {
    const subtotal = detalles.reduce((sum, d) => sum + (d.subtotal ?? 0), 0);
    const descuentoLineas = detalles.reduce((sum, d) => {
      const base = d.subtotal ?? 0;
      const tasaDesc = (d.descuento ?? 0) <= 1 ? (d.descuento ?? 0) : 0;
      return sum + (base * tasaDesc);
    }, 0);
    const descuentoGlobal = subtotal * (form.tasaDescuentoGlobal ?? 0);
    const montoDescuento = descuentoLineas + descuentoGlobal;
    const baseImponible = subtotal - montoDescuento;
    const montoItbis = esExento ? 0 : baseImponible * (form.tasaItbis ?? 0.18);
    const total = baseImponible + montoItbis;
    return { subtotal, montoDescuento, montoItbis, total };
  }, [detalles, esExento, form.tasaDescuentoGlobal, form.tasaItbis]);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      subtotal: totals.subtotal,
      montoDescuento: totals.montoDescuento,
      montoItbis: totals.montoItbis,
      total: totals.total,
    }));
  }, [totals]);

  const handleDetailsChange = (newDetalles: CotizacionDetalleDtoWithMeta[]) => {
    setDetalles(newDetalles);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.idcliente || form.idcliente <= 0) { 
      setError('Debe seleccionar un cliente'); 
      return; 
    }
    
    setLoading(true); 
    setError('');
    
    try {
      let idCotizacion: number | null = getSafeIdCotizacion();
      
      const payload: CotizacionSaveDto = {
        tipo: form.tipo,
        no_Cotizacion: form.no_Cotizacion,
        nombre_Cliente: clienteSeleccionado?.razon_Social || clienteSeleccionado?.nombre_Comercial || 'CLIENTE GENERAL',
        fecha: form.fecha,
        idcliente: form.idcliente,
        descripcion: form.descripcion || '',
        descuento: form.tasaDescuentoGlobal ?? 0,
        itbis: esExento ? 0 : totals.montoItbis,
        subtotal: totals.subtotal || 0,
      };

      if (esEdicion && idCotizacion) {
        await cotizacionApi.update(idCotizacion, payload);
      } else {
        const response = await cotizacionApi.create(payload, idEmpresa);
        const newId = extractIdFromResponse(response);
        if (!newId || newId <= 0) throw new Error('El servidor no devolvió un ID válido');
        idCotizacion = newId;
        setSavedIdCotizacion(newId);
      }

      if (!idCotizacion) throw new Error('No se pudo obtener el ID para guardar detalles');

      if (esEdicion && detallesAEliminar.length > 0) {
        await Promise.all(detallesAEliminar.map(idDet => cotizacionApi.deleteDetail(idDet)));
        setDetallesAEliminar([]);
      }

      
      if (detalles.length > 0) {
        await Promise.all(
          detalles.filter(d => !d.iddetalle || d.__modified).map(async (det) => {
            
            const detalleDto: CotizacionDetalleSaveDto = {
              idcotizacion: idCotizacion!,
              idarticulo: det.iddetalleProducto ?? det.iddetalle_Producto,
              cantidad: det.cantidad,
              medida: det.medida,
              precio: det.precio,
              itbis: det.p_Itbis,
              // 🔑 CRÍTICO: Asegurar que sean TASAS (0.00 - 1.00) y redondear a 3 decimales (SQL decimal(4,3))
  descuento: 
    Math.round(
      ((det.descuento ?? 0) > 1 ? (det.descuento ?? 0) / 100 : (det.descuento ?? 0)) * 1000
    ) / 1000
  ,
            };
// ✅ Validación preventiva antes de llamar a la API
if (detalleDto.descuento < 0 || detalleDto.descuento > 1) {
  throw new Error(`Descuento inválido en detalle: ${detalleDto.descuento}. Debe estar entre 0 y 1.`);
}
if (detalleDto.itbis < 0 || detalleDto.itbis > 1) {
  throw new Error(`ITBIS inválido en detalle: ${detalleDto.itbis}. Debe estar entre 0 y 1.`);
}
            if (det.iddetalle && det.iddetalle > 0) {
              await cotizacionApi.updateDetail(det.iddetalle, detalleDto);
            } else {
              await cotizacionApi.addDetail(idCotizacion!, detalleDto);
            }
          })
        );
      }

      alert('✅ Cotización guardada correctamente');
      navigate('/pedidos');
      
    } catch (err: any) {
      console.error('❌ Error al guardar:', err);
      setError(err.response?.data?.message || err.response?.data?.title || err.message || 'Error al guardar');
    } finally { 
      setLoading(false); 
    }
  };

  const formatMoney = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return '0.00';
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP', 
      minimumFractionDigits: 2 
    }).format(value);
  };

  if (loading && esEdicion && detalles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700 mx-auto"></div>
          <p className="mt-2 text-emerald-800 text-sm">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">
                {esEdicion ? '✏️ Editar' : '📄 Nuevo'} Pedido
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-400 text-emerald-900 text-xs font-bold">
                #{form.no_Cotizacion || 'Generando...'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/pedidos')}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white rounded-lg hover:bg-gray-50 transition shadow"
              >
                Cancelar
              </button>
              <button
                form="cotizacion-form"
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando
                  </>
                ) : (
                  <>💾 Guardar</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Error message compacto */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-2 text-xs text-red-700 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        <form id="cotizacion-form" onSubmit={handleSubmit} className="space-y-2">
          
          {/* Tarjeta: Información General - Compacta */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-3 py-1.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                Información General
              </h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">No. Cotización</label>
                  <input
                    type="text"
                    value={String(form.no_Cotizacion)}
                    onChange={(e) => setForm({ ...form, no_Cotizacion: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 font-mono focus:ring-1 focus:ring-emerald-500"
                    readOnly={!esEdicion}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={form.fecha}
                    onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Vendedor</label>
                  <select
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                    defaultValue=""
                  >
                    <option value="" disabled>Seleccionar...</option>
                    {vendedores.map(v => (
                      <option key={v.idempleado} value={v.idempleado}>{v.nombres}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cliente - destacado compacto */}
              <div className="bg-gradient-to-r from-emerald-50 via-yellow-50 to-orange-50 rounded-lg border border-emerald-200 p-2">
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700">
                      📇 Documento *
                      {clienteSeleccionado && (
                        <button type="button" onClick={handleRemoveCliente} className="ml-1 text-[10px] text-red-600 hover:underline">Quitar</button>
                      )}
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        required
                        value={clienteSeleccionado?.num_Documento || ''}
                        readOnly
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50 font-mono"
                        placeholder="RNC/Cédula"
                      />
                      <button
                        type="button"
                        onClick={() => setShowClienteSelector(true)}
                        className="px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 flex items-center gap-0.5 shadow"
                      >
                        🔍
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700">👤 Cliente *</label>
                    <input
                      type="text"
                      required
                      value={clienteSeleccionado?.razon_Social || clienteSeleccionado?.nombre_Comercial || ''}
                      readOnly
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-gray-50"
                      placeholder="Seleccione un cliente"
                    />
                    {clienteSeleccionado && (
                      <div className="mt-0.5 flex gap-2 text-[10px] text-gray-500">
                        {clienteSeleccionado.telefono && <span>📞 {clienteSeleccionado.telefono}</span>}
                        {clienteSeleccionado.limite > 0 && <span>💳 Límite: {formatMoney(clienteSeleccionado.limite)}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción compacta */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Nota</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={1}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 resize-none"
                  placeholder="Observaciones..."
                />
              </div>
            </div>
          </div>

          {/* Tarjeta: Detalles */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-3 py-1.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                Detalles de Productos
              </h3>
            </div>
            <div className="p-0">
              <CotizacionDetalleTable
                idCotizacion={getSafeIdCotizacion()}
                idEmpresa={idEmpresa}
                detalles={detalles}
                onDetailsChange={handleDetailsChange}
                onEliminar={(idDetalle) => {
                  if (idDetalle) setDetallesAEliminar(prev => [...prev, idDetalle]);
                  setDetalles(prev => prev.filter(d => d.iddetalle !== idDetalle));
                }}
              />
            </div>
          </div>

          {/* Tarjeta: Totales y Configuración - Compacta */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-3 py-1.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                Totales & Configuración
              </h3>
            </div>
            <div className="p-3">
              <div className="flex flex-col md:flex-row justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700">ITBIS</label>
                      <div className="flex gap-1 mt-0.5">
                        <button
                          type="button"
                          onClick={() => setEsExento(true)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${esExento ? 'bg-emerald-600 text-white ring-1 ring-emerald-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          Exento
                        </button>
                        <button
                          type="button"
                          onClick={() => setEsExento(false)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${!esExento ? 'bg-emerald-600 text-white ring-1 ring-emerald-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          Gravado
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700">Desc. Global (%)</label>
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={form.tasaDescuentoGlobal * 100}
                          onChange={(e) => setForm({ ...form, tasaDescuentoGlobal: (parseFloat(e.target.value) || 0) / 100 })}
                          className="w-20 px-1 py-0.5 border border-gray-300 rounded text-xs text-center focus:ring-1 focus:ring-orange-500"
                        />
                        <span className="text-[10px] text-gray-500">%</span>
                        <span className="text-[10px] text-gray-500 ml-1">Monto: {formatMoney(totals.montoDescuento)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Totales resumen compacto */}
                <div className="w-full md:w-64 bg-gradient-to-br from-emerald-50 to-orange-50 p-2 rounded-lg border border-emerald-200 shadow-sm">
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-gray-700">Subtotal:</span><span className="font-mono">{formatMoney(totals.subtotal)}</span></div>
                    <div className="flex justify-between text-red-600"><span>Descuento:</span><span className="font-mono">-{formatMoney(totals.montoDescuento)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-700">Base:</span><span className="font-mono">{formatMoney(totals.subtotal - totals.montoDescuento)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-700">ITBIS:</span><span className="font-mono">{formatMoney(totals.montoItbis)}</span></div>
                    <div className="border-t border-emerald-300 pt-1 mt-1 flex justify-between font-bold text-emerald-800">
                      <span>Total:</span>
                      <span className="text-base font-mono text-orange-600">{formatMoney(totals.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        <ClienteSelector 
          isOpen={showClienteSelector} 
          onClose={() => setShowClienteSelector(false)} 
          onSelect={handleClienteSelect} 
        />
      </div>
    </div>
  );
}