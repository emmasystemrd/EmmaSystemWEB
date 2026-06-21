import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import EmmaLogo from '../../components/shared/EmmaLogo';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginCentral, isLoading, error, clearError, step } = useAuthStore();

  const [form, setForm] = useState({
    usuario: '',
    clave: '',
    recordarme: false,
  });

  const [showPassword, setShowPassword] = useState(false);

  // Redirigir si ya pasó la etapa de login central
  useEffect(() => {
    if (step === 'select-company') {
      navigate('/select-company', { replace: true });
    } else if (step === 'empresa') {
      navigate('/login-empresa', { replace: true });
    } else if (step === 'authenticated') {
      navigate('/dashboard', { replace: true });
    }
  }, [step, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      // Mapear campos del formulario a los parámetros de loginCentral
      // El backend espera email/password, usamos los mismos campos del form
      await loginCentral(form.usuario, form.clave);
      // La redirección la maneja el useEffect basado en el step del store
    } catch {
      // El error ya está en el store
    }
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50">
      {/* Panel izquierdo: Branding (oculto en móvil) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 flex-col justify-center items-center p-6 relative overflow-hidden">
        {/* Fondo decorativo */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-48 h-48 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative z-10 max-w-md w-full space-y-4">
          <div className="flex justify-center">
            <EmmaLogo className="h-14 w-auto drop-shadow-md" />
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-xl font-bold text-gray-900">Bienvenido a EmmaSystem</h1>
            <div className="grid grid-cols-3 gap-2 pt-4">
              <div className="bg-white/70 rounded-xl p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-emerald-600">+500</div>
                <div className="text-[10px] text-gray-600">Empresas</div>
              </div>
              <div className="bg-white/70 rounded-xl p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-orange-500">+1M</div>
                <div className="text-[10px] text-gray-600">Facturas</div>
              </div>
              <div className="bg-white/70 rounded-xl p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-amber-500">24/7</div>
                <div className="text-[10px] text-gray-600">Disponible</div>
              </div>
            </div>
          </div>

          {/* Características compactas */}
          <div className="space-y-1">
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900">Facturación Electrónica</h3>
                <p className="text-[10px] text-gray-600">Cumple con Ley 32-23</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900">Seguridad avanzada</h3>
                <p className="text-[10px] text-gray-600">Protegemos tu información</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900">Acceso 24/7</h3>
                <p className="text-[10px] text-gray-600">Desde cualquier lugar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel derecho: Formulario de login compacto */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="w-full max-w-sm mx-auto bg-white rounded-2xl border border-emerald-100 shadow-xl p-5">
          {/* Logo móvil */}
          <div className="lg:hidden flex justify-center mb-3">
            <EmmaLogo className="h-10 w-auto" />
          </div>

          {/* Encabezado */}
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black">
              <span className="bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                EmmaSystem
              </span>
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">ERP • Contabilidad • Facturación</p>
            <h3 className="mt-3 text-base font-semibold text-gray-800">Iniciar sesión</h3>
          </div>

          {/* Mensaje de error compacto */}
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
            {/* Usuario / Email */}
            <div>
              <label htmlFor="usuario" className="block text-xs font-medium text-gray-700 mb-0.5">Usuario o Email</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="usuario"
                  type="text"
                  required
                  autoComplete="username"
                  className="block w-full rounded-xl border border-gray-300 py-1.5 pl-8 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="Ingresa tu usuario o email"
                  value={form.usuario}
                  onChange={(e) => setForm({ ...form, usuario: e.target.value })}
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="clave" className="block text-xs font-medium text-gray-700 mb-0.5">Contraseña</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                  <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="clave"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="block w-full rounded-xl border border-gray-300 py-1.5 pl-8 pr-9 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                  placeholder="Ingresa tu contraseña"
                  value={form.clave}
                  onChange={(e) => setForm({ ...form, clave: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Recordarme y olvidé contraseña */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="recordarme"
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={form.recordarme}
                  onChange={(e) => setForm({ ...form, recordarme: e.target.checked })}
                />
                <label htmlFor="recordarme" className="ml-1.5 block text-xs text-gray-700">Recordarme</label>
              </div>
              <a href="#" className="text-xs font-medium text-emerald-600 hover:text-emerald-500">¿Olvidaste tu contraseña?</a>
            </div>

            {/* Botón submit compacto */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center items-center rounded-xl h-9 text-sm font-bold text-white shadow-md bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 hover:scale-[1.01] hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-1">
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Conectando...
                </span>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">o</span>
            </div>
          </div>

          {/* Botón Google compacto */}
          <button
            type="button"
            className="flex w-full justify-center items-center gap-2 rounded-xl border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-1 focus:ring-emerald-500 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuar con Google
          </button>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-gray-500">
              ¿No tienes una cuenta?{' '}
              <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">Contáctanos</a>
            </p>
          </div>
        </div>
      </div>

      {/* Copyright centrado inferior */}
      <div className="absolute bottom-1 left-0 right-0 flex justify-center z-50 pointer-events-none">
        <p className="text-[10px] text-gray-500 bg-white/80 px-3 py-0.5 rounded-full backdrop-blur-sm shadow-sm">
          © 2026 EmmaSystem ERP | Contabilidad • Inventario • Facturación Electrónica
        </p>
      </div>
    </div>
  );
}