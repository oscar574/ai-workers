import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

export default function Plan() {
  const { effectiveOrg } = useOrg();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!effectiveOrg) return;
      try {
        if (effectiveOrg.plan_id) {
          setPlan(await base44.entities.SubscriptionPlan.get(effectiveOrg.plan_id));
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [effectiveOrg?.id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  const convUsage = effectiveOrg?.current_conversation_usage || 0;
  const convLimit = effectiveOrg?.monthly_conversation_limit || 0;
  const msgUsage = effectiveOrg?.current_message_usage || 0;
  const msgLimit = effectiveOrg?.monthly_message_limit || 0;
  const convPct = convLimit > 0 ? Math.round(convUsage / convLimit * 100) : 0;
  const msgPct = msgLimit > 0 ? Math.round(msgUsage / msgLimit * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Plan y consumo</h1>
        <p className="text-sm text-slate-500 mt-1">Tu suscripción actual y uso del periodo</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><CreditCard className="w-5 h-5" /></div>
            <div>
              <h3 className="font-semibold text-slate-900">{plan?.name || 'Sin plan'}</h3>
              <p className="text-sm text-slate-500">{plan ? `$${plan.price} MXN/mes` : 'Contacta al administrador'}</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Activo</Badge>
        </div>
        <p className="text-xs text-slate-400">Periodo iniciado: {effectiveOrg?.usage_period_start ? new Date(effectiveOrg.usage_period_start).toLocaleDateString('es-MX') : '—'}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
        <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Consumo del periodo</h3>
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Conversaciones</span>
            <span className="text-sm font-medium text-slate-900">{convUsage} / {convLimit}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${convPct > 80 ? 'bg-amber-500' : 'bg-slate-900'}`} style={{ width: `${Math.min(convPct, 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{convPct}% utilizado</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Mensajes</span>
            <span className="text-sm font-medium text-slate-900">{msgUsage} / {msgLimit}</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${msgPct > 80 ? 'bg-amber-500' : 'bg-slate-900'}`} style={{ width: `${Math.min(msgPct, 100)}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-1">{msgPct}% utilizado</p>
        </div>
      </div>

      {plan && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wide mb-4">Límites del plan</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Conversaciones/mes</span><span className="font-medium text-slate-900">{plan.conversation_limit}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Mensajes/mes</span><span className="font-medium text-slate-900">{plan.message_limit}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Elementos de conocimiento</span><span className="font-medium text-slate-900">{plan.knowledge_limit}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Usuarios</span><span className="font-medium text-slate-900">{plan.user_limit}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}