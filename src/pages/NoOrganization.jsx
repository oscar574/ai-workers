import React from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Building, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NoOrganization() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <Building className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">No perteneces a ninguna organización</h1>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          Para usar AI Workers necesitas una invitación de una organización. Solicita acceso al administrador de tu organización para que te envíe un enlace de invitación.
        </p>
        <Button variant="outline" onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4 mr-1.5" /> Cerrar sesión
        </Button>
      </div>
    </div>
  );
}