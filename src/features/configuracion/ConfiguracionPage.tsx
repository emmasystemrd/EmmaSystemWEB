import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import { 
  configApi, 
  type ConfProveedorClienteDto, 
  type ConfImpuestoDto, 
  type ConfEmpleadoDto, 
  type ConfTssDto, 
  type ConfFacturacionDto, 
  type ConfFactElectronicaDto, 
  type ConfFactElectronicaSaveDto 
} from '../../api/configuracion.api';
import { empresaApi, type EmpresaDto } from '../../api/empresa.api';
import { dgiiApi } from '../../api/dgii.api';
import { useAuthStore } from '../../store/authStore';

type TabId = 'empresa' | 'proveedor' | 'impuesto' | 'empleado' | 'tss' | 'factura' | 'electronica';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'empresa', label: 'Empresa', icon: '🏢' },
  { id: 'proveedor', label: 'Proveedor/Cliente', icon: '💼' },
  { id: 'impuesto', label: 'Impuestos', icon: '🧾' },
  { id: 'empleado', label: 'Empleado', icon: '👥' },
  { id: 'tss', label: 'TSS', icon: '🧮' },
  { id: 'factura', label: 'Facturación', icon: '🖨️' },
  { id: 'electronica', label: 'Facturación Electrónica', icon: '📡' },
];

const TIPOS_EMPRESA = [
  'ALMACÉN', 'BIENES RAÍCES', 'BAR', 'CAFETERÍA', 'CARNICERÍA', 'COLMADO',
  'DEALERS', 'ELECTRÓNICA', 'ESTACIÓN DE COMBUSTIBLE', 'FARMACIA', 'FERRETERÍA',
  'FUNERARIA', 'HELADERÍA', 'HOTEL', 'JOYERÍA', 'LIBRERÍA', 'MINIMARKET',
  'PANADERÍA Y REPOSTERÍA', 'PRÉSTAMOS', 'REPUESTOS', 'RESTAURANTE', 'SUPERMERCADO',
  'TIENDA DE CELULARES', 'TIENDA DE COMPUTADORAS', 'TIENDA DE ELECTRODOMÉSTICOS',
  'TIENDA DEL HOGAR', 'TIENDA DE ROPAS', 'AGRICULTURA', 'AGRIMENSURA', 'AGROPECUARIA',
  'ARTISTA', 'ASOCIACIONES', 'AYUNTAMIENTO', 'BARBERÍA', 'CARWASH', 'CINE', 'CLÍNICA',
  'COLEGIO', 'CONSTRUCCIÓN', 'CONSULTORIO', 'COOPERATIVA', 'COPICENTRO', 'EMISORA',
  'ENTRETENIMIENTO', 'ESCUELA', 'ESTUDIO DE GRABACIÓN', 'FINANCIERA', 'FIRMA DE ABOGADOS',
  'FIRMA DE CONTADORES', 'GIMNASIO', 'HOSPITAL', 'IGLESIA', 'INDUSTRIA', 'INSTITUTO',
  'LAVANDERÍA', 'ORGANIZACIÓN SIN FINES DE LUCRO', 'SALÓN DE BELLEZA', 'SASTRERÍA',
  'SERVICIOS TÉCNICOS', 'TELECOMUNICACIONES', 'TRANSPORTE', 'PRODUCTOS Y SERVICIOS GENERALES',
];

// Componente reutilizable para campos de cuenta contable
const CuentaInput = ({ 
  label, value, onChange, name, placeholder = "Ej: 211-01" 
}: { 
  label: string; value: string | undefined; 
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
  name: string; placeholder?: string; 
}) => (
  <div>
    <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">{label}</label>
    <input type="text" name={name} value={value || ''} onChange={onChange} placeholder={placeholder}
      className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 font-mono outline-none" />
  </div>
);

// ═══ Tipo extendido para incluir campos de claves (no vienen del GET) ═══
type ElectronicaFormState = Partial<ConfFactElectronicaDto> & {
  clave?: string;
  clave_Email?: string;
};

export default function ConfiguracionPage() {
  // ═══ TODOS LOS HOOKS DEBEN ESTAR AQUÍ ARRIBA ═══
  const { user } = useAuthStore();
  const idEmpresa = user?.idempresa ?? 1;
  
  const [activeTab, setActiveTab] = useState<TabId>('empresa');
  const [loading, setLoading] = useState<Partial<Record<TabId, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de datos
  const [empresa, setEmpresa] = useState<Partial<EmpresaDto>>({});
  const [provCli, setProvCli] = useState<Partial<ConfProveedorClienteDto>>({});
  const [impuestos, setImpuestos] = useState<Partial<ConfImpuestoDto>>({});
  const [empleado, setEmpleado] = useState<Partial<ConfEmpleadoDto>>({});
  const [tss, setTss] = useState<Partial<ConfTssDto>>({});
  const [factura, setFactura] = useState<Partial<ConfFacturacionDto>>({});
  const [electronica, setElectronica] = useState<ElectronicaFormState>({});
  
  const certFileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  
  // Estados para consulta DGII
  const [estadoDgii, setEstadoDgii] = useState<'idle' | 'buscando' | 'encontrado' | 'no_encontrado' | 'error'>('idle');
  const [nombreDgii, setNombreDgii] = useState<string>('');
  const [mensajeDgii, setMensajeDgii] = useState<string>('');

  // ═══ FUNCIONES HELPER ═══
  const limpiarRNC = (rnc: string): string => {
    return (rnc || '').replace(/[-\s]/g, '');
  };

  const limpiarTelefono = (telefono: string): string => {
    return (telefono || '').replace(/[-()\s]/g, '');
  };

  const getOpcionesFechaCierre = (rnc: string) => {
    const rncLimpio = limpiarRNC(rnc);
    const anioActual = new Date().getFullYear();
    const anioSiguiente = anioActual + 1;
    
    const opciones = [
      { value: `${anioActual}-12-31`, label: `31/12/${anioActual}` },
      { value: `${anioSiguiente}-03-31`, label: `31/03/${anioSiguiente}` },
      { value: `${anioSiguiente}-06-30`, label: `30/06/${anioSiguiente}` },
      { value: `${anioSiguiente}-09-30`, label: `30/09/${anioSiguiente}` },
    ];
    
    if (rncLimpio.length === 11) {
      return [opciones[0]];
    }
    
    return opciones;
  };

  const esPersonaFisica = (rnc: string): boolean => {
    return limpiarRNC(rnc).length === 11;
  };

  // ═══ HANDLERS ═══
  const createChangeHandler = (setter: React.Dispatch<any>) => 
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setter((prev: any) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    };

  // ═══ USEEFFECTS (TODOS JUNTOS, ANTES DE CUALQUIER RETURN) ═══
  
  // 1. Cargar datos de la pestaña activa
  useEffect(() => {
    const fetchData = async () => {
      setLoading(prev => ({ ...prev, [activeTab]: true }));
      setErrorMsg('');
      try {
        switch (activeTab) {
          case 'empresa': {
            const r = await empresaApi.getById(idEmpresa);
            const datos = r.data;
            if (datos.fecha_Cierre) {
              const fecha = datos.fecha_Cierre;
              if (fecha.includes('T')) {
                datos.fecha_Cierre = fecha.split('T')[0];
              }
            }
            setEmpresa(datos);
            if (datos.tieneLogo) {
              try {
                const logoRes = await empresaApi.getLogo(idEmpresa);
                if (logoRes.data?.logo) {
                  setLogoPreview(`data:image/png;base64,${logoRes.data.logo}`);
                }
              } catch (err) {
                console.error('Error cargando logo:', err);
              }
            }
            break;
          }
          case 'proveedor': { const r = await configApi.proveedorCliente.get(); setProvCli(r.data); break; }
          case 'impuesto': { const r = await configApi.impuestos.get(); setImpuestos(r.data); break; }
          case 'empleado': { const r = await configApi.empleado.get(); setEmpleado(r.data); break; }
          case 'tss': { const r = await configApi.tss.get(); setTss(r.data); break; }
          case 'factura': { const r = await configApi.facturacion.get(); setFactura(r.data); break; }
          case 'electronica': { 
            const r = await configApi.factElectronica.get(); 
            setElectronica(r.data || {}); 
            break; 
          }
        }
      } catch (err: any) {
        setErrorMsg(err.response?.data?.message || 'Error al cargar configuración');
      } finally {
        setLoading(prev => ({ ...prev, [activeTab]: false }));
      }
    };
    fetchData();
  }, [activeTab, idEmpresa]);

  // ═══ Consultar DGII cuando cambie el RNC (con debounce) ═══
  useEffect(() => {
    const rncLimpio = limpiarRNC(empresa.rnc || '');
    
    if (rncLimpio.length < 9) {
      setEstadoDgii('idle');
      setNombreDgii('');
      setMensajeDgii('');
      return;
    }

    setEstadoDgii('buscando');
    setMensajeDgii('🔍 Consultando DGII...');

    const timer = setTimeout(async () => {
      try {
        const { data } = await dgiiApi.consultarContribuyente(rncLimpio);
        
        if (data && data.nombre) {
          setEstadoDgii('encontrado');
          setNombreDgii(data.nombre);
          setMensajeDgii(`✅ Encontrado en DGII: ${data.nombre}`);
          setEmpresa(prev => ({ ...prev, nombre: data.nombre }));
        } else {
          setEstadoDgii('no_encontrado');
          setNombreDgii('');
          setMensajeDgii('⚠️ RNC/Cédula no encontrado en la DGII. Puede continuar si es un número de práctica.');
          setEmpresa(prev => ({ ...prev, nombre: '' }));
        }
      } catch (err: any) {
        setEstadoDgii('error');
        setNombreDgii('');
        setMensajeDgii('⚠️ No se pudo consultar la DGII. Puede continuar ingresando los datos manualmente.');
        setEmpresa(prev => ({ ...prev, nombre: '' }));
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [empresa.rnc]);

  // ═══ FUNCIONES DE GUARDADO ═══
  const handleSave = async (apiCall: () => Promise<any>, successLabel: string) => {
    setSaving(true); setErrorMsg(''); setSuccessMsg('');
    try {
      await apiCall();
      setSuccessMsg(`✅ Configuración de ${successLabel} guardada correctamente`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEmpresa = () => {
    const fd = new FormData();
    fd.append('Nombre', empresa.nombre || '');
    fd.append('Tipo', empresa.tipo || '');
    fd.append('RNC', limpiarRNC(empresa.rnc || ''));
    fd.append('Direccion', empresa.direccion || '');
    fd.append('Telefono', limpiarTelefono(empresa.telefono || ''));
    fd.append('Email', empresa.email || '');
    fd.append('Url', empresa.url || '');
    fd.append('Instagram', empresa.instagram || '');
    fd.append('Facebook', empresa.facebook || '');
    fd.append('Registrado', String(empresa.registrado ?? false));
    
    const fechaEnvio = empresa.fecha_Cierre || new Date().toISOString().split('T')[0];
    fd.append('Fecha_Cierre', fechaEnvio);
    
    const logoFile = logoFileRef.current?.files?.[0];
    if (logoFile) {
      fd.append('Logo', logoFile);
    }

    handleSave(() => empresaApi.update(idEmpresa, fd), 'Empresa');
  };

  // ═══ NUEVA FUNCIÓN: Guardar Facturación Electrónica ═══
  const handleSaveFactElectronica = () => {
    const fd = new FormData();
    
    fd.append('Envio_Inmediato', String(electronica.envio_Inmediato ?? 0));
    fd.append('Ambiente', String(electronica.ambiente ?? 0));
    fd.append('Email', electronica.email || '');
    
    if (electronica.fechaExpira) {
      fd.append('FechaExpira', electronica.fechaExpira);
    }
    
    // Claves (solo si el usuario las escribió)
    if (electronica.clave) {
      fd.append('Clave', electronica.clave);
    }
    
    if (electronica.clave_Email) {
      fd.append('Clave_Email', electronica.clave_Email);
    }
    
    // Archivo del certificado (solo si seleccionó uno nuevo)
    const certFile = certFileRef.current?.files?.[0];
    if (certFile) {
      fd.append('Certificado_Digital', certFile);
    }

    console.log('📤 Enviando config. electrónica:', Object.fromEntries(fd.entries()));
    
    handleSave(() => configApi.factElectronica.update(fd), 'Fact. Electrónica');
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ═══ RENDERIZADO DE PESTAÑAS ═══
  const renderTabContent = () => {
    if (loading[activeTab]) {
      return (
        <div className="p-12 text-center text-gray-500">
          <div className="animate-spin text-3xl mb-2 inline-block">⏳</div>
          <br />Cargando configuración...
        </div>
      );
    }

    switch (activeTab) {
      case 'empresa':
        return (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-emerald-800 pb-1 border-b mb-3">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Tipo de Empresa</label>
                  <select
                    name="tipo"
                    value={empresa.tipo || ''}
                    onChange={createChangeHandler(setEmpresa)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- SELECCIONA UN TIPO DE EMPRESA --</option>
                    {TIPOS_EMPRESA.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">RNC / Cédula</label>
                  <div className="relative">
                    <input
                      type="text"
                      name="rnc"
                      value={empresa.rnc || ''}
                      onChange={createChangeHandler(setEmpresa)}
                      placeholder="Ej: 101000010 o 001-1234567-8"
                      className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none pr-8 ${
                        estadoDgii === 'encontrado' ? 'border-green-400 bg-green-50' :
                        estadoDgii === 'no_encontrado' || estadoDgii === 'error' ? 'border-amber-400 bg-amber-50' :
                        'border-gray-200'
                      }`}
                    />
                    {estadoDgii === 'buscando' && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 animate-pulse">⏳</span>
                    )}
                    {estadoDgii === 'encontrado' && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600">✓</span>
                    )}
                  </div>
                  
                  {empresa.rnc && (
                    <p className={`text-[10px] mt-0.5 ${
                      limpiarRNC(empresa.rnc).length === 9 ? 'text-emerald-600' :
                      limpiarRNC(empresa.rnc).length === 11 ? 'text-blue-600' :
                      'text-red-600'
                    }`}>
                      {limpiarRNC(empresa.rnc).length === 9 && '✓ RNC válido (Persona Jurídica - 9 dígitos)'}
                      {limpiarRNC(empresa.rnc).length === 11 && '✓ Cédula válida (Persona Física - 11 dígitos)'}
                      {limpiarRNC(empresa.rnc).length !== 9 && limpiarRNC(empresa.rnc).length !== 11 && empresa.rnc.length > 0 &&
                        `⚠️ Documento inválido (${limpiarRNC(empresa.rnc).length} dígitos). Debe tener 9 (RNC) u 11 (Cédula)`
                      }
                    </p>
                  )}
                  
                  {mensajeDgii && (
                    <p className={`text-[10px] mt-0.5 ${
                      estadoDgii === 'encontrado' ? 'text-green-700 font-medium' :
                      estadoDgii === 'no_encontrado' || estadoDgii === 'error' ? 'text-amber-700' :
                      'text-blue-600'
                    }`}>
                      {mensajeDgii}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                    Nombre / Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={empresa.nombre || ''}
                    onChange={createChangeHandler(setEmpresa)}
                    placeholder="Se auto-llenará si el RNC existe en la DGII"
                    required
                    className={`w-full px-2 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none ${
                      estadoDgii === 'encontrado' ? 'border-green-400 bg-green-50' : 'border-gray-200'
                    }`}
                  />
                  {estadoDgii === 'encontrado' && nombreDgii && (
                    <p className="text-[10px] text-green-700 mt-0.5">✅ Nombre verificado con la DGII</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Dirección</label>
                  <input type="text" name="direccion" value={empresa.direccion || ''} onChange={createChangeHandler(setEmpresa)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Teléfono</label>
                  <input type="text" name="telefono" value={empresa.telefono || ''} onChange={createChangeHandler(setEmpresa)} placeholder="809-555-0000"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Email</label>
                  <input type="email" name="email" value={empresa.email || ''} onChange={createChangeHandler(setEmpresa)} placeholder="info@empresa.com"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Sitio Web</label>
                  <input type="text" name="url" value={empresa.url || ''} onChange={createChangeHandler(setEmpresa)} placeholder="https://www.empresa.com"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Instagram</label>
                  <input type="text" name="instagram" value={empresa.instagram || ''} onChange={createChangeHandler(setEmpresa)} placeholder="@empresa"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">Facebook</label>
                  <input type="text" name="facebook" value={empresa.facebook || ''} onChange={createChangeHandler(setEmpresa)} placeholder="facebook.com/empresa"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-emerald-800 pb-1 border-b mb-3">Logo de la Empresa</h3>
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-xs text-center px-2">Sin logo</span>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase">Cambiar Logo</label>
                  <input type="file" accept="image/*" ref={logoFileRef} onChange={handleLogoChange}
                    className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  <p className="text-[10px] text-gray-500">Formatos: PNG, JPG. Recomendado: 400x400px</p>
                  {logoPreview && (
                    <button type="button" onClick={() => { setLogoPreview(''); setEmpresa(prev => ({ ...prev, logo: undefined })); }}
                      className="text-[10px] text-red-600 hover:text-red-800 underline">
                      🗑️ Quitar logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-emerald-800 pb-1 border-b mb-3">Configuración Fiscal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border">
                  <input type="checkbox" id="registrado" name="registrado" checked={!!empresa.registrado} onChange={createChangeHandler(setEmpresa)}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
                  <label htmlFor="registrado" className="text-xs font-medium text-gray-700">Empresa Registrada en DGII</label>
                </div>
                
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                    Fecha de Cierre Fiscal
                    {esPersonaFisica(empresa.rnc || '') && (
                      <span className="ml-2 text-[9px] font-normal text-blue-600 normal-case">(Persona Física - Cierre Anual)</span>
                    )}
                    {!esPersonaFisica(empresa.rnc || '') && empresa.rnc && limpiarRNC(empresa.rnc).length === 9 && (
                      <span className="ml-2 text-[9px] font-normal text-emerald-600 normal-case">(Persona Jurídica - Puede elegir trimestre)</span>
                    )}
                  </label>
                  <select
                    name="fecha_Cierre"
                    value={empresa.fecha_Cierre || ''}
                    onChange={createChangeHandler(setEmpresa)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="">-- Selecciona fecha de cierre --</option>
                    {getOpcionesFechaCierre(empresa.rnc || '').map((opcion) => (
                      <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
                    ))}
                  </select>
                  
                  {empresa.fecha_Cierre && !getOpcionesFechaCierre(empresa.rnc || '').some(op => op.value === empresa.fecha_Cierre) && (
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      ⚠️ La fecha de cierre actual ({empresa.fecha_Cierre}) no está en las opciones disponibles. Selecciona una nueva fecha.
                    </p>
                  )}
                  
                  {esPersonaFisica(empresa.rnc || '') && (
                    <p className="text-[10px] text-gray-500 mt-1">ℹ️ Las personas físicas con cédula tienen cierre fiscal obligatorio el 31 de diciembre</p>
                  )}
                </div>
              </div>
            </div>

            <button onClick={handleSaveEmpresa} disabled={saving}
              className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Guardando...' : '💾 Guardar Empresa'}
            </button>
          </div>
        );

      case 'proveedor':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CuentaInput label="CxP (Cuenta por Pagar)" value={provCli.cxP} onChange={createChangeHandler(setProvCli)} name="cxP" />
              <CuentaInput label="Dev. Compra" value={provCli.dev_Compra} onChange={createChangeHandler(setProvCli)} name="dev_Compra" />
              <CuentaInput label="Desc. Compra" value={provCli.desc_Compra} onChange={createChangeHandler(setProvCli)} name="desc_Compra" />
              <CuentaInput label="Gasto Ingreso" value={provCli.gastoI} onChange={createChangeHandler(setProvCli)} name="gastoI" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CuentaInput label="Caja" value={provCli.caja} onChange={createChangeHandler(setProvCli)} name="caja" />
              <CuentaInput label="CxC Cia" value={provCli.cxC_Cia} onChange={createChangeHandler(setProvCli)} name="cxC_Cia" />
              <CuentaInput label="CxC" value={provCli.cxC} onChange={createChangeHandler(setProvCli)} name="cxC" />
              <CuentaInput label="Descuentos" value={provCli.descuentos} onChange={createChangeHandler(setProvCli)} name="descuentos" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CuentaInput label="Devoluciones" value={provCli.devoluciones} onChange={createChangeHandler(setProvCli)} name="devoluciones" />
              <CuentaInput label="Ingreso I" value={provCli.ingresoI} onChange={createChangeHandler(setProvCli)} name="ingresoI" />
              <CuentaInput label="Capital" value={provCli.capital} onChange={createChangeHandler(setProvCli)} name="capital" />
              <CuentaInput label="Cuenta Cierre" value={provCli.cuenta_Cierre} onChange={createChangeHandler(setProvCli)} name="cuenta_Cierre" />
            </div>
            <div className="flex items-center gap-3 mt-2 p-3 bg-gray-50 rounded border">
              <input type="checkbox" id="cumple" name="cliente_Cumple" checked={!!provCli.cliente_Cumple} onChange={createChangeHandler(setProvCli)}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600" />
              <label htmlFor="cumple" className="text-xs font-medium text-gray-700">Cliente Cumple con requisitos fiscales</label>
            </div>
            <button onClick={() => handleSave(() => configApi.proveedorCliente.update(provCli as any), 'Proveedor/Cliente')} disabled={saving}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Guardando...' : '💾 Guardar Proveedor/Cliente'}
            </button>
          </div>
        );

      // ═══════════════════════════════════════════════════════════════
      // 📡 FACTURACIÓN ELECTRÓNICA
      // ═══════════════════════════════════════════════════════════════
      case 'electronica':
        return (
          <div className="space-y-6 animate-fade-in">
            {/* ═══ SECCIÓN: CONFIGURACIÓN GENERAL ═══ */}
            <div>
              <h3 className="text-sm font-bold text-emerald-800 pb-1 border-b mb-3">
                📡 Configuración General DGII
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                    Ambiente
                  </label>
                  <select
                    name="ambiente"
                    value={electronica.ambiente ?? 0}
                    onChange={(e) => setElectronica(prev => ({ ...prev, ambiente: parseInt(e.target.value) }))}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value={0}>🟢 Pre-Certificación (Pruebas)</option>
                    <option value={1}>🟡 Certificación</option>
                    <option value={2}>🟢 Producción (DGII Real)</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">
                    ℹ️ Usa "Pre-Certificación" para pruebas. "Producción" emite comprobantes válidos.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                    Fecha de Expiración del Certificado
                  </label>
                  <input
                    type="date"
                    name="fechaExpira"
                    value={electronica.fechaExpira ? String(electronica.fechaExpira).split('T')[0] : ''}
                    onChange={createChangeHandler(setElectronica)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                  {electronica.fechaExpira && (() => {
                    const fecha = new Date(electronica.fechaExpira!);
                    const hoy = new Date();
                    const diasRestantes = Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                    if (diasRestantes < 0) {
                      return <p className="text-[10px] text-red-600 mt-1 font-medium">❌ Certificado EXPIRADO</p>;
                    } else if (diasRestantes <= 30) {
                      return <p className="text-[10px] text-amber-600 mt-1 font-medium">⚠️ Vence en {diasRestantes} días</p>;
                    } else {
                      return <p className="text-[10px] text-green-600 mt-1">✅ Vigente ({diasRestantes} días restantes)</p>;
                    }
                  })()}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-0.5">
                    Email para notificaciones DGII
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={electronica.email || ''}
                    onChange={createChangeHandler(setElectronica)}
                    placeholder="empresa@correo.com"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded border h-fit mt-auto">
                  <input
                    type="checkbox"
                    id="envioInmediato"
                    name="envio_Inmediato"
                    checked={electronica.envio_Inmediato === 1}
                    onChange={(e) => {
                      setElectronica(prev => ({
                        ...prev,
                        envio_Inmediato: e.target.checked ? 1 : 0
                      }));
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-emerald-600"
                  />
                  <div>
                    <label htmlFor="envioInmediato" className="text-xs font-medium text-gray-700 cursor-pointer">
                      Envío Inmediato a la DGII
                    </label>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      Los e-CF se envían al firmar. Si está desactivado, se envían por lotes.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ SECCIÓN: CERTIFICADO DIGITAL ═══ */}
            <div>
              <h3 className="text-sm font-bold text-emerald-800 pb-1 border-b mb-3">
                🔐 Certificado Digital (.pfx / .p12)
              </h3>
              <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🔑</span>
                  <div className="flex-1">
                    <p className="text-xs text-gray-700">
                      El certificado digital es emitido por el <strong>VIA FIRMA, DIGIFIRMA</strong> u otras entidades autorizadas por INDOTEL. 
                      Es requerido para firmar electrónicamente los comprobantes.
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      {electronica.tieneCertificado ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-semibold rounded">
                          ✅ Certificado cargado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-[10px] font-semibold rounded">
                          ⚠️ Sin certificado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                    Archivo del Certificado
                  </label>
                  <input
                    type="file"
                    accept=".pfx,.p12"
                    ref={certFileRef}
                    className="w-full text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    💡 Formatos aceptados: .pfx, .p12. Máximo recomendado: 5MB.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                    Clave del Certificado
                  </label>
                  <input
                    type="password"
                    name="clave"
                    value={electronica.clave || ''}
                    onChange={createChangeHandler(setElectronica)}
                    placeholder="•••••••• (dejar vacío si no cambia)"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                  />
                  {electronica.tieneClaveCertificado && (
                    <p className="text-[10px] text-green-600 mt-1">
                      🔒 Ya existe una clave almacenada (encriptada). Solo escríbela si deseas cambiarla.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ SECCIÓN: CORREO ELECTRÓNICO ═══ */}
            <div>
              <h3 className="text-sm font-bold text-emerald-800 pb-1 border-b mb-3">
                📧 Correo para Envío de e-CF
              </h3>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                <p className="text-xs text-gray-700">
                  Configura las credenciales del correo desde el cual se enviarán los comprobantes electrónicos a los clientes.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                    Clave del Correo
                  </label>
                  <input
                    type="password"
                    name="clave_Email"
                    value={electronica.clave_Email || ''}
                    onChange={createChangeHandler(setElectronica)}
                    placeholder="•••••••• (dejar vacío si no cambia)"
                    className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
                  />
                  {electronica.tieneClaveEmail && (
                    <p className="text-[10px] text-green-600 mt-1">
                      🔒 Ya existe una clave de correo almacenada (encriptada).
                    </p>
                  )}
                  <p className="text-[10px] text-gray-500 mt-1">
                    ℹ️ El correo emisor se configura en la pestaña <strong>Empresa</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ BOTÓN DE GUARDAR ═══ */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-[10px] text-gray-500">
                🔐 Las claves y el certificado se almacenan encriptados en la base de datos.
              </div>
              <button
                onClick={handleSaveFactElectronica}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {saving ? '⏳ Guardando...' : '💾 Guardar Fact. Electrónica'}
              </button>
            </div>
          </div>
        );

      // ═══ PESTAÑAS PENDIENTES ═══
      case 'impuesto':
      case 'empleado':
      case 'tss':
      case 'factura':
        return (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-3">🚧</div>
            <p className="text-sm font-medium">Pestaña en desarrollo</p>
            <p className="text-xs mt-1">Esta sección estará disponible próximamente.</p>
          </div>
        );

      default:
        return <div className="p-8 text-center text-gray-500">Pestaña no encontrada</div>;
    }
  };

  // ═══ RENDER PRINCIPAL (DESPUÉS DE TODOS LOS HOOKS) ═══
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 py-4 px-3">
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-white">⚙️ Configuración del Sistema</h1>
            <p className="text-emerald-100 text-xs">Gestione los parámetros contables, fiscales y de impresión de EmmaSystem</p>
          </div>
        </div>

        {successMsg && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs text-center animate-bounce">✅ {successMsg}</div>}
        {errorMsg && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs text-center">⚠️ {errorMsg}</div>}

        <div className="flex flex-col lg:flex-row gap-6 bg-white rounded-xl shadow border border-gray-100 overflow-hidden min-h-[600px]">
          <div className="lg:w-64 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex lg:flex-col overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap lg:whitespace-normal ${
                  activeTab === tab.id ? 'bg-emerald-100 text-emerald-800 border-l-4 lg:border-l-0 lg:border-r-4 border-emerald-500' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}>
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b flex items-center gap-2">
              {TABS.find(t => t.id === activeTab)?.icon} {TABS.find(t => t.id === activeTab)?.label}
            </h2>
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}