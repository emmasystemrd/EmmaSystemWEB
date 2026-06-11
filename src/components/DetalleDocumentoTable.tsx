import { useState, useEffect } from 'react';
import { 
  articuloApi, 
  type ArticuloVentaDto, 
  type MedidaDetalleProductoDto 
} from '../api/articulo.api';
import ArticuloSelector from './ArticuloSelector';
import type { DetalleDocumentoDto, TipoDocumento } from '../api/detalleDocumento.api';

interface DetalleDocumentoTableProps {
  tipoDocumento: TipoDocumento;           // ← Tipo de documento (cotizacion, venta, etc.)
  idDocumento: number | null;             // ID de la cabecera
  idEmpresa: number;
  detalles: DetalleDocumentoDto[];
  onDetailsChange: (detalles: DetalleDocumentoDto[]) => void;
  onEliminar?: (idDetalle: number) => void;
  titulo?: string;                        // Título personalizable
  color?: 'emerald' | 'orange' | 'blue' | 'purple'; // Color del tema
}

// Configuración por tipo de documento
const CONFIG_TIPO_DOCUMENTO: Record<TipoDocumento, { 
  titulo: string; 
  color: string;
  colorBg: string;
  colorHover: string;
  colorAccent: string;
}> = {
  cotizacion: { 
    titulo: 'Productos / Servicios', 
    color: 'orange', 
    colorBg: 'bg-orange-50', 
    colorHover: 'hover:bg-orange-50',
    colorAccent: 'bg-orange-500'
  },
  venta: { 
    titulo: 'Productos Vendidos', 
    color: 'emerald', 
    colorBg: 'bg-emerald-50', 
    colorHover: 'hover:bg-emerald-50',
    colorAccent: 'bg-emerald-600'
  },
  devolucion: { 
    titulo: 'Productos a Devolver', 
    color: 'red', 
    colorBg: 'bg-red-50', 
    colorHover: 'hover:bg-red-50',
    colorAccent: 'bg-red-500'
  },
  nota_debito: { 
    titulo: 'Productos - Nota de Débito', 
    color: 'amber', 
    colorBg: 'bg-amber-50', 
    colorHover: 'hover:bg-amber-50',
    colorAccent: 'bg-amber-500'
  },
  nota_credito: { 
    titulo: 'Productos - Nota de Crédito', 
    color: 'blue', 
    colorBg: 'bg-blue-50', 
    colorHover: 'hover:bg-blue-50',
    colorAccent: 'bg-blue-500'
  },
};

export default function DetalleDocumentoTable({ 
  tipoDocumento,
  idDocumento, 
  idEmpresa, 
  detalles, 
  onDetailsChange,
  onEliminar,
  titulo,
}: DetalleDocumentoTableProps) {
  
  const config = CONFIG_TIPO_DOCUMENTO[tipoDocumento];
  const displayTitle = titulo || config.titulo;
  
  const [showArticuloSelector, setShowArticuloSelector] = useState(false);
  const [searchArticulo, setSearchArticulo] = useState('');
  const [articulos, setArticulos] = useState<ArticuloVentaDto[]>([]);

  const normalizarTasaItbis = (tax: number | null | undefined): number => {
    if (tax == null || isNaN(tax)) return 0;
    return tax > 1 ? tax / 100 : tax;
  };

  // ═══ Búsqueda de artículos ═══
  useEffect(() => {
    if (!searchArticulo.trim()) {
      setArticulos([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await articuloApi.searchForSales(searchArticulo, idEmpresa);
        setArticulos(data.slice(0, 15));
      } catch (err) {
        console.error('Error al buscar artículos:', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchArticulo, idEmpresa]);

  // ═══ Agregar artículo al detalle ═══
  // ═══ Agregar artículo al detalle ═══
const handleArticuloSelect = async (articulo: ArticuloVentaDto) => {
  const tasaItbis = normalizarTasaItbis(articulo.gravado);
  
  let precioDefault = articulo.precio ?? 0;
  let medidaDefault = articulo.mayor || 'Unidad';
  let medidasDisponibles: MedidaDetalleProductoDto[] = [];
  let iddetalleDefault: number | undefined;

  try {
    // 1. Obtener todas las medidas/presentaciones del producto
    const { data: medidas } = await articuloApi.getDetallesByProducto(articulo.idArticulo);
    
    if (medidas && medidas.length > 0) {
      medidasDisponibles = medidas;
      
      // 2. ✅ CORRECCIÓN: Buscar la medida que coincida con articulo.mayor
      // Si no existe, usar la primera disponible
      const medidaBase = medidas.find(m => 
        m.nombre?.toLowerCase() === medidaDefault.toLowerCase()
      ) || medidas[0];
      
      // 3. ✅ CORRECCIÓN: Actualizar medidaDefault con el nombre real de la BD
      medidaDefault = medidaBase.nombre || medidaDefault;
      
      // 4. Obtener el precio EXACTO para esta medida específica
      try {
        const { data: precios } = await articuloApi.getDetallePrecios(
          articulo.idArticulo,
          medidaBase.idmedida,
          ''
        );
        
        if (precios && precios.length > 0) {
          precioDefault = precios[0].precio;
          iddetalleDefault = precios[0].iddetalle;
        }
      } catch (err) {
        console.warn('Fallback: usando precio base del buscador', err);
      }
    }
  } catch (err) {
    console.warn('No se pudieron cargar medidas:', err);
  }

  const subtotal = precioDefault;
  const montoItbis = subtotal * tasaItbis;
  
  const nuevoDetalle: DetalleDocumentoDto = {
    iddetalle: 0,
    idDocumento: typeof idDocumento === 'number' ? idDocumento : 0,
    iddetalle_Producto: iddetalleDefault ?? articulo.idArticulo,
    idArticuloOriginal: articulo.idArticulo,
    codigo: articulo.código || '',
    producto: articulo.artículo || '',
    nombreProducto: articulo.artículo || '',
    cantidad: 1,
    medida: medidaDefault, // ✅ Ahora coincide con el precio
    precio_Venta1: precioDefault, // ✅ Precio de la medida correcta
    p_Itbis: tasaItbis,
    descuento: 0,
    subtotal:precioDefault,
    itbis: montoItbis,
    total: subtotal + montoItbis,
    __modified: true,
    __new: true,
    medidasDisponibles,
  };
  
  onDetailsChange([...detalles, nuevoDetalle]);
  setSearchArticulo('');
  setArticulos([]);
};

  // ═══ Cambiar medida/presentación ═══
  const handleChangeMedida = async (index: number, idMedidaSeleccionada: number) => {
    const nuevosDetalles = [...detalles];
    const detActual = { ...nuevosDetalles[index] };

    const medidaInfo = detActual.medidasDisponibles?.find(m => m.idmedida === idMedidaSeleccionada);
    
    if (!medidaInfo || !detActual.nombreProducto) {
      console.warn('No se encontró info de medida o nombre del producto');
      return;
    }

   // detActual.medida = medidaInfo.nombre || detActual.medida;
    // ✅ DESPUÉS (ya maneja null correctamente con ||):
detActual.medida = medidaInfo.nombre || detActual.medida;
    detActual.__modified = true;

    try {
      const { data } = await articuloApi.getDetallePrecios(
        detActual.idArticuloOriginal!,
        idMedidaSeleccionada,
        ''
      );

      if (data && data.length > 0) {
        const resultado = data[0];
        detActual.iddetalle_Producto = resultado.iddetalle;
        
        const precioNuevo = parseFloat(resultado.precio.toFixed(2));
        detActual.precio_Venta1 = precioNuevo;
        
        const cantidad = detActual.cantidad ?? 0;
        const tasaItbis = detActual.p_Itbis ?? 0;
        const tasaDescuento = detActual.descuento ?? 0;
        
        const subtotal = cantidad * precioNuevo;
        const baseConDescuento = subtotal * (1 - tasaDescuento);
        const montoItbis = baseConDescuento * tasaItbis;
        const total = baseConDescuento + montoItbis;
        
        detActual.subtotal = parseFloat(subtotal.toFixed(2));
        detActual.itbis = parseFloat(montoItbis.toFixed(2));
        detActual.total = parseFloat(total.toFixed(2));
      }
    } catch (err) {
      console.error('❌ Error al obtener precio de la medida:', err);
    }

    nuevosDetalles[index] = detActual;
    onDetailsChange(nuevosDetalles);
  };

  // ═══ Actualizar campo del detalle ═══
  const updateDetalle = <K extends keyof DetalleDocumentoDto>(
    index: number, 
    field: K, 
    value: DetalleDocumentoDto[K]
  ) => {
    const nuevosDetalles = [...detalles];
    const detActual = { ...nuevosDetalles[index] };
    
    if (field === 'descuento') {
      let valorDescuento = typeof value === 'number' ? value : 0;
      if (valorDescuento > 1 && valorDescuento <= 100) {
        valorDescuento = valorDescuento / 100;
      }
      if (valorDescuento < 0 || valorDescuento > 1) {
        console.error(`❌ Descuento inválido: ${valorDescuento}`);
        return;
      }
      detActual.descuento = parseFloat(valorDescuento.toFixed(4));
    } else {
      detActual[field] = value;
    }
    
    detActual.__modified = true;
    
    const cantidad = detActual.cantidad ?? 0;
    const precio = detActual.precio_Venta1 ?? 0;
    const tasaItbis = detActual.p_Itbis ?? 0;
    const tasaDescuento = detActual.descuento ?? 0;
    
    const subtotal = cantidad * precio;
    const baseConDescuento = subtotal * (1 - tasaDescuento);
    const montoItbis = tasaItbis > 0 ? tasaItbis * baseConDescuento : 0;
    const total = baseConDescuento + montoItbis;
    
    detActual.subtotal = parseFloat(subtotal.toFixed(2));
    detActual.itbis = parseFloat(montoItbis.toFixed(2));
    detActual.total = parseFloat(total.toFixed(2));
    
    nuevosDetalles[index] = detActual;
    onDetailsChange(nuevosDetalles);
  };

  // ═══ Eliminar detalle ═══
  const eliminarDetalle = (index: number) => {
    const detalle = detalles[index];
    if (detalle.iddetalle && detalle.iddetalle > 0 && onEliminar) {
      onEliminar(detalle.iddetalle);
    }
    onDetailsChange(detalles.filter((_, i) => i !== index));
  };

  const formatMoney = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) return '0.00';
    return new Intl.NumberFormat('es-DO', { 
      style: 'currency', 
      currency: 'DOP', 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(value);
  };

  return (
    <div className="p-3 space-y-2">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
          <span className={`w-1 h-4 ${config.colorAccent} rounded-full`}></span>
          {displayTitle}
        </h3>
        <span className="text-[11px] text-gray-500">
          {detalles.length} ítem{detalles.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Buscador */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Buscar producto..." 
            value={searchArticulo}
            onChange={(e) => setSearchArticulo(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && articulos.length > 0) { 
                e.preventDefault(); 
                handleArticuloSelect(articulos[0]); 
              } 
            }} 
          />
          {searchArticulo && articulos.length > 0 && (
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {articulos.map(art => (
                <button 
                  key={art.idArticulo} 
                  type="button" 
                  onClick={() => handleArticuloSelect(art)}
                  className={`w-full px-3 py-1.5 text-left ${config.colorHover} flex justify-between items-center border-b border-gray-50 last:border-0`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs text-gray-900 truncate">{art.artículo}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{art.código}</div>
                  </div>
                  <div className="font-mono font-bold text-emerald-700 shrink-0 ml-3 text-xs">
                    {formatMoney(art.precio)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <button 
          type="button" 
          onClick={() => setShowArticuloSelector(true)}
          className={`px-2.5 py-1.5 ${config.colorAccent} text-white rounded-lg hover:opacity-90 transition flex items-center justify-center shrink-0`} 
          title="Buscar en modal"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Tabla */}
      {detalles.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">
          Busca y selecciona productos
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold text-emerald-800">Producto</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">Cant.</th>
                <th className="px-2 py-1.5 text-left font-semibold text-emerald-800">Medida</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">Precio</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">Desc. (%)</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">ITBIS</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">Importe</th>
                <th className="px-2 py-1.5 text-center font-semibold text-emerald-800">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detalles.map((det, index) => (
                <tr 
                  key={det.iddetalle && det.iddetalle > 0 ? det.iddetalle : `new-${index}`} 
                  className={`${config.colorHover} transition-colors`}
                >
                  <td className="px-2 py-1 font-medium text-gray-800">{det.producto}</td>
                  <td className="px-2 py-1">
                    <input 
                      type="number" 
                      min="1" 
                      step="any" 
                      value={det.cantidad}
                      onChange={(e) => updateDetalle(index, 'cantidad', parseFloat(e.target.value) || 1)}
                      className="w-16 px-1.5 py-0.5 border border-gray-200 rounded text-right text-xs focus:ring-1 focus:ring-emerald-500 outline-none" 
                    />
                  </td>
                  <td className="px-2 py-1">
                    {det.medidasDisponibles && det.medidasDisponibles.length > 1 ? (
                      <select
                        value={det.medidasDisponibles.find(m => m.nombre === det.medida)?.idmedida ?? ''}
                        onChange={(e) => handleChangeMedida(index, parseInt(e.target.value))}
                        className="w-28 px-1.5 py-0.5 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                      >
                        {det.medidasDisponibles.map((m, idx) => (
  <option key={`${m.idmedida}-${idx}`} value={m.idmedida}>
    {m.nombre || `Medida ${m.idmedida}`} {/* ✅ Ya maneja null */}
  </option>
))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        value={det.medida} 
                        readOnly
                        className="w-28 px-1.5 py-0.5 border border-gray-200 rounded bg-gray-50 text-xs text-gray-600" 
                      />
                    )}
                  </td>
                  <td className="px-2 py-1 text-right">
                    <input 
                      type="number" 
                      step="any" 
                      min="0" 
                      value={det.precio_Venta1?.toFixed(2) || '0.00'}
                      onChange={(e) => updateDetalle(index, 'precio_Venta1', parseFloat(e.target.value) || 0)}
                      className="w-20 px-1.5 py-0.5 border border-gray-200 rounded text-right text-xs focus:ring-1 focus:ring-emerald-500 outline-none" 
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      max="100" 
                      value={Math.round((det.descuento ?? 0) * 10000) / 100}
                      onChange={(e) => {
                        const valorIngresado = parseFloat(e.target.value) || 0;
                        if (valorIngresado < 0 || valorIngresado > 100) return;
                        updateDetalle(index, 'descuento', valorIngresado / 100);
                      }}
                      className="w-14 px-1.5 py-0.5 border border-gray-200 rounded text-right text-xs focus:ring-1 focus:ring-emerald-500 outline-none" 
                    />
                  </td>
                  <td className="px-2 py-1 text-right">
                    <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      (det.p_Itbis ?? 0) > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {((det.p_Itbis ?? 0) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-2 py-1 text-right font-mono text-gray-700 font-medium">
                    {formatMoney(det.total)}
                  </td>
                  <td className="px-2 py-1 text-center">
                    <button 
                      type="button" 
                      onClick={() => eliminarDetalle(index)}
                      className="text-red-500 hover:text-red-700 p-0.5 rounded hover:bg-red-50 transition-colors" 
                      title="Eliminar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ArticuloSelector 
        isOpen={showArticuloSelector} 
        onClose={() => setShowArticuloSelector(false)} 
        onSelect={handleArticuloSelect} 
        idEmpresa={idEmpresa} 
      />
    </div>
  );
}