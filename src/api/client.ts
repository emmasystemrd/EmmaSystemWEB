import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';

// Creamos una instancia de Axios configurada para EmmaSystem
const apiClient = axios.create({
  baseURL: '/api', // Usa el proxy de Vite (redirige a localhost:7152)
  timeout: 30000,  // 30 segundos de espera máxima
  headers: { 
    'Content-Type': 'application/json' 
  },
});

// 🔑 INTERCEPTOR DE PETICIONES (REQUEST)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('emma_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Error en request:', error);
    return Promise.reject(error);
  }
);

// 🔑 INTERCEPTOR DE RESPUESTAS (RESPONSE)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  
  (error: AxiosError) => {
    // 🔍 Log detallado para depuración
    console.error('📡 Error del backend:', {
      status: error.response?.status,
      data: error.response?.data,
    });

    // Manejo de 401 (Sesión expirada)
    if (error.response?.status === 401) {
      console.warn('⚠️ Sesión expirada. Redirigiendo a login...');
      localStorage.removeItem('emma_token');
      localStorage.removeItem('emma_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Preservar mensaje del backend para el frontend
    if (error.response?.data) {
      const backendData = error.response.data as Record<string, any>;
      if (backendData.message || backendData.error) {
        (error as any).backendMessage = backendData.message || backendData.error;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;