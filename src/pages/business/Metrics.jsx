import React from 'react';
import Placeholder from '@/components/Placeholder';
import { BarChart3 } from 'lucide-react';

export default function Metrics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Métricas</h1>
        <p className="text-sm text-slate-500 mt-1">Analiza el rendimiento de tu asistente</p>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 min-h-[400px] flex items-center justify-center">
        <Placeholder title="Métricas y reportes" description="Aquí podrás ver métricas detalladas: conversaciones por día, tasa de calificación de leads, tiempos de respuesta, temas más consultados y más." icon={BarChart3} />
      </div>
    </div>
  );
}