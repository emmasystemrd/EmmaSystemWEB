import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { articuloApi, type ArticuloSaveDto } from '../../api/articulo.api';
import { categoriaApi, type CategoriaDto } from '../../api/categoria.api';
import { medidaApi, type MedidaArticuloDto } from '../../api/medida.api';
import { detalleProductoApi, type DetalleProductoSaveDto } from '../../api/detalle-producto.api';
import CuentaContableSelector from '../../components/CuentaContableSelector';
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
    cta_Inventario: '', cta_Costo: '', cta_Ingreso: '', cta_VentaAF: '',
    facturar_Sin_Existencia: 'N',
    codigo_barra: '', unidades: 1,
    fotoBase64: undefined, estado: 'A', // ← AGREGAR (por defecto Activo)
  });

  const [detalles, setDetalles] = useState<(DetalleProductoSaveDto & { iddetalle?: number; key: string })[]>([]);
  const [detallesAEliminar, setDetallesAEliminar] = useState<number[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDto[]>([]);
  const [medidas, setMedidas] = useState<MedidaArticuloDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isInitializedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const idEmpresa = user?.idempresa ?? 1;
  const esEdicion = !!id;

  // ═══════════════════════════════════════════════════════════════
  // 🔧 INICIALIZACIÓN (con useRef para evitar doble ejecución)
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    loadCategorias();
    loadMedidas();

    if (!isInitializedRef.current) {
      if (esEdicion && id) {
        loadArticulo(parseInt(id));
      } else {
        addDetalle();
        // Cargar secuencia automática para tipo P
        loadSecuencia('P');
      }
      isInitializedRef.current = true;
    }
  }, [id, esEdicion]);

  // ═══════════════════════════════════════════════════════════════
  // 📊 CARGAR SECUENCIA AUTOMÁTICA DEL CÓDIGO
  // ═══════════════════════════════════════════════════════════════
  const loadSecuencia = async (tipo: string) => {
    if (esEdicion) return; // No cambiar código en edición
    try {
      const { data: secuencia } = await articuloApi.getSecuencia(tipo);
      setForm(prev => ({ ...prev, codigo: String(secuencia) }));
    } catch (err) {
      console.error('Error al cargar secuencia:', err);
    }
  };

  // Cuando cambia el tipo, recalcular secuencia
  useEffect(() => {
    if (!esEdicion && form.tipo) {
      loadSecuencia(form.tipo);
    }
  }, [form.tipo]);

  // ═══════════════════════════════════════════════════════════════
  // 📥 CARGAR DATOS
  // ═══════════════════════════════════════════════════════════════
  const loadArticulo = async (idArticulo: number) => {
  setLoading(true);
  try {
    const { data: cabecera } = await articuloApi.getById(idArticulo);
    const { data: detallesData } = await detalleProductoApi.getByArticulo(idArticulo);

    // ✅ Mapeo completo de TODOS los campos
    setForm({
      codigo: cabecera.codigo || '',
      nombre: cabecera.nombre || '',
      descripcion: cabecera.descripcion || '',
      fecha1: cabecera.fecha1?.split('T')[0] || new Date().toISOString().split('T')[0],
      idcategoria: cabecera.idcategoria ?? 0,
      idmedida: cabecera.idmedida ?? 0,
      costo: cabecera.costo ?? 0,
      precio: cabecera.precio ?? 0,
      comision: toPercentage(cabecera.comision ?? 0),
      balance_inicial: cabecera.exist ?? 0,
      tipo: cabecera.tipo || 'P',
      categoriaAF: cabecera.categoria ?? 0, // ✅ Mapear Categoria del SP a categoriaAF
      maximo: cabecera.maximo ?? 0,
      minimo: cabecera.minimo ?? 0,
      tax: toPercentage(cabecera.tax ?? 0),
      isVencimiento: cabecera.isVencimiento ?? false,
      fecha_vencimiento: cabecera.fecha_vencimiento?.split('T')[0],
      cta_Inventario: cabecera.cta_Inventario || '',
      cta_Costo: cabecera.cta_Costo || '',
      cta_Ingreso: cabecera.cta_Ingreso || '',
      cta_VentaAF: cabecera.cta_VentaAF || '',
      facturar_Sin_Existencia: cabecera.facturar_Sin_Existencia?.toUpperCase() === 'Y' ? 'Y' : 'N',
      codigo_barra: '',
      unidades: 1,
fotoBase64: cabecera.fotoBase64 ? `data:image/jpeg;base64,${cabecera.fotoBase64}` : undefined,
      estado: cabecera.estado || 'A', // ← AGREGAR
    });

    // ✅ Mapear detalles/presentaciones
    const detallesConKey = detallesData.map(d => ({
      ...d,
      key: `detalle-${d.iddetalle}`,
      codigoBarra: d.codigo_barra || '',
      idmedida: d.idmedida,
      existencia: d.existencia ?? 0,
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

  // ═══════════════════════════════════════════════════════════════
  // 🖼️ MANEJO DE FOTO
  // ═══════════════════════════════════════════════════════════════

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 1024 * 1024) {
    setError('La imagen no debe superar 1MB');
    return;
  }

  if (!file.type.startsWith('image/')) {
    setError('Solo se permiten archivos de imagen');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const base64Full = event.target?.result as string;
    // ✅ Guardar CON prefijo para mostrar en el frontend
    setForm(prev => ({ ...prev, fotoBase64: base64Full }));
  };
  reader.readAsDataURL(file);
};

  const removeFoto = () => {
    setForm(prev => ({ ...prev, fotoBase64: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ═══════════════════════════════════════════════════════════════
  // 📋 DETALLES / PRESENTACIONES
  // ═══════════════════════════════════════════════════════════════
  const addDetalle = () => {
    const hasEmptyRow = detalles.some(d =>
      !d.iddetalle && !d.codigoBarra && !d.nombre && d.unidades === 1
    );
    if (hasEmptyRow) return;

    const newDetalle: DetalleProductoSaveDto & { key: string } = {
      key: `new-${Date.now()}-${Math.random()}`,
      idarticulo: 0,
      codigoBarra: '',
      nombre: '',
      idmedida: form.idmedida || 0,
      unidades: 1,
      costo: form.costo || 0,
      margen: 0,
      precio: form.precio || 0,
      existencia:0,
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

  // ═══════════════════════════════════════════════════════════════
  // 💾 GUARDAR
  // ═══════════════════════════════════════════════════════════════
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formToSave = {
  ...form,
  tax: toDecimal(form.tax),
  comision: toDecimal(form.comision),
  facturar_sin_existencia: form.facturar_Sin_Existencia?.toUpperCase() === 'Y' ? 'Y' : 'N',
  // ✅ CORREGIR: Quitar prefijo antes de enviar al backend
  fotoBase64: form.fotoBase64?.includes(',') 
    ? form.fotoBase64.split(',')[1] 
    : form.fotoBase64,
};

    try {
      let idArticulo: number;
      if (esEdicion && id) {
        idArticulo = parseInt(id);
        await articuloApi.update(idArticulo, formToSave);
      } else {
        const { data: responseData } = await articuloApi.create(formToSave);
        idArticulo = responseData.idArticulo;
        if (!idArticulo || idArticulo <= 0) {
          throw new Error('El servidor no devolvió un ID válido');
        }
      }

      // Eliminar detalles marcados
      if (esEdicion && detallesAEliminar.length > 0) {
        await Promise.all(detallesAEliminar.map(idDet => detalleProductoApi.delete(idArticulo, idDet)));
      }

      // Crear/Actualizar detalles
      if (detalles.length > 0) {
        await Promise.all(detalles.map(async (det) => {
          const detalleDto: DetalleProductoSaveDto = {
            idarticulo: idArticulo,
            codigoBarra: det.codigoBarra,
            nombre: '',
            idmedida: det.idmedida,
            unidades: det.unidades,
            costo: det.costo,
            margen: det.margen,
            precio: det.precio,
            existencia:det.existencia,
          };
          if (det.iddetalle) {
            await detalleProductoApi.update(idArticulo, det.iddetalle, detalleDto);
          } else {
            await detalleProductoApi.create(idArticulo, detalleDto);
          }
        }));
      }

      setSuccess('✅ Producto guardado correctamente');
      setTimeout(() => navigate('/productos'), 1500);
    } catch (err: any) {
      console.error('Error al guardar:', err);
      const serverMsg = err.response?.data?.message || err.response?.data?.title;
      setError(serverMsg || err.message || 'Error al guardar el producto');
    } finally {
      setLoading(false);
    }
  };

  if (loading && esEdicion && detalles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando producto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-4">
      <div className="max-w-7xl mx-auto space-y-4">

        {/* ═══ HEADER ═══ */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                {esEdicion ? '✏️ Editar Producto' : '📦 Nuevo Producto'}
              </h1>
              <p className="text-emerald-100 text-xs">Complete la información del artículo</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => navigate('/productos')}
                className="px-4 py-2 text-xs font-semibold text-emerald-700 bg-white rounded-lg hover:bg-gray-50 transition shadow">
                ← Cancelar
              </button>
              <button form="articulo-form" type="submit" disabled={loading}
                className="px-4 py-2 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition shadow disabled:opacity-50 flex items-center gap-1.5">
                {loading ? (
                  <>
                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                    Guardando...
                  </>
                ) : '💾 Guardar'}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ MENSAJES ═══ */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 text-sm text-red-700 shadow-sm flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-3 text-sm text-emerald-700 shadow-sm">
            {success}
          </div>
        )}

        <form id="articulo-form" onSubmit={handleSubmit} className="space-y-4">

          {/* ═══════════════════════════════════════════════════════════════
              SECCIÓN 1: INFORMACIÓN GENERAL
              ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
                📋 Información General
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {/* Fila 1: Código + Nombre */}
              {/* Fila 1: Código + Nombre + Estado */}
<div className="w-full flex flex-col md:flex-row gap-3">
  <div className="w-full md:w-32 shrink-0">
    <label className="block text-xs font-semibold text-gray-700 mb-1">Código *</label>
    <input type="text" required value={form.codigo}
      onChange={(e) => setForm({ ...form, codigo: e.target.value })}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
      placeholder="Auto" />
    <p className="text-[10px] text-gray-400 mt-0.5">Auto-generado</p>
  </div>
  
  <div className="flex-1 min-w-0">
    <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre del Producto *</label>
    <input type="text" required value={form.nombre}
      onChange={(e) => {
        setForm({ ...form, nombre: e.target.value });
        setDetalles(prev => prev.map(d => ({ ...d, nombre: e.target.value })));
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
      placeholder="Ej: Coca Cola 2L" />
  </div>
  
  <div className="w-full md:w-32 shrink-0">
    <label className="block text-xs font-semibold text-gray-700 mb-1">Estado *</label>
    <select 
      value={form.estado || 'A'}
      onChange={(e) => setForm({ ...form, estado: e.target.value })}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
    >
      <option value="A">✅ Activo</option>
      <option value="I">⛔ Inactivo</option>
    </select>
  </div>
</div>

              {/* Fila 2: Descripción */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción</label>
                <textarea value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition resize-none"
                  placeholder="Descripción detallada del producto..." />
              </div>

              {/* Fila 3: Tipo + Categoría + Unidad */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo *</label>
                  <select value={form.tipo}
                    onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition">
                    <option value="P">Mercancía</option>
                    <option value="M">Material</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Categoría *</label>
                  <select required value={form.idcategoria}
                    onChange={(e) => setForm({ ...form, idcategoria: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition">
                    <option value={0}>Seleccionar...</option>
                    {categorias.map((c) => (
                      <option key={c.idcategoria} value={c.idcategoria}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unidad Base *</label>
                  <select required value={form.idmedida}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForm({ ...form, idmedida: val });
                      setDetalles(prev => prev.map(d => ({ ...d, idmedida: val })));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition">
                    <option value={0}>Seleccionar...</option>
                    {medidas.map((m) => (
                      <option key={m.idmedida} value={m.idmedida}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECCIÓN 2: FOTO DEL PRODUCTO
              ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
                🖼️ Foto del Producto
              </h3>
            </div>
            <div className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Preview de la foto */}
                <div className="w-full md:w-48 h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 overflow-hidden relative group">
                  {form.fotoBase64 ? (
  <>
    <img src={form.fotoBase64} alt="Preview" className="w-full h-full object-cover" />
    <button type="button" onClick={removeFoto}
      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
      title="Eliminar foto">
      ✕
    </button>
  </>
                  ) : (
                    <div className="text-center p-4">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-500">Sin imagen</p>
                    </div>
                  )}
                </div>

                {/* Controles de upload */}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                    id="foto-upload"
                  />
                  <label htmlFor="foto-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition cursor-pointer shadow-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {form.fotoBase64 ? 'Cambiar imagen' : 'Subir imagen'}
                  </label>
                  <p className="text-[11px] text-gray-500">
                    Formatos: JPG, PNG, GIF. Máximo 1MB.
                  </p>
                  <p className="text-[11px] text-gray-400 italic">
                    💡 La imagen se almacena en la base de datos
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECCIÓN 3: PRECIOS Y COSTOS
              ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
                💰 Precios y Costos
              </h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Costo *</label>
                  <input type="number" step="0.01" required value={form.costo}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setForm({ ...form, costo: val });
                      setDetalles(prev => prev.map(d => ({ ...d, costo: val, margen: d.precio > 0 && val > 0 ? (d.precio - val) / val : 0 })));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Precio Venta *</label>
                  <input type="number" step="0.01" required value={form.precio}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setForm({ ...form, precio: val });
                      setDetalles(prev => prev.map(d => ({ ...d, precio: val, margen: val > 0 && d.costo > 0 ? (val - d.costo) / d.costo : 0 })));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">ITBIS (%)</label>
                  <input type="number" min="0" max="100" value={form.tax}
                    onChange={(e) => setForm({ ...form, tax: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Comisión (%)</label>
                  <input type="number" min="0" max="100" step="0.01" value={form.comision}
                    onChange={(e) => setForm({ ...form, comision: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                </div>
              </div>

              {/* Resumen de cálculo */}
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gradient-to-r from-emerald-50 to-amber-50 rounded-lg border border-emerald-100">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Margen</p>
                  <p className="text-sm font-bold text-emerald-700">
                    {form.costo > 0 && form.precio > 0
                      ? `${(((form.precio - form.costo) / form.costo) * 100).toFixed(2)}%`
                      : '0.00%'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Precio + ITBIS</p>
                  <p className="text-sm font-bold text-orange-600">
                    RD$ {(form.precio * (1 + toDecimal(form.tax))).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Ganancia</p>
                  <p className="text-sm font-bold text-emerald-700">
                    RD$ {(form.precio - form.costo).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECCIÓN 4: INVENTARIO
              ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
                📦 Inventario
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Balance Inicial</label>
                  <input type="number" step="0.01" value={form.balance_inicial} readOnly  
                    onChange={(e) => setForm({ ...form, balance_inicial: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Máximo</label>
                  <input type="number" value={form.maximo}
                    onChange={(e) => setForm({ ...form, maximo: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Mínimo</label>
                  <input type="number" value={form.minimo}
                    onChange={(e) => setForm({ ...form, minimo: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer pb-2">
                    <input type="checkbox" checked={form.facturar_Sin_Existencia === 'Y'}
                      onChange={(e) => setForm({ ...form, facturar_Sin_Existencia: e.target.checked ? 'Y' : 'N' })}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                    Facturar sin existencia
                  </label>
                </div>
              </div>

              {/* Vencimiento */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input type="checkbox" checked={form.isVencimiento}
                    onChange={(e) => setForm({ ...form, isVencimiento: e.target.checked })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                  Producto con vencimiento
                </label>
                {form.isVencimiento && (
                  <input type="date" value={form.fecha_vencimiento || ''}
                    onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECCIÓN 5: CUENTAS CONTABLES
              ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2.5 border-b border-emerald-100">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
                📊 Cuentas Contables
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Asocia las cuentas contables para este producto</p>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  📥 Cuenta de Inventario
                </label>
                <CuentaContableSelector
                  value={form.cta_Inventario || ''}
                  onChange={(codigo) => setForm({ ...form, cta_Inventario: codigo })}
                  placeholder="Buscar cuenta de inventario..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  💸 Cuenta de Costo
                </label>
                <CuentaContableSelector
                  value={form.cta_Costo || ''}
                  onChange={(codigo) => setForm({ ...form, cta_Costo: codigo })}
                  placeholder="Buscar cuenta de costo..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  💵 Cuenta de Ingreso
                </label>
                <CuentaContableSelector
                  value={form.cta_Ingreso || ''}
                  onChange={(codigo) => setForm({ ...form, cta_Ingreso: codigo })}
                  placeholder="Buscar cuenta de ingreso..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  🛒 Cuenta de Venta (AF)
                </label>
                <CuentaContableSelector
                  value={form.cta_VentaAF || ''}
                  onChange={(codigo) => setForm({ ...form, cta_VentaAF: codigo })}
                  placeholder="Buscar cuenta de venta..."
                />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              SECCIÓN 6: PRESENTACIONES / DETALLES
              ═══════════════════════════════════════════════════════════════ */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2.5 border-b border-emerald-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
                📐 Detalles del Producto
              </h3>
              <button type="button" onClick={addDetalle}
                className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition shadow-sm flex items-center gap-1">
                <span>➕</span> Agregar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Código Barra</th>
                    <th className="px-3 py-2 text-left font-semibold">Medida</th>
                    <th className="px-3 py-2 text-right font-semibold">UNDs</th>
                    <th className="px-3 py-2 text-right font-semibold">P.Compra</th>
                    <th className="px-3 py-2 text-right font-semibold">Margen</th>
                    <th className="px-3 py-2 text-right font-semibold">P.Venta</th>
                    <th className="px-3 py-2 text-right font-semibold">P.+ITBIS</th>
                    <th className="px-3 py-2 text-right font-semibold">Existencia</th>
                    <th className="px-3 py-2 text-center font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detalles.map((det, index) => (
                    <tr key={det.key} className="hover:bg-orange-50/50 transition-colors">
                      <td className="px-2 py-1.5">
                        <input type="text" value={det.codigoBarra}
                          onChange={(e) => updateDetalle(index, 'codigoBarra', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
                          placeholder="Opcional" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={det.idmedida}
                          onChange={(e) => updateDetalle(index, 'idmedida', Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none">
                          {medidas.map(m => <option key={m.idmedida} value={m.idmedida}>{m.nombre}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step="0.01" min="1" value={det.unidades}
                          onChange={(e) => updateDetalle(index, 'unidades', parseFloat(e.target.value) || 0)}
                          className="w-15 px-2 py-1 border border-gray-200 rounded text-xs text-right focus:ring-1 focus:ring-emerald-500 outline-none" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step="0.01" min="0" value={det.costo}
                          onChange={(e) => updateDetalle(index, 'costo', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-right focus:ring-1 focus:ring-emerald-500 outline-none" />
                      </td>
                      <td className="px-2 py-1.5 text-right text-gray-600 font-mono">
                        {(det.margen * 100).toFixed(2)}%
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step="0.01" min="0" value={det.precio}
                          onChange={(e) => updateDetalle(index, 'precio', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-200 rounded text-xs text-right focus:ring-1 focus:ring-emerald-500 outline-none" />
                      </td>
                      <td className="px-2 py-1.5 text-right text-emerald-700 font-semibold font-mono">
                        {(det.precio * (1 + toDecimal(form.tax))).toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5">
  <input 
    type="number" 
    step="any" 
    min="0" 
    value={det.existencia || 0}
    onChange={(e) => updateDetalle(index, 'existencia', parseFloat(e.target.value) || 0)}
    className="w-18 px-1 py-1 border border-gray-200 rounded text-xs text-right focus:ring-1 focus:ring-emerald-500 outline-none"
    placeholder="0.00"
  />
</td>
                      <td className="px-2 py-1.5 text-center">
                        <button type="button" onClick={() => removeDetalle(index)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Eliminar presentación">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {detalles.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8">
                        <div className="text-4xl mb-2">📐</div>
                        <p className="text-xs text-gray-400">No hay presentaciones</p>
                        <button type="button" onClick={addDetalle}
                          className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                          + Agregar primera presentación
                        </button>
                      </td>
                    </tr>
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