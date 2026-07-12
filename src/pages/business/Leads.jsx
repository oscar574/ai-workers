import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const statusConfig = {
  unqualified: { label: 'No calificado', class: 'bg-slate-100 text-slate-500 hover:bg-slate-100' },
  in_progress: { label: 'En progreso', class: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  qualified: { label: 'Calificado', class: 'bg-green-100 text-green-700 hover:bg-green-100' }
};

export default function Leads() {
  const { effectiveOrg } = useOrg();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!effectiveOrg) return;
      try { setLeads(await base44.entities.Lead.filter({ organization_id: effectiveOrg.id }, '-created_date', 50)); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [effectiveOrg?.id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
        <p className="text-sm text-slate-500 mt-1">{leads.length} leads</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Aún no hay leads. Cuando tu asistente comience a atender conversaciones, los leads calificados aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Interés</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Ubicación</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Presupuesto</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{lead.service_interest || lead.intent || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{lead.location || '—'}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{lead.budget || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusConfig[lead.qualification_status]?.class || statusConfig.unqualified.class}>
                        {statusConfig[lead.qualification_status]?.label || 'No calificado'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{lead.created_date ? new Date(lead.created_date).toLocaleDateString('es-MX') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}