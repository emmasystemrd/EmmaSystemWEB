import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { reporteApi, type VentaDepartamentoReporteDto } from '../../api/reporte.api';
import { departamentoApi, type DepartamentoDto } from '../../api/departamento.api';
import { empresaApi, type EmpresaDto } from '../../api/empresa.api';
import { useAuthStore } from '../../store/authStore';

export default function VentaDepartamentoReportPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const idEmpresa = user?.idempresa ?? 1;

  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [departamentos, setDepartamentos] = useState<DepartamentoDto[]>([]);
  const [reporte, setReporte] = useState<VentaDepartamentoReporteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState({
    fecha1: new Date().toISOString().split('T')[0],
    fecha2: new Date().toISOString().split('T')[0],
    idDepartamento: 0
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [empRes, deptRes, logoRes] = await Promise.all([
          empresaApi.getById(idEmpresa),
          departamentoApi.getAll(idEmpresa),
          empresaApi.getLogo(idEmpresa)
        ]);
        setEmpresa(empRes.data);
        setDepartamentos(deptRes.data);
        if (logoRes.data?.logo) setLogoUrl(`data:image/png;base64,${logoRes.data.logo}`);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
    cargarDatos();
  }, [idEmpresa]);

  const cargarReporte = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await reporteApi.ventaDepartamento(filtros.fecha1, filtros.fecha2, filtros.idDepartamento);
      setReporte(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (v: number | null | undefined) => v == null || isNaN(v) ? 'RD$ 0.00' : new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(v);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-DO') : '-';

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
    doc.text(`Tel: ${empresa?.telefono || ''}`, 40, y + 17);

    doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE VENTAS POR CENTRO DE COSTOS', pw / 2, y + 35, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    const depto = departamentos.find(d => d.iddepartamento === filtros.idDepartamento);
    doc.text(`Período: ${formatDate(filtros.fecha1)} al ${formatDate(filtros.fecha2)} - ${depto ? depto.nombre : 'Todos los departamentos'}`, pw / 2, y + 42, { align: 'center' });

    y = 65;
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
    const cols = [25, 25, 35, 60, 35, 30, 30, 30];
    const headers = ['Fecha', 'Condición', 'RNC/Cédula', 'Cliente', 'NCF', 'Subtotal', 'ITBIS', 'Descuento'];
    let x = 15;
    headers.forEach((h, i) => { doc.text(h, x + 2, y + 5); x += cols[i]; });
    y += 8;
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);

    let tSub = 0, tItbis = 0, tDesc = 0;
    reporte.forEach((row, idx) => {
      if (y > 200) { doc.addPage(); y = 15; }
      if (idx % 2 === 0) { doc.setFillColor(240, 253, 244); doc.rect(15, y, pw - 30, 6, 'F'); }
      x = 15;
      doc.text(formatDate(row.fecha), x + 2, y + 4); x += cols[0];
      doc.text(row.condicion, x + 2, y + 4); x += cols[1];
      doc.text(row.num_Documento || '-', x + 2, y + 4); x += cols[2];
      doc.text(row.razon_Social.substring(0, 30), x + 2, y + 4); x += cols[3];
      doc.text(row.ncf, x + 2, y + 4); x += cols[4];
      doc.text(formatMoney(row.subtotal), x + cols[5] - 5, y + 4, { align: 'right' }); x += cols[5];
      doc.text(formatMoney(row.itbis), x + cols[6] - 5, y + 4, { align: 'right' }); x += cols[6];
      doc.text(formatMoney(row.descuento), x + cols[7] - 5, y + 4, { align: 'right' });
      tSub += row.subtotal; tItbis += row.itbis; tDesc += row.descuento;
      y += 6;
    });

    y += 5;
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    doc.text('TOTALES:', 17, y + 5);
    doc.text(formatMoney(tSub), pw - 120, y + 5, { align: 'right' });
    doc.text(formatMoney(tItbis), pw - 80, y + 5, { align: 'right' });
    doc.text(formatMoney(tDesc), pw - 20, y + 5, { align: 'right' });

    doc.save(`Reporte_Venta_Departamento_${filtros.fecha1}_al_${filtros.fecha2}.pdf`);
  };

  const exportarExcel = async () => {
    if (reporte.length === 0) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Venta por Departamento');

    ws.mergeCells('A1:H1'); ws.getCell('A1').value = empresa?.nombre || 'Empresa';
    ws.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF047857' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:H3'); ws.getCell('A3').value = 'REPORTE DE VENTAS POR CENTRO DE COSTOS';
    ws.getCell('A3').font = { size: 14, bold: true }; ws.getCell('A3').alignment = { horizontal: 'center' };

    const hr = ws.addRow(['Fecha', 'Condición', 'RNC/Cédula', 'Cliente', 'NCF', 'Subtotal', 'ITBIS', 'Descuento']);
    hr.height = 20;
    hr.eachCell(c => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      c.alignment = { horizontal: 'center' };
    });

    let tSub = 0, tItbis = 0, tDesc = 0;
    reporte.forEach((row, idx) => {
      const dr = ws.addRow([formatDate(row.fecha), row.condicion, row.num_Documento || '-', row.razon_Social, row.ncf, row.subtotal, row.itbis, row.descuento]);
      dr.height = 18;
      dr.eachCell((c, n) => {
        if (n >= 6) { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; }
        if (idx % 2 === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      });
      tSub += row.subtotal; tItbis += row.itbis; tDesc += row.descuento;
    });

    const tr = ws.addRow(['', '', '', '', 'TOTALES:', tSub, tItbis, tDesc]);
    tr.height = 20;
    tr.eachCell((c, n) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      if (n >= 6) { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; }
    });

    ws.columns = [{ width: 12 }, { width: 12 }, { width: 18 }, { width: 35 }, { width: 18 }, { width: 15 }, { width: 15 }, { width: 15 }];

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Reporte_Venta_Departamento_${filtros.fecha1}_al_${filtros.fecha2}.xlsx`);
  };

  const totales = reporte.reduce((a, r) => ({ sub: a.sub + r.subtotal, itbis: a.itbis + r.itbis, desc: a.desc + r.descuento }), { sub: 0, itbis: 0, desc: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain bg-white rounded-lg p-1" /> : <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl">🏢</div>}
              <div>
                <h1 className="text-2xl font-bold text-white">Venta por Centro de Costos</h1>
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
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Centro de Costos</label>
                <select value={filtros.idDepartamento} onChange={(e) => setFiltros(p => ({ ...p, idDepartamento: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value={0}>Todos los Departamentos</option>
                  {departamentos.map(d => <option key={d.iddepartamento} value={d.iddepartamento}>{d.nombre}</option>)}
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
              <div className="text-5xl mb-3">🏢</div>
              <p className="text-sm font-medium">No hay datos para mostrar</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Registros</p>
                  <p className="text-2xl font-bold text-emerald-700">{reporte.length}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Subtotal</p>
                  <p className="text-2xl font-bold text-blue-700">{formatMoney(totales.sub)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total ITBIS</p>
                  <p className="text-2xl font-bold text-purple-700">{formatMoney(totales.itbis)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Descuento</p>
                  <p className="text-2xl font-bold text-red-700">{formatMoney(totales.desc)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-3 py-3 text-left font-semibold">Condición</th>
                      <th className="px-3 py-3 text-left font-semibold">RNC/Cédula</th>
                      <th className="px-3 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-3 py-3 text-left font-semibold">NCF</th>
                      <th className="px-3 py-3 text-right font-semibold">Subtotal</th>
                      <th className="px-3 py-3 text-right font-semibold">ITBIS</th>
                      <th className="px-3 py-3 text-right font-semibold">Descuento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reporte.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-emerald-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-3 py-2 text-gray-700">{formatDate(row.fecha)}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${row.condicion === 'CONTADO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {row.condicion}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-gray-700">{row.num_Documento || '-'}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{row.razon_Social}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => window.open(`/ventas/${row.ncf}/imprimir`, '_blank')} className="font-mono font-bold text-emerald-700 hover:underline">
                            {row.ncf}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{formatMoney(row.subtotal)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatMoney(row.itbis)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatMoney(row.descuento)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold">
                    <tr>
                      <td colSpan={5} className="px-3 py-3 text-right uppercase text-sm">TOTALES:</td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(totales.sub)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(totales.itbis)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(totales.desc)}</td>
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