import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// ------------------------------------------------------------
// Configuración de Soporte Técnico WhatsApp
// ------------------------------------------------------------
const SOPORTE_WHATSAPP = '8495302566'; // Número de soporte (sin + ni espacios)

// ------------------------------------------------------------
// Tipos para soportar tres niveles de navegación
// ------------------------------------------------------------
interface NavItem {
  label: string;
  path?: string;
  children?: NavItem[];
}

interface NavModule {
  id: string;
  title: string;
  icon?: React.ReactNode;
  items: NavItem[];
}

// ------------------------------------------------------------
// Configuración del menú del sistema (dropdown del header)
// ------------------------------------------------------------
const SYSTEM_MENU_ITEMS: NavItem[] = [
  {
    label: 'Base de Datos',
    children: [
      { label: 'Crear nueva empresa', path: '/sistema/empresa/nueva' },
      { label: 'Backup', path: '/sistema/backup' },
      { label: 'Cambiar empresa', path: '/login' },
      { label: 'Copiar empresa', path: '/sistema/copiar-empresa' },
    ],
  },
  {
    label: 'Importar',
    children: [
      { label: 'Clientes', path: '/sistema/importar/clientes' },
      { label: 'Ventas', path: '/sistema/importar/ventas' },
      { label: 'Productos', path: '/sistema/importar/productos' },
      { label: 'Proveedores', path: '/sistema/importar/proveedores' },
    ],
  },
  {
    label: 'Exportar',
    children: [
      { label: 'Clientes', path: '/sistema/exportar/clientes' },
      { label: 'Ventas', path: '/sistema/exportar/ventas' },
      { label: 'Productos', path: '/sistema/exportar/productos' },
      { label: 'Proveedores', path: '/sistema/exportar/proveedores' },
    ],
  },
  { label: 'Cambiar usuario', path: '/sistema/cambiar-usuario' },
  { label: 'Configuración', path: '/configuracion' },
  { label: 'Historial', path: '/sistema/historial' },
  {
    label: 'Usuarios',
    children: [
      { label: 'Control de usuarios', path: '/sistema/usuarios/control' },
      { label: 'Controles de usuario', path: '/sistema/usuarios/controles' },
      { label: 'Cambiar contraseña', path: '/sistema/usuarios/cambiar-password' },
    ],
  },
  {
    label: 'Impuestos y NCF',
    children: [
      { label: 'Agregar NCF', path: '/agregar-ncf' },
      { label: 'Consulta RNC', path: '/consulta-rnc' },
      { label: 'Seguimientos e-CF', path: '/sistema/impuestos/seguimiento-ecf' },
    ],
  },
  { label: 'Reporte de errores y sugerencias', path: '/sistema/reporte-errores' },
];

// ------------------------------------------------------------
// Configuración principal del menú con iconos SVG
// ------------------------------------------------------------
const NAV_MODULES: NavModule[] = [
  {
    id: 'inventario',
    title: 'Artículos e Inventario',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    items: [
      { label: 'Productos', path: '/productos' },
      { label: 'Servicios', path: '/servicios' },
   //   { label: 'Productos Elaborados', path: '/elaborados' },
      { label: 'Categorías de Productos', path: '/categoria' },
      { label: 'Unidades de Medida', path: '/medida' },
      { label: 'Términos de Pago', path: '/terminos' },
      { label: 'Centros de Costos', path: '/centros-costos' },
 //     { label: 'Tasa de Cambio', path: '/inventario/tasa-cambio' },
      { label: 'Códigos de Barras', path: '/inventario/codigos-barras' },
      { label: 'Códigos QR', path: '/inventario/codigos-qr' },
//      { label: 'Movimientos de Inventario', path: '/inventario/movimientos' },
//        { label: 'Entradas y Salidas', path: '/inventario/entradas-salidas' },
    ],
  },
  {
    id: 'proveedores',
    title: 'Proveedores',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
   items: [
//      { label: 'Registro de Proveedores', path: '/proveedores/registro' },
 //     { label: 'Órdenes de Compra', path: '/proveedores/ordenes-compra' },
 //     { label: 'Facturas de Proveedores', path: '/proveedores/facturas' },
 //     { label: 'Notas de Crédito', path: '/proveedores/notas-credito' },
 //     { label: 'Notas de Débito', path: '/proveedores/notas-debito' },
  //    { label: 'Pagos a Proveedores', path: '/proveedores/pagos' },
   //   { label: 'Caja Chica', path: '/proveedores/caja-chica' },
//      { label: 'Anticipos a Proveedores', path: '/proveedores/anticipos' },
//      { label: 'Estado de Cuenta', path: '/proveedores/estado-cuenta' },
    ],
  },
  {
    id: 'clientes',
    title: 'Clientes',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    items: [
      { label: 'Registro de Clientes', path: '/clientes' },
      { label: 'Cotizaciones', path: '/cotizaciones' },
      { label: 'Pedidos', path: '/pedidos' },
      { label: 'Conduces', path: '/conduces' },
      { label: 'Facturas de Clientes', path: '/ventas' },
  //    { label: 'Facturas Pendientes', path: '/clientes/facturas-pendientes' },
      { label: 'Notas de Crédito', path: '/clientes/notas-credito' },
 //     { label: 'Notas de Débito', path: '/clientes/notas-debito' },
      { label: 'Cobros a Clientes', path: '/clientes/cobros' },
 //     { label: 'Anticipos de Clientes', path: '/clientes/anticipos' },
 //     { label: 'Ajustes de Caja', path: '/clientes/ajustes-caja' },
 //     { label: 'Cuadre de Caja', path: '/clientes/cuadre-caja' },
  //    { label: 'Tabla de Amortización', path: '/clientes/amortizacion' },
   //   { label: 'Cobro de Cuotas', path: '/clientes/cobro-cuotas' },
    ],
  },
  {
    id: 'educacion',
    title: 'Educación',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
    items: [
      { label: 'Tutores', path: '/educacion/tutores' },
      { label: 'Estudiantes', path: '/educacion/estudiantes' },
      { label: 'Cursos', path: '/cursos' },
      { label: 'Inscripciones', path: '/educacion/inscripciones' },
      { label: 'Asistencias', path: '/educacion/asistencias' },
      { label: 'Listado de Estudiantes', path: '/educacion/listado-estudiantes' },
//      { label: 'Control de Asistencias', path: '/educacion/asistencias/reporte' },
//      { label: 'Generar Facturas', path: '/educacion/generar-facturas' },
    ],
  },
  {
    id: 'nomina',
    title: 'Empleados y Nómina',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    items: [
//      { label: 'Registro de Puestos', path: '/nomina/puestos' },
 //     { label: 'Registro de Empleados', path: '/nomina/empleados' },
 //     { label: 'Ponches', path: '/nomina/ponches' },
//      { label: 'Préstamos a Empleados', path: '/nomina/prestamos' },
//      { label: 'Novedades de Nómina', path: '/nomina/novedades' },
//      { label: 'Generación de Nómina', path: '/nomina/generacion' },
//      { label: 'Generación de Bonificación', path: '/nomina/bonificaciones' },
//      { label: 'Salario de Navidad', path: '/nomina/salario-navidad' },
//      { label: 'Consultas de Nómina', path: '/nomina/consultas' },
//      { label: 'Prestaciones Laborales', path: '/nomina/prestaciones' },
    ],
  },
  {
    id: 'bancos',
    title: 'Bancos y Tesorería',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    items: [
//      { label: 'Registro de Bancos', path: '/bancos/registro-bancos' },
//      { label: 'Registro de Cuentas', path: '/bancos/cuentas' },
//      { label: 'Registro de Tarjetas', path: '/bancos/tarjetas' },
//      { label: 'Préstamos Bancarios', path: '/bancos/prestamos' },
//      { label: 'Solicitudes de Pago', path: '/bancos/solicitudes-pago' },
//      { label: 'Emisión de Cheques', path: '/bancos/cheques' },
//      { label: 'Depósitos Bancarios', path: '/bancos/depositos' },
//      { label: 'Retiros Bancarios', path: '/bancos/retiros' },
//      { label: 'Transferencias entre Cuentas', path: '/bancos/transferencias-internas' },
//      { label: 'Transferencias a Terceros', path: '/bancos/transferencias-terceros' },
//      { label: 'Notas de Débito Bancarias', path: '/bancos/notas-debito' },
//      { label: 'Notas de Crédito Bancarias', path: '/bancos/notas-credito' },
//      { label: 'Movimientos Bancarios', path: '/bancos/movimientos' },
//      { label: 'Conciliación Bancaria', path: '/bancos/conciliacion' },
    ],
  },
  {
    id: 'contabilidad',
    title: 'Contabilidad',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    items: [
 //     { label: 'Catálogo de Cuentas', path: '/contabilidad/catalogo-cuentas' },
 //     { label: 'Entradas de Diario', path: '/contabilidad/entradas-diario' },
 //     { label: 'Activos Fijos', path: '/contabilidad/activos-fijos' },
 //     { label: 'Cierre Fiscal', path: '/contabilidad/cierre-fiscal' },
  //    { label: 'Mayor General', path: '/contabilidad/mayor-general' },
  //    { label: 'Balanza de Comprobación', path: '/contabilidad/balanza' },
 //     { label: 'Depreciación de Activos', path: '/contabilidad/depreciacion' },
 //     { label: 'Estados Financieros', path: '/contabilidad/estados-financieros' },
    ],
  },
  {
    id: 'reportes',
    title: 'Reportes',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    items: [
      {
        label: 'Ventas',
        children: [
          { label: 'por Comprobantes', path: '/reporte/ventas/comprobante' },
          { label: 'por Centro de Costos', path: '/reporte/ventas/centro-costos' },
          { label: 'por Artículos Vendidos', path: '/reporte/ventas/articulos-vendidos' },
          { label: 'Utilidad por Producto', path: '/reporte/ventas/utilidad-producto' },
          { label: 'Comisión por Vendedor', path: '/reporte/ventas/comision-vendedor' },
          { label: 'Comisión por Producto', path: '/reporte/ventas/comision-producto' },
          { label: 'Relación de Cotizaciones', path: '/reporte/ventas/cotizaciones' },
          { label: 'Relación de Pedidos', path: '/reporte/ventas/pedidos' },
          { label: 'Relación de Conduces', path: '/reporte/ventas/conduces' },
        ],
      },
      {
        label: 'CxC Clientes',
        children: [
          { label: 'Saldos por Antigüedad', path: '/reportes/clientes/saldos-antiguedad' },
          { label: 'Movimientos de Cliente', path: '/reportes/clientes/movimientos-cliente' },
          { label: 'Estado de Cuenta', path: '/reportes/clientes/estado-cuenta' },
          { label: 'Recibo de Cobros', path: '/reportes/clientes/recibo-cobros' },
        ],
      },
      //{ label: 'Inventario', path: '/reportes/inventario' },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Modo impresión
  const isPrintMode = location.pathname.includes('/imprimir') || location.search.includes('print=true');

  // Estados para menús colapsables
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const systemMenuRef = useRef<HTMLDivElement>(null);

  const toggleModule = (id: string) => setOpenModules(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSubMenu = (key: string) => setOpenSubMenus(prev => ({ ...prev, [key]: !prev[key] }));

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  // ✅ Función para abrir WhatsApp con mensaje personalizado
  const handleSoporteWhatsApp = () => {
    const nombreUsuario = user?.nombreEmpleado || 'Usuario';
    const empresa = user?.empresa || 'Mi empresa';
    const mensaje = `¡Hola! Soy *${nombreUsuario}* de *${empresa}*. Necesito asistencia técnica con EmmaSystem. ¿Me pueden ayudar?`;
    const mensajeCodificado = encodeURIComponent(mensaje);
    const url = `https://wa.me/${SOPORTE_WHATSAPP}?text=${mensajeCodificado}`;
    window.open(url, '_blank');
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (systemMenuRef.current && !systemMenuRef.current.contains(event.target as Node)) {
        setShowSystemMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reiniciar estado de error cuando cambie la foto del usuario
  useEffect(() => {
    setAvatarError(false);
  }, [user?.logo]);

  // Construir la URL de la imagen del avatar (campo 'foto' de la API)
  const getAvatarSrc = () => {
    if (!user?.logo || avatarError) return null;
    const foto = user.logo;
    if (foto.startsWith('data:image') || foto.startsWith('http')) {
      return foto;
    }
    if (foto.length > 0) {
      const cleanBase64 = foto.replace(/\s/g, '');
      return `data:image/png;base64,${cleanBase64}`;
    }
    return null;
  };

  const avatarSrc = getAvatarSrc();
  const userInitial = user?.nombreEmpleado?.charAt(0)?.toUpperCase() || 'U';

  // Renderizado recursivo de submenús (para dropdown)
  const renderNavItems = (items: NavItem[], level: number = 1, parentKey: string = '') => {
    return items.map((item, idx) => {
      const hasChildren = item.children && item.children.length > 0;
      const itemKey = parentKey ? `${parentKey}-${idx}` : `${item.label}-${idx}`;
      const isOpen = openSubMenus[itemKey];

      if (hasChildren) {
        return (
          <div key={itemKey}>
            <button
              onClick={() => toggleSubMenu(itemKey)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
              <span>{item.label}</span>
              <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`overflow-hidden transition-all pl-3 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
              {renderNavItems(item.children!, level + 1, itemKey)}
            </div>
          </div>
        );
      } else if (item.path) {
        return (
          <Link
            key={itemKey}
            to={item.path}
            onClick={() => setShowSystemMenu(false)}
            className="block px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {item.label}
          </Link>
        );
      }
      return null;
    });
  };

  // Renderizado de items del sidebar (con estilos propios)
  const renderSidebarItems = (items: NavItem[], level: number = 1, parentKey: string = '') => {
    return items.map((item, idx) => {
      const hasChildren = item.children && item.children.length > 0;
      const itemKey = parentKey ? `${parentKey}-${idx}` : `${item.label}-${idx}`;
      const isOpen = openSubMenus[itemKey];

      if (hasChildren) {
        return (
          <div key={itemKey} className="space-y-0.5">
            <button
              onClick={() => toggleSubMenu(itemKey)}
              className="w-full flex items-center justify-between px-2 py-1 rounded-md text-xs font-medium transition-colors hover:bg-slate-800/50 hover:text-white"
            >
              <span className="truncate">{item.label}</span>
              <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pl-3 space-y-0.5 border-l border-slate-700 ml-1">
                {renderSidebarItems(item.children!, level + 1, itemKey)}
              </div>
            </div>
          </div>
        );
      } else if (item.path) {
        return (
          <Link
            key={itemKey}
            to={item.path}
            className={`block px-2 py-1 rounded text-xs font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-emerald-600/20 text-emerald-400 border-l-2 border-emerald-500'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {item.label}
          </Link>
        );
      }
      return null;
    });
  };

  // Modo impresión
  if (isPrintMode) {
    return (
      <div className="min-h-screen bg-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen overflow-hidden shadow-xl print:hidden">
        <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow">
            ES
          </div>
          <span className="text-lg font-bold text-white tracking-tight">EmmaSystem</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-all ${
              isActive('/dashboard') ? 'bg-emerald-600 text-white shadow-sm' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Dashboard
          </Link>

          {NAV_MODULES.map((module) => (
            <div key={module.id} className="space-y-1">
              <button
                onClick={() => toggleModule(module.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  openModules[module.id] ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {module.icon}
                  <span className="truncate">{module.title}</span>
                </span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0 ${openModules[module.id] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className={`overflow-hidden transition-all duration-200 ease-in-out ${openModules[module.id] ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="pl-3 space-y-1 border-l border-slate-700 ml-2">
                  {renderSidebarItems(module.items, 1, module.id)}
                </div>
              </div>
            </div>
          ))}
        </nav>

        {/* ✅ BOTÓN DE SOPORTE TÉCNICO WHATSAPP - Posición estratégica en el footer del sidebar */}
        <div className="border-t border-slate-700 p-2 space-y-1">
          <button
            onClick={handleSoporteWhatsApp}
            className="w-full group flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            title="Contactar soporte técnico por WhatsApp"
          >
            {/* Icono de WhatsApp */}
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <div className="flex-1 text-left">
              <div className="text-[11px] font-bold leading-tight">Soporte Técnico</div>
              <div className="text-[9px] text-green-100 leading-tight">¿Necesitas ayuda? Escríbenos</div>
            </div>
            <svg className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Versión */}
          <div className="px-2 py-1 text-[10px] text-slate-500 text-center">
            v5.5.0 • © 2026 EmmaSystem
          </div>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white shadow-sm border-b border-emerald-100 px-4 py-2 flex items-center justify-between sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
            <div>
              <h2 className="text-sm font-bold text-emerald-800 leading-tight">{user?.empresa || 'Empresa'}</h2>
              <p className="text-[10px] text-gray-500">Panel de Administración</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-800">{user?.nombreEmpleado}</p>
              <p className="text-[10px] text-gray-500">{user?.puesto || 'Administrador'}</p>
            </div>

            {/* Botón del Sistema con dropdown */}
            <div className="relative" ref={systemMenuRef}>
              <button
                onClick={() => setShowSystemMenu(!showSystemMenu)}
                className="p-1.5 rounded-md text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
                title="Configuración del sistema"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {showSystemMenu && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-y-auto">
                  <div className="py-1">
                    {renderNavItems(SYSTEM_MENU_ITEMS)}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar con imagen de perfil (user?.foto) y fallback a inicial */}
            <div className="h-8 w-8 rounded-full overflow-hidden bg-gradient-to-br from-emerald-500 to-orange-500 flex items-center justify-center text-white font-bold text-xs shadow shrink-0">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
              title="Cerrar Sesión"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 overflow-auto bg-gradient-to-br from-emerald-50 via-white to-amber-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}