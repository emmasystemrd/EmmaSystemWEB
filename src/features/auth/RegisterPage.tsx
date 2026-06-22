import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi, type RegistrarClienteRequest } from '../../api/auth.api';
import EmmaLogo from '../../components/shared/EmmaLogo';

// ✅ Credenciales SQL fijas para generación automática de cadena de conexión
const SQL_USER = 'sa';
const SQL_PASSWORD = '$EmmaSystem2021';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    razonSocial: '',
    rnc: '',
    correoPrincipal: '',
    telefono: '',
    emailAdmin: '',
    passwordAdmin: '',
    nombreCompletoAdmin: '',
    idPlan: 1,
    nombreEmpresa: '',
    nombreBD: '',
    servidorBD: '.\\EmmaSystem',
    rncCedula: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  // ✅ Generar cadena de conexión automáticamente a partir de los campos del formulario
  const buildConnectionString = (): string => {
    const server = form.servidorBD.trim() || '.\\EmmaSystem';
    const database = form.nombreBD.trim();
    if (!database) return '';
    return `Server=${server};Database=${database};User Id=${SQL_USER};Password=${SQL_PASSWORD};TrustServerCertificate=True;`;
  };

  const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setError(null);
  setIsLoading(true);

  try {
    const connectionString = buildConnectionString();
    if (!connectionString) {
      setError('El nombre de la base de datos es obligatorio.');
      setIsLoading(false);
      return;
    }

    const payload: RegistrarClienteRequest = {
      razonSocial: form.razonSocial,
      rnc: form.rnc || undefined,
      correoPrincipal: form.correoPrincipal,
      telefono: form.telefono || undefined,
      emailAdmin: form.emailAdmin,
      passwordAdmin: form.passwordAdmin,
      nombreCompletoAdmin: form.nombreCompletoAdmin,
      idPlan: form.idPlan,
      empresas: [
        {
          nombreEmpresa: form.nombreEmpresa,
          nombreBD: form.nombreBD,
          servidorBD: form.servidorBD,
          connectionString,
          rncCedula: form.rncCedula || undefined,
          esDefault: true,
        },
      ],
    };

    // ✅ PASO 1: Validar ANTES de registrar
    const { data: validacion } = await authApi.validarRegistro(payload);

    if (!validacion.esValido) {
      setError(validacion.errores.join('; '));
      setIsLoading(false);
      return;
    }

    // ✅ PASO 2: Registrar solo si la validación pasó
    await authApi.registrarCliente(payload);
    setSuccess(true);

    setTimeout(() => navigate('/login', { replace: true }), 2000);
  } catch (err: any) {
    const message =
      err.response?.data?.message ||
      err.backendMessage ||
      'Error al registrar cuenta';
    setError(message);
  } finally {
    setIsLoading(false);
  }
};

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-emerald-100 shadow-xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
          <p className="text-sm text-gray-600 mb-4">Tu cuenta ha sido registrada exitosamente. Serás redirigido al inicio de sesión.</p>
          <Link to="/login" className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
            Ir al inicio de sesión →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Panel izquierdo: Branding (oculto en móvil) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 flex-col justify-center items-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-48 h-48 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-md w-full space-y-4">
          <div className="flex justify-center">
            <EmmaLogo className="h-14 w-auto drop-shadow-md" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-gray-900">Crea tu cuenta en EmmaSystem</h1>
            <p className="text-sm text-gray-600">Registra tu empresa y comienza a facturar electrónicamente cumpliendo con la Ley 32-23.</p>
          </div>
        </div>
      </div>

      {/* Panel derecho: Formulario de registro */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white overflow-y-auto">
        <div className="w-full max-w-lg mx-auto bg-white rounded-2xl border border-emerald-100 shadow-xl p-5 my-8">
          {/* Logo móvil */}
          <div className="lg:hidden flex justify-center mb-3">
            <EmmaLogo className="h-10 w-auto" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-black">
              <span className="bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                EmmaSystem
              </span>
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">ERP • Contabilidad • Facturación</p>
            <h3 className="mt-3 text-base font-semibold text-gray-800">Registrar cuenta</h3>
          </div>

          {error && (
            <div className="mb-3 rounded-xl bg-red-50 border border-red-200 p-2" role="alert">
              <div className="flex items-start gap-2">
                <svg className="h-4 w-4 text-red-500 mt-0.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                <p className="text-xs text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Sección: Datos de la Empresa */}
            <div className="pt-2 pb-1">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Datos de la empresa</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="razonSocial" className="block text-xs font-medium text-gray-700 mb-0.5">Razón Social *</label>
                <input id="razonSocial" type="text" required
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="Ej: Distribuidora del Norte SRL"
                  value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} />
              </div>
              <div>
                <label htmlFor="rnc" className="block text-xs font-medium text-gray-700 mb-0.5">RNC</label>
                <input id="rnc" type="text" maxLength={11}
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="Sin guiones"
                  value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value.replace(/[^0-9]/g, '') })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="correoPrincipal" className="block text-xs font-medium text-gray-700 mb-0.5">Correo Principal *</label>
                <input id="correoPrincipal" type="email" required
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="contacto@empresa.com.do"
                  value={form.correoPrincipal} onChange={(e) => setForm({ ...form, correoPrincipal: e.target.value })} />
              </div>
              <div>
                <label htmlFor="telefono" className="block text-xs font-medium text-gray-700 mb-0.5">Teléfono</label>
                <input id="telefono" type="tel"
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="809-555-0101"
                  value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              </div>
            </div>

            {/* Sección: Usuario Administrador */}
            <div className="pt-2 pb-1">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Usuario administrador</h4>
            </div>

            <div>
              <label htmlFor="nombreCompletoAdmin" className="block text-xs font-medium text-gray-700 mb-0.5">Nombre Completo *</label>
              <input id="nombreCompletoAdmin" type="text" required
                className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                placeholder="Tu nombre completo"
                value={form.nombreCompletoAdmin} onChange={(e) => setForm({ ...form, nombreCompletoAdmin: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="emailAdmin" className="block text-xs font-medium text-gray-700 mb-0.5">Email de Acceso *</label>
                <input id="emailAdmin" type="email" required
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="admin@empresa.com.do"
                  value={form.emailAdmin} onChange={(e) => setForm({ ...form, emailAdmin: e.target.value })} />
              </div>
              <div>
                <label htmlFor="passwordAdmin" className="block text-xs font-medium text-gray-700 mb-0.5">Contraseña *</label>
                <div className="relative">
                  <input id="passwordAdmin" type={showPassword ? 'text' : 'password'} required minLength={6}
                    className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 pr-9 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                    placeholder="Mínimo 6 caracteres"
                    value={form.passwordAdmin} onChange={(e) => setForm({ ...form, passwordAdmin: e.target.value })} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      {showPassword
                        ? <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        : <><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></>
                      }
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Sección: Primera Empresa */}
            <div className="pt-2 pb-1">
              <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Primera empresa</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="nombreEmpresa" className="block text-xs font-medium text-gray-700 mb-0.5">Nombre Empresa *</label>
                <input id="nombreEmpresa" type="text" required
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="Ej: Sucursal Central"
                  value={form.nombreEmpresa} onChange={(e) => setForm({ ...form, nombreEmpresa: e.target.value })} />
              </div>
              <div>
                <label htmlFor="nombreBD" className="block text-xs font-medium text-gray-700 mb-0.5">Base de Datos *</label>
                <input id="nombreBD" type="text" required
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="Ej: TALLERBARAHONA"
                  value={form.nombreBD} onChange={(e) => setForm({ ...form, nombreBD: e.target.value })} />
              </div>
            </div>

            {/* ✅ Cadena de conexión eliminada - Se genera automáticamente */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="servidorBD" className="block text-xs font-medium text-gray-700 mb-0.5">Servidor BD</label>
                <input id="servidorBD" type="text"
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  value={form.servidorBD} onChange={(e) => setForm({ ...form, servidorBD: e.target.value })} />
              </div>
              <div>
                <label htmlFor="idPlan" className="block text-xs font-medium text-gray-700 mb-0.5">Plan *</label>
                <select id="idPlan" required
                  className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  value={form.idPlan} onChange={(e) => setForm({ ...form, idPlan: parseInt(e.target.value) })}>
                  <option value={1}>Plan Básico — RD$500/mes</option>
                  <option value={2}>Plan Premium — RD$1,200/mes</option>
                </select>
              </div>
            </div>

            {/* Botón submit */}
            <button type="submit" disabled={isLoading}
              className="flex w-full justify-center items-center rounded-xl h-10 text-sm font-bold text-white shadow-md bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 hover:scale-[1.01] hover:shadow-lg transition-all duration-200 disabled:opacity-50 mt-4">
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Registrando...
                </span>
              ) : 'Crear cuenta'}
            </button>
          </form>

          {/* Footer con enlace al login */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-gray-500">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-500">Iniciar sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}