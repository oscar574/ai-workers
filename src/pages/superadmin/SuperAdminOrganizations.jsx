import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LogIn, Pause, Play, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateOrganizationDialog from '@/components/superadmin/CreateOrganizationDialog';
import EditLimitsDialog from '@/components/superadmin/EditLimitsDialog';

const INDUSTRIES = [
  { value: 'all', label: 'Todas las industrias' },
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'arquitectura', label: 'Arquitectura' },
  { value: 'consultorio', label: 'Consultorio' },
  { value: 'iglesia', label: 'Iglesia' },
  { value: 'generico', label: 'Genérico' }
];

export default function SuperAdminOrganizations() {
  const [orgs, setOrgs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editLimitsOrg, setEditLimitsOrg] = useState(null);
  const { startImpersonation, user } = useOrg();
  const navigate = useNavigate();

  const loadOrgs = async () => {
    try {
      setLoading(true);
      const [orgList, planList] = await Promise.all([
        base44.entities.Organization.list('-created_date', 500),
        base44.entities.SubscriptionPlan.list()
      ]);
      setOrgs(orgList);
      setPlans(planList);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadOrgs(); }, []);

  const planMap = {};
  plans.forEach(p => { planMap[p.id] = p.name; });

  const filtered = orgs.filter(o => {
    if (search && !o.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (industryFilter !== 'all' && o.industry !== industryFilter) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    return true;
  });

  const handleImpersonate = async (org) => {
    await startImpersonation(org.id);
    navigate('/app');
  };

  const handleToggleStatus = async (org) => {
    const newStatus = org.status === 'active' ? 'suspended' : 'active';
    await base44.entities.Organization.update(org.id, { status: newStatus });
    await base44.entities.AuditLog.create({
      organization_id: org.id, user_id: user?.id, user_email: user?.email,
      action: newStatus === 'suspended' ? 'organization_suspended' : 'organization_reactivated',
      entity_type: 'Organization', entity_id: org.id, details: { name: org.name }
    });
    loadOrgs();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizaciones</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} de {orgs.length} organizaciones</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-slate-900 hover:bg-slate-800">
          <Plus className="w-4 h-4 mr-1.5" /> Nueva organización
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre..." className="pl-9" />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="suspended">Suspendidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Organización</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Industria</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden lg:table-cell">Consumo</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(org => {
                const convPct = org.monthly_conversation_limit > 0 ? Math.round((org.current_conversation_usage || 0) / org.monthly_conversation_limit * 100) : 0;
                return (
                  <tr key={org.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs flex-shrink-0" style={{ backgroundColor: org.primary_color || '#4f46e5' }}>
                          {org.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{org.name}</p>
                          <p className="text-xs text-slate-400">{org.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 capitalize hidden md:table-cell">{org.industry}</td>
                    <td className="px-4 py-3">
                      <Badge variant={org.status === 'active' ? 'default' : 'secondary'} className={org.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-100'}>
                        {org.status === 'active' ? 'Activa' : 'Suspendida'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{planMap[org.plan_id] || '—'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${convPct > 80 ? 'bg-amber-500' : 'bg-slate-300'}`} style={{ width: `${Math.min(convPct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{convPct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleImpersonate(org)} title="Entrar como administrador" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900">
                          <LogIn className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditLimitsOrg(org)} title="Modificar límites" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900">
                          <Sliders className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(org)} title={org.status === 'active' ? 'Suspender' : 'Reactivar'} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900">
                          {org.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-sm text-slate-400">No se encontraron organizaciones</div>
        )}
      </div>

      <CreateOrganizationDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={loadOrgs} plans={plans} />
      <EditLimitsDialog org={editLimitsOrg} onClose={() => setEditLimitsOrg(null)} onSaved={loadOrgs} />
    </div>
  );
}