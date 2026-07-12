import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Lock } from 'lucide-react';
import BusinessHoursEditor from '@/components/business/BusinessHoursEditor';

const INDUSTRIES = [
  { value: 'inmobiliaria', label: 'Inmobiliaria' },
  { value: 'clinica', label: 'Clínica' },
  { value: 'arquitectura', label: 'Arquitectura y construcción' },
  { value: 'consultorio', label: 'Consultorio' },
  { value: 'iglesia', label: 'Iglesia' },
  { value: 'generico', label: 'Negocio genérico' }
];

const KNOWLEDGE_TYPES = [
  { value: 'faq', label: 'Pregunta frecuente' },
  { value: 'service', label: 'Servicio' },
  { value: 'pricing', label: 'Precios' },
  { value: 'schedule', label: 'Horarios' },
  { value: 'policy', label: 'Políticas' },
  { value: 'free_text', label: 'Texto libre' }
];

const STEPS = [
  { num: 1, label: 'Negocio' }, { num: 2, label: 'Plantilla' }, { num: 3, label: 'Asistente' },
  { num: 4, label: 'Conocimiento' }, { num: 5, label: 'Calificación' }, { num: 6, label: 'Resumen' }
];

export default function Onboarding() {
  const { effectiveOrg, needsOnboarding, loading, reload } = useOrg();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [orgForm, setOrgForm] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [empForm, setEmpForm] = useState({});
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [qualForm, setQualForm] = useState({});
  const [newKnTitle, setNewKnTitle] = useState('');
  const [newKnType, setNewKnType] = useState('faq');
  const [newKnContent, setNewKnContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!effectiveOrg) return;
      try {
        const tmpls = await base44.entities.IndustryTemplate.filter({ active: true });
        setTemplates(tmpls);
        setOrgForm({
          name: effectiveOrg.name || '', industry: effectiveOrg.industry || 'generico',
          website: effectiveOrg.website || '', phone: effectiveOrg.phone || '',
          city: effectiveOrg.city || '', timezone: effectiveOrg.timezone || 'America/Mexico_City',
          logo_url: effectiveOrg.logo_url || '', primary_color: effectiveOrg.primary_color || '#4f46e5'
        });
        if (effectiveOrg.onboarding_step && effectiveOrg.onboarding_step >= 1) setStep(effectiveOrg.onboarding_step);
        if (effectiveOrg.selected_template_id) {
          const tmpl = tmpls.find(t => t.id === effectiveOrg.selected_template_id);
          if (tmpl) { setSelectedTemplate(tmpl); prefillFromTemplate(tmpl); }
        }
        const emps = await base44.entities.AIEmployee.filter({ organization_id: effectiveOrg.id });
        if (emps.length > 0) {
          setEmployee(emps[0]);
          const e = emps[0];
          setEmpForm({
            name: e.name || '', role: e.role || '', tone: e.tone || '', language: e.language || 'Español',
            primary_goal: e.primary_goal || '', system_instructions: e.system_instructions || '',
            welcome_message: e.welcome_message || '', fallback_message: e.fallback_message || '',
            handoff_message: e.handoff_message || '', response_length: e.response_length || 'medium',
            business_hours: e.business_hours || {}, human_contact_name: e.human_contact_name || '',
            human_contact_phone: e.human_contact_phone || ''
          });
          const qr = e.qualification_rules || {};
          setQualForm({
            required_questions: (qr.required_questions || []).join('\n'),
            required_data: (qr.required_data || []).join('\n'),
            qualified_criteria: qr.qualified_criteria || '',
            escalate_situations: (qr.escalate_situations || []).join('\n')
          });
        }
        setKnowledgeItems(await base44.entities.KnowledgeItem.filter({ organization_id: effectiveOrg.id }));
      } catch (e) { console.error(e); }
    };
    load();
  }, [effectiveOrg?.id]);

  const prefillFromTemplate = (tmpl) => {
    setEmpForm(prev => ({
      ...prev,
      name: prev.name || tmpl.default_employee_name || '',
      role: prev.role || tmpl.default_role || '',
      tone: prev.tone || tmpl.default_tone || '',
      primary_goal: prev.primary_goal || tmpl.primary_goal || '',
      system_instructions: prev.system_instructions || tmpl.default_system_instructions || '',
      welcome_message: prev.welcome_message || '¡Hola! ¿Cómo puedo ayudarte?',
      fallback_message: prev.fallback_message || 'Lo siento, no tengo esa información. ¿Te puedo conectar con un asesor?',
      handoff_message: prev.handoff_message || 'Te voy a conectar con un asesor humano. Un momento por favor.',
      language: prev.language || 'Español',
      response_length: prev.response_length || 'medium'
    }));
    setQualForm(prev => ({
      ...prev,
      required_questions: prev.required_questions || (tmpl.qualification_questions || []).join('\n'),
      escalate_situations: prev.escalate_situations || ''
    }));
  };

  const saveStep1 = async () => {
    setSaving(true);
    try { await base44.entities.Organization.update(effectiveOrg.id, { ...orgForm, onboarding_step: 2 }); setStep(2); }
    finally { setSaving(false); }
  };
  const saveStep2 = async (tmpl) => {
    setSaving(true);
    try {
      setSelectedTemplate(tmpl); prefillFromTemplate(tmpl);
      await base44.entities.Organization.update(effectiveOrg.id, { selected_template_id: tmpl.id, onboarding_step: 3 });
      setStep(3);
    } finally { setSaving(false); }
  };
  const saveStep3 = async () => {
    setSaving(true);
    try {
      if (employee) { await base44.entities.AIEmployee.update(employee.id, { ...empForm }); }
      else { const created = await base44.entities.AIEmployee.create({ ...empForm, organization_id: effectiveOrg.id, status: 'draft', prohibited_topics: selectedTemplate?.prohibited_topics || [] }); setEmployee(created); }
      await base44.entities.Organization.update(effectiveOrg.id, { onboarding_step: 4 });
      setStep(4);
    } finally { setSaving(false); }
  };
  const addKnowledge = async () => {
    if (!newKnTitle || !newKnContent || !employee) return;
    const item = await base44.entities.KnowledgeItem.create({ organization_id: effectiveOrg.id, ai_employee_id: employee.id, title: newKnTitle, type: newKnType, content: newKnContent, status: 'active', priority: 10 });
    setKnowledgeItems([...knowledgeItems, item]);
    setNewKnTitle(''); setNewKnContent('');
  };
  const deleteKnowledge = async (id) => { await base44.entities.KnowledgeItem.delete(id); setKnowledgeItems(knowledgeItems.filter(k => k.id !== id)); };
  const saveStep5 = async () => {
    setSaving(true);
    try {
      await base44.entities.AIEmployee.update(employee.id, {
        qualification_rules: {
          required_questions: (qualForm.required_questions || '').split('\n').map(s => s.trim()).filter(Boolean),
          required_data: (qualForm.required_data || '').split('\n').map(s => s.trim()).filter(Boolean),
          qualified_criteria: qualForm.qualified_criteria || '',
          escalate_situations: (qualForm.escalate_situations || '').split('\n').map(s => s.trim()).filter(Boolean)
        }
      });
      await base44.entities.Organization.update(effectiveOrg.id, { onboarding_step: 6 });
      setStep(6);
    } finally { setSaving(false); }
  };
  const finish = async () => {
    await base44.entities.Organization.update(effectiveOrg.id, { onboarding_step: null });
    reload();
    window.location.href = '/app';
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;
  if (!effectiveOrg) return <Navigate to="/no-organization" replace />;
  if (!needsOnboarding) return <Navigate to="/app" replace />;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Configura tu asistente</h1>
          <p className="text-sm text-slate-500">Te guiamos paso a paso. Puedes pausar y retomar cuando quieras.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step > s.num ? 'bg-slate-900 text-white' : step === s.num ? 'bg-slate-900 text-white ring-4 ring-slate-200' : 'bg-slate-100 text-slate-400'}`}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className={`text-xs hidden sm:block ${step >= s.num ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 -mt-5 ${step > s.num ? 'bg-slate-900' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Business info */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Información del negocio</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2"><Label>Nombre</Label><Input value={orgForm.name || ''} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Industria</Label>
                <Select value={orgForm.industry} onValueChange={v => setOrgForm({ ...orgForm, industry: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Ciudad</Label><Input value={orgForm.city || ''} onChange={e => setOrgForm({ ...orgForm, city: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Teléfono</Label><Input value={orgForm.phone || ''} onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Sitio web</Label><Input value={orgForm.website || ''} onChange={e => setOrgForm({ ...orgForm, website: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Zona horaria</Label><Input value={orgForm.timezone || ''} onChange={e => setOrgForm({ ...orgForm, timezone: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Color principal</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={orgForm.primary_color || '#4f46e5'} onChange={e => setOrgForm({ ...orgForm, primary_color: e.target.value })} className="w-10 h-9 rounded border border-slate-200 cursor-pointer" />
                  <Input value={orgForm.primary_color || ''} onChange={e => setOrgForm({ ...orgForm, primary_color: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2"><Button onClick={saveStep1} disabled={saving} className="bg-slate-900 hover:bg-slate-800">Continuar <ArrowRight className="w-4 h-4 ml-1.5" /></Button></div>
          </div>
        )}

        {/* Step 2: Template selection */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-1">Selecciona una plantilla</h2>
              <p className="text-sm text-slate-500 mb-4">Preconfiguramos tu asistente según tu industria. Podrás personalizar todo después.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map(t => (
                  <button key={t.id} onClick={() => saveStep2(t)} disabled={saving}
                    className={`text-left p-4 rounded-xl border transition-all ${selectedTemplate?.id === t.id ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    <h3 className="font-medium text-slate-900 text-sm">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5 capitalize">{t.industry}</p>
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-start"><Button variant="outline" onClick={() => setStep(1)}><ArrowLeft className="w-4 h-4 mr-1.5" /> Atrás</Button></div>
          </div>
        )}

        {/* Step 3: Employee config */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Configura tu empleado IA</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Nombre</Label><Input value={empForm.name || ''} onChange={e => setEmpForm({ ...empForm, name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Rol</Label><Input value={empForm.role || ''} onChange={e => setEmpForm({ ...empForm, role: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Tono</Label><Input value={empForm.tone || ''} onChange={e => setEmpForm({ ...empForm, tone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Idioma</Label><Input value={empForm.language || ''} onChange={e => setEmpForm({ ...empForm, language: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Objetivo principal</Label><Textarea value={empForm.primary_goal || ''} onChange={e => setEmpForm({ ...empForm, primary_goal: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5"><Label>Instrucciones del sistema</Label><Textarea value={empForm.system_instructions || ''} onChange={e => setEmpForm({ ...empForm, system_instructions: e.target.value })} rows={4} /></div>
            <div className="space-y-1.5"><Label>Mensaje de bienvenida</Label><Input value={empForm.welcome_message || ''} onChange={e => setEmpForm({ ...empForm, welcome_message: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Mensaje de respaldo</Label><Input value={empForm.fallback_message || ''} onChange={e => setEmpForm({ ...empForm, fallback_message: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Mensaje de transferencia</Label><Input value={empForm.handoff_message || ''} onChange={e => setEmpForm({ ...empForm, handoff_message: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Persona responsable</Label><Input value={empForm.human_contact_name || ''} onChange={e => setEmpForm({ ...empForm, human_contact_name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Teléfono de transferencia</Label><Input value={empForm.human_contact_phone || ''} onChange={e => setEmpForm({ ...empForm, human_contact_phone: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs text-slate-400">Horarios de atención ({orgForm.timezone})</Label><BusinessHoursEditor value={empForm.business_hours || {}} onChange={v => setEmpForm({ ...empForm, business_hours: v })} /></div>
            <div className="flex justify-between pt-2"><Button variant="outline" onClick={() => setStep(2)}><ArrowLeft className="w-4 h-4 mr-1.5" /> Atrás</Button><Button onClick={saveStep3} disabled={saving} className="bg-slate-900 hover:bg-slate-800">Continuar <ArrowRight className="w-4 h-4 ml-1.5" /></Button></div>
          </div>
        )}

        {/* Step 4: Knowledge */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-semibold text-slate-900">Base de conocimiento</h2>
              <p className="text-sm text-slate-500">Agrega información para que tu asistente pueda responder. Solo texto por ahora.</p>
              <div className="space-y-3 border border-slate-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>Título</Label><Input value={newKnTitle} onChange={e => setNewKnTitle(e.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={newKnType} onValueChange={setNewKnType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {KNOWLEDGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm text-slate-300 cursor-not-allowed"><span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Archivo</span><span className="text-xs">Próximamente</span></div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm text-slate-300 cursor-not-allowed"><span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> URL</span><span className="text-xs">Próximamente</span></div>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Contenido</Label><Textarea value={newKnContent} onChange={e => setNewKnContent(e.target.value)} rows={3} /></div>
                <Button onClick={addKnowledge} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Agregar</Button>
              </div>
              <div className="space-y-2">
                {knowledgeItems.map(k => (
                  <div key={k.id} className="flex items-start justify-between p-3 border border-slate-100 rounded-lg">
                    <div><p className="text-sm font-medium text-slate-900">{k.title}</p><p className="text-xs text-slate-400">{KNOWLEDGE_TYPES.find(t => t.value === k.type)?.label}</p></div>
                    <button onClick={() => deleteKnowledge(k.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between"><Button variant="outline" onClick={() => setStep(3)}><ArrowLeft className="w-4 h-4 mr-1.5" /> Atrás</Button><Button onClick={() => { base44.entities.Organization.update(effectiveOrg.id, { onboarding_step: 5 }); setStep(5); }} className="bg-slate-900 hover:bg-slate-800">Continuar <ArrowRight className="w-4 h-4 ml-1.5" /></Button></div>
          </div>
        )}

        {/* Step 5: Qualification rules */}
        {step === 5 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-semibold text-slate-900">Reglas de calificación</h2>
            <div className="space-y-1.5"><Label>Preguntas obligatorias (una por línea)</Label><Textarea value={qualForm.required_questions || ''} onChange={e => setQualForm({ ...qualForm, required_questions: e.target.value })} rows={4} /></div>
            <div className="space-y-1.5"><Label>Datos que debe obtener (uno por línea)</Label><Textarea value={qualForm.required_data || ''} onChange={e => setQualForm({ ...qualForm, required_data: e.target.value })} rows={3} /></div>
            <div className="space-y-1.5"><Label>Criterio de lead calificado</Label><Textarea value={qualForm.qualified_criteria || ''} onChange={e => setQualForm({ ...qualForm, qualified_criteria: e.target.value })} rows={2} /></div>
            <div className="space-y-1.5"><Label>Situaciones para escalar a humano (una por línea)</Label><Textarea value={qualForm.escalate_situations || ''} onChange={e => setQualForm({ ...qualForm, escalate_situations: e.target.value })} rows={3} /></div>
            <div className="flex justify-between pt-2"><Button variant="outline" onClick={() => setStep(4)}><ArrowLeft className="w-4 h-4 mr-1.5" /> Atrás</Button><Button onClick={saveStep5} disabled={saving} className="bg-slate-900 hover:bg-slate-800">Continuar <ArrowRight className="w-4 h-4 ml-1.5" /></Button></div>
          </div>
        )}

        {/* Step 6: Summary */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-semibold text-slate-900">Resumen</h2>
              <div className="space-y-3 text-sm">
                <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Negocio</p><p className="text-slate-900">{orgForm.name} · {INDUSTRIES.find(i => i.value === orgForm.industry)?.label}</p></div>
                <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Plantilla</p><p className="text-slate-900">{selectedTemplate?.name}</p></div>
                <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Asistente</p><p className="text-slate-900">{empForm.name} · {empForm.role}</p><p className="text-slate-500 text-xs mt-0.5">{empForm.primary_goal}</p></div>
                <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Conocimiento</p><p className="text-slate-900">{knowledgeItems.length} elementos</p></div>
                <div><p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Preguntas de calificación</p><p className="text-slate-900">{(qualForm.required_questions || '').split('\n').filter(Boolean).length} preguntas</p></div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-700">Tu asistente quedará en estado <strong>borrador</strong>. Se activará cuando el chat de prueba esté disponible en una fase posterior.</div>
            </div>
            <div className="flex justify-between"><Button variant="outline" onClick={() => setStep(5)}><ArrowLeft className="w-4 h-4 mr-1.5" /> Atrás</Button><Button onClick={finish} className="bg-slate-900 hover:bg-slate-800"><Check className="w-4 h-4 mr-1.5" /> Guardar asistente</Button></div>
          </div>
        )}
      </div>
    </div>
  );
}