// src/pages/dgii/ConsultaDgiiPage.tsx

import { useState } from 'react';
import DgiiRncLookup from '../../components/DgiiRncLookup';

export default function ConsultaDgiiPage() {
  const [tipo, setTipo] = useState<number>(1);
  const [tipoId, setTipoId] = useState<number>(1);
  const [ultimoResultado, setUltimoResultado] = useState<{
    razon_Social?: string;
    nombre_Comercial?: string;
    num_Documento?: string;
  } | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-6 px-4">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-indigo-700 rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-white">🏛️ Consulta DGII</h1>
            <p className="text-blue-100 text-xs">
              Consulta el Registro Nacional del Contribuyente de República Dominicana
            </p>
          </div>
        </div>

        {/* Selector de modo */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">📋 Modo de Consulta</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                Tipo de Persona
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
              >
                <option value={1}>Persona Jurídica</option>
                <option value={2}>Persona Física</option>
                <option value={3}>Consumidor Final</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                Tipo de Documento
              </label>
              <select
                value={tipoId}
                onChange={(e) => setTipoId(parseInt(e.target.value))}
                className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg"
              >
                <option value={1}>RNC</option>
                <option value={2}>Cédula</option>
                <option value={3}>Pasaporte</option>
                <option value={4}>ID Tributaria</option>
                <option value={5}>Sin Documento</option>
              </select>
            </div>
          </div>
        </div>

        {/* Componente DGII */}
        <DgiiRncLookup
          tipo={tipo}
          tipoId={tipoId}
          onFill={(data) => {
            setUltimoResultado(data);
          }}
        />

        {/* Historial de consultas (opcional) */}
        {ultimoResultado && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-emerald-800 mb-3">✅ Última Consulta</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2 bg-gray-50 rounded">
                <p className="text-[9px] text-gray-500 uppercase font-bold">RNC/Cédula</p>
                <p className="font-mono font-bold text-emerald-700">{ultimoResultado.num_Documento}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded">
                <p className="text-[9px] text-gray-500 uppercase font-bold">Nombre</p>
                <p className="font-semibold text-gray-900">{ultimoResultado.razon_Social}</p>
              </div>
              {ultimoResultado.nombre_Comercial && (
                <div className="col-span-2 p-2 bg-gray-50 rounded">
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Nombre Comercial</p>
                  <p className="text-gray-800">{ultimoResultado.nombre_Comercial}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}