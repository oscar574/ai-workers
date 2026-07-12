import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UserPlus, Copy, Check, Pause, Mail } from 'lucide-react';

const roleLabels = {
  organization_admin: 'Administrador',
  agent: 'Agente',
  viewer: 'Lectura'
};

export default function Team() {
  const { effectiveOrg, user, isImpersonating } = useOrg();
  const orgPayload = isImpersonating && effectiveOrg ? { organization_id: effectiveOrg.id } : {};
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const load = async () => {
    if (!effectiveOrg) return;
    try {
      const [m, i] = await Promise.all([
        base44.entities.OrganizationUser.filter({ organization_id: effectiveOrg.id }),
        base44.entities.Invitation.filter({ organization_id: effectiveOrg.id, status: 'pending' })
      ]);
      setMembers(m);
      setInvitations(i);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [effectiveOrg?.id]);

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError('');
    try {
      const res = await base44.functions.invoke('create-invitation', { email: inviteEmail, role: inviteRole, ...orgPayload });
      setInviteLink(res.data.link);
      load();
    } catch (e) {
      setInviteError(e.response?.data?.error || e.message || 'Error al crear invitación');
    } finally { setInviting(false); }
  };

  const handleDeactivate = async (member) => {
    if (!confirm(`¿Desactivar a ${member.user_name || member.user_email}?`)) return;
    await base44.entities.OrganizationUser.update(member.id, { status: 'inactive' });
    try {
      await base44.functions.invoke('save-audit-log', {
        organization_id: effectiveOrg.id,
        action: 'user_deactivated', entity_type: 'OrganizationUser', entity_id: member.id,
        details: { email: member.user_email }
      });
    } catch (e) { console.error(e); }
    load();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipo</h1>
          <p className="text-sm text-slate-500 mt-1">{members.filter(m => m.status === 'active').length} miembros activos</p>
        </div>
        <Button onClick={() => { setShowInvite(true); setInviteLink(''); setInviteEmail(''); setInviteError(''); }} className="bg-slate-900 hover:bg-slate-800">
          <UserPlus className="w-4 h-4 mr-1.5" /> Invitar
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Usuario</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-medium text-xs">
                        {(m.user_name || m.user_email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{m.user_name || m.user_email}</p>
                        <p className="text-xs text-slate-400">{m.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">{roleLabels[m.role] || m.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={m.status === 'active' ? 'default' : 'secondary'} className={m.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-100'}>
                      {m.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.user_id !== user?.id && m.status === 'active' && (
                      <button onClick={() => handleDeactivate(m)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900"><Pause className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {members.length === 0 && <div className="p-12 text-center text-sm text-slate-400">No hay miembros en el equipo</div>}
      </div>

      {invitations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Invitaciones pendientes</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Rol</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Expira</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-900">{inv.email}</td>
                    <td className="px-4 py-3"><Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100">{roleLabels[inv.role] || inv.role}</Badge></td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">{inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('es-MX') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Invitar al equipo</DialogTitle></DialogHeader>
          {!inviteLink ? (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colega@negocio.com" /></div>
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organization_admin">Administrador</SelectItem>
                    <SelectItem value="agent">Agente</SelectItem>
                    <SelectItem value="viewer">Lectura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInvite(false)}>Cancelar</Button>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail} className="bg-slate-900 hover:bg-slate-800">{inviting ? 'Enviando...' : 'Enviar invitación'}</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 text-sm text-green-600"><Check className="w-4 h-4" /> Invitación creada. Comparte este enlace:</div>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="text-xs" />
                <Button onClick={copyLink} variant="outline" size="icon">{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> También enviamos un correo a {inviteEmail}</p>
              <DialogFooter><Button onClick={() => setShowInvite(false)} className="bg-slate-900 hover:bg-slate-800">Listo</Button></DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}