import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/StatCard';
import { Building2, Bot, MessageSquare, Mail, Users, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [nearLimit, setNearLimit] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [orgs, employees, leads] = await Promise.all([
          base44.entities.Organization.list('-created_date', 500),
          base44.entities.AIEmployee.list('-created_date', 500),
          base44.entities.Lead.list('-created_date', 500)
        ]);
        const activeOrgs = orgs.filter(o => o.status === 'active');
        const activeAssistants = employees.filter(e => e.status === 'active');
        const totalConv = orgs.reduce((s, o) => s + (o.current_conversation_usage || 0), 0);
        const totalMsg = orgs.reduce((s, o) => s + (o.current_message_usage || 0), 0);
        const near = orgs.filter(o => {
          if (o.status !== 'active') return false;
          const convPct = o.monthly_conversation_limit > 0 ? (o.current_conversation_usage || 0) / o.monthly_conversation_limit : 0;
          const msgPct = o.monthly_message_limit > 0 ? (o.current_message_usage || 0) / o.monthly_message_limit : 0;
          return Math.max(convPct, msgPct) > 0.8;
        });
        setStats({
          activeOrgs: activeOrgs.length,
          activeAssistants: activeAssistants.length,
          totalConv, totalMsg,
          totalLeads: leads.length
        });
        setNearLimit(near);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen general de la plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Organizaciones activas" value={stats?.activeOrgs ?? 0} icon={Building2} />
        <StatCard label="Asistentes activos" value={stats?.activeAssistants ?? 0} icon={Bot} />
        <StatCard label="Conversaciones del mes" value={stats?.totalConv ?? 0} icon={MessageSquare} />
        <StatCard label="Mensajes del mes" value={stats?.totalMsg ?? 0} icon={Mail} />
        <StatCard label="Leads generados" value={stats?.totalLeads ?? 0} icon={Users} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-slate-900">Organizaciones cerca del límite</h2>
          </div>
          <button onClick={() => navigate('/superadmin/organizations')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
            Ver todas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {nearLimit.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
            No hay organizaciones cerca del límite de consumo
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Organización</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Conversaciones</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Mensajes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nearLimit.map(org => {
                  const convPct = org.monthly_conversation_limit > 0 ? Math.round((org.current_conversation_usage || 0) / org.monthly_conversation_limit * 100) : 0;
                  const msgPct = org.monthly_message_limit > 0 ? Math.round((org.current_message_usage || 0) / org.monthly_message_limit * 100) : 0;
                  return (
                    <tr key={org.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate('/superadmin/organizations')}>
                      <td className="px-4 py-3 font-medium text-slate-900">{org.name}</td>
                      <td className="px-4 py-3"><span className={convPct > 80 ? 'text-amber-600 font-medium' : 'text-slate-600'}>{org.current_conversation_usage || 0}/{org.monthly_conversation_limit} ({convPct}%)</span></td>
                      <td className="px-4 py-3"><span className={msgPct > 80 ? 'text-amber-600 font-medium' : 'text-slate-600'}>{org.current_message_usage || 0}/{org.monthly_message_limit} ({msgPct}%)</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}