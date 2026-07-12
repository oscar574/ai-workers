import React from 'react';
import Placeholder from '@/components/Placeholder';
import { MessageSquare } from 'lucide-react';

export default function TestChat() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Chat de prueba</h1>
        <p className="text-sm text-slate-500 mt-1">Prueba tu asistente antes de publicarlo</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 min-h-[400px] flex items-center justify-center">
        <Placeholder title="Chat de prueba" description="Aquí podrás conversar con tu asistente IA para verificar sus respuestas, tono y flujo de calificación antes de conectarlo a WhatsApp o tu sitio web." icon={MessageSquare} />
      </div>
    </div>
  );
}