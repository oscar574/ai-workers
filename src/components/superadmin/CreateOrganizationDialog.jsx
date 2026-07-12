import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const INDUSTRIES = [
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'arquitectura', label: 'Arquitectura y construcción' },
  { value: 'consultorio', label: 'Consultorio' },
  { value: 'iglesia', label: 'Iglesia' },
  { value: 'generico', label: 'Negocio genérico' }
];

export default function CreateOrganizationDialog({ open, onClose, onCreated, plans }) {
  const [form, setForm] = useState({
    name: '', industry: 'generico', plan_id: '', owner_email: '', owner_name: '',
    website: '', phone: '', city: '', timezone: 'America/Mexico_City', primary_color: '#4f46e5'
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.name || !form.owner_email) { setError('Nombre y email del dueño son obligatorios'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await base44.functions.invoke('create-organization', form);
      onCreated && onCreated();
      setForm({ name: '', industry: 'generico', plan_id: '', owner_email: '', owner_name: '', website: '', phone: '', city: '', timezone: 'America/Mexico_City', primary_color: '#4f46e5' });
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Error al crear organización');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear organización</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Nombre del negocio *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Inmobiliaria Pérez" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Industria</Label>
              <Select value={form.industry} onValueChange={v => setForm({ ...form, industry: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Plan</Label>
              <Select value={form.plan_id} onValueChange={v => setForm({ ...form, plan_id: v })}>
                <SelectTrigger><SelectValue placeholder="Demo" /></SelectTrigger>
                <SelectContent>{plans.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email del dueño *</Label>
              <Input type="email" value={form.owner_email} onChange={e => setForm({ ...form, owner_email: e.target.value })} placeholder="admin@negocio.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Nombre del dueño</Label>
              <Input value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} placeholder="Juan Pérez" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Sitio web</Label><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+52..." /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Ciudad</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Monterrey" /></div>
            <div className="space-y-1.5"><Label>Zona horaria</Label><Input value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Color principal</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
              <Input value={form.primary_color} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Creando...' : 'Crear organización'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}