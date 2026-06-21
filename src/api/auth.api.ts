import apiClient from './client';

// ─── Tipos para Login Central ───
export interface EmpresaDisponible {
  idEmpresa: number;
  nombreEmpresa: string;
  esDefault: boolean;
}

export interface LoginCentralResponse {
  token: string;
  nombreCliente: string;
  empresas: EmpresaDisponible[];
  expiresAt: string;
  autoSeleccionar: boolean;
}

// ─── Tipos para Seleccionar Empresa ───
export interface SeleccionEmpresaResponse {
  token: string;
  idEmpresa: number;
  nombreEmpresa: string;
  clienteId: number;
  expiresAt: string;
}

// ─── Tipos para Login Empresa ───
export interface LoginEmpresaCredentials {
  usuario: string;
  clave: string;
  idempresa: number;
}

export interface LoginEmpresaResponse {
  token: string;
  idEmpresa: number;
  nombreEmpresa: string;
  clienteId: number;
  expiresAt: string;
}

export const authApi = {
  loginCentral: (email: string, password: string) =>
    apiClient.post<LoginCentralResponse>('/auth/login/central', { email, password }),

  seleccionarEmpresa: (idEmpresa: number) =>
    apiClient.post<SeleccionEmpresaResponse>('/auth/seleccionar-empresa', { idEmpresa }),

  loginEmpresa: (credentials: LoginEmpresaCredentials) =>
    apiClient.post<LoginEmpresaResponse>('/auth/login/empresa', credentials),
};