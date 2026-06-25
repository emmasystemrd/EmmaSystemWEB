import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { reporteClientesApi, type SaldosAntiguedadReporteDto } from '../../api/reporte.api';
import { empresaApi, type EmpresaDto } from '../../api/empresa.api';
import { useAuthStore } from '../../store/authStore';

export default function SaldosAntiguedadReportPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const idEmpresa = user?.idempresa ?? 1;

  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [reporte, setReporte] = useState<SaldosAntiguedadReporteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [empRes, logoRes] = await Promise.all([
          empresaApi.getById(idEmpresa),
          empresaApi.getLogo(idEmpresa)
        ]);
        setEmpresa(empRes.data);
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
      const { data } = await reporteClientesApi.saldosAntiguedad(fecha);
      setReporte(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (v: number | null | undefined) => v == null || isNaN(v) ? 'RD$ 0.00' : new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(v);
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('es-DO') : '-';

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
    doc.text('SALDOS POR ANTIGÜEDAD', pw / 2, y + 35, { align: 'center' });
    doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Corte: ${formatDate(fecha)}`, pw / 2, y + 42, { align: 'center' });

    y = 65;
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold');
    const cols = [30, 50, 25, 25, 25, 25, 25, 25, 25];
    const headers = ['RNC/Cédula', 'Cliente', 'No Vencida', '30 días', '60 días', '90 días', '120 días', '+120 días', 'Balance'];
    let x = 15;
    headers.forEach((h, i) => { doc.text(h, x + 2, y + 5); x += cols[i]; });
    y += 8;
    doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);

    let tNoVenc = 0, t30 = 0, t60 = 0, t90 = 0, t120 = 0, tMas120 = 0, tBalance = 0;
    reporte.forEach((row, idx) => {
      if (y > 200) { doc.addPage(); y = 15; }
      if (idx % 2 === 0) { doc.setFillColor(240, 253, 244); doc.rect(15, y, pw - 30, 6, 'F'); }
      x = 15;
      doc.text(row.num_Documento, x + 2, y + 4); x += cols[0];
      doc.text(row.razon_Social.substring(0, 25), x + 2, y + 4); x += cols[1];
      doc.text(formatMoney(row.no_Vencida), x + cols[2] - 3, y + 4, { align: 'right' }); x += cols[2];
      doc.text(formatMoney(row.dias_30), x + cols[3] - 3, y + 4, { align: 'right' }); x += cols[3];
      doc.text(formatMoney(row.dias_60), x + cols[4] - 3, y + 4, { align: 'right' }); x += cols[4];
      doc.text(formatMoney(row.dias_90), x + cols[5] - 3, y + 4, { align: 'right' }); x += cols[5];
      doc.text(formatMoney(row.dias_120), x + cols[6] - 3, y + 4, { align: 'right' }); x += cols[6];
      doc.text(formatMoney(row.mas_120), x + cols[7] - 3, y + 4, { align: 'right' }); x += cols[7];
      doc.text(formatMoney(row.balance), x + cols[8] - 3, y + 4, { align: 'right' });
      tNoVenc += row.no_Vencida; t30 += row.dias_30; t60 += row.dias_60; t90 += row.dias_90; t120 += row.dias_120; tMas120 += row.mas_120; tBalance += row.balance;
      y += 6;
    });

    y += 5;
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('TOTALES:', 17, y + 5);
    doc.text(formatMoney(tNoVenc), 130, y + 5, { align: 'right' });
    doc.text(formatMoney(t30), 155, y + 5, { align: 'right' });
    doc.text(formatMoney(t60), 180, y + 5, { align: 'right' });
    doc.text(formatMoney(t90), 205, y + 5, { align: 'right' });
    doc.text(formatMoney(t120), 230, y + 5, { align: 'right' });
    doc.text(formatMoney(tMas120), 255, y + 5, { align: 'right' });
    doc.text(formatMoney(tBalance), pw - 20, y + 5, { align: 'right' });

    doc.save(`Saldos_Antiguedad_${fecha}.pdf`);
  };

  const exportarExcel = async () => {
    if (reporte.length === 0) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Saldos Antigüedad');

    ws.mergeCells('A1:I1'); ws.getCell('A1').value = empresa?.nombre || 'Empresa';
    ws.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF047857' } };
    ws.getCell('A1').alignment = { horizontal: 'center' };

    ws.mergeCells('A3:I3'); ws.getCell('A3').value = 'SALDOS POR ANTIGÜEDAD';
    ws.getCell('A3').font = { size: 14, bold: true }; ws.getCell('A3').alignment = { horizontal: 'center' };

    const hr = ws.addRow(['RNC/Cédula', 'Cliente', 'No Vencida', '30 días', '60 días', '90 días', '120 días', '+120 días', 'Balance']);
    hr.height = 20;
    hr.eachCell(c => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      c.alignment = { horizontal: 'center' };
    });

    let tNoVenc = 0, t30 = 0, t60 = 0, t90 = 0, t120 = 0, tMas120 = 0, tBalance = 0;
    reporte.forEach((row, idx) => {
      const dr = ws.addRow([row.num_Documento, row.razon_Social, row.no_Vencida, row.dias_30, row.dias_60, row.dias_90, row.dias_120, row.mas_120, row.balance]);
      dr.height = 18;
      dr.eachCell((c, n) => {
        if (n >= 3) { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; }
        if (idx % 2 === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      });
      tNoVenc += row.no_Vencida; t30 += row.dias_30; t60 += row.dias_60; t90 += row.dias_90; t120 += row.dias_120; tMas120 += row.mas_120; tBalance += row.balance;
    });

    const tr = ws.addRow(['', '', tNoVenc, t30, t60, t90, t120, tMas120, tBalance]);
    tr.height = 20;
    tr.eachCell((c, n) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      if (n >= 3) { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; }
    });

    ws.columns = [{ width: 18 }, { width: 30 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 18 }];

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Saldos_Antiguedad_${fecha}.xlsx`);
  };

  const totales = reporte.reduce((a, r) => ({
    noVenc: a.noVenc + r.no_Vencida,
    d30: a.d30 + r.dias_30,
    d60: a.d60 + r.dias_60,
    d90: a.d90 + r.dias_90,
    d120: a.d120 + r.dias_120,
    mas120: a.mas120 + r.mas_120,
    balance: a.balance + r.balance
  }), { noVenc: 0, d30: 0, d60: 0, d90: 0, d120: 0, mas120: 0, balance: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain bg-white rounded-lg p-1" /> : <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl">📊</div>}
              <div>
                <h1 className="text-2xl font-bold text-white">Saldos por Antigüedad</h1>
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
              <div className="w-[200px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Fecha de Corte</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex-1 min-w-[250px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Período</label>
                <div className="px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 font-medium">
                  Corte al {formatDate(fecha)}
                </div>
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
              <div className="text-5xl mb-3">📊</div>
              <p className="text-sm font-medium">No hay saldos pendientes</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Clientes</p>
                  <p className="text-2xl font-bold text-emerald-700">{reporte.length}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Balance Total</p>
                  <p className="text-xl font-bold text-red-700">{formatMoney(totales.balance)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">No Vencido</p>
                  <p className="text-xl font-bold text-blue-700">{formatMoney(totales.noVenc)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Vencido</p>
                  <p className="text-xl font-bold text-orange-700">{formatMoney(totales.balance - totales.noVenc)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                    <tr>
                      <th className="px-2 py-3 text-left font-semibold">RNC/Cédula</th>
                      <th className="px-2 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-2 py-3 text-left font-semibold">Últ. Cobro</th>
                      <th className="px-2 py-3 text-right font-semibold">No Vencida</th>
                      <th className="px-2 py-3 text-right font-semibold">30 días</th>
                      <th className="px-2 py-3 text-right font-semibold">60 días</th>
                      <th className="px-2 py-3 text-right font-semibold">90 días</th>
                      <th className="px-2 py-3 text-right font-semibold">120 días</th>
                      <th className="px-2 py-3 text-right font-semibold">+120 días</th>
                      <th className="px-2 py-3 text-right font-semibold">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {reporte.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-emerald-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-2 py-2 font-mono text-gray-700">{row.num_Documento}</td>
                        <td className="px-2 py-2 font-medium text-gray-900">{row.razon_Social}</td>
                        <td className="px-2 py-2 text-gray-700">{formatDate(row.ultCobro)}</td>
                        <td className="px-2 py-2 text-right font-mono">{formatMoney(row.no_Vencida)}</td>
                        <td className="px-2 py-2 text-right font-mono text-yellow-600">{formatMoney(row.dias_30)}</td>
                        <td className="px-2 py-2 text-right font-mono text-orange-600">{formatMoney(row.dias_60)}</td>
                        <td className="px-2 py-2 text-right font-mono text-red-600">{formatMoney(row.dias_90)}</td>
                        <td className="px-2 py-2 text-right font-mono text-red-700">{formatMoney(row.dias_120)}</td>
                        <td className="px-2 py-2 text-right font-mono text-red-800 font-bold">{formatMoney(row.mas_120)}</td>
                        <td className="px-2 py-2 text-right font-mono font-bold text-emerald-700">{formatMoney(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold">
                    <tr>
                      <td colSpan={3} className="px-2 py-3 text-right uppercase text-xs">TOTALES:</td>
                      <td className="px-2 py-3 text-right font-mono">{formatMoney(totales.noVenc)}</td>
                      <td className="px-2 py-3 text-right font-mono">{formatMoney(totales.d30)}</td>
                      <td className="px-2 py-3 text-right font-mono">{formatMoney(totales.d60)}</td>
                      <td className="px-2 py-3 text-right font-mono">{formatMoney(totales.d90)}</td>
                      <td className="px-2 py-3 text-right font-mono">{formatMoney(totales.d120)}</td>
                      <td className="px-2 py-3 text-right font-mono">{formatMoney(totales.mas120)}</td>
                      <td className="px-2 py-3 text-right font-mono">{formatMoney(totales.balance)}</td>
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