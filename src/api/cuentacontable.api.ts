import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// DTO
// ═══════════════════════════════════════════════════════════════

export interface CuentaContableDto {
  num_Cuenta: string;      // Código de la cuenta (ej: "112-01")
  nombre: string;          // Nombre de la cuenta
  descripcion?: string;
  grupo?: string;
  tipo?: string;           // 'D' = Detalle
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const cuentaContableApi = {
  /**
   * Busca cuentas contables por texto (en código, nombre, descripción, grupo)
   */
  buscar: (texto: string) =>
    apiClient.get<CuentaContableDto[]>(
      `/cliente/cuentas?texto=${encodeURIComponent(texto)}`
    ),

  /**
   * Obtiene todas las cuentas contables de tipo Detalle
   */
  getAll: () =>
    apiClient.get<CuentaContableDto[]>('/cliente/cuentas/todas'),
};