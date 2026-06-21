import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts y Autenticación
import SelectCompanyPage from './features/auth/SelectCompanyPage';
import LoginEmpresaPage from './features/auth/LoginEmpresaPage';

import LoginPage from './features/auth/LoginPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './features/dashboard/DashboardPage';

// Módulo: Clientes
import ClienteListPage from './features/clientes/ClienteListPage';
import ClienteFormPage from './features/clientes/ClienteFormPage';

// Módulo: Artículos e Inventario
import CategoriaListPage from './features/categoria/categoriaListPage';
import MedidaListPage from './features/medida/medidaListPage';
import DepartamentoListPage from './features/departamento/departamentoListPage';
import ArticuloListPage from './features/articulo/articuloListPage';
import ArticuloFormPage from './features/articulo/articuloFormPage';

// Módulo: Configuración
import TerminoListPage from './features/Termino/TerminoListPage';
import TerminoFormPage from './features/Termino/TerminoFormPage';

// Cotizacion
import CotizacionListPage from './features/cotizacion/cotizacionListPage';
import CotizacionFormPage from './features/cotizacion/cotizacionFormPage';
import CotizacionPrintPage from './pages/CotizacionPrintPage';

// Pedido
import PedidoListPage from './features/pedido/pedidoListPage';
import PedidoFormPage from './features/pedido/pedidoFormPage';
// Conduce
import ConduceListPage from './features/conduce/conduceListPage';
import ConduceFormPage from './features/conduce/conduceFormPage';
//Venta
import VentaListPage from './features/venta/VentaListPage';
import VentaFormPage from './features/venta/VentaFormPage';
import FacturaPrintPage from './pages/FacturaPrintPage';

import ENcfListPage from './features/configuracion/ENcfListPage';
import ConfiguracionPage from './features/configuracion/ConfiguracionPage';
import ConsultaDgiiPage from './features/configuracion/consultadgii';
import CursoFormPage from './features/curso/CursoFormPage';
import CursoListPage from './features/curso/CursoListPage';
import EstudianteListPage from './features/estudiante/EstudianteListPage';
import EstudianteFormPage from './features/estudiante/EstudianteFormPage';
import InscripcionListPage from './features/inscripcion/InscripcionListPage';
import InscripcionFormPage from './features/inscripcion/InscripcionFormPage';
import AsistenciaPage from './features/asistencia/AsistenciaPage';
import AsistenciaReportPage from './features/asistencia/AsistenciaReportPage';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === Rutas Públicas === */}
<Route path="/login" element={<LoginPage />} />
<Route path="/select-company" element={<SelectCompanyPage />} />
<Route path="/login-empresa" element={<LoginEmpresaPage />} />

        {/* === Rutas Protegidas === */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            
            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Módulo: Clientes */}
            <Route path="/clientes" element={<ClienteListPage />} />
            <Route path="/clientes/nuevo" element={<ClienteFormPage />} />
            <Route path="/clientes/editar/:id" element={<ClienteFormPage />} />

            {/* Módulo: Artículos e Inventario */}
            <Route path="/productos" element={<ArticuloListPage />} />
            <Route path="/productos/nuevo" element={<ArticuloFormPage />} />
            <Route path="/productos/editar/:id" element={<ArticuloFormPage />} />
            
            {/* Sub-módulos de Inventario */}
            <Route path="/categoria" element={<CategoriaListPage />} />
            <Route path="/medida" element={<MedidaListPage />} />
            <Route path="/centros-costos" element={<DepartamentoListPage />} />

            {/* Módulo: Configuración */}
            <Route path="/terminos" element={<TerminoListPage />} />
            <Route path="/terminos/nuevo" element={<TerminoFormPage />} />
            <Route path="/terminos/editar/:id" element={<TerminoFormPage />} />

            {/* Módulo: Ventas - Cotizaciones */}
            <Route path="/cotizaciones" element={<CotizacionListPage />} />
            <Route path="/cotizaciones/nueva" element={<CotizacionFormPage />} />
            <Route path="/cotizaciones/editar/:id" element={<CotizacionFormPage />} />

            {/* Módulo: Ventas - Pedidos */}
            <Route path="/pedidos" element={<PedidoListPage />} />
            <Route path="/pedidos/nuevo" element={<PedidoFormPage />} />
            <Route path="/pedidos/editar/:id" element={<PedidoFormPage />} />
            <Route path="/pedidos/:id/imprimir/:tipo" element={<CotizacionPrintPage />} />
            {/* Módulo: Ventas - Conduces */}
            <Route path="/conduces" element={<ConduceListPage />} />
            <Route path="/conduces/nuevo" element={<ConduceFormPage />} />
            <Route path="/conduces/editar/:id" element={<ConduceFormPage />} />
            <Route path="/conduces/:id/imprimir/:tipo" element={<CotizacionPrintPage />} />

            
            <Route path="/ventas" element={<VentaListPage />} />
            <Route path="/ventas/nueva" element={<VentaFormPage />} />
            <Route path="/ventas/:id/editar" element={<VentaFormPage />} />

            <Route path="/agregar-ncf" element={<ENcfListPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/consulta-rnc" element={<ConsultaDgiiPage />} />
            
<Route path="/cursos" element={<CursoListPage />} />
<Route path="/cursos/nuevo" element={<CursoFormPage />} />
<Route path="/cursos/editar/:id" element={<CursoFormPage />} />

<Route path="/educacion/estudiantes" element={<EstudianteListPage />} />
<Route path="/educacion/estudiantes/nuevo" element={<EstudianteFormPage />} />
<Route path="/educacion/estudiantes/editar/:id" element={<EstudianteFormPage />} />
<Route path="/educacion/inscripciones" element={<InscripcionListPage />} />
<Route path="/educacion/inscripciones/nueva" element={<InscripcionFormPage />} />
<Route path="/educacion/inscripciones/editar/:id" element={<InscripcionFormPage />} />
<Route path="/educacion/asistencias" element={<AsistenciaPage />} />
<Route path="/educacion/asistencias/reporte" element={<AsistenciaReportPage />} />

          </Route>
        </Route>

        {/* === Fallback: Redirección por defecto === */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        // App.tsx o tu archivo de rutas
      <Route path="/cotizaciones/:id/imprimir/:tipo" element={<CotizacionPrintPage />} />
      
      <Route path="/ventas/:noFactura/imprimir" element={<FacturaPrintPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;