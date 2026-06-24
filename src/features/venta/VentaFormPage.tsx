import { useState, useEffect, useMemo, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ventaApi, type VentaSaveDto, type VentaPagoDto } from '../../api/venta.api';
import { cobroApi, type CobroSaveDto, type DetalleCobroSaveDto } from '../../api/cobro.api';
import { clienteApi, type ClienteDto, type TipoComprobanteDto } from '../../api/cliente.api';
import { terminoApi, type TerminoDto } from '../../api/termino.api';
import { departamentoApi, type DepartamentoDto } from '../../api/departamento.api';
import { cotizacionApi, type VendedorDto } from '../../api/cotizacion.api';
import CuentaContableSelector from '../../components/CuentaContableSelector';
import DetalleDocumentoTable from '../../components/DetalleDocumentoTable';
import type { DetalleDocumentoDto } from '../../api/detalleDocumento.api';
import { useAuthStore } from '../../store/authStore';
import ClienteSelector from '../../components/ClienteSelector';
import { ecfApi, type ConfCertificadoDto } from '../../api/ecf.api';

// ═══ Estado del formulario de Cobro ═══
interface CobroFormState {
  efectivo: number;
  cheque: number;
  banco_ck: number;
  num_ck: string;
  transferencia: number;
  banco_transf: number | null;
  ref_transf: string;
  tarjeta: number;
  tipo_tarjeta: number | null;
  ref_tarjeta: string;
  retencion_isr: number;
  retencion_itbis: number;
}

const initialCobroState: CobroFormState = {
  efectivo: 0, cheque: 0, banco_ck: 0, num_ck: '',
  transferencia: 0, banco_transf: 0, ref_transf: '',
  tarjeta: 0, tipo_tarjeta: 0, ref_tarjeta: '',
  retencion_isr: 0, retencion_itbis: 0
};

const initialFormState: VentaSaveDto = {
  fecha: new Date().toISOString().split('T')[0],
  idcliente: 0,
  nombre_Cliente: '',
  contado: 'Y',
  tipo: '',
  ncf: '',
  idtermino: 1,
  tipo_Ingreso: 1,
  subtotal: 0,
  itbis: 0,
  descuento: 0,
  monto_Descuento: 0,
  vencimiento: '',
  interes: 0,
  propina_Legal: 0,
  descripcion: '',
  cta_Ingreso: '',
  monto_Servicios: 0,
  itbis_Servicios: 0,
  iddepartamento: 1,
  idlogin: 1,
  idvendedor: 1,
  detalles: [],
};

export default function VentaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const idEmpresa = user?.idempresa ?? 1;
  const idLogin = user?.idusuario ?? 1;

  const esEdicion = !!id;
  const [formData, setFormData] = useState<VentaSaveDto>({
    ...initialFormState,
    idlogin: idLogin,
  });
  
  // Estado para facturación electrónica
  const [procesandoEcf, setProcesandoEcf] = useState(false);
  const [, ] = useState<ConfCertificadoDto | null>(null);
  const [mensajeEcf, setMensajeEcf] = useState<{ tipo: 'success' | 'error' | 'info'; texto: string } | null>(null);

  // ✅ Estados del cobro
  const [cobroData, setCobroData] = useState<CobroFormState>(initialCobroState);
  const [tieneCobro, setTieneCobro] = useState(false);
  const [cobroRegistrado, setCobroRegistrado] = useState<VentaPagoDto | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [, setLoadingNcf] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'bienes' | 'servicios' | 'cobro'>('bienes');

  // ═══ Estados para dropdowns ═══
  const [terminos, setTerminos] = useState<TerminoDto[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoDto[]>([]);
  const [vendedores, setVendedores] = useState<VendedorDto[]>([]);
  const [tiposComprobante, setTiposComprobante] = useState<TipoComprobanteDto[]>([]);
  const [detallesVenta, setDetallesVenta] = useState<DetalleDocumentoDto[]>([]);
  const [servicioCuenta, setServicioCuenta] = useState('');
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null);

  // ═══ Función para detectar si el NCF es electrónico ═══
  const esNcfElectronico = (ncf: string): boolean => {
    if (!ncf) return false;
    const ncfLimpio = ncf.trim();
    return ncfLimpio.startsWith('E') && ncfLimpio.length === 13;
  };

  // ═══ Cargar datos base ═══
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [termRes, depRes, vendRes, tiposRes] = await Promise.all([
          terminoApi.getAll(idEmpresa),
          departamentoApi.getAll(idEmpresa),
          cotizacionApi.getVendedores(idEmpresa),
          clienteApi.getTiposComprobante(true),
        ]);
        
        setTerminos(termRes.data);
        setDepartamentos(depRes.data);
        setVendedores(vendRes.data);
        setTiposComprobante(tiposRes.data);
      } catch (err) {
        console.error('Error cargando datos:', err);
      }
    };
    cargarDatos();
  }, [idEmpresa]);

  // ═══ Cargar venta si es edición ═══
  useEffect(() => {
    if (!esEdicion || !id) return;
    
    const cargarVenta = async () => {
      setLoading(true);
      try {
        const response = await ventaApi.getById(idEmpresa, parseInt(id));
        const data = response.data;
        
        setFormData({
          fecha: data.fecha?.split('T')[0] ?? '',
          idcliente: data.idcliente,
          nombre_Cliente: data.nombre_Cliente,
          contado: data.contado,
          tipo: data.tipo,
          ncf: data.ncf,
          idtermino: data.idtermino,
          tipo_Ingreso: data.tipo_Ingreso,
          subtotal: data.subtotal,
          itbis: data.itbis,
          descuento: data.descuento ?? 0,
          monto_Descuento: data.monto_Descuento ?? 0,
          vencimiento: data.vencimiento?.split('T')[0] ?? '',
          interes: data.interes ?? 0,
          propina_Legal: data.propina_Legal ?? 0,
          descripcion: data.descripcion,
          cta_Ingreso: data.cta_Ingreso,
          monto_Servicios: data.monto_Servicios,
          itbis_Servicios: data.itbis_Servicios ?? data.itbis_Servicios ?? 0,
          iddepartamento: data.iddepartamento,
          idlogin: data.idlogin,
          idvendedor: data.idvendedor,
          detalles: [],
        });

        try {
          const detallesRes = await ventaApi.getDetalles(parseInt(id));
          const detalles = detallesRes.data;
          
          if (detalles && detalles.length > 0) {
            setDetallesVenta(detalles.map((d: any) => ({
              iddetalle: d.iddetalle || 0,
              idDocumento: parseInt(id!),
              iddetalle_Producto: d.idarticulo || d.iddetalle_Producto || 0,
              idArticuloOriginal: d.idarticulo || d.idArticuloOriginal || 0,
              codigo: d.codigo || '',
              producto: d.producto || '',
              nombreProducto: d.producto || '',
              cantidad: d.cantidad,
              medida: d.medida || '',
              precio_Venta1: d.precio_venta1 || d.precio_Venta1 || 0,
              p_Itbis: d.p_itbis || d.p_Itbis || 0,
              descuento: d.descuento ?? 0,
              subtotal: d.valor || d.subtotal || 0,
              itbis: d.itbis ?? 0,
              total: (d.valor || d.subtotal || 0) + (d.itbis ?? 0),
              medidasDisponibles: [],
            })));
          }
        } catch (err) {
          console.error('❌ Error cargando detalles:', err);
        }

        if (data.idcliente > 0) {
          try {
            const clientesRes = await clienteApi.buscarActivos('');
            const cliente = clientesRes.data.find((c: ClienteDto) => c.idcliente === data.idcliente);
            if (cliente) setClienteSeleccionado(cliente);
          } catch (err) {
            console.error('❌ Error cargando cliente:', err);
          }
        }

        // ✅ VERIFICAR SI TIENE COBRO REGISTRADO
        if (data.ncf) {
          try {
            const pagoRes = await ventaApi.getPagoInfo(data.ncf);
            const pago = pagoRes.data;
            
            if (pago && (pago.codigo || pago.efectivo > 0 || pago.cheque > 0 || 
                pago.transferencia > 0 || pago.tarjeta > 0 || 
                pago.retencion_ITBIS > 0 || pago.retencion_ISR > 0)) {
              
              setTieneCobro(true);
              setCobroRegistrado(pago);
              
              setCobroData({
                efectivo: pago.efectivo || 0,
                cheque: pago.cheque || 0,
                banco_ck: pago.banco_Ck || 0,
                num_ck: pago.num_Ck || '',
                transferencia: pago.transferencia || 0,
                banco_transf: pago.banco_Transf,
                ref_transf: pago.ref_Transf || '',
                tarjeta: pago.tarjeta || 0,
                tipo_tarjeta: pago.tipo_Tarjeta,
                ref_tarjeta: pago.ref_Tarjeta || '',
                retencion_isr: pago.retencion_ISR || 0,
                retencion_itbis: pago.retencion_ITBIS || 0,
              });
            }
          } catch (err) {
            console.log('ℹ️ No hay cobro registrado para esta venta');
          }
        }
// ✅ CÓDIGO CORREGIDO
if (esNcfElectronico(data.ncf)) {
  try {
    // Consultar estado del ECF por NCF
    const estadoRes = await ecfApi.consultarEstadoPorNcf(data.ncf);
    if (estadoRes.data && estadoRes.data.estadoEcf) {
      const estado = estadoRes.data.estadoEcf.toUpperCase();
      if (estado === 'ACEPTADO') {
        setMensajeEcf({ tipo: 'success', texto: `✅ Comprobante ${data.ncf} aceptado por la DGII` });
      } else if (estado === 'RECHAZADO') {
        setMensajeEcf({ tipo: 'error', texto: `❌ Comprobante ${data.ncf} rechazado por la DGII` });
      } else if (estado === 'EN PROCESO') {
        setMensajeEcf({ tipo: 'info', texto: `⏳ Comprobante ${data.ncf} en proceso de validación` });
      } else if (estado === 'PENDIENTE') {
        setMensajeEcf({ tipo: 'info', texto: `⏳ Comprobante ${data.ncf} pendiente de envío` });
      }
    }
  } catch (err) {
    console.log('ℹ️ No se pudo verificar el estado ECF');
  }
}

      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar la venta');
      } finally {
        setLoading(false);
      }
    };
    cargarVenta();
  }, [id, esEdicion, idEmpresa]);

  // ═══ Auto-generar NCF ═══
  useEffect(() => {
    if (!esEdicion) {
      if (!formData.tipo) {
        setFormData(prev => ({ ...prev, ncf: '' }));
      } else {
        const autoGenerarNcf = async () => {
          setLoadingNcf(true);
          try {
            const { data } = await ventaApi.generarNcf(formData.tipo);
            setFormData(prev => ({ ...prev, ncf: data.ncfGenerado }));
          } catch (err: any) {
            setFormData(prev => ({ ...prev, ncf: '' }));
          } finally {
            setLoadingNcf(false);
          }
        };
        autoGenerarNcf();
      }
    }
  }, [formData.tipo, esEdicion]);

  // ═══ Cálculos automáticos (Venta + Cobro) ═══
  const calculos = useMemo(() => {
    const totalValorBienes = detallesVenta.reduce((sum, d) => sum + d.subtotal, 0);
    const totalDescuentoBienes = detallesVenta.reduce((sum, d) => sum + (d.subtotal * d.descuento), 0);
    const totalItbisBienes = detallesVenta.reduce((sum, d) => sum + d.itbis, 0);

    const subtotal = totalValorBienes - totalDescuentoBienes + formData.monto_Servicios;
    const itbis = totalItbisBienes + formData.itbis_Servicios;
    const totalVenta = subtotal + itbis;

    const totalMetodosPago = 
      cobroData.efectivo + 
      cobroData.cheque + 
      cobroData.transferencia + 
      cobroData.tarjeta;
    
    const totalRetenciones = 
      cobroData.retencion_isr + 
      cobroData.retencion_itbis;
    
    const totalCobrado = totalMetodosPago + totalRetenciones;
    const diferencia = totalVenta - totalCobrado;
    
    const balance = diferencia > 0 ? diferencia : 0;
    const devuelta = diferencia < 0 ? Math.abs(diferencia) : 0;

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      itbis: parseFloat(itbis.toFixed(2)),
      totalVenta: parseFloat(totalVenta.toFixed(2)),
      totalMetodosPago: parseFloat(totalMetodosPago.toFixed(2)),
      totalRetenciones: parseFloat(totalRetenciones.toFixed(2)),
      totalCobrado: parseFloat(totalCobrado.toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
      devuelta: parseFloat(devuelta.toFixed(2)),
    };
  }, [detallesVenta, formData.monto_Servicios, formData.itbis_Servicios, cobroData]);

  // ═══ Handlers ═══
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof VentaSaveDto;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [fieldName]: (e.target as HTMLInputElement).checked }));
      return;
    }

    const numericFields = [
      'idcliente', 'idtermino', 'tipo_Ingreso', 'subtotal', 'itbis',
      'descuento', 'monto_Descuento', 'interes', 'propina_Legal',
      'monto_Servicios', 'itbis_Servicios', 'iddepartamento', 'idvendedor'
    ];

    setFormData(prev => ({
      ...prev,
      [fieldName]: numericFields.includes(fieldName)
        ? (value === '' ? 0 : Number(value))
        : value,
    }));
  };

  const handleCobroChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCobroData(prev => ({
      ...prev,
      [name]: ['banco_ck', 'banco_transf', 'tipo_tarjeta'].includes(name) 
        ? (value === '' ? null : Number(value))
        : Number(value) || 0
    }));
  };

  // ═══ Función para procesar facturación electrónica ═══
  const procesarFacturacionElectronica = async (idVenta: number, ncf: string): Promise<boolean> => {
  try {
    setProcesandoEcf(true);
    setMensajeEcf(null);
    
    // 1. Verificar configuración del certificado
    const configRes = await ecfApi.getConfiguracion();
    const config = configRes.data;

    if (!config.tieneCertificado || !config.tieneClave) {
      setMensajeEcf({ 
        tipo: 'error', 
        texto: '⚠️ No hay certificado digital configurado. Ve a Configuración → Facturación Electrónica.' 
      });
      return false;
    }

    // 2. Llamar al endpoint de facturación electrónica
    const resultado = await ventaApi.firmarYEnviarEcf(idVenta, config.ambiente);
    const data = resultado.data;
    
    // 3. Manejar respuesta según tipo de comprobante
    const esConsumoMenor250k = formData.tipo === '32' && calculos.totalVenta <= 250000;
    
    if (esConsumoMenor250k) {
      // Consumo ≤ 250k: Respuesta inmediata
      if (data.estado === 'ACEPTADO') {
        setMensajeEcf({ 
          tipo: 'success', 
          texto: `✅ Comprobante ${ncf} aceptado inmediatamente por la DGII.` 
        });
        return true;
      } else if (data.estado === 'RECHAZADO') {
        setMensajeEcf({ 
          tipo: 'error', 
          texto: `❌ Comprobante ${ncf} rechazado: ${data.mensaje || 'Error desconocido'}` 
        });
        return false;
      }
    } else {
      // Otros tipos: Respuesta con TrackId
      if (data.trackId) {
        setMensajeEcf({ 
          tipo: 'success', 
          texto: `✅ Comprobante ${ncf} enviado a la DGII. TrackID: ${data.trackId}` 
        });
        return true;
      } else {
        setMensajeEcf({ 
          tipo: 'error', 
          texto: `❌ Error al enviar el comprobante ${ncf}: ${data.mensaje || 'Error desconocido'}` 
        });
        return false;
      }
    }
    
    return false;
  } catch (err: any) {
    console.error('❌ Error en facturación electrónica:', err);
    setMensajeEcf({ 
      tipo: 'error', 
      texto: `❌ Error al procesar facturación electrónica: ${err.response?.data?.message || err.message}` 
    });
    return false;
  } finally {
    setProcesandoEcf(false);
  }
};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // ✅ BLOQUEO: Si tiene cobro registrado, no permitir modificar
    if (esEdicion && tieneCobro) {
      alert('⚠️ Esta venta tiene un cobro registrado y no puede ser modificada.\n\nPara realizar cambios, primero debe eliminar o anular el cobro asociado.');
      return;
    }

    if (!formData.idcliente) return alert('⚠️ Selecciona un cliente');
    if (!formData.ncf.trim()) return alert('⚠️ Genera o ingresa el NCF');
    if (!formData.tipo) return alert('⚠️ Selecciona un tipo de comprobante');
    if (detallesVenta.length === 0 && formData.monto_Servicios === 0) {
      return alert('⚠️ Agrega al menos un producto o servicio a la venta');
    }

    if (calculos.totalCobrado === 0 && formData.contado === 'Y') {
      if (!window.confirm('⚠️ No has registrado ningún método de pago. ¿Deseas continuar sin cobro?')) {
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setMensajeEcf(null);

    try {
      const detallesMapeados = detallesVenta.map(d => ({
        iddetalle: d.iddetalle || 0,
        idarticulo: d.iddetalle_Producto,
        codigo: d.codigo,
        producto: d.producto,
        cantidad: d.cantidad,
        medida: d.medida,
        precio_venta1: d.precio_Venta1,
        p_itbis: d.p_Itbis,
        descuento: d.descuento,
        valor: d.subtotal,
        itbis: d.itbis,
      }));

      const finalData: VentaSaveDto = {
        ...formData,
        subtotal: calculos.subtotal,
        itbis: calculos.itbis,
        detalles: detallesMapeados,
        vencimiento: formData.vencimiento || undefined,
        cta_Ingreso: formData.cta_Ingreso || servicioCuenta || '',
      };

      let idVenta: number;
      
      if (esEdicion && id) {
        await ventaApi.update(parseInt(id), finalData);
        idVenta = parseInt(id);
      } else {
        const ventaRes = await ventaApi.create(finalData, idEmpresa);
        idVenta = typeof ventaRes.data === 'number' ? ventaRes.data : ventaRes.data;
      }

      // ✅ PROCESAR COBRO SI APLICA
      if (calculos.totalCobrado > 0) {
        try {
          const idDocRes = await cobroApi.getIdDocumento('Venta', formData.ncf);
          const idDocumento = idDocRes.data;

          if (!idDocumento || idDocumento === 0) {
            console.warn('⚠️ No se pudo obtener el ID del documento. El cobro no se registrará.');
          } else {
            const detallesCobro: DetalleCobroSaveDto[] = detallesVenta.map(d => {
              const montoLinea = d.subtotal + d.itbis;
              return {
                iddetalle: 0,
                iddocumento: idDocumento,
                balance: montoLinea,
                p_descuento: d.descuento,
                descuento: d.subtotal * d.descuento,
                idretencion_ITBIS: cobroData.retencion_itbis > 0 ? 1 : 0,
                idretencion_ISR: cobroData.retencion_isr > 0 ? 1 : 0,
                p_isr: 0,
                p_itr: 0,
                isr: 0,
                itr: 0,
                interes: 0,
                cargos: 0,
                monto: montoLinea,
              };
            });

            const codigoCobro = `RC-${Date.now().toString().slice(-7)}`;

            const cobroPayload: CobroSaveDto = {
              codigo: codigoCobro,
              no_Cuota: 0,
              fecha: formData.fecha,
              idcliente: formData.idcliente,
              balance: calculos.totalVenta,
              descuento: 0,
              retencion_ITBIS: cobroData.retencion_itbis,
              retencion_ISR: cobroData.retencion_isr,
              efectivo: cobroData.efectivo,
              cheque: cobroData.cheque,
              banco_Ck: cobroData.banco_ck,
              num_Ck: cobroData.num_ck,
              transferencia: cobroData.transferencia,
              banco_Transf: cobroData.banco_transf,
              ref_Transf: cobroData.ref_transf,
              tarjeta: cobroData.tarjeta,
              tipo_Tarjeta: cobroData.tipo_tarjeta,
              ref_Tarjeta: cobroData.ref_tarjeta,
              devuelta: calculos.devuelta,
              detalles: detallesCobro,
            };

            await cobroApi.create(cobroPayload);
            console.log('✅ Cobro registrado correctamente');
          }
        } catch (cobroErr: any) {
          console.error('❌ Error al procesar el cobro:', cobroErr);
          alert('⚠️ La venta se guardó, pero hubo un error al registrar el cobro: ' + 
            (cobroErr.response?.data?.message || cobroErr.message));
        }
      }

      // ✅ VERIFICAR SI EL NCF ES ELECTRÓNICO Y PROCESAR AUTOMÁTICAMENTE
      const esElectronico = esNcfElectronico(formData.ncf);
      
      if (esElectronico) {
        const ecfExitoso = await procesarFacturacionElectronica(idVenta, formData.ncf);
        
        if (ecfExitoso) {
          setSuccess(`✅ Venta guardada y comprobante electrónico ${formData.ncf} enviado a la DGII`);
        } else {
          setSuccess(`⚠️ Venta guardada, pero hubo un problema al enviar el comprobante electrónico a la DGII`);
        }
      } else {
        setSuccess(`✅ Venta guardada correctamente`);
      }

      // Esperar 2 segundos para mostrar el mensaje antes de navegar
      setTimeout(() => {
        navigate('/ventas');
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error al guardar:', err);
      
      let errorMessage = 'Error al guardar la venta';
      if (err.response?.data?.errors) {
        const validationErrors = Object.entries(err.response.data.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
        errorMessage = `Errores de validación:\n${validationErrors}`;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
      alert(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClienteSelect = (cliente: ClienteDto) => {
    setClienteSeleccionado(cliente);
    const terminoCliente = terminos.find(t => t.idtermino === cliente.termino);
    const esContado = cliente.termino === 1 || terminoCliente?.nombre.toLowerCase().includes('contado') || false;
  
    setFormData(prev => ({
      ...prev,
      idcliente: cliente.idcliente,
      nombre_Cliente: cliente.razon_Social || cliente.nombre_Comercial || '',
      tipo: cliente.tipo_Comprobante ? String(cliente.tipo_Comprobante) : prev.tipo,
      tipo_Ingreso: cliente.tipo_Ingreso || prev.tipo_Ingreso,
      idtermino: cliente.termino || prev.idtermino,
      contado: esContado ? 'Y' : 'N',
      idvendedor: (cliente.vendedor && cliente.vendedor > 0) ? cliente.vendedor : prev.idvendedor,
      iddepartamento: (cliente.departamento && cliente.departamento > 0) ? cliente.departamento : prev.iddepartamento,
    }));
    setShowClienteSelector(false);
  };

  const handleRemoveCliente = () => {
    setClienteSeleccionado(null);
    setFormData(prev => ({
      ...prev,
      idcliente: 0,
      nombre_Cliente: '',
      tipo: '',
      tipo_Ingreso: 1,
      idtermino: 1,
      contado: 'Y',
      idvendedor: 1,
      iddepartamento: 1,
    }));
    setCobroData(initialCobroState);
  };

  const formatMoney = (v: number) =>
    new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' }).format(v);

  const getNombreBanco = (codigo: number | null | undefined) => {
    if (!codigo) return 'N/A';
    const bancos: Record<number, string> = {
      1: 'APAP', 2: 'BANCO DE RESERVAS', 3: 'BANCO POPULAR',
      4: 'BHD LEÓN', 5: 'BANCO DEL PROGRESO', 6: 'BANCO SANTA CRUZ',
      7: 'BANCO CARIBE', 8: 'BANCO ADEMI', 9: 'BANCO PROMERICA',
      10: 'BANCO ADOPEM', 11: 'BANCAMERICA', 12: 'SCOTIABANK', 13: 'OTRO'
    };
    return bancos[codigo] || 'N/A';
  };

  const getNombreTarjeta = (codigo: number | null | undefined) => {
    if (!codigo) return 'N/A';
    const tarjetas: Record<number, string> = {
      1: 'Mastercard', 2: 'Visa', 3: 'American Express', 4: 'Amex', 5: 'Otra'
    };
    return tarjetas[codigo] || 'N/A';
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Cargando venta...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">
                {esEdicion ? '✏️ Editar Venta' : '➕ Nueva Venta'}
              </h1>
              <p className="text-emerald-100 text-xs">Complete la información de la venta</p>
            </div>
            <button
              onClick={() => navigate('/ventas')}
              className="px-3 py-1.5 text-xs bg-white text-emerald-700 rounded-lg hover:bg-emerald-50"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* ✅ ALERTA: Venta con cobro registrado */}
        {tieneCobro && esEdicion && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-800">
                  Venta con Cobro Registrado - Modo Solo Lectura
                </h3>
                <p className="text-xs text-red-700 mt-1">
                  Esta venta tiene un cobro asociado (<strong>{cobroRegistrado?.codigo}</strong>) y no puede ser modificada.
                  Para realizar cambios, primero debe eliminar o anular el cobro desde el módulo de Cobros.
                </p>
                <div className="mt-2 flex gap-4 text-xs">
                  <span className="font-semibold">💰 Total Cobrado: {formatMoney(calculos.totalCobrado)}</span>
                  {(cobroRegistrado?.devuelta || 0) > 0 && (
                    <span className="font-semibold text-emerald-700">
                      ↩️ Devuelta: {formatMoney(cobroRegistrado?.devuelta || 0)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ MENSAJE DE FACTURACIÓN ELECTRÓNICA */}
        {mensajeEcf && (
          <div className={`border-l-4 p-4 rounded-lg ${
            mensajeEcf.tipo === 'success' ? 'bg-green-50 border-green-500' :
            mensajeEcf.tipo === 'error' ? 'bg-red-50 border-red-500' :
            'bg-blue-50 border-blue-500'
          }`}>
            <div className="flex items-start gap-3">
              <span className="text-2xl">
                {mensajeEcf.tipo === 'success' ? '✅' : mensajeEcf.tipo === 'error' ? '❌' : 'ℹ️'}
              </span>
              <div className="flex-1">
                <p className={`text-sm font-semibold ${
                  mensajeEcf.tipo === 'success' ? 'text-green-800' :
                  mensajeEcf.tipo === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {mensajeEcf.texto}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2 bg-red-50 border-l-4 border-red-500 rounded text-xs text-red-700">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="p-2 bg-green-50 border-l-4 border-green-500 rounded text-xs text-green-700">
              ✅ {success}
            </div>
          )}

          {/* ═══ SECCIÓN: INFORMACIÓN GENERAL ═══ */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-4">
            <h3 className="text-sm font-bold text-emerald-800 mb-3 pb-1 border-b border-emerald-100">
              📋 Información General
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                  Fecha <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="fecha"
                  required
                  value={formData.fecha}
                  onChange={handleChange}
                  disabled={tieneCobro}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                  Cliente <span className="text-red-500">*</span>
                  {clienteSeleccionado && !tieneCobro && (
                    <button
                      type="button"
                      onClick={handleRemoveCliente}
                      className="ml-2 text-[10px] text-red-600 hover:text-red-800 underline"
                    >
                      Quitar
                    </button>
                  )}
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    required
                    value={
                      clienteSeleccionado
                        ? `${clienteSeleccionado.codigo} - ${clienteSeleccionado.razon_Social || clienteSeleccionado.nombre_Comercial}`
                        : ''
                    }
                    readOnly
                    disabled={tieneCobro}
                    placeholder="Haga clic en 🔍 para buscar cliente"
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => !tieneCobro && setShowClienteSelector(true)}
                  />
                  {!tieneCobro && (
                    <button
                      type="button"
                      onClick={() => setShowClienteSelector(true)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
                      title="Buscar cliente"
                    >
                      🔍
                    </button>
                  )}
                </div>
                {clienteSeleccionado && (
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-gray-600">
                    {clienteSeleccionado.num_Documento && (
                      <span className="font-mono">📋 {clienteSeleccionado.num_Documento}</span>
                    )}
                    {clienteSeleccionado.telefono && (
                      <span>📞 {clienteSeleccionado.telefono}</span>
                    )}
                    {clienteSeleccionado.limite > 0 && (
                      <span>💳 Límite: {formatMoney(clienteSeleccionado.limite)}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                  Condición
                </label>
                <select
                  name="contado"
                  value={formData.contado}
                  onChange={handleChange}
                  disabled={tieneCobro}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="Y">Contado</option>
                  <option value="N">Crédito</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                  Tipo Comprobante <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipo"
                  required
                  value={formData.tipo}
                  onChange={handleChange}
                  disabled={tieneCobro}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">-- Seleccionar --</option>
                  {tiposComprobante.map(tipo => (
                    <option key={String(tipo.id)} value={String(tipo.id)}>
                      {tipo.id} - {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                  NCF / No. Factura <span className="text-red-500">*</span>
                  {esNcfElectronico(formData.ncf) && (
                    <span className="ml-2 text-[10px] text-emerald-600 font-bold">🧾 ECF</span>
                  )}
                </label>
                <input
                  type="text"
                  name="ncf"
                  required
                  value={formData.ncf}
                  onChange={handleChange}
                  disabled={tieneCobro}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Vendedor</label>
                <select
                  name="idvendedor"
                  value={formData.idvendedor}
                  onChange={handleChange}
                  disabled={tieneCobro}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {vendedores.map(v => (
                    <option key={v.idempleado} value={v.idempleado}>{v.nombres}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Término</label>
                <select
                  name="idtermino"
                  value={formData.idtermino}
                  onChange={handleChange}
                  disabled={tieneCobro}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {terminos.map(t => (
                    <option key={t.idtermino} value={t.idtermino}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                  Centro de Costos
                </label>
                <select
                  name="iddepartamento"
                  value={formData.iddepartamento}
                  onChange={handleChange}
                  disabled={tieneCobro}
                  className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {departamentos.map(d => (
                    <option key={d.iddepartamento} value={d.iddepartamento}>{d.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ═══ PESTAÑAS: BIENES / SERVICIOS / COBRO ═══ */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
            <div className="border-b border-gray-100 px-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('bienes')}
                  className={`py-2 px-4 text-xs font-medium border-b-2 transition-all ${
                    activeTab === 'bienes'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📦 Bienes ({detallesVenta.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('servicios')}
                  className={`py-2 px-4 text-xs font-medium border-b-2 transition-all ${
                    activeTab === 'servicios'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  🛠️ Servicios
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cobro')}
                  className={`py-2 px-4 text-xs font-medium border-b-2 transition-all flex items-center gap-1 ${
                    activeTab === 'cobro'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  💳 Cobro
                  {tieneCobro && (
                    <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      🔒 Registrado
                    </span>
                  )}
                  {!tieneCobro && calculos.totalCobrado > 0 && (
                    <span className="bg-green-100 text-green-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                      {formatMoney(calculos.totalCobrado)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="p-4">
              {activeTab === 'bienes' && (
                <DetalleDocumentoTable
                  tipoDocumento="venta"
                  idDocumento={esEdicion && id ? parseInt(id) : null}
                  detalles={detallesVenta}
                  onDetailsChange={tieneCobro ? () => {} : setDetallesVenta}
                  idEmpresa={idEmpresa}
                  titulo="Productos Vendidos"
                />
              )}

              {activeTab === 'servicios' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                      Descripción del Servicio
                    </label>
                    <textarea
                      name="descripcion"
                      rows={2}
                      value={formData.descripcion}
                      onChange={handleChange}
                      disabled={tieneCobro}
                      placeholder="Observaciones generales de la venta..."
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                        Cuenta Contable de Ingreso
                      </label>
                      <CuentaContableSelector
                        value={servicioCuenta}
                        onChange={tieneCobro ? () => {} : setServicioCuenta}
                        placeholder="Buscar cuenta de servicio..."
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                        Monto Servicios
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monto_Servicios}
                        onChange={handleChange}
                        name="monto_Servicios"
                        disabled={tieneCobro}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-right font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                        ITBIS Servicios
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.itbis_Servicios}
                        onChange={handleChange}
                        name="itbis_Servicios"
                        disabled={tieneCobro}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-right font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cobro' && (
                <div className="space-y-4">
                  <div className={`px-3 py-2 rounded-lg text-xs font-medium ${
                    tieneCobro
                      ? 'bg-red-50 border border-red-200 text-red-700'
                      : formData.contado === 'Y' 
                        ? 'bg-green-50 border border-green-200 text-green-700' 
                        : 'bg-amber-50 border border-amber-200 text-amber-700'
                  }`}>
                    {tieneCobro
                      ? `🔒 Cobro Registrado - Código: ${cobroRegistrado?.codigo || 'N/A'} - No se puede modificar`
                      : formData.contado === 'Y' 
                        ? '💰 Venta al Contado - Registre los métodos de pago'
                        : '📝 Venta a Crédito - Registra un anticipo o pago parcial'
                    }
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-blue-800 mb-3 pb-1 border-b border-blue-100">
                      💵 Métodos de Pago
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Efectivo
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="efectivo"
                          value={cobroData.efectivo}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          className="w-full px-2 py-1.5 text-xs border border-green-200 bg-green-50 rounded-lg focus:ring-1 focus:ring-green-500 outline-none text-right font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Cheque
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="cheque"
                          value={cobroData.cheque}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-right font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Banco Cheque
                        </label>
                        {tieneCobro ? (
                          <input
                            type="text"
                            value={getNombreBanco(cobroData.banco_ck || 0)}
                            readOnly
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-100 text-gray-700"
                          />
                        ) : (
                          <select
                            name="banco_ck"
                            value={cobroData.banco_ck || ''}
                            onChange={handleCobroChange}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="1">APAP</option>
                            <option value="2">BANCO DE RESERVAS</option>
                            <option value="3">BANCO POPULAR</option>
                            <option value="4">BHD LEÓN</option>
                            <option value="5">BANCO DEL PROGRESO</option>
                            <option value="6">BANCO SANTA CRUZ</option>
                            <option value="7">BANCO CARIBE</option>
                            <option value="8">BANCO ADEMI</option>
                            <option value="9">BANCO PROMERICA</option>
                            <option value="10">BANCO ADOPEM</option>
                            <option value="11">BANCAMERICA</option>
                            <option value="12">SCOTIABANK</option>
                            <option value="13">OTRO</option>
                          </select>
                        )}
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          No. Cheque
                        </label>
                        <input
                          type="text"
                          name="num_ck"
                          value={cobroData.num_ck}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          placeholder="Ej: 12345"
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Transferencia
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="transferencia"
                          value={cobroData.transferencia}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-right font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Banco Transf.
                        </label>
                        {tieneCobro ? (
                          <input
                            type="text"
                            value={getNombreBanco(cobroData.banco_transf)}
                            readOnly
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-100 text-gray-700"
                          />
                        ) : (
                          <select
                            name="banco_transf"
                            value={cobroData.banco_transf || ''}
                            onChange={handleCobroChange}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="1">APAP</option>
                            <option value="2">BANCO DE RESERVAS</option>
                            <option value="3">BANCO POPULAR</option>
                            <option value="4">BHD LEÓN</option>
                          </select>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Ref. Transferencia
                        </label>
                        <input
                          type="text"
                          name="ref_transf"
                          value={cobroData.ref_transf}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          placeholder="Ej: TRF-2026-001"
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Tarjeta
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="tarjeta"
                          value={cobroData.tarjeta}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none text-right font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Tipo Tarjeta
                        </label>
                        {tieneCobro ? (
                          <input
                            type="text"
                            value={getNombreTarjeta(cobroData.tipo_tarjeta || 0)}
                            readOnly
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-100 text-gray-700"
                          />
                        ) : (
                          <select
                            name="tipo_tarjeta"
                            value={cobroData.tipo_tarjeta || ''}
                            onChange={handleCobroChange}
                            className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                          >
                            <option value="">Seleccionar...</option>
                            <option value="1">Mastercard</option>
                            <option value="2">Visa</option>
                            <option value="3">American Express</option>
                            <option value="4">Amex</option>
                            <option value="5">Otra</option>
                          </select>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                          Ref. Tarjeta / Voucher
                        </label>
                        <input
                          type="text"
                          name="ref_tarjeta"
                          value={cobroData.ref_tarjeta}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          placeholder="Ej: VOUCH-001"
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-red-800 mb-3 pb-1 border-b border-red-100">
                      📋 Retenciones
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-red-700 uppercase mb-0.5">
                          Retención ITBIS
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="retencion_itbis"
                          value={cobroData.retencion_itbis}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          className="w-full px-2 py-1.5 text-xs border border-red-200 bg-white rounded-lg focus:ring-1 focus:ring-red-500 outline-none text-right font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-red-700 uppercase mb-0.5">
                          Retención ISR
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          name="retencion_isr"
                          value={cobroData.retencion_isr}
                          onChange={handleCobroChange}
                          disabled={tieneCobro}
                          className="w-full px-2 py-1.5 text-xs border border-red-200 bg-white rounded-lg focus:ring-1 focus:ring-red-500 outline-none text-right font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-blue-800 mb-3 pb-1 border-b border-blue-200">
                      📊 Resumen de Cobro
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-2 border border-gray-200">
                        <p className="text-[10px] text-gray-600 uppercase">Total Venta</p>
                        <p className="text-lg font-bold text-gray-900 font-mono">
                          {formatMoney(calculos.totalVenta)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-green-200">
                        <p className="text-[10px] text-gray-600 uppercase">Métodos de Pago</p>
                        <p className="text-lg font-bold text-green-700 font-mono">
                          {formatMoney(calculos.totalMetodosPago)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-red-200">
                        <p className="text-[10px] text-gray-600 uppercase">Retenciones</p>
                        <p className="text-lg font-bold text-red-700 font-mono">
                          {formatMoney(calculos.totalRetenciones)}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 border border-blue-200">
                        <p className="text-[10px] text-gray-600 uppercase">Total Cobrado</p>
                        <p className="text-lg font-bold text-blue-700 font-mono">
                          {formatMoney(calculos.totalCobrado)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-blue-200 flex justify-end gap-6">
                      {calculos.balance > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-red-600 uppercase font-bold">Balance Pendiente</p>
                          <p className="text-2xl font-bold text-red-600 font-mono">
                            {formatMoney(calculos.balance)}
                          </p>
                        </div>
                      )}
                      {calculos.devuelta > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-emerald-600 uppercase font-bold">Devuelta / Cambio</p>
                          <p className="text-2xl font-bold text-emerald-600 font-mono">
                            {formatMoney(calculos.devuelta)}
                          </p>
                        </div>
                      )}
                      {calculos.balance === 0 && calculos.devuelta === 0 && calculos.totalCobrado > 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-blue-600 uppercase font-bold">Estado</p>
                          <p className="text-xl font-bold text-blue-600">✅ Pagado Completamente</p>
                        </div>
                      )}
                      {calculos.totalCobrado === 0 && (
                        <div className="text-right">
                          <p className="text-[10px] text-gray-600 uppercase font-bold">Estado</p>
                          <p className="text-xl font-bold text-gray-600">⏳ Sin Cobro</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══ TOTALES CALCULADOS ═══ */}
          <div className="bg-gradient-to-r from-emerald-50 to-amber-50 rounded-xl shadow-md border border-emerald-200 p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 border border-emerald-200">
                <p className="text-[10px] text-gray-600 uppercase font-semibold mb-1">Subtotal</p>
                <p className="text-lg font-bold text-emerald-700 font-mono">{formatMoney(calculos.subtotal)}</p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-orange-200">
                <p className="text-[10px] text-gray-600 uppercase font-semibold mb-1">ITBIS</p>
                <p className="text-lg font-bold text-orange-700 font-mono">{formatMoney(calculos.itbis)}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg p-3 shadow-lg">
                <p className="text-[10px] text-emerald-100 uppercase font-semibold mb-1">Total</p>
                <p className="text-2xl font-bold text-white font-mono">{formatMoney(calculos.totalVenta)}</p>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="bg-white rounded-xl shadow-md border border-emerald-100 p-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => navigate('/ventas')}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              {tieneCobro ? '← Volver' : 'Cancelar'}
            </button>
            {!tieneCobro && (
              <button
                type="submit"
                disabled={loading || procesandoEcf}
                className="px-6 py-2 text-xs font-bold text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50 shadow-sm flex items-center gap-2"
              >
                {loading ? (
                  'Guardando...'
                ) : procesandoEcf ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Enviando a DGII...
                  </>
                ) : esEdicion ? (
                  'Actualizar Venta'
                ) : (
                  <>💾 Guardar Venta</>
                )}
              </button>
            )}
          </div>

          <ClienteSelector
            isOpen={showClienteSelector}
            onClose={() => setShowClienteSelector(false)}
            onSelect={handleClienteSelect}
          />
        </form>
      </div>
    </div>
  );
}