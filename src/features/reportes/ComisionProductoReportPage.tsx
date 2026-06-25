import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { reporteApi, type ComisionProductoReporteDto } from '../../api/reporte.api';
import { empresaApi, type EmpresaDto } from '../../api/empresa.api';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';

interface EmpleadoDto {
  idempleado: number;
  nombres: string;
  apellido1: string;
  apellido2: string;
  num_Doc: string;
}

export default function ComisionProductoReportPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const idEmpresa = user?.idempresa ?? 1;

  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [empleados, setEmpleados] = useState<EmpleadoDto[]>([]);
  const [reporte, setReporte] = useState<ComisionProductoReporteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState({
    fecha1: new Date().toISOString().split('T')[0],
    fecha2: new Date().toISOString().split('T')[0],
    idEmpleado: 0
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [empRes, logoRes, empListRes] = await Promise.all([
          empresaApi.getById(idEmpresa),
          empresaApi.getLogo(idEmpresa),
          apiClient.get<EmpleadoDto[]>('/empleado', { params: { idEmpresa } })
        ]);
        setEmpresa(empRes.data);
        if (logoRes.data?.logo) setLogoUrl(`data:image/png;base64,${logoRes.data.logo}`);
        setEmpleados(empListRes.data);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
    cargarDatos();
  }, [idEmpresa]);

  const cargarReporte = async () => {
    if (!filtros.idEmpleado) {
      setError('Debe seleccionar un empleado');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await reporteApi.comisionProducto(filtros.fecha1, filtros.fecha2, filtros.idEmpleado);
      setReporte(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (v: number | null | undefined) => v == null || isNaN(v) ? 'RD$ 0.00' : new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(v);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-DO') : '-';
  const formatPercent = (v: number | null | undefined) => v == null || isNaN(v) ? '0%' : `${(v * 100).toFixed(2)}%`;

  const empleadoNombre = empleados.find(e => e.idempleado === filtros.idEmpleado);
  const empleadoDisplay = empleadoNombre ? `${empleadoNombre.nombres} ${empleadoNombre.apellido1}` : '';

  const exportarPDF = async () => {
    if (reporte.length === 0) return;
    const doc = new jsPDF('landscape', 'mm', 'letter');
    const pw = doc.internal.pageSize.getWidth();
    let y = 15;

    if (logoUrl && empresa) {
      try { doc.addImage(logoUrl, 'PNG', 15, y, 20, 20); } catch {}
    }
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(empresa?.nombre || 'Empresa', 40, y + 5);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`RNC: ${empresa?.rnc || ''}`, 40, y + 12);

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE COMISIÓN POR PRODUCTO', pw / 2, y + 35, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${formatDate(filtros.fecha1)} al ${formatDate(filtros.fecha2)}`, pw / 2, y + 42, { align: 'center' });
    doc.text(`Empleado: ${empleadoDisplay}`, pw / 2, y + 48, { align: 'center' });

    y = 70;
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    const cols = [30, 80, 30, 50, 50];
    const headers = ['Código', 'Producto', '% Comisión', 'Ventas', 'Comisión'];
    let x = 15;
    headers.forEach((h, i) => { doc.text(h, x + 2, y + 5); x += cols[i]; });
    y += 8;
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);

    let tVentas = 0, tComision = 0;
    reporte.forEach((row, idx) => {
      if (y > 200) { doc.addPage(); y = 15; }
      if (idx % 2 === 0) { doc.setFillColor(240, 253, 244); doc.rect(15, y, pw - 30, 6, 'F'); }
      x = 15;
      doc.text(row.codigo, x + 2, y + 4); x += cols[0];
      doc.text(row.producto.substring(0, 40), x + 2, y + 4); x += cols[1];
      doc.text(formatPercent(row.porcentaje), x + cols[2] - 5, y + 4, { align: 'right' }); x += cols[2];
      doc.text(formatMoney(row.ventas), x + cols[3] - 5, y + 4, { align: 'right' }); x += cols[3];
      doc.text(formatMoney(row.comision), x + cols[4] - 5, y + 4, { align: 'right' });
      tVentas += row.ventas; tComision += row.comision;
      y += 6;
    });

    y += 5;
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('TOTALES:', 17, y + 5);
    doc.text(formatMoney(tVentas), pw - 80, y + 5, { align: 'right' });
    doc.text(formatMoney(tComision), pw - 20, y + 5, { align: 'right' });

    doc.save(`Reporte_Comision_Producto_${filtros.fecha1}_al_${filtros.fecha2}.pdf`);
  };

  const exportarExcel = async () => {
    if (reporte.length === 0) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Comisión Producto');

    ws.mergeCells('A1:E1'); ws.getCell('A1').value = empresa?.nombre || 'Empresa';
    ws.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF047857' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:E3'); ws.getCell('A3').value = 'REPORTE DE COMISIÓN POR PRODUCTO';
    ws.getCell('A3').font = { size: 14, bold: true }; ws.getCell('A3').alignment = { horizontal: 'center' };

    ws.mergeCells('A4:E4'); ws.getCell('A4').value = `Empleado: ${empleadoDisplay}`;
    ws.getCell('A4').alignment = { horizontal: 'center' };

    const hr = ws.addRow(['Código', 'Producto', '% Comisión', 'Ventas', 'Comisión']);
    hr.height = 20;
    hr.eachCell(c => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      c.alignment = { horizontal: 'center' };
    });

    let tVentas = 0, tComision = 0;
    reporte.forEach((row, idx) => {
      const dr = ws.addRow([row.codigo, row.producto, row.porcentaje, row.ventas, row.comision]);
      dr.height = 18;
      dr.eachCell((c, n) => {
        if (n === 3) { c.numFmt = '0.00%'; c.alignment = { horizontal: 'right' }; }
        else if (n >= 4) { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; }
        if (idx % 2 === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      });
      tVentas += row.ventas; tComision += row.comision;
    });

    const tr = ws.addRow(['', '', '', tVentas, tComision]);
    tr.height = 20;
    tr.eachCell((c, n) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      if (n >= 4) { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; }
    });

    ws.columns = [{ width: 15 }, { width: 40 }, { width: 15 }, { width: 20 }, { width: 20 }];

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Reporte_Comision_Producto_${filtros.fecha1}_al_${filtros.fecha2}.xlsx`);
  };

  const totales = reporte.reduce((a, r) => ({ ventas: a.ventas + r.ventas, comision: a.comision + r.comision }), { ventas: 0, comision: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain bg-white rounded-lg p-1" /> : <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl">💼</div>}
              <div>
                <h1 className="text-2xl font-bold text-white">Comisión por Producto</h1>
                <p className="text-emerald-100 text-sm">{empresa?.nombre || 'Empresa'}</p>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium">← Volver</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2 border-b border-emerald-100">
            <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              <span className="w-1 h-4 bg-orange-500 rounded-full"></span> 🔍 Filtros del Reporte
            </h2>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-[160px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Fecha Desde</label>
                <input type="date" value={filtros.fecha1} onChange={(e) => setFiltros(p => ({ ...p, fecha1: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="w-[160px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Fecha Hasta</label>
                <input type="date" value={filtros.fecha2} onChange={(e) => setFiltros(p => ({ ...p, fecha2: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex-1 min-w-[250px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Empleado / Vendedor</label>
                <select value={filtros.idEmpleado} onChange={(e) => setFiltros(p => ({ ...p, idEmpleado: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value={0}>Seleccione un empleado...</option>
                  {empleados.map(e => <option key={e.idempleado} value={e.idempleado}>{e.nombres} {e.apellido1} {e.apellido2}</option>)}
                </select>
              </div>
              <div className="w-[180px]">
                <button onClick={cargarReporte} disabled={loading} className="w-full px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>Cargando...</> : <>🔍 Generar Reporte</>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {reporte.length > 0 && (
          <div className="flex gap-3 justify-end">
            <button onClick={exportarPDF} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">📄 Exportar PDF</button>
            <button onClick={exportarExcel} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2">📊 Exportar Excel</button>
          </div>
        )}

        {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-sm text-red-700">⚠️ {error}</div>}

        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-500 text-sm mt-3">Generando reporte...</p>
            </div>
          ) : reporte.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-5xl mb-3">💼</div>
              <p className="text-sm font-medium">No hay datos para mostrar</p>
              <p className="text-xs mt-1">Seleccione un empleado y genere el reporte</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Productos</p>
                  <p className="text-2xl font-bold text-emerald-700">{reporte.length}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Ventas</p>
                  <p className="text-2xl font-bold text-blue-700">{formatMoney(totales.ventas)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Comisión</p>
                  <p className="text-2xl font-bold text-green-700">{formatMoney(totales.comision)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold">Código</th>
                      <th className="px-3 py-3 text-left font-semibold">Producto</th>
                      <th className="px-3 py-3 text-right font-semibold">% Comisión</th>
                      <th className="px-3 py-3 text-right font-semibold">Ventas</th>
                      <th className="px-3 py-3 text-right font-semibold">Comisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reporte.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-emerald-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-3 py-2 font-mono text-gray-700">{row.codigo}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{row.producto}</td>
                        <td className="px-3 py-2 text-right font-mono text-blue-700 font-semibold">{formatPercent(row.porcentaje)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatMoney(row.ventas)}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-green-700">{formatMoney(row.comision)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold">
                    <tr>
                      <td colSpan={3} className="px-3 py-3 text-right uppercase text-sm">TOTALES:</td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(totales.ventas)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(totales.comision)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}