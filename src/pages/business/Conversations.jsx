import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Badge } from '@/components/ui/badge';
import { MessagesSquare } from 'lucide-react';

const statusConfig = {
  open: { label: 'Abierta', class: 'bg-green-100 text-green-700 hover:bg-green-100' },
  closed: { label: 'Cerrada', class: 'bg-slate-100 text-slate-500 hover:bg-slate-100' },
  expired: { label: 'Expirada', class: 'bg-red-100 text-red-600 hover:bg-red-100' }
};

export default function Conversations() {
  const { effectiveOrg } = useOrg();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!effectiveOrg) return;
      try { setConversations(await base44.entities.Conversation.filter({ organization_id: effectiveOrg.id }, '-created_date', 50)); }
      catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [effectiveOrg?.id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Conversaciones</h1>
        <p className="text-sm text-slate-500 mt-1">{conversations.length} conversaciones</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {conversations.length === 0 ? (
          <div className="p-12 text-center">
            <MessagesSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Aún no hay conversaciones. Cuando tu asistente comience a atender prospectos, las conversaciones aparecerán aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Canal</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Transferencia</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Resumen</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Inicio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conversations.map(conv => (
                  <tr key={conv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900 capitalize">{conv.channel?.replace('_', ' ') || '—'}</td>
                    <td className="px-4 py-3"><Badge className={statusConfig[conv.status]?.class || statusConfig.closed.class}>{statusConfig[conv.status]?.label || 'Cerrada'}</Badge></td>
                    <td className="px-4 py-3 hidden sm:table-cell">{conv.human_handoff_required ? <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Requerida</Badge> : <span className="text-slate-400">No</span>}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden md:table-cell max-w-xs truncate">{conv.summary || '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{conv.created_date ? new Date(conv.created_date).toLocaleDateString('es-MX') : '—'}</td>
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