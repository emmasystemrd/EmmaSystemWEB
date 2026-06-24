import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ventaApi, type FacturaReporteDto, type FacturaDetalleReporteDto, type VentaPagoDto } from '../api/venta.api';
import { empresaApi, type EmpresaDto } from '../api/empresa.api';
import { useAuthStore } from '../store/authStore';

interface EcfDatosDto {
  secuencia: string;
  codigoSeguridad: string | null;
  fechaFirma: string | null;
  ambiente: number;
  estadoEcf: string | null;
}

export default function FacturaPrintPage() {
  const { noFactura } = useParams<{ noFactura: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const idEmpresa = user?.idempresa ?? 1;

  const [cabecera, setCabecera] = useState<FacturaReporteDto | null>(null);
  const [detalles, setDetalles] = useState<FacturaDetalleReporteDto[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null);
  const [pago, setPago] = useState<VentaPagoDto | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // ✅ NUEVO: Datos ECF para QR
  const [ecfDatos, setEcfDatos] = useState<EcfDatosDto | null>(null);

  // ═══ FUNCIONES HELPER ═══
  const formatMoney = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return 'RD$ 0.00';
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatFechaFirma = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
    } catch (err) {
      console.error('Error formateando fecha:', dateStr, err);
      return 'N/A';
    }
  };

  const getTituloFactura = (tipo: string) => {
    switch (tipo) {
      case '31': return 'Factura de Crédito Fiscal Electrónica';
      case '32': return 'Factura de Consumo Electrónica';
      case '44': return 'Regímenes Especiales Electrónico';
      case '45': return 'Comprobante Gubernamental Electrónico';
      case '46': return 'Comprobante electrónico para exportaciones';
      default: return 'Comprobante Fiscal';
    }
  };

  const getNombreAmbiente = (ambiente: number) => {
    switch (ambiente) {
      case 1: return 'certecf';
      case 2: return 'ecf';
      default: return 'testecf';
    }
  };

  // ✅ NUEVO: Determinar si es comprobante electrónico
  const esComprobanteElectronico = (ncf: string): boolean => {
    if (!ncf) return false;
    return ncf.trim().startsWith('E') && ncf.trim().length === 13;
  };

  // ✅ NUEVO: Generar URL del QR
  const generarUrlQR = useMemo(() => {
    if (!cabecera || !ecfDatos || !empresa) {
      console.log('❌ QR: Faltan datos', { cabecera: !!cabecera, ecfDatos: !!ecfDatos, empresa: !!empresa });
      return null;
    }
    
    const ncf = cabecera.ncf;
    if (!esComprobanteElectronico(ncf)) {
      console.log('❌ QR: No es comprobante electrónico:', ncf);
      return null;
    }
    
    const rncEmisor = empresa.rnc?.replace(/-/g, '') || '';
    const rncComprador = cabecera.num_Documento?.replace(/-/g, '') || '';
    const montoTotal = Math.round(cabecera.total * 100) / 100;
    const codigoSeguridad = ecfDatos.codigoSeguridad || '';
    const ambienteNombre = getNombreAmbiente(ecfDatos.ambiente);
    const fechaEmision = new Date(cabecera.fecha).toLocaleDateString('es-DO', { 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    }).replace(/\//g, '-');
    const fechaFirma = ecfDatos.fechaFirma 
      ? formatFechaFirma(ecfDatos.fechaFirma).replace(' ', '%20')
      : '';

    // Calcular Gravado + Exento (para determinar si es consumo ≤ 250k)
    const gravado = cabecera.subtotal || 0;
    const exento = 0; // Ajustar si tienes campo de exento
    const totalGravadoExento = gravado + exento;

    console.log('✅ QR: Generando URL con datos:', {
      ncf,
      rncEmisor,
      codigoSeguridad,
      ambiente: ambienteNombre,
      montoTotal,
      totalGravadoExento
    });

    // ✅ LÓGICA IGUAL AL DESKTOP
    if (ncf.includes('E32') && totalGravadoExento <= 250000) {
      // Consumo ≤ 250k - URL simplificada
      return `https://fc.dgii.gov.do/${ambienteNombre}/consultatimbrefc?rncemisor=${rncEmisor}&encf=${ncf}&montototal=${montoTotal.toFixed(2)}&codigoseguridad=${encodeURIComponent(codigoSeguridad)}`;
    } else {
      // Crédito Fiscal, NC, ND, Consumo > 250k - URL completa
      return `https://ecf.dgii.gov.do/${ambienteNombre}/ConsultaTimbre?RncEmisor=${rncEmisor}&RncComprador=${rncComprador}&ENCF=${ncf}&FechaEmision=${fechaEmision}&MontoTotal=${montoTotal.toFixed(2)}&FechaFirma=${fechaFirma}&CodigoSeguridad=${encodeURIComponent(codigoSeguridad)}`;
    }
  }, [cabecera, ecfDatos, empresa]);

  // ═══ useEffect: Carga de datos ═══
  useEffect(() => {
    const fetchData = async () => {
      if (!noFactura) {
        setError('No se proporcionó un NCF');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      
      try {
        console.log('🔄 Iniciando carga de factura:', noFactura);
        
        // 1. Cargar datos básicos en paralelo
        const [cabRes, empRes, pagoRes] = await Promise.all([
          ventaApi.getFacturaReporte(noFactura),
          empresaApi.getById(idEmpresa),
          ventaApi.getPagoInfo(noFactura).catch(err => {
            console.warn('⚠️ Error cargando pago (no crítico):', err.message);
            return { data: null };
          })
        ]);

        console.log('✅ Cabecera cargada:', cabRes.data);
        console.log('✅ Empresa cargada:', empRes.data);
        
        setCabecera(cabRes.data);
        setEmpresa(empRes.data);
        
        if (pagoRes.data) {
          setPago(pagoRes.data);
          console.log('✅ Pago cargado:', pagoRes.data);
        }

        // 2. Cargar logo (no crítico si falla)
        try {
          const logoRes = await empresaApi.getLogo(idEmpresa);
          if (logoRes.data?.logo) {
            setLogoUrl(`data:image/png;base64,${logoRes.data.logo}`);
            console.log('✅ Logo cargado');
          }
        } catch (err) {
          console.warn('⚠️ No se pudo cargar el logo (no crítico)');
        }

        // 3. Cargar detalles
        if (cabRes.data?.idventa1) {
          try {
            const detRes = await ventaApi.getFacturaDetalle(cabRes.data.idventa1);
            setDetalles(detRes.data || []);
            console.log('✅ Detalles cargados:', detRes.data?.length || 0);
          } catch (err: any) {
            console.warn('⚠️ Error cargando detalles:', err.message);
          }
        }

        // 4. ✅ NUEVO: Cargar datos ECF (CRÍTICO para QR)
        if (esComprobanteElectronico(noFactura)) {
          try {
            console.log('🔄 Cargando datos ECF para:', noFactura);
            const ecfRes = await ventaApi.obtenerDatosEcf(noFactura);
            console.log('✅ Datos ECF cargados:', ecfRes.data);
            console.log('📊 Detalles ECF:', {
              secuencia: ecfRes.data?.secuencia,
              codigoSeguridad: ecfRes.data?.codigoSeguridad,
              fechaFirma: ecfRes.data?.fechaFirma,
              ambiente: ecfRes.data?.ambiente,
              estadoEcf: ecfRes.data?.estadoEcf
            });
            setEcfDatos(ecfRes.data);
          } catch (err: any) {
            console.error('❌ ERROR CRÍTICO: No se pudieron cargar datos ECF:', err.message);
            console.error('❌ Detalle del error:', err.response?.data || err);
            // Crear datos dummy para debugging
            setEcfDatos({
              secuencia: noFactura,
              codigoSeguridad: 'DEBUG',
              fechaFirma: new Date().toISOString(),
              ambiente: 0,
              estadoEcf: 'ERROR'
            });
          }
        } else {
          console.log('ℹ️ No es comprobante electrónico, no se cargan datos ECF');
        }
        
      } catch (err: any) {
        console.error('❌ Error crítico en carga:', err);
        console.error('❌ Detalle:', err.response?.data || err.message);
        
        const errorMsg = err.response?.data?.message || err.message || 'Error desconocido al cargar la factura';
        setError(`Error al cargar: ${errorMsg}`);
      } finally {
        setLoading(false);
        console.log('✅ Carga finalizada');
      }
    };

    fetchData();
  }, [noFactura, idEmpresa]);

  // ═══ Combinar detalles de productos + servicios ═══
  const detallesCombinados = useMemo(() => {
    const items: FacturaDetalleReporteDto[] = [...detalles];

    if (cabecera && cabecera.monto_Servicios > 0) {
      items.push({
        codigo: '0',
        descripcion: cabecera.descripcion || 'Servicio',
        cantidad: 1,
        medida: 'UNIDAD',
        precio_Venta1: cabecera.monto_Servicios,
        descuento: 0,
        importe: cabecera.monto_Servicios,
        itbis: (cabecera as any).itbiS_Servicios ?? (cabecera as any).itbis_Servicios ?? 0,
      } as FacturaDetalleReporteDto);
    }

    return items;
  }, [detalles, cabecera]);

  // ═══ Cálculos de pago ═══
  const calculosPago = useMemo(() => {
    if (!pago || !cabecera) {
      return {
        tienePago: false,
        totalMetodosPago: 0,
        totalRetenciones: 0,
        totalCobrado: 0,
        devuelta: 0,
        balance: 0,
        formasPago: [] as string[]
      };
    }

    const totalMetodosPago = 
      (pago.efectivo || 0) + 
      (pago.cheque || 0) + 
      (pago.transferencia || 0) + 
      (pago.tarjeta || 0);
    
    const totalRetenciones = 
      (pago.retencion_ITBIS || 0) + 
      (pago.retencion_ISR || 0);
    
    const totalCobrado = totalMetodosPago + totalRetenciones;
    const diferencia = cabecera.total - totalCobrado;
    
    const balance = diferencia > 0 ? diferencia : 0;
    const devuelta = diferencia < 0 ? Math.abs(diferencia) : 0;

    const formasPago: string[] = [];
    if (pago.efectivo > 0) formasPago.push(`Efectivo: ${formatMoney(pago.efectivo)}`);
    if (pago.cheque > 0) formasPago.push(`Cheque: ${formatMoney(pago.cheque)}`);
    if (pago.transferencia > 0) formasPago.push(`Transferencia: ${formatMoney(pago.transferencia)}`);
    if (pago.tarjeta > 0) formasPago.push(`Tarjeta: ${formatMoney(pago.tarjeta)}`);

    return {
      tienePago: totalCobrado > 0,
      totalMetodosPago,
      totalRetenciones,
      totalCobrado,
      devuelta,
      balance,
      formasPago
    };
  }, [pago, cabecera]);

  const mostrarVencimiento = cabecera ? ['31', '44', '45', '46'].includes(cabecera.tipo) : false;
  const esEcf = cabecera ? esComprobanteElectronico(cabecera.ncf) : false;

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando factura...</div>;
  if (error || !cabecera) return <div className="p-8 text-center text-red-600">❌ {error || 'Factura no encontrada'}</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-4">
      
      {/* Botones de acción */}
      <div className="no-print max-w-4xl mx-auto mb-4 flex justify-between items-center px-4">
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors">
          ← Volver
        </button>
        <div className="flex gap-2">
          {esEcf && ecfDatos?.estadoEcf && (
            <span className={`px-3 py-2 rounded-lg text-xs font-bold ${
              ecfDatos.estadoEcf === 'ACEPTADO' ? 'bg-green-100 text-green-700' :
              ecfDatos.estadoEcf === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {ecfDatos.estadoEcf === 'ACEPTADO' ? '✅' : ecfDatos.estadoEcf === 'RECHAZADO' ? '❌' : '⏳'} 
              {' '}DGII: {ecfDatos.estadoEcf}
            </span>
          )}
          <button onClick={() => window.print()} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow flex items-center gap-2 transition-colors">
            🖨️ Imprimir Factura
          </button>
        </div>
      </div>

      {/* ═══ HOJA DE IMPRESIÓN ═══ */}
      <div className="print-area max-w-4xl mx-auto bg-white shadow-lg p-8 text-sm text-gray-800">
        
        {/* 1. ENCABEZADO DE LA EMPRESA */}
        <div className="flex justify-between items-start border-b-2 border-emerald-100 pb-4 mb-6">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo Empresa" 
                className="h-25 w-25 object-contain" 
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
              />
            ) : (
              <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                Sin Logo
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-emerald-800 uppercase">
                {empresa?.nombre || 'Nombre de la Empresa'}
              </h1>
              <p className="text-xs text-gray-600">RNC: {empresa?.rnc || '000-00000-0'}</p>
              <p className="text-xs text-gray-600">{empresa?.direccion || 'Dirección no registrada'}</p>
              <p className="text-xs text-gray-600">
                Tel: {empresa?.telefono || 'N/A'} | {empresa?.email || 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{getTituloFactura(cabecera.tipo)}</h2>
            <p className="text-sm font-mono font-bold text-emerald-700 mt-1">NCF: {cabecera.ncf}</p>
            
            {mostrarVencimiento && cabecera.vencimiento && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                Vence: {formatDate(cabecera.vencimiento)}
              </p>
            )}
            
            <p className="text-xs text-gray-500 mt-2">Fecha de Emisión: {formatDate(cabecera.fecha)}</p>
          </div>
        </div>

        {/* 2. DATOS DEL CLIENTE */}
        <div className="grid grid-cols-2 gap-4 mb-6 bg-gray-50 p-3 rounded border border-gray-200">
          <div>
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Cliente</p>
            <p className="font-semibold text-sm text-gray-900">{cabecera.razon_Social || cabecera.nombre_Comercial}</p>
            <p className="text-xs text-gray-600 mt-1">RNC/Cédula: {cabecera.num_Documento || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1">Dirección / Contacto</p>
            <p className="text-xs text-gray-600">{cabecera.direccion || 'N/A'}</p>
            <p className="text-xs text-gray-600 mt-1">Tel: {cabecera.telefono || 'N/A'}</p>
          </div>
        </div>

        {/* 3. DETALLE DE VENTA */}
        <table className="w-full text-xs mb-6 border-collapse">
          <thead>
            <tr className="bg-emerald-700 text-white">
              <th className="p-2 text-left border border-emerald-800 w-24">Código</th>
              <th className="p-2 text-left border border-emerald-800">Descripción</th>
              <th className="p-2 text-right border border-emerald-800 w-16">Cant.</th>
              <th className="p-2 text-left border border-emerald-800 w-16">Medida</th>
              <th className="p-2 text-right border border-emerald-800 w-24">Precio</th>
              <th className="p-2 text-right border border-emerald-800 w-16">Desc.</th>
              <th className="p-2 text-right border border-emerald-800 w-24">Importe</th>
              <th className="p-2 text-right border border-emerald-800 w-24">ITBIS</th>
            </tr>
          </thead>
          <tbody>
            {detallesCombinados.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500 italic">No hay detalles registrados.</td>
              </tr>
            ) : (
              detallesCombinados.map((det, idx) => {
                const esServicio = det.codigo === '0' && det.medida === 'UNIDAD' && idx === detallesCombinados.length - 1 && cabecera?.monto_Servicios! > 0;
                
                return (
                  <tr 
                    key={idx} 
                    className={`border-b border-gray-200 ${esServicio ? 'bg-blue-50' : ''}`}
                  >
                    <td className="p-2 font-mono text-gray-600">{det.codigo}</td>
                    <td className={`p-2 font-medium ${esServicio ? 'text-blue-800 italic' : 'text-gray-900'}`}>
                      {det.descripcion}
                      {esServicio && <span className="ml-2 text-[9px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">SERVICIO</span>}
                    </td>
                    <td className="p-2 text-right">{det.cantidad}</td>
                    <td className="p-2 text-gray-600">{det.medida}</td>
                    <td className="p-2 text-right font-mono">{formatMoney(det.precio_Venta1)}</td>
                    <td className="p-2 text-right text-gray-600">
                      {det.descuento > 0 ? `${(det.descuento * 100).toFixed(0)}%` : '-'}
                    </td>
                    <td className="p-2 text-right font-mono font-medium">{formatMoney(det.importe)}</td>
                    <td className="p-2 text-right font-mono">{formatMoney(det.itbis)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* 4. TOTALES */}
        <div className="flex justify-end mb-6">
          <div className="w-72 space-y-1 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-semibold text-gray-600">Subtotal:</span>
              <span className="font-mono">{formatMoney(cabecera.subtotal)}</span>
            </div>
            
            {cabecera.descuento > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200 text-red-600">
                <span className="font-semibold">Descuento:</span>
                <span className="font-mono">- {formatMoney(cabecera.descuento)}</span>
              </div>
            )}
            
            <div className="flex justify-between py-1 border-b border-gray-200">
              <span className="font-semibold text-gray-600">ITBIS:</span>
              <span className="font-mono">{formatMoney(cabecera.itbis)}</span>
            </div>
            
            {cabecera.propina_Legal > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Propina Legal (10%):</span>
                <span className="font-mono">{formatMoney(cabecera.propina_Legal)}</span>
              </div>
            )}
            
            <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded font-bold text-base text-emerald-800 mt-2 border-t-2 border-emerald-700">
              <span>TOTAL A PAGAR:</span>
              <span className="font-mono">{formatMoney(cabecera.total)}</span>
            </div>
          </div>
        </div>

        {/* 5. INFORMACIÓN DE PAGO */}
        {calculosPago.tienePago && (
          <div className="mb-6 border-t-2 border-gray-300 pt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Información de Pago</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-[10px] uppercase text-blue-700 font-bold tracking-wider mb-2">Formas de Pago</p>
                {calculosPago.formasPago.length > 0 ? (
                  <div className="space-y-1">
                    {calculosPago.formasPago.map((forma, idx) => (
                      <p key={idx} className="text-xs text-gray-800 font-mono">{forma}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 italic">Sin formas de pago registradas</p>
                )}
                
                {calculosPago.totalRetenciones > 0 && (
                  <div className="mt-3 pt-2 border-t border-blue-200">
                    <p className="text-[10px] uppercase text-red-700 font-bold tracking-wider mb-1">Retenciones</p>
                    {(pago?.retencion_ITBIS || 0) > 0 && (
                      <p className="text-xs text-gray-800 font-mono">
                        Retención ITBIS: {formatMoney(pago?.retencion_ITBIS)}
                      </p>
                    )}
                    {(pago?.retencion_ISR || 0) > 0 && (
                      <p className="text-xs text-gray-800 font-mono">
                        Retención ISR: {formatMoney(pago?.retencion_ISR)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded p-3">
                <p className="text-[10px] uppercase text-emerald-700 font-bold tracking-wider mb-2">Resumen de Pago</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total Métodos:</span>
                    <span className="font-mono font-semibold">{formatMoney(calculosPago.totalMetodosPago)}</span>
                  </div>
                  {calculosPago.totalRetenciones > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-700">Retenciones:</span>
                      <span className="font-mono font-semibold text-red-600">{formatMoney(calculosPago.totalRetenciones)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-emerald-200 mt-1">
                    <span className="font-bold text-gray-800">Total Cobrado:</span>
                    <span className="font-mono font-bold text-emerald-700">{formatMoney(calculosPago.totalCobrado)}</span>
                  </div>
                </div>

                {calculosPago.devuelta > 0 && (
                  <div className="mt-3 pt-2 border-t border-emerald-200">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-emerald-800">DEVUELTA:</span>
                      <span className="text-sm font-mono font-bold text-emerald-700">
                        {formatMoney(calculosPago.devuelta)}
                      </span>
                    </div>
                  </div>
                )}
                
                {calculosPago.balance > 0 && (
                  <div className="mt-3 pt-2 border-t border-red-200">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-red-800">BALANCE PENDIENTE:</span>
                      <span className="text-sm font-mono font-bold text-red-700">
                        {formatMoney(calculosPago.balance)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 6. FIRMAS */}
        <div className="grid grid-cols-2 gap-16 mt-12 text-center text-xs mb-8">
          {/* COLUMNA IZQUIERDA: Firma Empresa */}
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="font-bold uppercase text-gray-800">Firma de Entregado</p>
              <p className="text-gray-500 mt-1">Nombre y Sello de la Empresa</p>
            </div>
          </div>

          {/* COLUMNA DERECHA: Firma Cliente */}
          <div>
            <div className="border-t border-gray-400 pt-2">
              <p className="font-bold uppercase text-gray-800">Firma de Recibido</p>
              <p className="text-gray-500 mt-1">Nombre, Cédula y Sello del Cliente</p>
            </div>
          </div>
        </div>

        {/* 7. ✅ CÓDIGO QR GRANDE - DEBAJO DE FIRMAS */}
        {/* 7. ✅ CÓDIGO QR GRANDE - DEBAJO DE FIRMAS */}
{esEcf && generarUrlQR && ecfDatos && (
  <div className="mt-8 pt-6 border-t-2 border-emerald-200">
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-bold text-emerald-800 mb-3 uppercase tracking-wider">
        Verificación de Autenticidad - DGII
      </h3>
      
      {/* QR GRANDE - 250px con borde ajustado */}
      <div className="border-2 border-emerald-600 p-3 rounded-lg bg-white shadow-md mb-3">
        <QRCodeSVG
          value={generarUrlQR}
          size={80}  // ✅ Tamaño óptimo
          level="M"
          includeMargin={false}
          bgColor="#FFFFFF"
          fgColor="#047857"
        />
      </div>
      
      {/* Información del QR */}
      <div className="text-center space-y-2 max-w-xl">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-emerald-50 px-3 py-2 rounded">
            <p className="text-[9px] uppercase text-emerald-600 font-bold tracking-wider mb-0.5">Código de Seguridad</p>
            <p className="font-mono font-bold text-emerald-900 text-sm">
              {ecfDatos.codigoSeguridad || 'N/A'}
            </p>
          </div>
          <div className="bg-emerald-50 px-3 py-2 rounded">
            <p className="text-[9px] uppercase text-emerald-600 font-bold tracking-wider mb-0.5">Fecha de Firma</p>
            <p className="font-mono font-bold text-emerald-900 text-sm">
              {ecfDatos.fechaFirma ? formatFechaFirma(ecfDatos.fechaFirma) : 'N/A'}
            </p>
          </div>
        </div>
        
        <p className="text-[10px] text-gray-600 mt-2 italic">
          📱 Escanee el código QR para verificar autenticidad ante la DGII
        </p>
        
        {ecfDatos.estadoEcf && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ${
            ecfDatos.estadoEcf === 'ACEPTADO' ? 'bg-green-100 text-green-700' :
            ecfDatos.estadoEcf === 'RECHAZADO' ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {ecfDatos.estadoEcf === 'ACEPTADO' ? '✅' : ecfDatos.estadoEcf === 'RECHAZADO' ? '❌' : '⏳'}
            Estado DGII: {ecfDatos.estadoEcf}
          </div>
        )}
      </div>
    </div>
  </div>
)}

        {/* 8. PIE DE PÁGINA */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-[10px] text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">
            Gracias por su preferencia. 
            {esEcf ? ' Este documento es un Comprobante Electrónico válido emitido ante la DGII.' : ' Este documento es un comprobante fiscal válido.'}
          </p>
          <p>
            Cajero: <span className="font-semibold text-gray-700">{cabecera.cajero}</span> | 
            Vendedor: <span className="font-semibold text-gray-700">{cabecera.vendedor}</span> | 
            Término: <span className="font-semibold text-gray-700">{cabecera.termino} ({cabecera.tiempo} días)</span>
          </p>
          {cabecera.descripcion && (
            <p className="italic text-gray-600 mt-2">Nota: {cabecera.descripcion}</p>
          )}
          <p className="mt-2 text-[9px] text-gray-400">Documento generado el {new Date().toLocaleString('es-DO')}</p>
        </div>

      </div>

      {/* Estilos para impresión */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 1cm !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
}