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
// ─── Tipos para Registro de Cliente ───
export interface EmpresaRegistro {
  nombreEmpresa: string;
  nombreBD: string;
  servidorBD: string;
  connectionString: string;
  rncCedula?: string;
  esDefault: boolean;
}

export interface RegistrarClienteRequest {
  razonSocial: string;
  rnc?: string;
  correoPrincipal: string;
  telefono?: string;
  emailAdmin: string;
  passwordAdmin: string;
  nombreCompletoAdmin: string;
  idPlan: number;
  empresas: EmpresaRegistro[];
}

export interface RegistrarClienteResponse {
  idCliente: number;
  codigoCliente: string;
  idUsuarioCentral: number;
  idLicencia: number;
  idsEmpresas: number[];
  mensaje: string;
}
// Agregar tipo
export interface ValidarRegistroResponse {
  esValido: boolean;
  errores: string[];
}
export const authApi = {
  loginCentral: (email: string, password: string) =>
    apiClient.post<LoginCentralResponse>('/auth/login/central', { email, password }),

  seleccionarEmpresa: (idEmpresa: number) =>
    apiClient.post<SeleccionEmpresaResponse>('/auth/seleccionar-empresa', { idEmpresa }),

  loginEmpresa: (credentials: LoginEmpresaCredentials) =>
    apiClient.post<LoginEmpresaResponse>('/auth/login/empresa', credentials),

  registrarCliente: (data: RegistrarClienteRequest) =>
    apiClient.post<RegistrarClienteResponse>('/admin/registrar-cliente', data),

  // Agregar al objeto authApi
validarRegistro: (data: RegistrarClienteRequest) =>
  apiClient.post<ValidarRegistroResponse>('/admin/validar-registro', data),
};