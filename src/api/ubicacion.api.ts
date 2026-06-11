import apiClient from './client';
// DTOs para ubicación
export interface ProvinciaDto {
  idprovincia: number;
  provincia: string;
}

export interface MunicipioDto {
  idmunicipio: number;
  idprovincia: number;
  municipio: string;
}

export interface SectorDto {
  idsector: number;
  idmunicipio: number;
  sector: string;
}

export interface RutaDto {
  idruta: number;
  ruta: string;
  descripcion?: string;
}

// API de ubicación (provincias, municipios, sectores, rutas)
export const ubicacionApi = {
  getProvincias: () => apiClient.get<ProvinciaDto[]>('/ubicacion/provincias'),
  
  getMunicipios: (idProvincia: number) => 
    apiClient.get<MunicipioDto[]>(`/ubicacion/provincias/${idProvincia}/municipios`),
  
  getSectores: (idMunicipio: number) => 
    apiClient.get<SectorDto[]>(`/ubicacion/municipios/${idMunicipio}/sectores`),
  
  getRutas: () => 
    apiClient.get<RutaDto[]>(`/ubicacion/rutas`),
};