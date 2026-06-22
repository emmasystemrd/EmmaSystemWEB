import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import EmmaLogo from '../../components/shared/EmmaLogo';

export default function SelectCompanyPage() {
  const navigate = useNavigate();
  // ✅ Agregar logout a las acciones del store
  const { empresas, nombreCliente, selectEmpresa, isLoading, error, clearError, step, logout } = useAuthStore();

  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Redirigir si ya pasó esta etapa
  useEffect(() => {
    if (step === 'authenticated') navigate('/dashboard', { replace: true });
    if (step === 'empresa') navigate('/login-empresa', { replace: true });
    if (step === 'central') navigate('/login', { replace: true });
  }, [step, navigate]);

  const handleSelect = async () => {
    if (selectedId === null) return;
    clearError();
    try {
      await selectEmpresa(selectedId);
      navigate('/login-empresa', { replace: true });
    } catch {
      // El error ya está en el store
    }
  };

  // ✅ Acción para volver al login central limpiando todo
  const handleBackToLogin = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-emerald-100 shadow-xl p-6">
        <div className="flex justify-center mb-4">
          <EmmaLogo className="h-12 w-auto" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Selecciona tu empresa</h2>
          <p className="text-sm text-gray-500 mt-1">
            Bienvenido, <span className="font-semibold text-gray-700">{nombreCliente}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3">
            <p className="text-xs text-red-700 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {empresas.map((empresa) => (
            <button
              key={empresa.idEmpresa}
              onClick={() => setSelectedId(empresa.idEmpresa)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selectedId === empresa.idEmpresa
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  selectedId === empresa.idEmpresa ? 'border-emerald-500' : 'border-gray-300'
                }`}
              >
                {selectedId === empresa.idEmpresa && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{empresa.nombreEmpresa}</p>
                {empresa.esDefault && (
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Predeterminada
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleSelect}
          disabled={selectedId === null || isLoading}
          className="mt-6 flex w-full justify-center items-center rounded-xl h-10 text-sm font-bold text-white shadow-md bg-gradient-to-r from-emerald-500 via-amber-500 to-orange-500 hover:scale-[1.01] hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
        >
          {isLoading ? 'Conectando...' : 'Continuar'}
        </button>

        {/* ✅ Botón para volver al Login Central */}
        <button
          type="button"
          onClick={handleBackToLogin}
          disabled={isLoading}
          className="mt-3 flex w-full justify-center items-center rounded-xl h-9 text-xs font-medium text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-800 transition-all duration-200 disabled:opacity-50"
        >
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}