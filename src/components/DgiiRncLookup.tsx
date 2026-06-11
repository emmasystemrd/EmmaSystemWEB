import { useState } from 'react';
import { dgiiApi, type ContribuyenteDto, type RncRegistradoDto } from '../api/dgii.api';

interface Props {
  tipo: number;        // 1=Jurídica, 2=Física, 3=Consumidor Final
  tipoId: number;      // 1=RNC, 2=Cédula, 3=Pasaporte, 4=ID Tributaria, 5=Sin Doc
  onFill: (data: {
    razon_Social?: string;
    nombre_Comercial?: string;
    num_Documento?: string;
  }) => void;
}

type ConsultaMode = 'contribuyente' | 'registrado' | 'disabled';

export default function DgiiRncLookup({ tipo, tipoId, onFill }: Props) {
  const [rnc, setRnc] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultContribuyente, setResultContribuyente] = useState<ContribuyenteDto | null>(null);
  const [resultRegistrado, setResultRegistrado] = useState<RncRegistradoDto | null>(null);
  const [error, setError] = useState('');

  // 🎯 Determinar qué API usar según tipo y tipo_Id
  const getConsultaMode = (): ConsultaMode => {
    // Consumidor Final con Cédula → ConsultarRncRegistrado
    if (tipo === 3 && tipoId === 2) return 'registrado';
    
    // Persona Jurídica o Física con RNC o Cédula → ConsultarRncContribuyentes
    if ((tipo === 1 || tipo === 2) && (tipoId === 1 || tipoId === 2)) return 'contribuyente';
    
    // Otros casos (Pasaporte, Sin Documento, etc.) → Deshabilitado
    return 'disabled';
  };

  const mode = getConsultaMode();

  const handleConsultar = async () => {
    if (!rnc.trim() || mode === 'disabled') return;
    
    setLoading(true);
    setError('');
    setResultContribuyente(null);
    setResultRegistrado(null);
    
    try {
      if (mode === 'registrado') {
        // 📞 Consultar RNC Registrado (Consumidor Final con Cédula)
        const { data } = await dgiiApi.consultarRncRegistrado(rnc.trim());
        setResultRegistrado(data);
        
        onFill({
          razon_Social: data.nombre,
          nombre_Comercial: data.nombreComercial || undefined,
          num_Documento: data.rncOCedula,
        });
      } else {
        // 📞 Consultar Contribuyente (Jurídica/Física con RNC/Cédula)
        const { data } = await dgiiApi.consultarContribuyente(rnc.trim());
        setResultContribuyente(data);
        
        onFill({
          razon_Social: data.nombre,
          nombre_Comercial: data.nombreComercial || undefined,
          num_Documento: data.rncCedula,
        });
      }
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      
      if (status === 404) {
        setError(`No se encontró "${rnc}" en la DGII. Verifica el número.`);
      } else if (status === 500) {
        setError('Error del servidor DGII. Intenta más tarde.');
      } else {
        setError(msg || 'Error al consultar la DGII.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Si el modo está deshabilitado, no mostrar el componente
  if (mode === 'disabled') return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🏛️</span>
          <h4 className="text-xs font-bold text-blue-900 uppercase">Consulta DGII</h4>
        </div>
        
        {/* Badge del modo */}
        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
          mode === 'registrado' 
            ? 'bg-purple-100 text-purple-700' 
            : 'bg-blue-100 text-blue-700'
        }`}>
          {mode === 'registrado' ? '📋 RNC Registrado' : '🔍 Contribuyente'}
        </span>
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={rnc}
          onChange={(e) => setRnc(e.target.value)}
          placeholder={mode === 'registrado' 
            ? "Cédula (11 dígitos)" 
            : "RNC (9 dígitos) o Cédula (11 dígitos)"}
          maxLength={mode === 'registrado' ? 11 : 11}
          className="flex-1 px-2 py-1.5 text-xs border border-blue-200 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
          onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
        />
        <button
          type="button"
          onClick={handleConsultar}
          disabled={loading || !rnc.trim()}
          className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span className="hidden sm:inline">Consultando...</span>
            </>
          ) : (
            <>🔍 Consultar</>
          )}
        </button>
      </div>

      {/* Descripción del modo */}
      <p className="text-[10px] text-blue-700 italic">
        {mode === 'registrado' 
          ? '💡 Consulta básica para Consumidor Final con Cédula'
          : '💡 Consulta detallada para RNC/Cédula (Jurídica/Física)'}
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2">
          <p className="text-[10px] text-red-600">❌ {error}</p>
        </div>
      )}

      {/* Resultado: RNC Registrado */}
      {resultRegistrado && (
        <div className="bg-white rounded-lg p-2 text-[10px] space-y-0.5 border border-green-200">
          <p className="font-bold text-green-800 text-xs">✅ RNC Registrado encontrado</p>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div>
              <span className="font-semibold text-gray-700">Cédula:</span>{' '}
              <span className="text-gray-900">{resultRegistrado.rncOCedula}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Estado:</span>{' '}
              <span className="text-gray-900">{resultRegistrado.estado}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">Nombre:</span>{' '}
              <span className="text-gray-900">{resultRegistrado.nombre}</span>
            </div>
            {resultRegistrado.actividadEconomica && (
              <div className="col-span-2">
                <span className="font-semibold text-gray-700">Actividad:</span>{' '}
                <span className="text-gray-900">{resultRegistrado.actividadEconomica}</span>
              </div>
            )}
            {resultRegistrado.tipoContribuyente && (
              <div className="col-span-2">
                <span className="font-semibold text-gray-700">Tipo:</span>{' '}
                <span className="text-gray-900">{resultRegistrado.tipoContribuyente}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resultado: Contribuyente */}
      {resultContribuyente && (
        <div className="bg-white rounded-lg p-2 text-[10px] space-y-0.5 border border-green-200">
          <p className="font-bold text-green-800 text-xs">✅ Contribuyente encontrado</p>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <div>
              <span className="font-semibold text-gray-700">RNC/Cédula:</span>{' '}
              <span className="text-gray-900">{resultContribuyente.rncCedula}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">Estado:</span>{' '}
              <span className="text-gray-900">{resultContribuyente.estado}</span>
            </div>
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">Razón Social:</span>{' '}
              <span className="text-gray-900">{resultContribuyente.nombre}</span>
            </div>
            {resultContribuyente.nombreComercial && (
              <div className="col-span-2">
                <span className="font-semibold text-gray-700">Nombre Comercial:</span>{' '}
                <span className="text-gray-900">{resultContribuyente.nombreComercial}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="font-semibold text-gray-700">Categoría:</span>{' '}
              <span className="text-gray-900">{resultContribuyente.categoria || 'N/A'}</span>
            </div>
            {resultContribuyente.regimenPagos && (
              <div className="col-span-2">
                <span className="font-semibold text-gray-700">Régimen:</span>{' '}
                <span className="text-gray-900">{resultContribuyente.regimenPagos}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}