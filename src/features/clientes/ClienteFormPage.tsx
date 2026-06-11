import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { clienteApi, type ClienteSaveDto, type RetencionDto, type TipoComprobanteDto } from '../../api/cliente.api';
import { ubicacionApi, type MunicipioDto, type ProvinciaDto, type RutaDto, type SectorDto } from '../../api/ubicacion.api';
import { terminoApi, type TerminoDto } from '../../api/termino.api';
import { departamentoApi, type DepartamentoDto } from '../../api/departamento.api';
import { cotizacionApi, type VendedorDto } from '../../api/cotizacion.api';
import DgiiRncLookup from '../../components/DgiiRncLookup';
import CuentaContableSelector from '../../components/CuentaContableSelector';
// ═══════════════════════════════════════════════════════════════
// CONSTANTES DE VALIDACIÓN DGII
// ═══════════════════════════════════════════════════════════════

const TIPO_DOCUMENTO_POR_PERSONA: Record<number, number[]> = {
  1: [1, 4],       // Jurídica → RNC, ID Tributaria
  2: [2],          // Física → Cédula
  3: [2, 3, 5],    // Consumidor Final → Cédula, Pasaporte, Sin Documento
};

const LONGITUD_DOCUMENTO: Record<number, number | null> = {
  1: 9,    // RNC
  2: 11,   // Cédula
  3: null, // Pasaporte (longitud variable)
  4: 9,    // ID Tributaria
  5: 0,    // Sin Documento (vacío)
};

const NOMBRE_TIPO_PERSONA: Record<number, string> = {
  1: 'Jurídica',
  2: 'Física',
  3: 'Consumidor Final',
};

const NOMBRE_TIPO_DOCUMENTO: Record<number, string> = {
  1: 'RNC',
  2: 'Cédula',
  3: 'Pasaporte',
  4: 'ID Tributaria',
  5: 'Sin Documento',
};

// ═══════════════════════════════════════════════════════════════
// HELPERS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════

const limpiarDocumento = (doc: string): string =>
  (doc || '').replace(/[-\s]/g, '');

const getOpcionesTipoDocumento = (tipoPersona: number): number[] =>
  TIPO_DOCUMENTO_POR_PERSONA[tipoPersona] || [];

const validarDocumento = (
  tipoPersona: number,
  tipoDocumento: number,
  documento: string,
  documentoFromDgii: boolean
): string => {
  const docLimpio = limpiarDocumento(documento);

  if (documentoFromDgii && docLimpio.length > 0) {
    return '';
  }

  const opcionesValidas = getOpcionesTipoDocumento(tipoPersona);
  if (!opcionesValidas.includes(tipoDocumento)) {
    return `El tipo de documento "${NOMBRE_TIPO_DOCUMENTO[tipoDocumento] || tipoDocumento}" no es válido para persona ${NOMBRE_TIPO_PERSONA[tipoPersona] || tipoPersona}.`;
  }

  const longitudEsperada = LONGITUD_DOCUMENTO[tipoDocumento];

  if (tipoDocumento === 5) {
    if (docLimpio.length > 0) {
      return 'El número de documento debe estar vacío para "Sin Documento".';
    }
    return '';
  }

  if (docLimpio.length === 0) {
    return 'El número de documento es obligatorio.';
  }

  if (longitudEsperada !== null && docLimpio.length !== longitudEsperada) {
    return `El documento debe tener exactamente ${longitudEsperada} dígitos (actual: ${docLimpio.length}).`;
  }

  if (tipoDocumento !== 3 && !/^\d+$/.test(docLimpio)) {
    return 'El documento solo puede contener números.';
  }

  return '';
};

// ═══════════════════════════════════════════════════════════════
// ESTADO INICIAL Y CONSTANTES
// ═══════════════════════════════════════════════════════════════

const initialFormState: ClienteSaveDto = {
  codigo: '',
  razon_Social: '',
  nombre_Comercial: '',
  tipo: 0,
  tipo_Id: 0,
  num_Documento: '',
  direccion: '',
  telefono: '',
  email: '',
  tipo_Ingreso: 1,
  tax: true,
  tipo_Comprobante: '02',
  retencion_ITBIS: 0,
  retencion_ISR: 0,
  limite: 0,
  balance: 0,
  fecha1: `${new Date().getFullYear()}-01-01`,
  num_Cuenta: '',
  termino: 1,
  descuento: 0,
  forma_Pago: 0,
  departamento: 1,
  vendedor: 0,
  lista_Precio: 1,
  comentario: '',
  idprovincia: 0,
  idmunicipio: 0,
  idsector: 0,
  ruta: '',
};

const tabs = [
  { id: 'general', label: '📋 Información General' },
  { id: 'fiscal', label: '🧾 Fiscal & Crédito' },
  { id: 'ubicacion', label: '📍 Ubicación' },
  { id: 'avanzado', label: '⚙️ Configuración' },
];

const getErrorMessage = (status: number, backendMessage?: string): string => {
  if (backendMessage) return backendMessage;
  const messages: Record<number, string> = {
    400: 'Datos inválidos. Verifica los campos obligatorios.',
    401: 'Sesión expirada. Inicia sesión nuevamente.',
    403: 'No tienes permisos para esta acción.',
    404: 'El cliente no fue encontrado.',
    405: 'Método no permitido.',
    409: 'Conflicto: El documento ya está registrado.',
    500: 'Error interno del servidor. Intenta más tarde.',
  };
  return messages[status] || 'Ocurrió un error inesperado.';
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

export default function ClienteFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState<ClienteSaveDto>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const esEdicion = !!id;

  const idEmpresa = 1;

  // 📦 Estados para dropdowns
  const [tiposComprobante, setTiposComprobante] = useState<TipoComprobanteDto[]>([]);
  const [provincias, setProvincias] = useState<ProvinciaDto[]>([]);
  const [municipios, setMunicipios] = useState<MunicipioDto[]>([]);
  const [sectores, setSectores] = useState<SectorDto[]>([]);
  const [rutas, setRutas] = useState<RutaDto[]>([]);
  const [retencionesItbis, setRetencionesItbis] = useState<RetencionDto[]>([]);
  const [retencionesIsr, setRetencionesIsr] = useState<RetencionDto[]>([]);
  const [terminosPago, setTerminosPago] = useState<TerminoDto[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoDto[]>([]);
  const [vendedores, setVendedores] = useState<VendedorDto[]>([]);

  // 🔄 Estados de carga
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [loadingRetenciones, setLoadingRetenciones] = useState(false);
  const [loadingTerminos, setLoadingTerminos] = useState(false);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(false);
  const [loadingVendedores, setLoadingVendedores] = useState(false);

  // ✏️ Estado para ruta personalizada
  const [rutaCustom, setRutaCustom] = useState('');
  const [usarRutaCustom, setUsarRutaCustom] = useState(false);

  // 🏛️ Estados para validación DGII
  const [documentoFromDgii, setDocumentoFromDgii] = useState(false);


  // 🚨 Estado para errores de validación en tiempo real
  const [errores, setErrores] = useState<{
    tipo?: string;
    tipo_Id?: string;
    num_Documento?: string;
  }>({});

  // ═══════════════════════════════════════════════════════════════
  // EFECTOS - CARGA DE DATOS
  // ═══════════════════════════════════════════════════════════════

  // 📥 Cargar datos base al montar (paralelo)
  useEffect(() => {
    const cargarDatosBase = async () => {
      setLoadingUbicacion(true);
      setLoadingRetenciones(true);
      setLoadingTerminos(true);
      setLoadingDepartamentos(true);
      setLoadingVendedores(true);
      try {
        const [provRes, rutasRes, itbisRes, isrRes, terminosRes, departamentosRes, vendedoresRes] = await Promise.all([
          ubicacionApi.getProvincias(),
          ubicacionApi.getRutas(),
          clienteApi.getRetencionesItbis(),
          clienteApi.getRetencionesIsr(),
          terminoApi.getAll(idEmpresa),
          departamentoApi.getAll(idEmpresa),
          cotizacionApi.getVendedores(idEmpresa),
        ]);
        setProvincias(provRes.data);
        setRutas(rutasRes.data);
        setRetencionesItbis(itbisRes.data);
        setRetencionesIsr(isrRes.data);
        setTerminosPago(terminosRes.data);
        setDepartamentos(departamentosRes.data);
        setVendedores(vendedoresRes.data);
      } catch (err) {
        console.error('❌ Error al cargar datos base:', err);
      } finally {
        setLoadingUbicacion(false);
        setLoadingRetenciones(false);
        setLoadingTerminos(false);
        setLoadingDepartamentos(false);
        setLoadingVendedores(false);
      }
    };
    cargarDatosBase();
  }, []);

  // 📥 Cargar tipos de comprobante
  useEffect(() => {
    const cargarTipos = async () => {
      setLoadingTipos(true);
      try {
        const { data } = await clienteApi.getTiposComprobante(true);
        setTiposComprobante(data);
        if (!formData.tipo_Comprobante && data.length > 0) {
          setFormData(prev => ({ ...prev, tipo_Comprobante: data[0].id }));
        }
      } catch (err) {
        console.error('❌ Error al cargar tipos de comprobante:', err);
      } finally {
        setLoadingTipos(false);
      }
    };
    cargarTipos();
  }, []);

  // 🔄 Cargar municipios cuando cambia provincia
  useEffect(() => {
    if (!formData.idprovincia || formData.idprovincia <= 0) {
      setMunicipios([]);
      setFormData(prev => ({ ...prev, idmunicipio: 0, idsector: 0 }));
      return;
    }
    const cargarMunicipios = async () => {
      try {
        const { data } = await ubicacionApi.getMunicipios(formData.idprovincia);
        setMunicipios(data);
        setFormData(prev => ({ ...prev, idmunicipio: 0, idsector: 0 }));
      } catch (err) {
        console.error('❌ Error al cargar municipios:', err);
        setMunicipios([]);
      }
    };
    cargarMunicipios();
  }, [formData.idprovincia]);

  // 🔄 Cargar sectores cuando cambia municipio
  useEffect(() => {
    if (!formData.idmunicipio || formData.idmunicipio <= 0) {
      setSectores([]);
      setFormData(prev => ({ ...prev, idsector: 0 }));
      return;
    }
    const cargarSectores = async () => {
      try {
        const { data } = await ubicacionApi.getSectores(formData.idmunicipio);
        setSectores(data);
        //setFormData(prev => ({ ...prev, idsector: 0 }));
      } catch (err) {
        console.error('❌ Error al cargar sectores:', err);
        setSectores([]);
      }
    };
    cargarSectores();
  }, [formData.idmunicipio]);

  // 📥 Cargar cliente si es edición
  useEffect(() => {
    if (!esEdicion || !id) return;
    const cargarCliente = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await clienteApi.getById(parseInt(id));
        
        const mappedData: Partial<ClienteSaveDto> = {
          codigo: data.codigo ?? '',
          razon_Social: data.razon_Social ?? '',
          nombre_Comercial: data.nombre_Comercial ?? '',
          tipo: data.tipo ?? 0,
          tipo_Id: data.tipo_Id ?? 0,
          num_Documento: data.num_Documento ?? '',
          direccion: data.direccion ?? '',
          telefono: data.telefono ?? '',
          email: data.email ?? '',
          limite: data.limite ?? 0,
          balance: data.balance ?? 0,
          num_Cuenta: data.num_Cuenta ?? '',
          tipo_Ingreso: data.tipo_Ingreso ?? 1,
          tax: data.tax ?? true,
          tipo_Comprobante: data.tipo_Comprobante ?? '02',
          retencion_ITBIS: data.retencion_ITBIS ?? 0,
          retencion_ISR: data.retencion_ISR ?? 0,
          termino: data.termino ?? 1,
          descuento: data.descuento ?? 0,
          forma_Pago: data.forma_Pago ?? 0,
          departamento: data.departamento ?? 1,
          vendedor: data.vendedor ?? 0,
          lista_Precio: data.lista_Precio ?? 1,
          comentario: data.comentario ?? '',
          fecha1: data.fecha1 ?? new Date().toISOString().split('T')[0],
          idprovincia: data.idprovincia ?? 0,
          idmunicipio: data.idmunicipio ?? 0,
          idsector: data.idsector ?? 0,
          ruta: data.ruta ?? '',
        };
        setFormData({ ...initialFormState, ...mappedData });

        if (data.idprovincia > 0) {
          const { data: munis } = await ubicacionApi.getMunicipios(data.idprovincia);
          setMunicipios(munis);
          if (data.idmunicipio > 0) {
            const { data: secs } = await ubicacionApi.getSectores(data.idmunicipio);
            setSectores(secs);
          }
        }
        if (data.ruta && !rutas.some(r => r.ruta === data.ruta)) {
          setRutaCustom(data.ruta);
          setUsarRutaCustom(true);
        }
      } catch (err: any) {
        console.error('❌ Error al cargar cliente:', err);
        setError(getErrorMessage(err.response?.status, err.response?.data?.message));
        if (err.response?.status === 404) setTimeout(() => navigate('/clientes'), 2000);
      } finally {
        setLoading(false);
      }
    };
    cargarCliente();
  }, [id, esEdicion, navigate, rutas]);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  // ✏️ handleChange con validaciones
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldName = name as keyof ClienteSaveDto;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [fieldName]: (e.target as HTMLInputElement).checked }));
      return;
    }

    if (fieldName === 'tipo_Comprobante') {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎯 VALIDACIÓN: Cambio de Tipo de Persona
    // ═══════════════════════════════════════════════════════════════
    if (fieldName === 'tipo') {
      const nuevoTipo = Number(value);
      const opcionesValidas = getOpcionesTipoDocumento(nuevoTipo);
      const primerTipoIdValido = opcionesValidas[0] || 0;

      setFormData(prev => ({
        ...prev,
        tipo: nuevoTipo,
        tipo_Id: primerTipoIdValido,
        num_Documento: '',
      }));

      setDocumentoFromDgii(false);
      
      setErrores(prev => ({ ...prev, tipo: undefined, tipo_Id: undefined, num_Documento: undefined }));
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎯 VALIDACIÓN: Cambio de Tipo de Documento
    // ═══════════════════════════════════════════════════════════════
    if (fieldName === 'tipo_Id') {
      const nuevoTipoId = Number(value);

      const opcionesValidas = getOpcionesTipoDocumento(formData.tipo);
      if (!opcionesValidas.includes(nuevoTipoId)) {
        setErrores(prev => ({
          ...prev,
          tipo_Id: `No válido para persona ${NOMBRE_TIPO_PERSONA[formData.tipo] || 'seleccionada'}`
        }));
        return;
      }

      if (nuevoTipoId === 5) {
        setFormData(prev => ({ ...prev, tipo_Id: nuevoTipoId, num_Documento: '' }));
        setDocumentoFromDgii(false);
        setErrores(prev => ({ ...prev, tipo_Id: undefined, num_Documento: undefined }));
        return;
      }

      setFormData(prev => ({ ...prev, tipo_Id: nuevoTipoId, num_Documento: '' }));
      setDocumentoFromDgii(false);
      
      setErrores(prev => ({ ...prev, tipo_Id: undefined, num_Documento: undefined }));
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // 🎯 VALIDACIÓN: Cambio de Número de Documento
    // ═══════════════════════════════════════════════════════════════
    if (fieldName === 'num_Documento') {
      if (documentoFromDgii) {
        setErrores(prev => ({
          ...prev,
          num_Documento: '⚠️ Este documento fue validado en la DGII. No se puede modificar.'
        }));
        return;
      }

      if (formData.tipo_Id === 5) {
        setFormData(prev => ({ ...prev, num_Documento: '' }));
        return;
      }

      const errorMsg = validarDocumento(formData.tipo, formData.tipo_Id, value, false);
      setErrores(prev => ({ ...prev, num_Documento: errorMsg || undefined }));
      setFormData(prev => ({ ...prev, num_Documento: value }));
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // Cascada de ubicaciones
    // ═══════════════════════════════════════════════════════════════
    if (fieldName === 'idprovincia') {
      setFormData(prev => ({ ...prev, idprovincia: Number(value), idmunicipio: 0, idsector: 0 }));
      return;
    }
    if (fieldName === 'idmunicipio') {
      setFormData(prev => ({ ...prev, idmunicipio: Number(value), idsector: 0 }));
      return;
    }

    // Ruta
    if (fieldName === 'ruta') {
      if (value === '__CUSTOM__') {
        setUsarRutaCustom(true);
        setFormData(prev => ({ ...prev, ruta: '' }));
        return;
      }
      if (usarRutaCustom && value !== '__CUSTOM__') {
        setUsarRutaCustom(false);
        setRutaCustom('');
      }
      setFormData(prev => ({ ...prev, ruta: value }));
      return;
    }

    // Campos numéricos (excluyendo tipo y tipo_Id que ya se manejan arriba)
    const isNumericField = [
      'tipo_Ingreso', 'termino', 'forma_Pago',
      'departamento', 'vendedor', 'idprovincia',
      'idmunicipio', 'idsector', 'limite', 'balance',
      'retencion_ITBIS', 'retencion_ISR', 'descuento'
    ].includes(fieldName);

    setFormData(prev => ({
      ...prev,
      [fieldName]: isNumericField ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  // ✏️ Input para ruta personalizada
  const handleRutaCustomChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setRutaCustom(value);
    setFormData(prev => ({ ...prev, ruta: value }));
  };

  // 🏛️ Handler para auto-llenar desde DGII - BLOQUEA el documento
  const handleDgiiFill = (data: {
    razon_Social?: string;
    nombre_Comercial?: string;
    num_Documento?: string;
  }) => {
    const documentoLimpio = data.num_Documento ? limpiarDocumento(data.num_Documento) : '';

    setFormData(prev => ({
      ...prev,
      razon_Social: data.razon_Social ?? prev.razon_Social,
      nombre_Comercial: data.nombre_Comercial ?? prev.nombre_Comercial,
      num_Documento: documentoLimpio,
    }));

    if (documentoLimpio) {
      setDocumentoFromDgii(true);
      //setDocumentoOriginalDgii(documentoLimpio);
      setErrores(prev => ({ ...prev, num_Documento: undefined }));
    }
  };

  // 🔓 Desbloquear documento (con confirmación)
  const handleDesbloquearDocumento = () => {
    if (confirm('⚠️ ¿Estás seguro de desbloquear el documento?\n\nAl modificarlo manualmente, perderás la validación de la DGII.')) {
      setDocumentoFromDgii(false);
      setErrores(prev => ({ ...prev, num_Documento: undefined }));
    }
  };

  // 💾 Guardar formulario CON VALIDACIONES
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
console.log('ID:', id);
console.log('esEdicion:', esEdicion);
    // ═══════════════════════════════════════════════════════════════
    // 🚨 VALIDACIONES PREVIAS AL ENVÍO
    // ═══════════════════════════════════════════════════════════════

    if (!formData.tipo || formData.tipo === 0) {
      setErrores(prev => ({ ...prev, tipo: 'Selecciona un tipo de persona' }));
      setActiveTab('general');
      return;
    }

    const opcionesValidas = getOpcionesTipoDocumento(formData.tipo);
    if (!opcionesValidas.includes(formData.tipo_Id)) {
      setErrores(prev => ({
        ...prev,
        tipo_Id: `Tipo de documento no válido para persona ${NOMBRE_TIPO_PERSONA[formData.tipo]}`
      }));
      setActiveTab('general');
      return;
    }

    const errorDoc = validarDocumento(
      formData.tipo,
      formData.tipo_Id,
      formData.num_Documento,
      documentoFromDgii
    );
    if (errorDoc) {
      setErrores(prev => ({ ...prev, num_Documento: errorDoc }));
      setActiveTab('general');
      alert(`❌ Error en el documento:\n\n${errorDoc}`);
      return;
    }

    setErrores({});

    // ═══════════════════════════════════════════════════════════════
    // ENVÍO AL BACKEND
    // ═══════════════════════════════════════════════════════════════
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        num_Documento: limpiarDocumento(formData.num_Documento),
        
      };

      if (esEdicion && id) {
        const idNum = parseInt(id);
        if (isNaN(idNum) || idNum <= 0) throw new Error(`ID inválido: "${id}"`);
        await clienteApi.update(idNum, payload);
      } else {
        await clienteApi.create(payload);
      }
      navigate('/clientes');
    } catch (err: any) {
      console.error('❌ Error al guardar:', err);
      const status = err.response?.status;
      const backendMsg = err.response?.data?.message || err.response?.data?.error;
      const validationErrors = err.response?.data?.errors;
      let mensajeError = getErrorMessage(status, backendMsg);
      if (validationErrors && typeof validationErrors === 'object') {
        const erroresLista = Object.entries(validationErrors).slice(0, 3)
          .map(([campo, valor]: [string, any]) => `${campo}: ${valor}`).join('; ');
        mensajeError = `Validación fallida: ${erroresLista}`;
      }
      setError(mensajeError);
      if (status && status >= 500) alert('⚠️ Error del servidor: ' + mensajeError);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  if (loading && esEdicion && !formData.razon_Social) {
    return <div className="p-8 text-center text-gray-500">Cargando datos del cliente...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-2 px-3">
      <div className="max-w-6xl mx-auto space-y-2">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-4 py-2">
            <h1 className="text-lg font-bold text-white">{esEdicion ? '✏️ Editar Cliente' : '👤 Nuevo Cliente'}</h1>
            <p className="text-emerald-100 text-[11px]">Complete la información por secciones</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md border border-emerald-100 overflow-hidden">
          <div className="border-b border-gray-100 px-3">
            <nav className="flex gap-4 overflow-x-auto" aria-label="Tabs">
              {tabs.map(tab => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                  className={`py-1.5 px-1 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                    activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit} className="p-3 space-y-3">
            {error && (
              <div className="flex items-start gap-2 p-2 bg-red-50 border-l-4 border-red-500 rounded-lg text-xs text-red-700">
                <svg className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB 1: GENERAL
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'general' && (
              <div className="space-y-3">
                {/* 🏛️ Consulta DGII */}
                <DgiiRncLookup
                  tipo={formData.tipo}
                  tipoId={formData.tipo_Id}
                  onFill={handleDgiiFill}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">

                  {/* ═══ TIPO DE PERSONA ═══ */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
                      Tipo de Persona <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tipo"
                      value={formData.tipo}
                      onChange={handleChange}
                      className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white ${
                        errores.tipo ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      }`}
                    >
                      <option value={0}>SELECCIONA UNO</option>
                      <option value={1}>JURÍDICA</option>
                      <option value={2}>FÍSICA</option>
                      <option value={3}>CONSUMIDOR FINAL</option>
                    </select>
                    {errores.tipo && (
                      <p className="text-[10px] text-red-600 mt-0.5">⚠️ {errores.tipo}</p>
                    )}
                    {formData.tipo > 0 && (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        📋 Docs permitidos: {getOpcionesTipoDocumento(formData.tipo)
                          .map(id => NOMBRE_TIPO_DOCUMENTO[id])
                          .join(', ')}
                      </p>
                    )}
                  </div>

                  {/* ═══ TIPO DE DOCUMENTO (dinámico) ═══ */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
                      Tipo de Documento <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="tipo_Id"
                      value={formData.tipo_Id}
                      onChange={handleChange}
                      disabled={formData.tipo === 0}
                      className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white ${
                        errores.tipo_Id ? 'border-red-400 bg-red-50' : 'border-gray-200'
                      } ${formData.tipo === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {formData.tipo === 0 ? (
                        <option value={0}>Primero selecciona Tipo de Persona</option>
                      ) : (
                        <>
                          <option value={0}>-- Seleccionar --</option>
                          {getOpcionesTipoDocumento(formData.tipo).map(tipoDocId => (
                            <option key={tipoDocId} value={tipoDocId}>
                              {NOMBRE_TIPO_DOCUMENTO[tipoDocId]}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    {errores.tipo_Id && (
                      <p className="text-[10px] text-red-600 mt-0.5">⚠️ {errores.tipo_Id}</p>
                    )}
                  </div>

                  {/* ═══ NÚMERO DE DOCUMENTO (con validación y bloqueo DGII) ═══ */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
                      Número de Documento
                      {formData.tipo_Id !== 5 && formData.tipo_Id !== 0 && <span className="text-red-500">*</span>}
                      {documentoFromDgii && (
                        <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold bg-green-100 text-green-700 rounded">
                          ✓ DGII
                        </span>
                      )}
                    </label>

                    <div className="flex gap-1">
                      <input
                        name="num_Documento"
                        value={formData.num_Documento}
                        onChange={handleChange}
                        disabled={formData.tipo_Id === 5 || formData.tipo_Id === 0 || documentoFromDgii}
                        placeholder={
                          formData.tipo_Id === 5
                            ? 'No aplica'
                            : formData.tipo_Id === 0
                              ? 'Selecciona tipo de documento'
                              : formData.tipo_Id === 1 || formData.tipo_Id === 4
                                ? '9 dígitos (RNC/ID)'
                                : formData.tipo_Id === 2
                                  ? '11 dígitos (Cédula)'
                                  : 'Número de documento'
                        }
                        maxLength={
                          formData.tipo_Id === 1 || formData.tipo_Id === 4 ? 11 :
                          formData.tipo_Id === 2 ? 13 :
                          30
                        }
                        className={`flex-1 px-2 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                          errores.num_Documento
                            ? 'border-red-400 bg-red-50'
                            : documentoFromDgii
                              ? 'border-green-400 bg-green-50 cursor-not-allowed'
                              : formData.tipo_Id === 5 || formData.tipo_Id === 0
                                ? 'border-gray-200 bg-gray-100 cursor-not-allowed'
                                : 'border-gray-200'
                        }`}
                      />

                      {documentoFromDgii && (
                        <button
                          type="button"
                          onClick={handleDesbloquearDocumento}
                          className="px-2 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                          title="Desbloquear para editar manualmente"
                        >
                          🔓
                        </button>
                      )}
                    </div>

                    {errores.num_Documento ? (
                      <p className="text-[10px] text-red-600 mt-0.5">⚠️ {errores.num_Documento}</p>
                    ) : documentoFromDgii ? (
                      <p className="text-[10px] text-green-600 mt-0.5">
                        ✅ Documento validado en DGII
                      </p>
                    ) : formData.tipo_Id === 5 ? (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        ℹ️ No requiere número de documento
                      </p>
                    ) : formData.tipo_Id === 0 ? (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        ℹ️ Selecciona un tipo de documento
                      </p>
                    ) : (
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        📏 Longitud esperada: {LONGITUD_DOCUMENTO[formData.tipo_Id] ?? 'variable'} dígitos
                        {' • '}Actual: {limpiarDocumento(formData.num_Documento).length}
                      </p>
                    )}
                  </div>

                  {/* ═══ RAZÓN SOCIAL ═══ */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
                      Razón Social / Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="razon_Social"
                      required
                      value={formData.razon_Social}
                      onChange={handleChange}
                      placeholder={
                        formData.tipo === 1 ? 'Ej. DISTRIBUIDORA ABC SRL' :
                        formData.tipo === 2 ? 'Ej. Juan Pérez' :
                        'Ej. Consumidor Final'
                      }
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* ═══ NOMBRE COMERCIAL ═══ */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
                      Nombre Comercial
                    </label>
                    <input
                      name="nombre_Comercial"
                      value={formData.nombre_Comercial}
                      onChange={handleChange}
                      placeholder="Ej. Distribuidora ABC"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* ═══ TELÉFONO ═══ */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Teléfono</label>
                    <input
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                      placeholder="809-555-1234"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* ═══ EMAIL ═══ */}
                  <div className="lg:col-span-2">
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Correo Electrónico</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contacto@empresa.com"
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  {/* ═══ TIPO DE INGRESO ═══ */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Tipo de Ingreso</label>
                    <select
                      name="tipo_Ingreso"
                      value={formData.tipo_Ingreso}
                      onChange={handleChange}
                      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                    >
                      <option value={1}>01 - Ingresos por Operaciones</option>
                      <option value={2}>02 - Ingresos Financieros</option>
                      <option value={3}>03 - Ingresos Extraordinarios</option>
                      <option value={4}>04 - Ingresos por Act. Fijos</option>
                      <option value={5}>05 - Otros Ingresos</option>
                    </select>
                  </div>

                  {/* ═══ APLICA ITBIS ═══ */}
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="tax"
                        checked={formData.tax}
                        onChange={handleChange}
                        className="h-3 w-3 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      Aplica ITBIS
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB 2: FISCAL & CRÉDITO
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'fiscal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Tipo de Comprobante</label>
                  {loadingTipos ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : (
                    <select name="tipo_Comprobante" value={formData.tipo_Comprobante} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value="">-- Seleccionar --</option>
                      {tiposComprobante.map(tipo => (
                        <option key={String(tipo.id)} value={String(tipo.id)}>{tipo.id} - {tipo.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Retención ITBIS</label>
                  {loadingRetenciones ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : (
                    <select name="retencion_ITBIS" value={formData.retencion_ITBIS} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value={0}>Sin retención</option>
                      {retencionesItbis.map(r => (
                        <option key={r.id} value={r.porcentaje}>{r.codigo} {r.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Retención ISR</label>
                  {loadingRetenciones ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : (
                    <select name="retencion_ISR" value={formData.retencion_ISR} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value={0}>Sin retención</option>
                      {retencionesIsr.map(r => (
                        <option key={r.id} value={r.porcentaje}>{r.codigo} {r.nombre} ({r.porcentaje * 100}%)</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Límite de Crédito (RD$)</label>
                  <input name="limite" type="number" value={formData.limite} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Balance Inicial (RD$)</label>
                  <input name="balance" type="number" value={formData.balance} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Fecha de Inicio <span className="text-red-500">*</span></label>
                  <input name="fecha1" type="date" required value={formData.fecha1} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="col-span-2">
  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">
    Cuenta Contable CxC <span className="text-red-500">*</span>
  </label>
  <CuentaContableSelector
    value={formData.num_Cuenta}
    onChange={(codigo) => setFormData(prev => ({ ...prev, num_Cuenta: codigo }))}
    placeholder="Ej: 112-01 o Cuentas por Cobrar"
  />
</div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Término de Pago</label>
                  {loadingTerminos ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : (
                    <select name="termino" value={formData.termino} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                      {terminosPago.map(t => (
                        <option key={t.idtermino} value={t.idtermino}>{t.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB 3: UBICACIÓN
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'ubicacion' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Dirección Completa</label>
                  <input name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle, Número, Edificio, Apartamento" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Provincia</label>
                  {loadingUbicacion ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : (
                    <select name="idprovincia" value={formData.idprovincia} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value={0}>-- Seleccionar --</option>
                      {provincias.map(p => (
                        <option key={p.idprovincia} value={p.idprovincia}>{p.provincia}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Municipio</label>
                  {loadingUbicacion ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : !formData.idprovincia ? (
                    <select disabled className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-100 text-gray-400">
                      <option>Seleccione provincia primero</option>
                    </select>
                  ) : (
                    <select name="idmunicipio" value={formData.idmunicipio} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value={0}>-- Seleccionar --</option>
                      {municipios.map(m => (
                        <option key={m.idmunicipio} value={m.idmunicipio}>{m.municipio}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Sector</label>
                  {loadingUbicacion ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : !formData.idmunicipio ? (
                    <select disabled className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-100 text-gray-400">
                      <option>Seleccione municipio primero</option>
                    </select>
                  ) : (
                    <select name="idsector" value={formData.idsector} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                      <option value={0}>-- Seleccionar --</option>
                      {sectores.map(s => (
                        <option key={s.idsector} value={s.idsector}>{s.sector}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Ruta / Zona</label>
                  {loadingUbicacion ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : (
                    <div className="flex gap-1">
                      <select name="ruta" value={usarRutaCustom ? '__CUSTOM__' : formData.ruta} onChange={handleChange} className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                        <option value="">-- Seleccionar o escribir --</option>
                        {rutas.map(r => (
                          <option key={r.idruta} value={r.ruta}>{r.ruta}</option>
                        ))}
                        <option value="__CUSTOM__">✏️ Escribir otra...</option>
                      </select>
                      {usarRutaCustom && (
                        <input type="text" value={rutaCustom} onChange={handleRutaCustomChange} placeholder="Ej. RUTA-05" autoFocus className="flex-1 px-2 py-1.5 text-xs border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-0.5">{rutas.length} rutas registradas • Puedes escribir una nueva</p>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════
                TAB 4: AVANZADO
                ═══════════════════════════════════════════════════════════════ */}
            {activeTab === 'avanzado' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Centro de Costos</label>
                  {loadingDepartamentos ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : (
                    <select name="departamento" value={formData.departamento} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                      {departamentos.map(t => (
                        <option key={t.iddepartamento} value={t.iddepartamento}>{t.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Vendedor</label>
                  {loadingVendedores ? (
                    <div className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 text-gray-400">Cargando...</div>
                  ) : (
                    <select name="vendedor" value={formData.vendedor} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                    <option value={0}>SELECCIONE UNO</option>    
                      
                      {vendedores.map(t => (
                        <option key={t.idempleado} value={t.idempleado}>{t.nombres}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Lista de Precios</label>
                  <input name="lista_Precio" type="number" value={formData.lista_Precio} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Forma de Pago</label>
                  <select name="forma_Pago" value={formData.forma_Pago} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white">
                    <option value={0}>SELECCIONE UNA</option>
                    <option value={1}>EFECTIVO</option>
                    <option value={2}>CHEQUE</option>
                    <option value={3}>TRANSFERENCIA</option>
                    <option value={4}>TARJETA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Descuento Global (%)</label>
                  <input name="descuento" type="number" value={formData.descuento} onChange={handleChange} className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase tracking-wide mb-0.5">Comentarios / Observaciones</label>
                  <textarea name="comentario" rows={2} value={formData.comentario} onChange={handleChange} placeholder="Notas internas sobre el cliente..." className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none resize-none" />
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-2">
              <button type="button" onClick={() => navigate('/clientes')} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="px-4 py-1.5 text-xs font-bold text-white bg-orange-500 rounded-md hover:bg-orange-600 disabled:opacity-50 shadow-sm transition">
                {loading ? 'Guardando...' : esEdicion ? 'Actualizar Cliente' : 'Crear Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}