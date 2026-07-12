import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import BusinessHoursEditor from '@/components/business/BusinessHoursEditor';
import { Save, Bot } from 'lucide-react';

export default function Assistant() {
  const { effectiveOrg } = useOrg();
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!effectiveOrg) return;
      try {
        const emps = await base44.entities.AIEmployee.filter({ organization_id: effectiveOrg.id });
        if (emps.length > 0) {
          const emp = emps[0];
          const qr = emp.qualification_rules || {};
          setEmployee(emp);
          setForm({
            ...emp,
            qualification_required_questions: (qr.required_questions || []).join('\n'),
            qualification_required_data: (qr.required_data || []).join('\n'),
            qualification_criteria: qr.qualified_criteria || '',
            qualification_escalate: (qr.escalate_situations || []).join('\n'),
            prohibited_topics_text: (emp.prohibited_topics || []).join('\n')
          });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [effectiveOrg?.id]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const data = {
        name: form.name, role: form.role, status: form.status, tone: form.tone,
        language: form.language, welcome_message: form.welcome_message,
        fallback_message: form.fallback_message, handoff_message: form.handoff_message,
        system_instructions: form.system_instructions, primary_goal: form.primary_goal,
        business_hours: form.business_hours || {},
        qualification_rules: {
          required_questions: (form.qualification_required_questions || '').split('\n').map(s => s.trim()).filter(Boolean),
          required_data: (form.qualification_required_data || '').split('\n').map(s => s.trim()).filter(Boolean),
          qualified_criteria: form.qualification_criteria || '',
          escalate_situations: (form.qualification_escalate || '').split('\n').map(s => s.trim()).filter(Boolean)
        },
        prohibited_topics: (form.prohibited_topics_text || '').split('\n').map(s => s.trim()).filter(Boolean),
        human_contact_name: form.human_contact_name, human_contact_phone: form.human_contact_phone,
        response_length: form.response_length
      };
      await base44.entities.AIEmployee.update(employee.id, data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  if (!employee) return <div className="text-center py-20 text-slate-400">No hay asistente configurado. Completa el onboarding primero.</div>;

  const statusColors = { draft: 'bg-slate-100 text-slate-600', active: 'bg-green-100 text-green-700', paused: 'bg-amber-100 text-amber-700' };
  const statusLabels = { draft: 'Borrador', active: 'Activo', paused: 'Pausado' };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white"><Bot className="w-5 h-5" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Asistente IA</h1>
            <Badge className={`mt-0.5 ${statusColors[employee.status] || statusColors.draft}`}>{statusLabels[employee.status] || 'Borrador'}</Badge>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
      {saved && <p className="text-sm text-green-600">✓ Cambios guardados correctamente</p>}

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Información básica</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Nombre</Label><Input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Rol</Label><Input value={form.role || ''} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="Ej. Asesor inmobiliario" /></div>
          <div className="space-y-1.5"><Label>Tono</Label><Input value={form.tone || ''} onChange={e => setForm({ ...form, tone: e.target.value })} placeholder="Ej. Profesional y cercano" /></div>
          <div className="space-y-1.5"><Label>Idioma</Label><Input value={form.language || ''} onChange={e => setForm({ ...form, language: e.target.value })} placeholder="Español" /></div>
          <div className="space-y-1.5">
            <Label>Longitud de respuesta</Label>
            <Select value={form.response_length || 'medium'} onValueChange={v => setForm({ ...form, response_length: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="short">Corta</SelectItem><SelectItem value="medium">Media</SelectItem><SelectItem value="long">Larga</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={form.status || 'draft'} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Borrador</SelectItem><SelectItem value="active">Activo</SelectItem><SelectItem value="paused">Pausado</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Mensajes</h2>
        <div className="space-y-1.5"><Label>Mensaje de bienvenida</Label><Textarea value={form.welcome_message || ''} onChange={e => setForm({ ...form, welcome_message: e.target.value })} rows={2} /></div>
        <div className="space-y-1.5"><Label>Mensaje de respaldo (cuando no sabe responder)</Label><Textarea value={form.fallback_message || ''} onChange={e => setForm({ ...form, fallback_message: e.target.value })} rows={2} /></div>
        <div className="space-y-1.5"><Label>Mensaje de transferencia a humano</Label><Textarea value={form.handoff_message || ''} onChange={e => setForm({ ...form, handoff_message: e.target.value })} rows={2} /></div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Instrucciones y objetivo</h2>
        <div className="space-y-1.5"><Label>Objetivo principal</Label><Textarea value={form.primary_goal || ''} onChange={e => setForm({ ...form, primary_goal: e.target.value })} rows={2} /></div>
        <div className="space-y-1.5"><Label>Instrucciones del sistema</Label><Textarea value={form.system_instructions || ''} onChange={e => setForm({ ...form, system_instructions: e.target.value })} rows={5} /></div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Horarios de atención</h2>
        <p className="text-xs text-slate-400">Zona horaria: {effectiveOrg?.timezone || 'America/Mexico_City'}</p>
        <BusinessHoursEditor value={form.business_hours || {}} onChange={v => setForm({ ...form, business_hours: v })} />
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Reglas de calificación</h2>
        <div className="space-y-1.5"><Label>Preguntas obligatorias (una por línea)</Label><Textarea value={form.qualification_required_questions || ''} onChange={e => setForm({ ...form, qualification_required_questions: e.target.value })} rows={4} /></div>
        <div className="space-y-1.5"><Label>Datos que debe obtener (uno por línea)</Label><Textarea value={form.qualification_required_data || ''} onChange={e => setForm({ ...form, qualification_required_data: e.target.value })} rows={3} /></div>
        <div className="space-y-1.5"><Label>Criterio de lead calificado</Label><Textarea value={form.qualification_criteria || ''} onChange={e => setForm({ ...form, qualification_criteria: e.target.value })} rows={2} /></div>
        <div className="space-y-1.5"><Label>Situaciones para escalar a humano (una por línea)</Label><Textarea value={form.qualification_escalate || ''} onChange={e => setForm({ ...form, qualification_escalate: e.target.value })} rows={3} /></div>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Contacto humano y restricciones</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>Persona responsable</Label><Input value={form.human_contact_name || ''} onChange={e => setForm({ ...form, human_contact_name: e.target.value })} /></div>
          <div className="space-y-1.5"><Label>Teléfono de transferencia</Label><Input value={form.human_contact_phone || ''} onChange={e => setForm({ ...form, human_contact_phone: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5"><Label>Temas prohibidos (uno por línea)</Label><Textarea value={form.prohibited_topics_text || ''} onChange={e => setForm({ ...form, prohibited_topics_text: e.target.value })} rows={3} /></div>
      </section>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  );
}