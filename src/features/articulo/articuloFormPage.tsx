import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { articuloApi, type ArticuloSaveDto } from '../../api/articulo.api';
import { categoriaApi, type CategoriaDto } from '../../api/categoria.api';
import { medidaApi, type MedidaArticuloDto } from '../../api/medida.api';
import { detalleProductoApi, type DetalleProductoSaveDto } from '../../api/detalle-producto.api';
import { useAuthStore } from '../../store/authStore';

export default function ArticuloFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const toPercentage = (value: number | null | undefined): number => {
    if (value == null) return 0;
    return Math.round(value * 100);
  };
  const toDecimal = (percent: number): number => {
    return parseFloat((percent / 100).toFixed(4));
  };

  const [form, setForm] = useState<ArticuloSaveDto>({
    codigo: '', nombre: '', descripcion: '', fecha1: new Date().toISOString().split('T')[0],
    idcategoria: 0, idmedida: 0, costo: 0, precio: 0, comision: 0, balance_inicial: 0,
    tipo: 'P', maximo: 0, minimo: 0, tax: 18, isVencimiento: false,
    cta_inventario: '', cta_costo: '', cta_ingreso: '', cta_ventaAF: '',
    facturar_sin_existencia: 'N',
    codigo_barra: '', unidades: 1,
  });
  
  const [detalles, setDetalles] = useState<(DetalleProductoSaveDto & { iddetalle?: number; key: string })[]>([]);
  const [detallesAEliminar, setDetallesAEliminar] = useState<number[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [medidas, setMedidas] = useState<MedidaArticuloDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const idEmpresa = user?.idempresa ?? 1;
  const idLogin = user?.idusuario ?? 1;
  const esEdicion = !!id;

  useEffect(() => {
    loadCategorias();
    loadMedidas();
    if (esEdicion && id) {
      loadArticulo(parseInt(id));
    } else {
      addDetalle();
    }
  }, [id, esEdicion, idEmpresa]);

  const loadArticulo = async (idArticulo: number) => {
    setLoading(true);
    try {
      const { data: cabecera } = await articuloApi.getById(idArticulo);
      const { data: detallesData } = await detalleProductoApi.getByArticulo(idArticulo);
      
      setForm({
        codigo: cabecera.codigo, nombre: cabecera.nombre, descripcion: cabecera.descripcion || '',
        fecha1: cabecera.fecha1?.split('T')[0] || '',
        idcategoria: cabecera.idcategoria, idmedida: cabecera.idmedida,
        costo: cabecera.costo, precio: cabecera.precio, comision: cabecera.comision,
        balance_inicial: cabecera.balance_inicial, tipo: cabecera.tipo,
        maximo: cabecera.maximo, minimo: cabecera.minimo, 
        tax: toPercentage(cabecera.tax),
        isVencimiento: cabecera.isVencimiento,
        fecha_vencimiento: cabecera.fecha_vencimiento?.split('T')[0],
        cta_inventario: cabecera.cta_inventario || '', cta_costo: cabecera.cta_costo || '',
        cta_ingreso: cabecera.cta_ingreso || '', cta_ventaAF: cabecera.cta_ventaAF || '',
        facturar_sin_existencia: cabecera.facturar_sin_existencia?.toUpperCase() === 'Y' ? 'Y' : 'N',
        codigo_barra: '', unidades: 1,
      });

      const detallesConKey = detallesData.map(d => ({
        ...d,
        key: `detalle-${d.iddetalle}`,
        codigoBarra: d.codigo_barra,
        idmedida: d.idmedida,
      }));
      setDetalles(detallesConKey);
    } catch (err: any) {
      console.error('Error al cargar artículo:', err);
      setError('No se pudieron cargar los datos del producto');
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const { data } = await categoriaApi.getForArticulo(idEmpresa);
      setCategorias(data);
    } catch (err) { console.error('Error categorías:', err); }
  };

  const loadMedidas = async () => {
    try {
      const { data } = await medidaApi.getForArticulo(idEmpresa);
      setMedidas(data);
    } catch (err) { console.error('Error medidas:', err); }
  };

  const addDetalle = () => {
    const newDetalle: DetalleProductoSaveDto & { key: string } = {
      key: `new-${Date.now()}`,
      idarticulo: 0,
      codigoBarra: '',
      nombre: form.nombre || '',
      idmedida: form.idmedida || 0,
      unidades: 1,
      costo: form.costo || 0,
      margen: 0,
      precio: form.precio || 0,
    };
    setDetalles(prev => [...prev, newDetalle]);
  };

  const removeDetalle = (index: number) => {
    const detalle = detalles[index];
    if (detalle.iddetalle) {
      setDetallesAEliminar(prev => [...prev, detalle.iddetalle!]);
    }
    setDetalles(prev => prev.filter((_, i) => i !== index));
  };

  const updateDetalle = (index: number, field: keyof DetalleProductoSaveDto, value: any) => {
    setDetalles(prev => {
      const newDetalles = [...prev];
      newDetalles[index] = { ...newDetalles[index], [field]: value };
      if (field === 'costo' || field === 'precio') {
        const costo = field === 'costo' ? value : newDetalles[index].costo;
        const precio = field === 'precio' ? value : newDetalles[index].precio;
        if (costo > 0 && precio > 0) {
          newDetalles[index].margen = (precio - costo) / costo;
        }
      }
      return newDetalles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formToSave = {
      ...form,
      tax: toDecimal(form.tax),
      comision: toDecimal(form.comision),
      facturar_sin_existencia: form.facturar_sin_existencia?.toUpperCase() === 'Y' ? 'Y' : 'N',
    };

    try {
      let idArticulo: number;

      if (esEdicion && id) {
        idArticulo = parseInt(id);
      } else {
        const response = await articuloApi.create(formToSave, idEmpresa, idLogin);
        let rawId: any = response;
        if (rawId && typeof rawId === 'object' && 'data' in rawId) rawId = rawId.data;
        if (rawId && typeof rawId === 'object' && 'id' in rawId) rawId = rawId.id;
        if (rawId && typeof rawId === 'object' && rawId.data && 'id' in rawId.data) rawId = rawId.data.id;
        idArticulo = Number(rawId);
      }

      if (esEdicion && detallesAEliminar.length > 0) {
        await Promise.all(detallesAEliminar.map(idDet => detalleProductoApi.delete(idArticulo, idDet)));
      }

      if (detalles.length > 0) {
        await Promise.all(detalles.map(async (det) => {
          const detalleDto: DetalleProductoSaveDto = {
            idarticulo: idArticulo,
            codigoBarra: det.codigoBarra,
            nombre: det.nombre,
            idmedida: det.idmedida,
            unidades: det.unidades,
            costo: det.costo,
            margen: det.margen,
            precio: det.precio,
          };
          if (det.iddetalle) {
            await detalleProductoApi.update(idArticulo, det.iddetalle, detalleDto);
          } else {
            await detalleProductoApi.create(idArticulo, detalleDto);
          }
        }));
      }

      alert('✅ Producto guardado correctamente');
      navigate('/productos');
    } catch (err: any) {
      console.error('❌ Error al guardar:', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.title;
      setError(serverMsg || err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (loading && esEdicion && detalles.length === 0) {
    return <div className="p-8 text-center text-gray-500">Cargando producto...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Header compacto */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold text-white">{esEdicion ? '✏️ Editar Producto' : '📦 Nuevo Producto'}</h1>
              <p className="text-emerald-100 text-[11px]">Información general y presentaciones</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => navigate('/productos')} className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-white rounded-lg hover:bg-gray-50 transition shadow">
                Cancelar
              </button>
              <button form="articulo-form" type="submit" disabled={loading} className="px-3 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-2 text-xs text-red-700 shadow-sm">
            ⚠️ {error}
          </div>
        )}

        <form id="articulo-form" onSubmit={handleSubmit} className="space-y-2">
          {/* Cabecera compacta */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-3 py-1.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                Información General
              </h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Código *</label>
                  <input type="text" required value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide">Nombre *</label>
                  <input type="text" required value={form.nombre} onChange={(e) => {
                    setForm({ ...form, nombre: e.target.value });
                    setDetalles(prev => prev.map(d => ({ ...d, nombre: e.target.value })));
                  }} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">Categoría *</label>
                  <select required value={form.idcategoria} onChange={(e) => setForm({ ...form, idcategoria: Number(e.target.value) })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-emerald-500">
                    <option value={0}>Seleccionar...</option>
                    {categorias.map((c) => (<option key={c.idcategoria} value={c.idcategoria}>{c.nombre}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">Unidad Base *</label>
                  <select required value={form.idmedida} onChange={(e) => {
                    const val = Number(e.target.value);
                    setForm({ ...form, idmedida: val });
                    setDetalles(prev => prev.map(d => ({ ...d, idmedida: val })));
                  }} className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-emerald-500">
                    <option value={0}>Seleccionar...</option>
                    {medidas.map((m) => (<option key={m.idmedida} value={m.idmedida}>{m.nombre}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">Tipo</label>
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-emerald-500">
                    <option value="P">Mercancía</option>
                    <option value="M">Material</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-gray-100">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">Costo *</label>
                  <input type="number" step="0.01" required value={form.costo} onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setForm({ ...form, costo: val });
                    setDetalles(prev => prev.map(d => ({ ...d, costo: val, margen: d.precio > 0 && val > 0 ? (d.precio - val) / val : 0 })));
                  }} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">Precio Venta *</label>
                  <input type="number" step="0.01" required value={form.precio} onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setForm({ ...form, precio: val });
                    setDetalles(prev => prev.map(d => ({ ...d, precio: val, margen: val > 0 && d.costo > 0 ? (val - d.costo) / d.costo : 0 })));
                  }} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">ITBIS (%)</label>
                  <input type="number" min="0" max="100" value={form.tax} onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700">Comisión (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={form.comision} onChange={(e) => setForm({ ...form, comision: parseFloat(e.target.value) || 0 })} className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right" />
                </div>
              </div>

              <div className="pt-0 flex items-center">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.facturar_sin_existencia === 'Y'} onChange={(e) => setForm({ ...form, facturar_sin_existencia: e.target.checked ? 'Y' : 'N' })} className="rounded border-gray-300 text-emerald-600" />
                  Facturar sin existencia
                </label>
              </div>
            </div>
          </div>

          {/* Tabla de detalles compacta */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-3 py-1.5 border-b border-emerald-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
                <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                Presentaciones / Detalles
              </h3>
              <button type="button" onClick={addDetalle} className="px-2 py-0.5 bg-orange-500 text-white rounded-md text-[11px] font-semibold hover:bg-orange-600 flex items-center gap-0.5">
                + Agregar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-semibold">Código Barra</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Presentación</th>
                    <th className="px-2 py-1.5 text-left font-semibold">Medida</th>
                    <th className="px-2 py-1.5 text-right font-semibold">UNDs</th>
                    <th className="px-2 py-1.5 text-right font-semibold">P.Compra</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Margen</th>
                    <th className="px-2 py-1.5 text-right font-semibold">P.Venta</th>
                    <th className="px-2 py-1.5 text-right font-semibold">P.+ITBIS</th>
                    <th className="px-2 py-1.5 text-right font-semibold">Existencia</th>
                    <th className="px-2 py-1.5 text-center font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detalles.map((det, index) => (
                    <tr key={det.key} className="hover:bg-orange-50">
                      <td className="px-2 py-1"><input type="text" value={det.codigoBarra} onChange={(e) => updateDetalle(index, 'codigoBarra', e.target.value)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs" placeholder="Opcional" /></td>
                      <td className="px-2 py-1"><input type="text" value={det.nombre} onChange={(e) => updateDetalle(index, 'nombre', e.target.value)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs" placeholder="Ej. Mayor, Detalle" /></td>
                      <td className="px-2 py-1">
                        <select value={det.idmedida} onChange={(e) => updateDetalle(index, 'idmedida', Number(e.target.value))} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs bg-white">
                          {medidas.map(m => <option key={m.idmedida} value={m.idmedida}>{m.nombre}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1"><input type="number" step="0.01" min="1" value={det.unidades} onChange={(e) => updateDetalle(index, 'unidades', parseFloat(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-right" /></td>
                      <td className="px-2 py-1"><input type="number" step="0.01" min="0" value={det.costo} onChange={(e) => updateDetalle(index, 'costo', parseFloat(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-right" /></td>
                      <td className="px-2 py-1 text-right text-gray-600">{(det.margen * 100).toFixed(2)}%</td>
                      <td className="px-2 py-1"><input type="number" step="0.01" min="0" value={det.precio} onChange={(e) => updateDetalle(index, 'precio', parseFloat(e.target.value) || 0)} className="w-full px-1 py-0.5 border border-gray-200 rounded text-xs text-right" /></td>
                      <td className="px-2 py-1 text-right text-emerald-700 font-semibold">{(det.precio * (1 + toDecimal(form.tax))).toFixed(2)}</td>
                      <td className="px-2 py-1">
                        <input type="number" step="0.01" min="0" value={det.unidades > 0 ? (form.balance_inicial / det.unidades).toFixed(2) : 0} readOnly disabled={esEdicion} className="w-full px-1 py-0.5 border rounded text-xs text-right bg-gray-50" />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button type="button" onClick={() => removeDetalle(index)} className="text-red-500 hover:text-red-700 p-0.5 rounded">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {detalles.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-6 text-gray-400 text-xs">No hay presentaciones. Click en "Agregar" para añadir.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}