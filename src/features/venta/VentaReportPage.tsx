import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { ventaApi, type VentaReporteDto } from '../../api/venta.api';
import { empresaApi, type EmpresaDto } from '../../api/empresa.api';
import { useAuthStore } from '../../store/authStore';

export default function VentaReportPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const idEmpresa = user?.idempresa ?? 1;
  const tableRef = useRef<HTMLTableElement>(null);

  const [empresa, setEmpresa] = useState<EmpresaDto | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [reporte, setReporte] = useState<VentaReporteDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [filtros, setFiltros] = useState({
    fecha1: new Date().toISOString().split('T')[0],
    fecha2: new Date().toISOString().split('T')[0],
    comprobante: ''
  });

  // Cargar empresa y logo
  useEffect(() => {
    const cargarEmpresa = async () => {
      try {
        const empRes = await empresaApi.getById(idEmpresa);
        setEmpresa(empRes.data);
        
        const logoRes = await empresaApi.getLogo(idEmpresa);
        if (logoRes.data?.logo) {
          setLogoUrl(`data:image/png;base64,${logoRes.data.logo}`);
        }
      } catch (err) {
        console.error('Error cargando empresa:', err);
      }
    };
    cargarEmpresa();
  }, [idEmpresa]);

  const cargarReporte = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await ventaApi.reporteVentasComprobante(
        filtros.fecha1,
        filtros.fecha2,
        filtros.comprobante
      );
      setReporte(data);
    } catch (err: any) {
      console.error('Error cargando reporte:', err);
      setError(err.response?.data?.message || 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return 'RD$ 0.00';
    return new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-DO');
  };

  const handleVerFactura = (ncf: string) => {
    window.open(`/ventas/${ncf}/imprimir`, '_blank');
  };

  // ═══ EXPORTAR A PDF ═══
  const exportarPDF = async () => {
    if (reporte.length === 0) return;

    const doc = new jsPDF('landscape', 'mm', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;

    // Encabezado
    if (logoUrl && empresa) {
      try {
        doc.addImage(logoUrl, 'PNG', 15, yPos, 20, 20);
      } catch (err) {
        console.warn('No se pudo agregar el logo');
      }
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(empresa?.nombre || 'Empresa', 40, yPos + 5);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`RNC: ${empresa?.rnc || ''}`, 40, yPos + 12);
    doc.text(empresa?.direccion || '', 40, yPos + 17);
    doc.text(`Tel: ${empresa?.telefono || ''}`, 40, yPos + 22);

    // Título del reporte
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE VENTAS POR COMPROBANTE', pageWidth / 2, yPos + 35, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${formatDate(filtros.fecha1)} al ${formatDate(filtros.fecha2)}`, pageWidth / 2, yPos + 42, { align: 'center' });

    yPos = 65;

    // Encabezados de tabla
    doc.setFillColor(16, 185, 129);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');

    const colWidths = [25, 25, 35, 35, 60, 35, 30, 30, 30];
    const headers = ['Fecha', 'Condición', 'Comprobante', 'RNC/Cédula', 'Cliente', 'NCF', 'Subtotal', 'ITBIS', 'Descuento'];
    let xPos = 15;
    
    headers.forEach((header, i) => {
      doc.text(header, xPos + 2, yPos + 5);
      xPos += colWidths[i];
    });

    yPos += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Datos
    let totalSubtotal = 0;
    let totalITBIS = 0;
    let totalDescuento = 0;

    reporte.forEach((row, idx) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 15;
      }

      if (idx % 2 === 0) {
        doc.setFillColor(240, 253, 244);
        doc.rect(15, yPos, pageWidth - 30, 6, 'F');
      }

      xPos = 15;
      doc.text(formatDate(row.fecha), xPos + 2, yPos + 4); xPos += colWidths[0];
      doc.text(row.condicion, xPos + 2, yPos + 4); xPos += colWidths[1];
      doc.text(row.comprobante || '-', xPos + 2, yPos + 4); xPos += colWidths[2];
      doc.text(row.num_Documento || '-', xPos + 2, yPos + 4); xPos += colWidths[3];
      doc.text(row.razon_Social.substring(0, 30), xPos + 2, yPos + 4); xPos += colWidths[4];
      doc.text(row.ncf, xPos + 2, yPos + 4); xPos += colWidths[5];
      doc.text(formatMoney(row.subtotal), xPos + colWidths[6] - 5, yPos + 4, { align: 'right' }); xPos += colWidths[6];
      doc.text(formatMoney(row.itbis), xPos + colWidths[7] - 5, yPos + 4, { align: 'right' }); xPos += colWidths[7];
      doc.text(formatMoney(row.descuento), xPos + colWidths[8] - 5, yPos + 4, { align: 'right' });

      totalSubtotal += row.subtotal;
      totalITBIS += row.itbis;
      totalDescuento += row.descuento;

      yPos += 6;
    });

    // Totales
    yPos += 5;
    doc.setFillColor(16, 185, 129);
    doc.rect(15, yPos, pageWidth - 30, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTALES:', 17, yPos + 5);
    doc.text(formatMoney(totalSubtotal), pageWidth - 120, yPos + 5, { align: 'right' });
    doc.text(formatMoney(totalITBIS), pageWidth - 80, yPos + 5, { align: 'right' });
    doc.text(formatMoney(totalDescuento), pageWidth - 20, yPos + 5, { align: 'right' });

    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado el: ${new Date().toLocaleString('es-DO')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`Reporte_Ventas_${filtros.fecha1}_al_${filtros.fecha2}.pdf`);
  };

  // ═══ EXPORTAR A EXCEL ═══
  const exportarExcel = async () => {
    if (reporte.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ventas');

    // Encabezado
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = empresa?.nombre || 'Empresa';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF047857' } };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.mergeCells('A2:I2');
    worksheet.getCell('A2').value = `RNC: ${empresa?.rnc || ''}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:I3');
    worksheet.getCell('A3').value = 'REPORTE DE VENTAS POR COMPROBANTE';
    worksheet.getCell('A3').font = { size: 14, bold: true };
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:I4');
    worksheet.getCell('A4').value = `Período: ${formatDate(filtros.fecha1)} al ${formatDate(filtros.fecha2)}`;
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    // Encabezados de tabla
    const headerRow = worksheet.addRow([
      'Fecha', 'Condición', 'Comprobante', 'RNC/Cédula', 'Cliente', 'NCF', 'Subtotal', 'ITBIS', 'Descuento'
    ]);
    headerRow.height = 20;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Datos
    let totalSubtotal = 0;
    let totalITBIS = 0;
    let totalDescuento = 0;

    reporte.forEach((row, idx) => {
      const dataRow = worksheet.addRow([
        formatDate(row.fecha),
        row.condicion,
        row.comprobante || '-',
        row.num_Documento || '-',
        row.razon_Social,
        row.ncf,
        row.subtotal,
        row.itbis,
        row.descuento
      ]);

      dataRow.height = 18;
      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        if (colNumber >= 7) {
          cell.numFmt = '$#,##0.00';
          cell.alignment = { horizontal: 'right' };
        } else if (colNumber === 1) {
          cell.alignment = { horizontal: 'center' };
        }

        if (idx % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
        }
      });

      totalSubtotal += row.subtotal;
      totalITBIS += row.itbis;
      totalDescuento += row.descuento;
    });

    // Fila de totales
    const totalRow = worksheet.addRow([
      '', '', '', '', 'TOTALES:', '', totalSubtotal, totalITBIS, totalDescuento
    ]);
    totalRow.height = 20;
    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      if (colNumber >= 7) {
        cell.numFmt = '$#,##0.00';
        cell.alignment = { horizontal: 'right' };
      } else if (colNumber === 5) {
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Anchos de columna
    worksheet.columns = [
      { width: 12 }, // Fecha
      { width: 12 }, // Condición
      { width: 20 }, // Comprobante
      { width: 18 }, // RNC/Cédula
      { width: 35 }, // Cliente
      { width: 18 }, // NCF
      { width: 15 }, // Subtotal
      { width: 15 }, // ITBIS
      { width: 15 }  // Descuento
    ];

    // Pie de página
    worksheet.addRow([]);
    const footerRow = worksheet.addRow([`Generado el: ${new Date().toLocaleString('es-DO')}`]);
    worksheet.mergeCells(`A${footerRow.number}:I${footerRow.number}`);
    footerRow.getCell(1).alignment = { horizontal: 'center' };
    footerRow.getCell(1).font = { italic: true, color: { argb: 'FF666666' } };

    // Generar archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Ventas_${filtros.fecha1}_al_${filtros.fecha2}.xlsx`);
  };

  // Calcular totales
  const totales = reporte.reduce((acc, row) => ({
    subtotal: acc.subtotal + row.subtotal,
    itbis: acc.itbis + row.itbis,
    descuento: acc.descuento + row.descuento
  }), { subtotal: 0, itbis: 0, descuento: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-4">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-14 w-14 object-contain bg-white rounded-lg p-1" />
              ) : (
                <div className="h-14 w-14 bg-white/20 rounded-lg flex items-center justify-center text-white text-2xl">
                  📊
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">Reporte de Ventas por Comprobante</h1>
                <p className="text-emerald-100 text-sm">{empresa?.nombre || 'Empresa'}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
            >
              ← Volver
            </button>
          </div>
        </div>
{/* Filtros */}
<div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
  <div className="bg-gradient-to-r from-emerald-50 to-yellow-50 px-4 py-2 border-b border-emerald-100">
    <h2 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
      <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
      🔍 Filtros del Reporte
    </h2>
  </div>
  <div className="p-4">
    <div className="flex flex-wrap items-end gap-4">
      {/* Fecha Desde - Ancho fijo pequeño */}
      <div className="w-[160px]">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
          Fecha Desde
        </label>
        <input
          type="date"
          value={filtros.fecha1}
          onChange={(e) => setFiltros(prev => ({ ...prev, fecha1: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
        />
      </div>

      {/* Fecha Hasta - Ancho fijo pequeño */}
      <div className="w-[160px]">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
          Fecha Hasta
        </label>
        <input
          type="date"
          value={filtros.fecha2}
          onChange={(e) => setFiltros(prev => ({ ...prev, fecha2: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
        />
      </div>

      {/* Tipo Comprobante - Ocupa el espacio restante */}
      <div className="flex-1 min-w-[250px]">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
          Tipo Comprobante
        </label>
        <select
          value={filtros.comprobante}
          onChange={(e) => setFiltros(prev => ({ ...prev, comprobante: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
        >
          <option value="">Todos los Comprobantes</option>
          <option value="01">Crédito Fiscal</option>
          <option value="02">Consumo</option>
          <option value="12">Registro Único de Ingresos</option>
          <option value="14">Regímenes Especiales</option>
          <option value="15">Gubernamental</option>
          <option value="16">Exportaciones</option>
          <option value="31">Crédito Fiscal Electrónico</option>
          <option value="32">Consumo Electrónico</option>
          <option value="44">Regímenes Especiales Electrónico</option>
          <option value="45">Gubernamental Electrónico</option>
          <option value="46">Exportaciones Electrónico</option>
        </select>
      </div>

      {/* Botón Generar - Ancho fijo */}
      <div className="w-[180px]">
        <button
          onClick={cargarReporte}
          disabled={loading}
          className="w-full px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow"
        >
          {loading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              Cargando...
            </>
          ) : (
            <>🔍 Generar Reporte</>
          )}
        </button>
      </div>
    </div>
  </div>
</div>

        {/* Botones de exportación */}
        {reporte.length > 0 && (
          <div className="flex gap-3 justify-end">
            <button
              onClick={exportarPDF}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow"
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={exportarExcel}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow"
            >
              📊 Exportar Excel
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {/* Tabla de resultados */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
              <p className="text-gray-500 text-sm mt-3">Generando reporte...</p>
            </div>
          ) : reporte.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-sm font-medium">No hay datos para mostrar</p>
              <p className="text-xs mt-1">Ajusta los filtros y genera el reporte</p>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-emerald-50 to-yellow-50 border-b border-emerald-100">
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Registros</p>
                  <p className="text-2xl font-bold text-emerald-700">{reporte.length}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Subtotal</p>
                  <p className="text-2xl font-bold text-blue-700">{formatMoney(totales.subtotal)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total ITBIS</p>
                  <p className="text-2xl font-bold text-purple-700">{formatMoney(totales.itbis)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 shadow-sm">
                  <p className="text-xs text-gray-500 uppercase font-semibold">Total Descuento</p>
                  <p className="text-2xl font-bold text-red-700">{formatMoney(totales.descuento)}</p>
                </div>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table ref={tableRef} className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-emerald-700 to-emerald-600 text-white">
                    <tr>
                      <th className="px-3 py-3 text-left font-semibold">Fecha</th>
                      <th className="px-3 py-3 text-left font-semibold">Condición</th>
                      <th className="px-3 py-3 text-left font-semibold">Comprobante</th>
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
                      <tr 
                        key={idx} 
                        className={`hover:bg-emerald-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-3 py-2 text-gray-700">{formatDate(row.fecha)}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            row.condicion === 'CONTADO' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {row.condicion}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{row.comprobante || '-'}</td>
                        <td className="px-3 py-2 font-mono text-gray-700">{row.num_Documento || '-'}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">{row.razon_Social}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleVerFactura(row.ncf)}
                            className="font-mono font-bold text-emerald-700 hover:text-emerald-900 hover:underline transition-colors"
                            title="Ver factura"
                          >
                            {row.ncf}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-700">{formatMoney(row.subtotal)}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-700">{formatMoney(row.itbis)}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-700">{formatMoney(row.descuento)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold">
                    <tr>
                      <td colSpan={6} className="px-3 py-3 text-right uppercase text-sm">TOTALES:</td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(totales.subtotal)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(totales.itbis)}</td>
                      <td className="px-3 py-3 text-right font-mono">{formatMoney(totales.descuento)}</td>
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