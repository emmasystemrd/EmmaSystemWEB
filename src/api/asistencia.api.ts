import apiClient from './client';

// ═══════════════════════════════════════════════════════════════
// DTOs
// ═══════════════════════════════════════════════════════════════

export interface EstudianteAsistenciaDto {
  iddetalle: number | null;
  idestudiante: number;
  codigo: string;
  estudiante: string;
  asistencia: string; // "P", "A", "E", "T", "M", "N" o ""
}

export interface DetalleAsistenciaSaveDto {
  iddetalle: number;
  idestudiante: number;
  asistencia: string;
}

export interface AsistenciaSaveDto {
  idAsistencia: number | null;
  fecha: string;
  idcurso: number;
  iddetalle_Curso: number | null;
  idlogin?: number;
  idinstructor: number;
  detalles: DetalleAsistenciaSaveDto[];
}

export interface AsistenciaMatrixDto {
  estudiante: string;
  sexo: string;
  edad: number;
  telefono: string;
  dia_1: string | null;
  dia_2: string | null;
  dia_3: string | null;
  dia_4: string | null;
  dia_5: string | null;
  dia_6: string | null;
  dia_7: string | null;
  dia_8: string | null;
  dia_9: string | null;
  dia_10: string | null;
  dia_11: string | null;
  dia_12: string | null;
  dia_13: string | null;
  dia_14: string | null;
  dia_15: string | null;
  dia_16: string | null;
  dia_17: string | null;
  dia_18: string | null;
  dia_19: string | null;
  dia_20: string | null;
  dia_21: string | null;
  dia_22: string | null;
  dia_23: string | null;
  dia_24: string | null;
  dia_25: string | null;
  dia_26: string | null;
  dia_27: string | null;
  dia_28: string | null;
  dia_29: string | null;
  dia_30: string | null;
  dia_31: string | null;
}

// ═══════════════════════════════════════════════════════════════
// API CLIENT
// ═══════════════════════════════════════════════════════════════

export const asistenciaApi = {
  getEstudiantes: (params: {
    idAsistencia: number;
    fecha: string;
    idCurso: number;
    idDetalleCurso: number | null;
    idInstructor: number;
  }) => {
    const query = new URLSearchParams({
      idAsistencia: String(params.idAsistencia),
      fecha: params.fecha,
      idCurso: String(params.idCurso),
      idInstructor: String(params.idInstructor),
    });
    if (params.idDetalleCurso) {
      query.append('idDetalleCurso', String(params.idDetalleCurso));
    }
    return apiClient.get<EstudianteAsistenciaDto[]>(`/asistencias/estudiantes?${query.toString()}`);
  },

  saveAsistencia: (data: AsistenciaSaveDto) =>
    apiClient.post<{ idAsistencia: number; message: string }>('/asistencias', data),

  getMatrix: (params: {
    fecha1: string;
    fecha2: string;
    idCurso: number;
    idDetalleCurso: number | null;
    idInstructor: number;
  }) => {
    const query = new URLSearchParams({
      fecha1: params.fecha1,
      fecha2: params.fecha2,
      idCurso: String(params.idCurso),
      idInstructor: String(params.idInstructor),
    });
    if (params.idDetalleCurso) {
      query.append('idDetalleCurso', String(params.idDetalleCurso));
    }
    return apiClient.get<AsistenciaMatrixDto[]>(`/asistencias/matrix?${query.toString()}`);
  },
};