import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/StatCard';
import { MessageSquare, Mail, Bot, Users, ArrowRight, Settings } from 'lucide-react';

export default function BusinessHome() {
  const { effectiveOrg } = useOrg();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [teamCount, setTeamCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!effectiveOrg) return;
      try {
        const [emps, team] = await Promise.all([
          base44.entities.AIEmployee.filter({ organization_id: effectiveOrg.id }),
          base44.entities.OrganizationUser.filter({ organization_id: effectiveOrg.id, status: 'active' })
        ]);
        setEmployee(emps[0] || null);
        setTeamCount(team.length);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [effectiveOrg?.id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  const convPct = effectiveOrg?.monthly_conversation_limit > 0 ? Math.round((effectiveOrg?.current_conversation_usage || 0) / effectiveOrg.monthly_conversation_limit * 100) : 0;
  const msgPct = effectiveOrg?.monthly_message_limit > 0 ? Math.round((effectiveOrg?.current_message_usage || 0) / effectiveOrg.monthly_message_limit * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{effectiveOrg?.name}</h1>
        <p className="text-sm text-slate-500 mt-1 capitalize">{effectiveOrg?.industry} · {effectiveOrg?.city || 'Sin ciudad'}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Conversaciones" value={`${effectiveOrg?.current_conversation_usage || 0} / ${effectiveOrg?.monthly_conversation_limit || 0}`} sublabel={`${convPct}% usado`} icon={MessageSquare} />
        <StatCard label="Mensajes" value={`${effectiveOrg?.current_message_usage || 0} / ${effectiveOrg?.monthly_message_limit || 0}`} sublabel={`${msgPct}% usado`} icon={Mail} />
        <StatCard label="Asistente IA" value={employee?.status === 'active' ? 'Activo' : employee?.status === 'paused' ? 'Pausado' : 'Borrador'} icon={Bot} />
        <StatCard label="Equipo" value={teamCount} sublabel="Usuarios activos" icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Asistente IA</h3>
            <button onClick={() => navigate('/app/assistant')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">Configurar <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
          {employee ? (
            <div className="space-y-2">
              <p className="text-sm text-slate-600"><span className="text-slate-400">Nombre:</span> {employee.name}</p>
              <p className="text-sm text-slate-600"><span className="text-slate-400">Rol:</span> {employee.role || '—'}</p>
              <p className="text-sm text-slate-600"><span className="text-slate-400">Objetivo:</span> {employee.primary_goal || '—'}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">No hay asistente configurado</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Configuración</h3>
            <button onClick={() => navigate('/app/settings')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">Editar <Settings className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-slate-600"><span className="text-slate-400">Teléfono:</span> {effectiveOrg?.phone || '—'}</p>
            <p className="text-sm text-slate-600"><span className="text-slate-400">Sitio web:</span> {effectiveOrg?.website || '—'}</p>
            <p className="text-sm text-slate-600"><span className="text-slate-400">Zona horaria:</span> {effectiveOrg?.timezone || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}