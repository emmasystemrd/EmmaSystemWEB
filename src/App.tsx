import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Layouts y Autenticación
import SelectCompanyPage from './features/auth/SelectCompanyPage';
import LoginEmpresaPage from './features/auth/LoginEmpresaPage';
import RegisterPage from './features/auth/RegisterPage';
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

// Lazy loading para componentes pesados
const VentaFormPage = lazy(() => import('./features/venta/VentaFormPage'));
const VentaListPage = lazy(() => import('./features/venta/VentaListPage'));
const CotizacionPrintPage = lazy(() => import('./pages/CotizacionPrintPage'));
const FacturaPrintPage = lazy(() => import('./pages/FacturaPrintPage'));
const AsistenciaReportPage = lazy(() => import('./features/asistencia/AsistenciaReportPage'));

// Pedido
import PedidoListPage from './features/pedido/pedidoListPage';
import PedidoFormPage from './features/pedido/pedidoFormPage';

// Conduce
import ConduceListPage from './features/conduce/conduceListPage';
import ConduceFormPage from './features/conduce/conduceFormPage';

import ENcfListPage from './features/configuracion/ENcfListPage';
import ConfiguracionPage from './features/configuracion/ConfiguracionPage';
import ConsultaDgiiPage from './features/configuracion/consultadgii';

// Educación
import CursoFormPage from './features/curso/CursoFormPage';
import CursoListPage from './features/curso/CursoListPage';
import EstudianteListPage from './features/estudiante/EstudianteListPage';
import EstudianteFormPage from './features/estudiante/EstudianteFormPage';
import InscripcionListPage from './features/inscripcion/InscripcionListPage';
import InscripcionFormPage from './features/inscripcion/InscripcionFormPage';
import AsistenciaPage from './features/asistencia/AsistenciaPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === Rutas Públicas === */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/select-company" element={<SelectCompanyPage />} />
        <Route path="/login-empresa" element={<LoginEmpresaPage />} />
        <Route path="/registro" element={<RegisterPage />} />

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

            {/* Módulo: Ventas - Conduces */}
            <Route path="/conduces" element={<ConduceListPage />} />
            <Route path="/conduces/nuevo" element={<ConduceFormPage />} />
            <Route path="/conduces/editar/:id" element={<ConduceFormPage />} />

            {/* ✅ CORRECTO: Suspense DENTRO del element */}
            <Route path="/ventas" element={
              <Suspense fallback={<div className="p-8 text-center">Cargando ventas...</div>}>
                <VentaListPage />
              </Suspense>
            } />
            <Route path="/ventas/nueva" element={
              <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
                <VentaFormPage />
              </Suspense>
            } />
            <Route path="/ventas/:id/editar" element={
              <Suspense fallback={<div className="p-8 text-center">Cargando...</div>}>
                <VentaFormPage />
              </Suspense>
            } />

            {/* Rutas de Impresión - Protegidas y Lazy Loaded */}
            <Route path="/cotizaciones/:id/imprimir/:tipo" element={
              <Suspense fallback={<div className="p-8 text-center">Cargando impresión...</div>}>
                <CotizacionPrintPage />
              </Suspense>
            } />
            <Route path="/conduces/:id/imprimir/:tipo" element={
              <Suspense fallback={<div className="p-8 text-center">Cargando impresión...</div>}>
                <CotizacionPrintPage />
              </Suspense>
            } />
            <Route path="/ventas/:noFactura/imprimir" element={
              <Suspense fallback={<div className="p-8 text-center">Cargando impresión...</div>}>
                <FacturaPrintPage />
              </Suspense>
            } />
            <Route path="/educacion/asistencia-formulario/:idCurso/:idInstructor/:fecha" element={
              <Suspense fallback={<div className="p-8 text-center">Cargando formulario...</div>}>
                <AsistenciaReportPage />
              </Suspense>
            } />

            {/* Configuración DGII */}
            <Route path="/agregar-ncf" element={<ENcfListPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="/consulta-rnc" element={<ConsultaDgiiPage />} />
            
            {/* Módulo: Educación */}
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
          </Route>
        </Route>

        {/* === Fallback: Redirección por defecto === */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;