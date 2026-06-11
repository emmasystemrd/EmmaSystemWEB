import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// TIPOS (DTOs)
// ═══════════════════════════════════════════════════════════════

export interface ContribuyenteDto {
  rncCedula: string;
  nombre: string;
  nombreComercial: string;
  categoria: string;
  estado: string;
  tipoContribuyente: string;
  regimenPagos: string;
}

export interface RncRegistradoDto {
  rncOCedula: string;
  nombre: string;
  nombreComercial: string;
  actividadEconomica: string;
  tipoContribuyente: string;
  estado: string;
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const dgiiApi = {
  /**
   * Consulta detallada de contribuyente (RNC/Cédula)
   * Usar para: Persona Jurídica o Persona Física con RNC/Cédula
   */
  consultarContribuyente: (rncOCedula: string) =>
    apiClient.get<ContribuyenteDto>(`/dgii/contribuyente/${encodeURIComponent(rncOCedula)}`),

  /**
   * Consulta básica de RNC registrado
   * Usar para: Consumidor Final con Cédula
   */
  consultarRncRegistrado: (rncOCedula: string) =>
    apiClient.get<RncRegistradoDto>(`/dgii/rnc-registrado/${encodeURIComponent(rncOCedula)}`),
};