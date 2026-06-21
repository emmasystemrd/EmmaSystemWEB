import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import EmmaLogo from '../../components/shared/EmmaLogo';

export default function LoginEmpresaPage() {
  const navigate = useNavigate();
  const { loginEmpresa, selectedEmpresa, goBackToSelectCompany, isLoading, error, clearError, step } = useAuthStore();

  const [form, setForm] = useState({ usuario: '', clave: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Redirigir si no hay empresa seleccionada o ya está autenticado
  useEffect(() => {
    if (step === 'authenticated') navigate('/dashboard', { replace: true });
    if (step === 'central' || step === 'select-company') navigate('/login', { replace: true });
  }, [step, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await loginEmpresa(form.usuario, form.clave);
      navigate('/dashboard', { replace: true });
    } catch {
      // El error ya está en el store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-emerald-100 shadow-xl p-5">
        <div className="flex justify-center mb-3">
          <EmmaLogo className="h-10 w-auto" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-gray-900">Acceso a empresa</h2>
          <p className="text-xs text-gray-500 mt-1">{selectedEmpresa?.nombreEmpresa}</p>
        </div>

        {error && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-200 p-2">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="usuario" className="block text-xs font-medium text-gray-700 mb-0.5">Usuario</label>
            <input
              id="usuario"
              type="text"
              required
              autoComplete="username"
              className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="Ingresa tu usuario"
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="clave" className="block text-xs font-medium text-gray-700 mb-0.5">Contraseña</label>
            <div className="relative">
              <input
                id="clave"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className="block w-full rounded-xl border border-gray-300 py-1.5 px-3 pr-9 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                placeholder="Ingresa tu contraseña"
                value={form.clave}
                onChange={(e) => setForm({ ...form, clave: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  {showPassword ? (
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  ) : (
                    <>
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center items-center rounded-xl h-9 text-sm font-bold text-white shadow-md bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 hover:scale-[1.01] hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {isLoading ? 'Verificando...' : 'Iniciar sesión'}
          </button>
        </form>

        <button
          onClick={() => {
            goBackToSelectCompany();
            navigate('/select-company', { replace: true });
          }}
          className="mt-4 w-full text-xs font-medium text-gray-500 hover:text-emerald-600 transition"
        >
          ← Cambiar de empresa
        </button>
      </div>
    </div>
  );
}