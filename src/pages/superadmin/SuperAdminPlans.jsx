import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', price: 0, conversation_limit: 0, message_limit: 0, knowledge_limit: 0, user_limit: 0, active: true });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setPlans(await base44.entities.SubscriptionPlan.list()); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name: '', price: 0, conversation_limit: 0, message_limit: 0, knowledge_limit: 0, user_limit: 0, active: true }); setEditing('new'); };
  const openEdit = (p) => { setForm(p); setEditing(p.id); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name: form.name, price: Number(form.price),
        conversation_limit: Number(form.conversation_limit), message_limit: Number(form.message_limit),
        knowledge_limit: Number(form.knowledge_limit), user_limit: Number(form.user_limit), active: form.active
      };
      if (editing === 'new') await base44.entities.SubscriptionPlan.create(data);
      else await base44.entities.SubscriptionPlan.update(editing, data);
      setEditing(null); load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planes de suscripción</h1>
          <p className="text-sm text-slate-500 mt-1">{plans.length} planes</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Nuevo plan</Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Plan</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Precio</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Conversaciones</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden sm:table-cell">Mensajes</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Conocimiento</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500 hidden md:table-cell">Usuarios</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Estado</th>
                <th className="text-right px-4 py-3 font-medium text-slate-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-slate-600">${p.price}</td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{p.conversation_limit}</td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{p.message_limit}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{p.knowledge_limit}</td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{p.user_limit}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.active ? 'default' : 'secondary'} className={p.active ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-100'}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing === 'new' ? 'Nuevo plan' : 'Editar plan'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Precio (MXN)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Usuarios</Label><Input type="number" value={form.user_limit} onChange={e => setForm({ ...form, user_limit: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Conversaciones</Label><Input type="number" value={form.conversation_limit} onChange={e => setForm({ ...form, conversation_limit: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Mensajes</Label><Input type="number" value={form.message_limit} onChange={e => setForm({ ...form, message_limit: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Conocimiento</Label><Input type="number" value={form.knowledge_limit} onChange={e => setForm({ ...form, knowledge_limit: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} /><Label>Activo</Label></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}