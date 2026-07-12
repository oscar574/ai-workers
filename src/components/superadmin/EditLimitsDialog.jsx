import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function EditLimitsDialog({ org, onClose, onSaved }) {
  const [convLimit, setConvLimit] = useState(0);
  const [msgLimit, setMsgLimit] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (org) {
      setConvLimit(org.monthly_conversation_limit || 0);
      setMsgLimit(org.monthly_message_limit || 0);
    }
  }, [org]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.Organization.update(org.id, {
        monthly_conversation_limit: Number(convLimit),
        monthly_message_limit: Number(msgLimit)
      });
      onSaved && onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!org) return null;

  return (
    <Dialog open={!!org} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modificar límites — {org.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Límite de conversaciones mensuales</Label>
            <Input type="number" value={convLimit} onChange={e => setConvLimit(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Límite de mensajes mensuales</Label>
            <Input type="number" value={msgLimit} onChange={e => setMsgLimit(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}