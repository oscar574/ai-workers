import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SuperAdminAudit() {
  const [logs, setLogs] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orgFilter, setOrgFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const [logList, orgList] = await Promise.all([
        base44.entities.AuditLog.list('-created_date', 200),
        base44.entities.Organization.list('-created_date', 500)
      ]);
      setLogs(logList);
      setOrgs(orgList);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const orgMap = {};
  orgs.forEach(o => { orgMap[o.id] = o.name; });

  const filtered = logs.filter(l => {
    if (orgFilter !== 'all' && l.organization_id !== orgFilter) return false;
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    return true;
  });

  const actionTypes = [...new Set(logs.map(l => l.action))];

  const formatAction = (action) => {
    const map = {
      organization_created: 'Organización creada',
      organization_suspended: 'Organización suspendida',
      organization_reactivated: 'Organización reactivada',
      invitation_accepted: 'Invitación aceptada',
      limits_changed: 'Límites modificados',
      plan_changed: 'Plan modificado',
      role_changed: 'Rol cambiado',
      assistant_activated: 'Asistente activado',
      assistant_paused: 'Asistente pausado',
      invitation_created: 'Invitación creada',
      user_deactivated: 'Usuario desactivado',
      user_invited: 'Usuario invitado'
    };
    return map[action] || action;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Auditoría</h1>
        <p className="text-sm text-slate-500 mt-1">{filtered.length} registros</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Todas las organizaciones" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las organizaciones</SelectItem>
            {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-56"><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {actionTypes.map(a => <SelectItem key={a} value={a}>{formatAction(a)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Acción</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Organización</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{log.created_date ? new Date(log.created_date).toLocaleString('es-MX') : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{log.user_email || '—'}</td>
                  <td className="px-4 py-3"><span className="font-medium text-slate-900">{formatAction(log.action)}</span></td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{orgMap[log.organization_id] || 'Plataforma'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{log.details ? JSON.stringify(log.details).slice(0, 80) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <div className="p-12 text-center text-sm text-slate-400">No hay registros de auditoría</div>}
      </div>
    </div>
  );
}