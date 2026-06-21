import { create } from 'zustand';
import { authApi, type EmpresaDisponible } from '../api/auth.api';

// ─── Tipos ───
interface AuthUser {
  idusuario: number;
  idempresa: number;
  idacceso: number;
  nombreEmpleado: string;
  puesto: string;
  empresa: string;
  logo: string;
  idroles: number[];
}

type AuthStep = 'central' | 'select-company' | 'empresa' | 'authenticated';

interface AuthState {
  // Tokens por etapa
  centralToken: string | null;
  tenantToken: string | null;
  operativeToken: string | null;

  // Datos por etapa
  nombreCliente: string | null;
  empresas: EmpresaDisponible[];
  selectedEmpresa: EmpresaDisponible | null;
  user: AuthUser | null;

  // Estado UI
  step: AuthStep;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones - Paso 1
  loginCentral: (email: string, password: string) => Promise<void>;
  // Acciones - Paso 2
  selectEmpresa: (idEmpresa: number) => Promise<void>;
  // Acciones - Paso 3
  loginEmpresa: (usuario: string, clave: string) => Promise<void>;
  // Acciones - Generales
  logout: () => void;
  clearError: () => void;
  goBackToSelectCompany: () => void;
}

// ─── Helpers de persistencia ───
const STORAGE_KEYS = {
  centralToken: 'emma_central_token',
  tenantToken: 'emma_tenant_token',
  operativeToken: 'emma_token', // Mismo key que antes para compatibilidad con interceptor
  empresas: 'emma_empresas',
  selectedEmpresa: 'emma_selected_empresa',
  nombreCliente: 'emma_nombre_cliente',
  user: 'emma_user',
  step: 'emma_auth_step',
};

const getStoredStep = (): AuthStep => {
  const step = localStorage.getItem(STORAGE_KEYS.step) as AuthStep;
  return step || 'central';
};

export const useAuthStore = create<AuthState>((set, get) => ({
  // Estado inicial hidratado desde localStorage
  centralToken: localStorage.getItem(STORAGE_KEYS.centralToken),
  tenantToken: localStorage.getItem(STORAGE_KEYS.tenantToken),
  operativeToken: localStorage.getItem(STORAGE_KEYS.operativeToken),
  nombreCliente: localStorage.getItem(STORAGE_KEYS.nombreCliente),
  empresas: JSON.parse(localStorage.getItem(STORAGE_KEYS.empresas) || '[]'),
  selectedEmpresa: JSON.parse(localStorage.getItem(STORAGE_KEYS.selectedEmpresa) || 'null'),
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null'),
  step: getStoredStep(),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.operativeToken),
  isLoading: false,
  error: null,

  // ─── PASO 1: Login Central ───
  loginCentral: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.loginCentral(email, password);

      localStorage.setItem(STORAGE_KEYS.centralToken, data.token);
      localStorage.setItem(STORAGE_KEYS.empresas, JSON.stringify(data.empresas));
      localStorage.setItem(STORAGE_KEYS.nombreCliente, data.nombreCliente);

      // Si solo tiene una empresa, saltar selección automáticamente
      const nextStep = data.autoSeleccionar ? 'empresa' : 'select-company';
      const selectedEmpresa = data.autoSeleccionar ? data.empresas[0] : null;

      if (data.autoSeleccionar && selectedEmpresa) {
        localStorage.setItem(STORAGE_KEYS.selectedEmpresa, JSON.stringify(selectedEmpresa));
      }

      localStorage.setItem(STORAGE_KEYS.step, nextStep);

      set({
        centralToken: data.token,
        empresas: data.empresas,
        nombreCliente: data.nombreCliente,
        selectedEmpresa,
        step: nextStep,
        isLoading: false,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.backendMessage || 'Error al iniciar sesión';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  // ─── PASO 2: Seleccionar Empresa ───
  selectEmpresa: async (idEmpresa) => {
    const { centralToken } = get();
    if (!centralToken) throw new Error('Sesión central expirada');

    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.seleccionarEmpresa(idEmpresa);

      const empresa = get().empresas.find((e) => e.idEmpresa === idEmpresa) || null;

      localStorage.setItem(STORAGE_KEYS.tenantToken, data.token);
      localStorage.setItem(STORAGE_KEYS.selectedEmpresa, JSON.stringify(empresa));
      localStorage.setItem(STORAGE_KEYS.step, 'empresa');

      set({
        tenantToken: data.token,
        selectedEmpresa: empresa,
        step: 'empresa',
        isLoading: false,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.backendMessage || 'Error al seleccionar empresa';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  // ─── PASO 3: Login Empresa ───
  loginEmpresa: async (usuario, clave) => {
    const { selectedEmpresa } = get();
    if (!selectedEmpresa) throw new Error('No hay empresa seleccionada');

    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.loginEmpresa({
        usuario,
        clave,
        idempresa: selectedEmpresa.idEmpresa,
      });

      localStorage.setItem(STORAGE_KEYS.operativeToken, data.token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data));
      localStorage.setItem(STORAGE_KEYS.step, 'authenticated');

      set({
        operativeToken: data.token,
        user: data as unknown as AuthUser,
        isAuthenticated: true,
        step: 'authenticated',
        isLoading: false,
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.backendMessage || 'Credenciales inválidas';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  // ─── Logout completo ───
  logout: () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
    set({
      centralToken: null,
      tenantToken: null,
      operativeToken: null,
      nombreCliente: null,
      empresas: [],
      selectedEmpresa: null,
      user: null,
      step: 'central',
      isAuthenticated: false,
      error: null,
    });
  },

  // ─── Volver a selección de empresa ───
  goBackToSelectCompany: () => {
    localStorage.removeItem(STORAGE_KEYS.tenantToken);
    localStorage.removeItem(STORAGE_KEYS.operativeToken);
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.setItem(STORAGE_KEYS.step, 'select-company');

    set({
      tenantToken: null,
      operativeToken: null,
      user: null,
      isAuthenticated: false,
      step: 'select-company',
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));