import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';

const INDUSTRIES = [
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'arquitectura', label: 'Arquitectura y construcción' },
  { value: 'consultorio', label: 'Consultorio' },
  { value: 'iglesia', label: 'Iglesia' },
  { value: 'generico', label: 'Negocio genérico' }
];

export default function Settings() {
  const { effectiveOrg, reload } = useOrg();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (effectiveOrg) {
      setForm({
        name: effectiveOrg.name || '', industry: effectiveOrg.industry || 'generico',
        website: effectiveOrg.website || '', phone: effectiveOrg.phone || '',
        city: effectiveOrg.city || '', timezone: effectiveOrg.timezone || 'America/Mexico_City',
        logo_url: effectiveOrg.logo_url || '', primary_color: effectiveOrg.primary_color || '#4f46e5'
      });
    }
  }, [effectiveOrg?.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await base44.functions.invoke('update-organization-settings', form);
      setSaved(true);
      reload();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.response?.data?.error || e.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  if (!effectiveOrg) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="text-sm text-slate-500 mt-1">Datos de tu organización</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="space-y-1.5"><Label>Nombre del negocio</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Industria</Label>
            <Select value={form.industry} onValueChange={v => setForm({ ...form, industry: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Ciudad</Label><Input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Teléfono</Label><Input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Sitio web</Label><Input value={form.website || ''} onChange={e => setForm({ ...form, website: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5"><Label>Zona horaria</Label><Input value={form.timezone || ''} onChange={e => setForm({ ...form, timezone: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>URL del logo</Label><Input value={form.logo_url || ''} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
        <div className="space-y-1.5">
          <Label>Color principal</Label>
          <div className="flex items-center gap-2">
            <input type="color" value={form.primary_color || '#4f46e5'} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
            <Input value={form.primary_color || ''} onChange={e => setForm({ ...form, primary_color: e.target.value })} className="flex-1" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
        {saved && <span className="text-sm text-green-600">✓ Cambios guardados</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  );
}