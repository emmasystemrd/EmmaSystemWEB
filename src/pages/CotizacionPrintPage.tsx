import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cotizacionApi, type CotizacionImpresionDto, type CotizacionDetalleImpresionDto } from '../api/cotizacion.api';
import { empresaApi, type EmpresaDto } from '../api/empresa.api';
import { useAuthStore } from '../store/authStore';

export default function CotizacionPrintPage() {
  const { id, tipo } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const idEmpresa = user?.idempresa ?? 1;

  const [cabecera, setCabecera] = useState<CotizacionImpresionDto | null>(null);
  const [detalles, setDetalles] = useState<CotizacionDetalleImpresionDto[]>([]);
  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>(''); // ✅ Nuevo estado para el logo
  useEffect(() => {
    if (!id || !tipo) {
      setError('Parámetros incompletos para impresión.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [cabRes, empRes] = await Promise.all([
          cotizacionApi.getCotizacionPrintData(id, tipo),
          empresaApi.getById(idEmpresa)
        ]);

        setCabecera(cabRes.data);
        setEmpresa(empRes.data);

        // 2. ✅ Cargar el logo desde el endpoint específico
try {
  const logoRes = await empresaApi.getLogo(idEmpresa);
  if (logoRes.data?.logo) {
    // Si viene como base64, convertir a URL de datos
    setLogoUrl(`data:image/png;base64,${logoRes.data.logo}`);
  }
} catch (err) {
  console.warn('⚠️ No se pudo cargar el logo:', err);
}

        if (cabRes.data?.idcotizacion) {
          const detRes = await cotizacionApi.getDetails(cabRes.data.idcotizacion);
          setDetalles(detRes.data || []);
        }
      } catch (err: any) {
        console.error('❌ Error carga impresión:', err);
        setError(err.response?.data?.message || 'Error al cargar datos para impresión.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, tipo, idEmpresa]);

  const formatMoney = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0.00';
    return new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  };

  if (loading) return <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center"><div className="text-center text-emerald-700 text-sm">Cargando datos de impresión...</div></div>;
  if (error) return <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center"><div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 text-sm text-red-700">{error}</div></div>;
  if (!cabecera) return <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 flex items-center justify-center"><div className="text-gray-500">Cotización no encontrada</div></div>;

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 1.2cm; size: Letter; }
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-container { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; background: white !important; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
          .footer-print { position: fixed; bottom: 0.8cm; left: 0; right: 0; text-align: center; font-size: 8px; color: #666; }
          .bg-gray-50, .bg-emerald-50, .bg-gradient-to-r { background: transparent !important; }
          .border-emerald-100, .border-gray-200 { border-color: #e5e7eb !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
        <div className="max-w-5xl mx-auto">
          {/* Barra de control (no se imprime) */}
          <div className="no-print mb-3 flex justify-between items-center">
            <button onClick={() => navigate(-1)} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm">
              ← Volver
            </button>
            <button onClick={() => window.print()} className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow-md flex items-center gap-1">
              🖨️ Imprimir / PDF
            </button>
          </div>

          {/* Contenido imprimible */}
          <div className="print-container bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden print:shadow-none print:border-0">
            <div className="p-4 print:p-2 space-y-4">
              {/* Encabezado compacto */}
              <div className="flex justify-between items-start border-b border-emerald-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-16 h-14 print:w-14 print:h-12 flex items-center justify-center bg-gray-50 rounded-lg border border-emerald-100 print:border-0">
                    <img src={logoUrl}  alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="text-base font-bold text-emerald-800">{empresa?.nombre || 'Nombre de la Empresa'}</h1>
                    <p className="text-[11px] text-gray-600">{empresa?.direccion}</p>
                    <p className="text-[10px] text-gray-500">Tel: {empresa?.telefono} | RNC: {empresa?.rnc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-orange-600 uppercase tracking-wide">COTIZACIÓN</h2>
                  <p className="text-sm font-mono font-semibold text-emerald-700">Nº {cabecera.no_Cotizacion}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Fecha: {new Date(cabecera.fecha).toLocaleDateString('es-DO')}</p>
                </div>
              </div>

              {/* Cliente y observaciones */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100 print:border-gray-200 print:bg-transparent">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Cliente</p>
                  <p className="font-semibold text-gray-800 text-xs">{cabecera.razon_Social}</p>
                  <p className="text-gray-600 text-[11px]">RNC/Cédula: {cabecera.num_Documento}</p>
                  <p className="text-gray-600 text-[11px]">{cabecera.direccionCliente}</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100 print:border-gray-200 print:bg-transparent">
                  <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Observaciones</p>
                  <p className="text-gray-700 text-[11px] mt-0.5 whitespace-pre-wrap">{cabecera.descripcion || 'N/A'}</p>
                </div>
              </div>

              {/* Tabla de detalles compacta */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50">
                    <tr>
                      <th className="py-1.5 px-2 text-left font-semibold text-emerald-800 border border-emerald-100">Descripción</th>
                      <th className="py-1.5 px-2 text-center font-semibold text-emerald-800 border border-emerald-100">Cant.</th>
                      <th className="py-1.5 px-2 text-center font-semibold text-emerald-800 border border-emerald-100">U.Medida</th>
                      <th className="py-1.5 px-2 text-right font-semibold text-emerald-800 border border-emerald-100">Precio</th>
                      <th className="py-1.5 px-2 text-right font-semibold text-emerald-800 border border-emerald-100">Desc.</th>
                      <th className="py-1.5 px-2 text-right font-semibold text-emerald-800 border border-emerald-100">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {detalles.length > 0 ? (
                      detalles.map((d, i) => (
                        <tr key={d.codigo || i} className="hover:bg-orange-50">
                          <td className="py-1.5 px-2 border border-gray-100 text-gray-700">{d.producto}</td>
                          <td className="py-1.5 px-2 border border-gray-100 text-center">{d.cantidad}</td>
                          <td className="py-1.5 px-2 border border-gray-100">{d.medida}</td>
                          <td className="py-1.5 px-2 border border-gray-100 text-right font-mono">{formatMoney(d.precio)}</td>
                          <td className="py-1.5 px-2 border border-gray-100 text-right font-mono">{formatMoney(d.descuento)}</td>
                          <td className="py-1.5 px-2 border border-gray-100 text-right font-mono font-semibold text-emerald-700">{formatMoney(d.precio * d.cantidad)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="py-4 text-center text-gray-400 text-xs">Sin detalles registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totales compactos */}
              <div className="flex justify-end">
                <div className="w-56 text-xs space-y-0.5 bg-gray-50 p-2 rounded-lg border border-gray-100 print:bg-transparent">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-mono">{formatMoney(cabecera.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Descuento:</span>
                    <span className="font-mono">-{formatMoney(cabecera.descuento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ITBIS:</span>
                    <span className="font-mono">{formatMoney(cabecera.itbis)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-200 font-bold text-emerald-800">
                    <span className="text-sm">TOTAL:</span>
                    <span className="font-mono text-base text-orange-600">{formatMoney(cabecera.total)}</span>
                  </div>
                </div>
              </div>

              {/* Firmas y pie de página */}
              <div className="pt-4 border-t border-emerald-100 text-center">
                <p className="text-[9px] text-gray-400 mb-3">
                  Esta cotización tiene una validez de 15 días. Precios expresados en pesos dominicanos (RD$).
                </p>
                <div className="flex justify-between px-8 print:px-12">
                  <div className="w-1/3 border-t border-gray-300 pt-1 text-[9px] text-gray-500 text-center">
                    Firma y Sello del Cliente
                  </div>
                  <div className="w-1/3 border-t border-gray-300 pt-1 text-[9px] text-gray-500 text-center">
                    Firma del Vendedor
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}