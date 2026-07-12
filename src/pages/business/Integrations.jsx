import React from 'react';
import Placeholder from '@/components/Placeholder';
import { Plug } from 'lucide-react';

export default function Integrations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integraciones</h1>
        <p className="text-sm text-slate-500 mt-1">Conecta tu asistente con tus canales</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 min-h-[400px] flex items-center justify-center">
        <Placeholder title="Integraciones" description="Próximamente podrás conectar tu asistente IA con WhatsApp, tu sitio web, Google Calendar, CRM y más canales para automatizar la atención a tus clientes." icon={Plug} />
      </div>
    </div>
  );
}