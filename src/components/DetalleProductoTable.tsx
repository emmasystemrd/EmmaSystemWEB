import { useState, useEffect } from 'react';
import { detalleProductoApi, type DetalleProductoDto, type DetalleProductoSaveDto } from '../api/detalle-producto.api';
import { medidaApi, type MedidaArticuloDto } from '../api/medida.api';

interface DetalleProductoTableProps {
  idArticulo: number | null;
  idEmpresa: number;
  onDetailsChange?: (details: DetalleProductoDto[]) => void;
}

export default function DetalleProductoTable({ idArticulo, idEmpresa, onDetailsChange }: DetalleProductoTableProps) {
  const [detalles, setDetalles] = useState<DetalleProductoDto[]>([]);
  const [medidas, setMedidas] = useState<MedidaArticuloDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<DetalleProductoSaveDto>>({
    codigoBarra: '', nombre: '', idmedida: 0, unidades: 1, costo: 0, margen: 0, precio: 0,
  });

  useEffect(() => {
    const loadMedidas = async () => {
      try {
        const { data } = await medidaApi.getForArticulo(idEmpresa);
        setMedidas(data);
      } catch (err) {
        console.error('Error al cargar medidas:', err);
      }
    };
    if (idEmpresa) loadMedidas();
  }, [idEmpresa]);

  useEffect(() => {
    if (idArticulo) {
      loadDetalles();
    } else {
      setDetalles([]);
    }
  }, [idArticulo]);

  const loadDetalles = async () => {
    if (!idArticulo) return;
    setLoading(true);
    try {
      const { data } = await detalleProductoApi.getByArticulo(idArticulo);
      // ✅ Asegurar que no haya duplicados por ID
      const unique = data.filter((det, idx, self) => 
        self.findIndex(d => d.iddetalle === det.iddetalle) === idx
      );
      setDetalles(unique);
      onDetailsChange?.(unique);
    } catch (err) {
      console.error('Error al cargar detalles:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (detalle: DetalleProductoDto) => {
    setEditingId(detalle.iddetalle);
    setForm({
      codigoBarra: detalle.codigo_barra,
      nombre: detalle.nombre,
      idmedida: detalle.idmedida,
      unidades: detalle.unidades,
      costo: detalle.costo,
      margen: detalle.margen,
      precio: detalle.precio,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ codigoBarra: '', nombre: '', idmedida: 0, unidades: 1, costo: 0, margen: 0, precio: 0 });
  };

  const saveDetalle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idmedida || !form.nombre || !form.unidades) {
      alert('Completa los campos obligatorios');
      return;
    }

    try {
      const dto: DetalleProductoSaveDto = {
        idarticulo: idArticulo || 0,
        codigoBarra: form.codigoBarra || '',
        nombre: form.nombre!,
        idmedida: form.idmedida!,
        unidades: form.unidades!,
        costo: form.costo || 0,
        margen: form.margen || 0,
        precio: form.precio || 0,
      };

      if (editingId) {
        if (idArticulo) {
          await detalleProductoApi.update(idArticulo, editingId, dto);
        } else {
          alert('No se puede editar porque el producto aún no ha sido creado');
          return;
        }
      } else if (idArticulo) {
        await detalleProductoApi.create(idArticulo, dto);
      }
      cancelEdit();
      if (idArticulo) loadDetalles();
    } catch (err: any) {
      console.error('Error al guardar detalle:', err);
      alert(err.response?.data?.message || 'Error al guardar');
    }
  };

  const deleteDetalle = async (idDetalle: number) => {
    if (!confirm('¿Eliminar esta presentación?')) return;
    if (!idArticulo) {
      alert('No se puede eliminar porque el producto no existe');
      return;
    }
    try {
      await detalleProductoApi.delete(idArticulo, idDetalle);
      loadDetalles();
    } catch (err: any) {
      console.error('Error al eliminar:', err);
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  const calculateMargen = (costo: number, precio: number) => {
    if (!costo || !precio) return 0;
    return (precio - costo) / costo;
  };

  const handleCostoOrPrecioChange = (field: 'costo' | 'precio', value: number) => {
    const newForm = { ...form, [field]: value };
    if (newForm.costo && newForm.precio) {
      newForm.margen = calculateMargen(newForm.costo, newForm.precio);
    }
    setForm(newForm);
  };

  return (
    <div className="space-y-3">
      {/* Encabezado compacto */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-1">
          <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
          Presentaciones / Detalles
        </h3>
        <span className="text-[11px] text-gray-500">{detalles.length} presentación{detalles.length !== 1 ? 'es' : ''}</span>
      </div>

      {/* Formulario de detalle compacto */}
      <form onSubmit={saveDetalle} className="bg-gradient-to-r from-emerald-50 to-yellow-50 p-3 rounded-xl border border-emerald-100 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Código Barras</label>
            <input
              type="text"
              value={form.codigoBarra}
              onChange={(e) => setForm({ ...form, codigoBarra: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="Opcional"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Nombre de Presentación *</label>
            <input
              type="text"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="Ej. Caja x12, Unidad, Litro..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Unidad *</label>
            <select
              required
              value={form.idmedida}
              onChange={(e) => setForm({ ...form, idmedida: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
            >
              <option value={0}>Seleccionar...</option>
              {medidas.map((m) => (
                <option key={m.idmedida} value={m.idmedida}>{m.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Unidades por Presentación *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={form.unidades}
              onChange={(e) => setForm({ ...form, unidades: parseFloat(e.target.value) || 0 })}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Costo Unitario *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.costo}
              onChange={(e) => handleCostoOrPrecioChange('costo', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Precio de Venta *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={form.precio}
              onChange={(e) => handleCostoOrPrecioChange('precio', parseFloat(e.target.value) || 0)}
              className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[10px] text-gray-600">
            Margen: <span className="font-mono font-medium text-emerald-700">{form.margen ? (form.margen * 100).toFixed(2) : '0.00'}%</span>
          </span>
          <div className="flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="px-3 py-1 text-xs font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600 transition shadow-sm"
            >
              {editingId ? 'Actualizar' : idArticulo ? 'Agregar Presentación' : 'Agregar (se guardará con el producto)'}
            </button>
          </div>
        </div>
      </form>

      {/* Tabla compacta */}
      {loading ? (
        <div className="text-center text-gray-500 py-4 text-xs">Cargando presentaciones...</div>
      ) : detalles.length === 0 ? (
        <div className="text-center text-gray-400 py-4 text-xs border border-dashed border-gray-200 rounded-lg">
          No hay presentaciones registradas. Agrega la primera arriba.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
              <tr>
                <th className="px-2 py-1.5 text-left font-semibold text-emerald-800">Presentación</th>
                <th className="px-2 py-1.5 text-left font-semibold text-emerald-800">Unidad</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">Unidades</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">Costo</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">Precio</th>
                <th className="px-2 py-1.5 text-right font-semibold text-emerald-800">Margen</th>
                <th className="px-2 py-1.5 text-center font-semibold text-emerald-800">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {detalles.map((det) => (
                <tr key={det.iddetalle} className="hover:bg-orange-50 transition-colors">
                  <td className="px-2 py-1.5 font-medium text-gray-800">{det.nombre}</td>
                  <td className="px-2 py-1.5 text-gray-600">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded-full text-[10px]">{det.medida_nombre || `ID:${det.idmedida}`}</span>
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono">{det.unidades}</td>
                  <td className="px-2 py-1.5 text-right font-mono">RD$ {det.costo.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right font-mono font-semibold text-emerald-700">RD$ {det.precio.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-right font-mono text-green-600">{(det.margen * 100).toFixed(2)}%</td>
                  <td className="px-2 py-1.5 text-center space-x-1.5 whitespace-nowrap">
                    <button
                      onClick={() => startEdit(det)}
                      className="text-blue-600 hover:text-blue-800 text-xs p-1 rounded hover:bg-blue-50"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteDetalle(det.iddetalle)}
                      className="text-red-600 hover:text-red-800 text-xs p-1 rounded hover:bg-red-50"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}