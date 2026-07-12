import React from 'react';
import Placeholder from '@/components/Placeholder';
import { Hand } from 'lucide-react';

export default function HumanRequests() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Solicitudes humanas</h1>
        <p className="text-sm text-slate-500 mt-1">Transferencias de conversaciones a tu equipo</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 min-h-[400px] flex items-center justify-center">
        <Placeholder title="Solicitudes de transferencia" description="Cuando tu asistente no pueda resolver una consulta, generará una solicitud de transferencia humana que aparecerá aquí para que tu equipo la atienda." icon={Hand} />
      </div>
    </div>
  );
}