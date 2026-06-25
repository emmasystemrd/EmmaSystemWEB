import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { reporteClientesApi, type EstadoCuentaReporteDto } from '../../api/reporte.api';
import { clienteApi, type ClienteDto } from '../../api/cliente.api';
import { empresaApi, type EmpresaDto } from '../../api/empresa.api';
import { useAuthStore } from '../../store/authStore';

export default function EstadoCuentaReportPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const idEmpresa = user?.idempresa ?? 1;

  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [reporte, setReporte] = useState<EstadoCuentaReporteDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState({
    fecha1: new Date().toISOString().split('T')[0],
    fecha2: new Date().toISOString().split('T')[0],
    fecha: new Date().toISOString().split('T')[0],
    idCliente: 0
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [empRes, logoRes, cliRes] = await Promise.all([
          empresaApi.getById(idEmpresa),
          empresaApi.getLogo(idEmpresa),
          clienteApi.getAll()
        ]);
        setEmpresa(empRes.data);
        if (logoRes.data?.logo) setLogoUrl(`data:image/png;base64,${logoRes.data.logo}`);
        setClientes(cliRes.data);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
    cargarDatos();
  }, [idEmpresa]);

  const cargarReporte = async () => {
    if (!filtros.idCliente) {
      setError('Debe seleccionar un cliente');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await reporteClientesApi.estadoCuenta(filtros.idCliente, filtros.fecha, filtros.fecha1, filtros.fecha2);
      setReporte(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar el reporte');
      setReporte(null);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (v: number | null | undefined) => v == null || isNaN(v) ? 'RD$ 0.00' : new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(v);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('es-DO') : '-';

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'FACTURA': return 'bg-blue-100 text-blue-700';
      case 'NOTA DEBITO': return 'bg-orange-100 text-orange-700';
      case 'NOTA CREDITO': return 'bg-purple-100 text-purple-700';
      case 'BALANCE INICIAL': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const exportarPDF = async () => {
    if (!reporte) return;
    const doc = new jsPDF('portrait', 'mm', 'letter');
    const pw = doc.internal.pageSize.getWidth();
    let y = 15;

    // Encabezado
    if (logoUrl && empresa) {
      try { doc.addImage(logoUrl, 'PNG', 15, y, 25, 25); } catch {}
    }
    doc.setFontSize(16); doc.setFont('helvetica', 'bold');
    doc.text(empresa?.nombre || 'Empresa', 45, y + 5);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`RNC: ${empresa?.rnc || ''}`, 45, y + 12);
    doc.text(empresa?.direccion || '', 45, y + 17);
    doc.text(`Tel: ${empresa?.telefono || ''}`, 45, y + 22);

    y += 35;
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 10, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE CUENTA', pw / 2, y + 7, { align: 'center' });

    y += 20;
    // Datos del cliente
    doc.setFillColor(240, 253, 244); doc.rect(15, y, pw - 30, 35, 'F');
    doc.setTextColor(4, 120, 87); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE', 20, y + 7);
    doc.setTextColor(0, 0, 0); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${reporte.razon_Social}`, 20, y + 15);
    doc.text(`RNC/Cédula: ${reporte.num_Documento || 'N/A'}`, 20, y + 21);
    doc.text(`Dirección: ${reporte.direccion || 'N/A'}`, 20, y + 27);
    doc.text(`Teléfono: ${reporte.telefono || 'N/A'}`, 120, y + 15);
    doc.text(`Condición: ${reporte.condicion}`, 120, y + 21);
    doc.text(`Límite de Crédito: ${formatMoney(reporte.limite)}`, 120, y + 27);

    y += 45;
    // Saldos por antigüedad
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('SALDOS POR ANTIGÜEDAD', 20, y + 5);
    y += 10;

    doc.setFillColor(240, 253, 244); doc.rect(15, y, pw - 30, 15, 'F');
    doc.setTextColor(0, 0, 0); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    const colWidth = (pw - 30) / 7;
    const headers = ['No Vencida', '30 días', '60 días', '90 días', '120 días', '+120 días', 'Balance'];
    headers.forEach((h, i) => {
      doc.text(h, 15 + i * colWidth + 2, y + 5);
    });
    y += 7;
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(reporte.no_Vencida), 15 + colWidth - 5, y + 5, { align: 'right' });
    doc.text(formatMoney(reporte.dias_30), 15 + 2 * colWidth - 5, y + 5, { align: 'right' });
    doc.text(formatMoney(reporte.dias_60), 15 + 3 * colWidth - 5, y + 5, { align: 'right' });
    doc.text(formatMoney(reporte.dias_90), 15 + 4 * colWidth - 5, y + 5, { align: 'right' });
    doc.text(formatMoney(reporte.dias_120), 15 + 5 * colWidth - 5, y + 5, { align: 'right' });
    doc.text(formatMoney(reporte.mas_120), 15 + 6 * colWidth - 5, y + 5, { align: 'right' });
    doc.setTextColor(4, 120, 87);
    doc.text(formatMoney(reporte.balanceTotal), pw - 17, y + 5, { align: 'right' });

    y += 20;
    // Movimientos
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 8, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text('MOVIMIENTOS DEL PERÍODO', 20, y + 5);
    y += 10;

    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 6, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(8);
    const cols = [22, 25, 30, 22, 28, 28, 28];
    const movHeaders = ['Fecha', 'Tipo', 'Detalle', 'Vence', 'Valor', 'Pago', 'Balance'];
    let x = 15;
    movHeaders.forEach((h, i) => { doc.text(h, x + 2, y + 4); x += cols[i]; });
    y += 6;
    doc.setTextColor(0, 0, 0); doc.setFontSize(7); doc.setFont('helvetica', 'normal');

    let tValor = 0, tPago = 0, tBalance = 0;
    reporte.movimientos.forEach((mov, idx) => {
      if (y > 260) { doc.addPage(); y = 15; }
      if (idx % 2 === 0) { doc.setFillColor(240, 253, 244); doc.rect(15, y, pw - 30, 5, 'F'); }
      x = 15;
      doc.text(formatDate(mov.fecha), x + 2, y + 3); x += cols[0];
      doc.text(mov.tipo, x + 2, y + 3); x += cols[1];
      doc.text(mov.detalle.substring(0, 18), x + 2, y + 3); x += cols[2];
      doc.text(mov.vence, x + 2, y + 3); x += cols[3];
      doc.text(formatMoney(mov.valor), x + cols[4] - 3, y + 3, { align: 'right' }); x += cols[4];
      doc.text(formatMoney(mov.pago), x + cols[5] - 3, y + 3, { align: 'right' }); x += cols[5];
      doc.text(formatMoney(mov.balance), x + cols[6] - 3, y + 3, { align: 'right' });
      tValor += mov.valor; tPago += mov.pago; tBalance += mov.balance;
      y += 5;
    });

    y += 3;
    doc.setFillColor(16, 185, 129); doc.rect(15, y, pw - 30, 6, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('TOTALES:', 17, y + 4);
    doc.text(formatMoney(tValor), 150, y + 4, { align: 'right' });
    doc.text(formatMoney(tPago), 178, y + 4, { align: 'right' });
    doc.text(formatMoney(tBalance), pw - 17, y + 4, { align: 'right' });

    doc.save(`Estado_Cuenta_${reporte.razon_Social}_${filtros.fecha1}_al_${filtros.fecha2}.pdf`);
  };

  const exportarExcel = async () => {
    if (!reporte) return;
    const wb = new ExcelJS.Workbook();
    
    // Hoja 1: Datos del Cliente y Saldos
    const ws1 = wb.addWorksheet('Estado Cuenta');
    
    ws1.mergeCells('A1:G1'); ws1.getCell('A1').value = empresa?.nombre || 'Empresa';
    ws1.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF047857' } };
    ws1.getCell('A1').alignment = { horizontal: 'center' };

    ws1.mergeCells('A3:G3'); ws1.getCell('A3').value = 'ESTADO DE CUENTA';
    ws1.getCell('A3').font = { size: 14, bold: true }; ws1.getCell('A3').alignment = { horizontal: 'center' };

    // Datos del cliente
    ws1.getCell('A5').value = 'DATOS DEL CLIENTE';
    ws1.getCell('A5').font = { size: 12, bold: true, color: { argb: 'FF047857' } };
    ws1.getCell('A6').value = 'Cliente:'; ws1.getCell('B6').value = reporte.razon_Social;
    ws1.getCell('A7').value = 'RNC/Cédula:'; ws1.getCell('B7').value = reporte.num_Documento;
    ws1.getCell('A8').value = 'Dirección:'; ws1.getCell('B8').value = reporte.direccion;
    ws1.getCell('A9').value = 'Teléfono:'; ws1.getCell('B9').value = reporte.telefono;
    ws1.getCell('D6').value = 'Condición:'; ws1.getCell('E6').value = reporte.condicion;
    ws1.getCell('D7').value = 'Límite:'; ws1.getCell('E7').value = reporte.limite;
    ws1.getCell('E7').numFmt = '$#,##0.00';

    // Saldos por antigüedad
    ws1.getCell('A11').value = 'SALDOS POR ANTIGÜEDAD';
    ws1.getCell('A11').font = { size: 12, bold: true, color: { argb: 'FF047857' } };
    
    const hrSaldos = ws1.addRow(['No Vencida', '30 días', '60 días', '90 días', '120 días', '+120 días', 'Balance Total']);
    hrSaldos.eachCell(c => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      c.alignment = { horizontal: 'center' };
    });
    
    const drSaldos = ws1.addRow([reporte.no_Vencida, reporte.dias_30, reporte.dias_60, reporte.dias_90, reporte.dias_120, reporte.mas_120, reporte.balanceTotal]);
    drSaldos.eachCell(c => { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; c.font = { bold: true }; });

    // Movimientos
    ws1.addRow([]);
    ws1.getCell(`A${ws1.rowCount + 1}`).value = 'MOVIMIENTOS DEL PERÍODO';
    ws1.getCell(`A${ws1.rowCount}`).font = { size: 12, bold: true, color: { argb: 'FF047857' } };

    const hrMov = ws1.addRow(['Fecha', 'Tipo', 'Detalle', 'Vence', 'Valor', 'Pago', 'Balance']);
    hrMov.height = 20;
    hrMov.eachCell(c => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      c.alignment = { horizontal: 'center' };
    });

    let tValor = 0, tPago = 0, tBalance = 0;
    reporte.movimientos.forEach((mov, idx) => {
      const dr = ws1.addRow([formatDate(mov.fecha), mov.tipo, mov.detalle, mov.vence, mov.valor, mov.pago, mov.balance]);
      dr.height = 18;
      dr.eachCell((c, n) => {
        if (n >= 5) { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; }
        if (idx % 2 === 0) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      });
      tValor += mov.valor; tPago += mov.pago; tBalance += mov.balance;
    });

    const tr = ws1.addRow(['', '', '', 'TOTALES:', tValor, tPago, tBalance]);
    tr.height = 20;
    tr.eachCell((c, n) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      if (n >= 5) { c.numFmt = '$#,##0.00'; c.alignment = { horizontal: 'right' }; }
    });

    ws1.columns = [{ width: 12 }, { width: 18 }, { width: 25 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }];

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), `Estado_Cuenta_${reporte.razon_Social}_${filtros.fecha1}_al_${filtros.fecha2}.xlsx`);
  };

  const totalesMov = reporte?.movimientos.reduce((a, r) => ({ valor: a.valor + r.valor, pago: a.pago + r.pago, balance: a.balance + r.balance }), { valor: 0, pago: 0, balance: 0 }) || { valor: 0, pago: 0, balance: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-4">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain bg-white rounded-lg p-1" /> : <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl">📊</div>}
              <div>
                <h1 className="text-2xl font-bold text-white">Estado de Cuenta</h1>
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
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-[140px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Fecha Corte</label>
                <input type="date" value={filtros.fecha} onChange={(e) => setFiltros(p => ({ ...p, fecha: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="w-[140px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Desde</label>
                <input type="date" value={filtros.fecha1} onChange={(e) => setFiltros(p => ({ ...p, fecha1: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="w-[140px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Hasta</label>
                <input type="date" value={filtros.fecha2} onChange={(e) => setFiltros(p => ({ ...p, fecha2: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="flex-1 min-w-[250px]">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">Cliente</label>
                <select value={filtros.idCliente} onChange={(e) => setFiltros(p => ({ ...p, idCliente: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value={0}>Seleccione un cliente...</option>
                  {clientes.map(c => <option key={c.idcliente} value={c.idcliente}>{c.razon_Social}</option>)}
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

        {reporte && (
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
          ) : !reporte ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-5xl mb-3">📊</div>
              <p className="text-sm font-medium">Seleccione un cliente y genere el reporte</p>
            </div>
          ) : (
            <>
              {/* Datos del Cliente */}
              <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 p-4 border-b border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-orange-500 rounded-full"></span> 👤 Datos del Cliente
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Cliente</p>
                    <p className="font-semibold text-gray-900">{reporte.razon_Social}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold">RNC/Cédula</p>
                    <p className="font-mono text-gray-900">{reporte.num_Documento || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Teléfono</p>
                    <p className="text-gray-900">{reporte.telefono || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Dirección</p>
                    <p className="text-gray-900 text-xs">{reporte.direccion || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Condición</p>
                    <p className="text-gray-900">{reporte.condicion}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 font-bold">Límite de Crédito</p>
                    <p className="font-bold text-emerald-700">{formatMoney(reporte.limite)}</p>
                  </div>
                </div>
              </div>

              {/* Saldos por Antigüedad */}
              <div className="p-4 border-b border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <span className="w-1 h-4 bg-orange-500 rounded-full"></span> 📅 Saldos por Antigüedad (al {formatDate(filtros.fecha)})
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-blue-700 font-bold">No Vencida</p>
                    <p className="text-sm font-bold text-blue-900">{formatMoney(reporte.no_Vencida)}</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-yellow-700 font-bold">30 días</p>
                    <p className="text-sm font-bold text-yellow-900">{formatMoney(reporte.dias_30)}</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-orange-700 font-bold">60 días</p>
                    <p className="text-sm font-bold text-orange-900">{formatMoney(reporte.dias_60)}</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-red-700 font-bold">90 días</p>
                    <p className="text-sm font-bold text-red-900">{formatMoney(reporte.dias_90)}</p>
                  </div>
                  <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-red-700 font-bold">120 días</p>
                    <p className="text-sm font-bold text-red-900">{formatMoney(reporte.dias_120)}</p>
                  </div>
                  <div className="bg-red-200 border border-red-400 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-red-800 font-bold">+120 días</p>
                    <p className="text-sm font-bold text-red-900">{formatMoney(reporte.mas_120)}</p>
                  </div>
                  <div className="bg-emerald-100 border-2 border-emerald-500 rounded-lg p-2 text-center">
                    <p className="text-[10px] uppercase text-emerald-700 font-bold">Balance Total</p>
                    <p className="text-sm font-bold text-emerald-900">{formatMoney(reporte.balanceTotal)}</p>
                  </div>
                </div>
              </div>

              {/* Movimientos */}
              <div>
                <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2 border-b border-emerald-100">
                  <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                    <span className="w-1 h-4 bg-orange-500 rounded-full"></span> 📋 Movimientos del Período ({formatDate(filtros.fecha1)} al {formatDate(filtros.fecha2)})
                  </h3>
                </div>

                {reporte.movimientos.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p className="text-sm">No hay movimientos en el período seleccionado</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-emerald-100">
                      <div className="bg-white rounded-lg p-2 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total Valor</p>
                        <p className="text-lg font-bold text-blue-700">{formatMoney(totalesMov.valor)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Total Pagado</p>
                        <p className="text-lg font-bold text-green-700">{formatMoney(totalesMov.pago)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 shadow-sm">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Balance Final</p>
                        <p className={`text-lg font-bold ${totalesMov.balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{formatMoney(totalesMov.balance)}</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                          <tr>
                            <th className="px-3 py-3 text-left font-semibold">Fecha</th>
                            <th className="px-3 py-3 text-left font-semibold">Tipo</th>
                            <th className="px-3 py-3 text-left font-semibold">Detalle</th>
                            <th className="px-3 py-3 text-left font-semibold">Vence</th>
                            <th className="px-3 py-3 text-right font-semibold">Valor</th>
                            <th className="px-3 py-3 text-right font-semibold">Pago</th>
                            <th className="px-3 py-3 text-right font-semibold">Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {reporte.movimientos.map((mov, idx) => (
                            <tr key={idx} className={`hover:bg-emerald-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <td className="px-3 py-2 text-gray-700">{formatDate(mov.fecha)}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getTipoColor(mov.tipo)}`}>
                                  {mov.tipo}
                                </span>
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-900">{mov.detalle}</td>
                              <td className="px-3 py-2 text-gray-600 text-xs">{mov.vence}</td>
                              <td className="px-3 py-2 text-right font-mono">{formatMoney(mov.valor)}</td>
                              <td className="px-3 py-2 text-right font-mono text-green-700">{formatMoney(mov.pago)}</td>
                              <td className={`px-3 py-2 text-right font-mono font-bold ${mov.balance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                                {formatMoney(mov.balance)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold">
                          <tr>
                            <td colSpan={4} className="px-3 py-3 text-right uppercase text-sm">TOTALES:</td>
                            <td className="px-3 py-3 text-right font-mono">{formatMoney(totalesMov.valor)}</td>
                            <td className="px-3 py-3 text-right font-mono">{formatMoney(totalesMov.pago)}</td>
                            <td className="px-3 py-3 text-right font-mono">{formatMoney(totalesMov.balance)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}