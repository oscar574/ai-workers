import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrg } from '@/lib/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, BookOpen, Lock } from 'lucide-react';

const TYPES = [
  { value: 'faq', label: 'Pregunta frecuente' },
  { value: 'service', label: 'Servicio' },
  { value: 'pricing', label: 'Precios' },
  { value: 'schedule', label: 'Horarios' },
  { value: 'policy', label: 'Políticas' },
  { value: 'free_text', label: 'Texto libre' }
];

const typeLabels = {};
TYPES.forEach(t => { typeLabels[t.value] = t.label; });

const DISABLED_TYPES = [
  { label: 'Archivo', note: 'Próximamente' },
  { label: 'URL (sitio web)', note: 'Próximamente' }
];

export default function Knowledge() {
  const { effectiveOrg } = useOrg();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'faq', content: '', priority: 10, status: 'active' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!effectiveOrg) return;
    try {
      setItems(await base44.entities.KnowledgeItem.filter({ organization_id: effectiveOrg.id }, 'priority', 100));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [effectiveOrg?.id]);

  const openNew = () => { setForm({ title: '', type: 'faq', content: '', priority: 10, status: 'active' }); setEditing('new'); };
  const openEdit = (item) => { setForm(item); setEditing(item.id); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        title: form.title, type: form.type, content: form.content,
        priority: Number(form.priority) || 10, status: form.status
      };
      if (editing === 'new') {
        await base44.entities.KnowledgeItem.create({ ...data, organization_id: effectiveOrg.id });
      } else {
        await base44.entities.KnowledgeItem.update(editing, data);
      }
      setEditing(null);
      load();
    } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este elemento?')) return;
    await base44.entities.KnowledgeItem.delete(id);
    load();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Base de conocimiento</h1>
          <p className="text-sm text-slate-500 mt-1">{items.length} elementos</p>
        </div>
        <Button onClick={openNew} className="bg-slate-900 hover:bg-slate-800"><Plus className="w-4 h-4 mr-1.5" /> Nuevo</Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No hay elementos de conocimiento. Crea el primero para que tu asistente lo use.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-medium text-slate-900 text-sm">{item.title}</h3>
                  <Badge variant="secondary" className="mt-1 bg-slate-100 text-slate-500 hover:bg-slate-100 text-xs">{typeLabels[item.type] || item.type}</Badge>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              <p className="text-sm text-slate-500 line-clamp-2">{item.content}</p>
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-50">
                <span className="text-xs text-slate-400">Prioridad: {item.priority}</span>
                <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className={item.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100 text-xs' : 'bg-slate-100 text-slate-400 hover:bg-slate-100 text-xs'}>
                  {item.status === 'active' ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing === 'new' ? 'Nuevo elemento' : 'Editar elemento'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5"><Label>Título</Label><Input value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  {DISABLED_TYPES.map(t => (
                    <div key={t.label} className="flex items-center justify-between px-2 py-1.5 text-sm text-slate-300 cursor-not-allowed">
                      <span className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> {t.label}</span>
                      <span className="text-xs">{t.note}</span>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Contenido</Label><Textarea value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} rows={6} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Prioridad (menor = más importante)</Label><Input type="number" value={form.priority || 10} onChange={e => setForm({ ...form, priority: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.status || 'active'} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Activo</SelectItem><SelectItem value="inactive">Inactivo</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
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