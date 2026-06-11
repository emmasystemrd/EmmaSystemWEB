import { create } from 'zustand';
import apiClient from '../api/client';

// Tipado fuerte basado en tu LoginResponseDto del backend
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

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Acciones
  login: (usuario: string, clave: string, idempresa: number) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Estado inicial hidratado desde localStorage
  token: localStorage.getItem('emma_token'),
  user: JSON.parse(localStorage.getItem('emma_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('emma_token'),
  isLoading: false,
  error: null,

  login: async (usuario, clave, idempresa) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post('/auth/login', {
        usuario,
        clave,
        idempresa,
      });

      // Persistir en localStorage
      localStorage.setItem('emma_token', data.token);
      localStorage.setItem('emma_user', JSON.stringify(data));

      // Actualizar estado global
      set({
        token: data.token,
        user: data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al iniciar sesión';

      set({
        isLoading: false,
        error: message,
        token: null,
        user: null,
        isAuthenticated: false,
      });

      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('emma_token');
    localStorage.removeItem('emma_user');
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));