import apiClient from './client';

export interface LoginCredentials {
  usuario: string;
  clave: string;
  idempresa: number;
}

export const authApi = {
  login: (credentials: LoginCredentials) => 
    apiClient.post('/auth/login', credentials),
};