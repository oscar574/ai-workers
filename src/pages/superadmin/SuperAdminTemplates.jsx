import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Plus, Edit, Copy, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const emptyForm = {
  name: '', industry: '', description: '', default_employee_name: '', default_role: '',
  default_tone: '', primary_goal: '', default_system_instructions: '',
  qualification_questions_text: '', prohibited_topics_text: '', recommended_actions_text: '',
  active: true
};

export default function SuperAdminTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { user } = useOrg();

  const load = async () => {
    try { setTemplates(await base44.entities.IndustryTemplate.list('-created_date', 100)); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyForm); setEditing('new'); };
  const openEdit = (t) => {
    setForm({
      ...t,
      qualification_questions_text: (t.qualification_questions || []).join('\n'),
      prohibited_topics_text: (t.prohibited_topics || []).join('\n'),
      recommended_actions_text: (t.recommended_actions || []).join('\n')
    });
    setEditing(t.id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name: form.name, industry: form.industry, description: form.description,
        default_employee_name: form.default_employee_name, default_role: form.default_role,
        default_tone: form.default_tone, primary_goal: form.primary_goal,
        default_system_instructions: form.default_system_instructions,
        qualification_questions: form.qualification_questions_text.split('\n').map(s => s.trim()).filter(Boolean),
        prohibited_topics: form.prohibited_topics_text.split('\n').map(s => s.trim()).filter(Boolean),
        recommended_actions: form.recommended_actions_text.split('\n').map(s => s.trim()).filter(Boolean),
        active: form.active
      };
      if (editing === 'new') {
        await base44.entities.IndustryTemplate.create(data);
      } else {
        await base44.entities.IndustryTemplate.update(editing, data);
      }
      setEditing(null);
      load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleDuplicate = async (t) => {
    await base44.entities.IndustryTemplate.create({
      ...t, name: t.name + ' (copia)', id: undefined, created_date: undefined, updated_date: undefined
    });
    load();
  };

  const handleToggle = async (t) => {
    await base44.entities.IndustryTemplate.update(t.id, { active: !t.active });
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Plantillas de industria</h1>
          <p className="text-sm text-slate-500 mt-1">{templates.length} plantillas</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Nueva plantilla</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-slate-900">{t.name}</h3>
              <Badge variant={t.active ? 'default' : 'secondary'} className={t.active ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-100'}>
                {t.active ? 'Activa' : 'Inactiva'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mb-2 capitalize">{t.industry}</p>
            <p className="text-sm text-slate-500 line-clamp-3 flex-1">{t.description}</p>
            <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-100">
              <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Edit className="w-4 h-4" /></button>
              <button onClick={() => handleDuplicate(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Copy className="w-4 h-4" /></button>
              <button onClick={() => handleToggle(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 ml-auto"><Power className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === 'new' ? 'Nueva plantilla' : 'Editar plantilla'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Industria</Label><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Descripción</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Nombre del empleado</Label><Input value={form.default_employee_name} onChange={e => setForm({ ...form, default_employee_name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Rol</Label><Input value={form.default_role} onChange={e => setForm({ ...form, default_role: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Tono</Label><Input value={form.default_tone} onChange={e => setForm({ ...form, default_tone: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Objetivo principal</Label><Textarea value={form.primary_goal} onChange={e => setForm({ ...form, primary_goal: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5"><Label>Instrucciones del sistema</Label><Textarea value={form.default_system_instructions} onChange={e => setForm({ ...form, default_system_instructions: e.target.value })} rows={4} /></div>
            <div className="space-y-1.5"><Label>Preguntas de calificación (una por línea)</Label><Textarea value={form.qualification_questions_text} onChange={e => setForm({ ...form, qualification_questions_text: e.target.value })} rows={4} /></div>
            <div className="space-y-1.5"><Label>Temas prohibidos (uno por línea)</Label><Textarea value={form.prohibited_topics_text} onChange={e => setForm({ ...form, prohibited_topics_text: e.target.value })} rows={3} /></div>
            <div className="space-y-1.5"><Label>Acciones recomendadas (una por línea)</Label><Textarea value={form.recommended_actions_text} onChange={e => setForm({ ...form, recommended_actions_text: e.target.value })} rows={3} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} /><Label>Activa</Label></div>
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