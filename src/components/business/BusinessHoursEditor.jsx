import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' }
];

export default function BusinessHoursEditor({ value, onChange }) {
  const hours = value || {};

  const updateDay = (day, field, val) => {
    const dayData = hours[day] || { enabled: false, start: '09:00', end: '18:00' };
    onChange({ ...hours, [day]: { ...dayData, [field]: val } });
  };

  return (
    <div className="space-y-2">
      {DAYS.map(d => {
        const dayData = hours[d.key] || { enabled: false, start: '09:00', end: '18:00' };
        return (
          <div key={d.key} className="flex items-center gap-3">
            <div className="w-10"><Switch checked={dayData.enabled} onCheckedChange={v => updateDay(d.key, 'enabled', v)} /></div>
            <span className="w-28 text-sm text-slate-600">{d.label}</span>
            <Input type="time" value={dayData.start || '09:00'} onChange={e => updateDay(d.key, 'start', e.target.value)} disabled={!dayData.enabled} className="w-32" />
            <span className="text-slate-400 text-sm">—</span>
            <Input type="time" value={dayData.end || '18:00'} onChange={e => updateDay(d.key, 'end', e.target.value)} disabled={!dayData.enabled} className="w-32" />
          </div>
        );
      })}
    </div>
  );
}