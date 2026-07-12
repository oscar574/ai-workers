import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { CheckCircle, XCircle, Loader, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AcceptInvitation() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  useEffect(() => {
    const handle = async () => {
      if (isLoadingAuth) return;

      if (!isAuthenticated) {
        if (token) localStorage.setItem('pending_invitation_token', token);
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const effectiveToken = token || localStorage.getItem('pending_invitation_token');
      if (!effectiveToken) {
        setStatus('error');
        setError('Token no proporcionado');
        return;
      }

      try {
        await base44.functions.invoke('accept-invitation', { token: effectiveToken });
        localStorage.removeItem('pending_invitation_token');
        setStatus('success');
        setTimeout(() => { window.location.href = '/'; }, 2500);
      } catch (e) {
        setStatus('error');
        setError(e.response?.data?.error || e.message || 'Error al aceptar invitación');
      }
    };
    handle();
  }, [isLoadingAuth, isAuthenticated, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
              <Loader className="w-8 h-8 text-slate-400 animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Procesando invitación...</h1>
            <p className="text-sm text-slate-500">Estamos confirmando tu acceso a la organización</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">¡Invitación aceptada!</h1>
            <p className="text-sm text-slate-500">Ya formas parte de la organización. Te redirigiremos en un momento...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">No se pudo aceptar</h1>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => base44.auth.logout()}>
                <LogOut className="w-4 h-4 mr-1.5" /> Cerrar sesión
              </Button>
              <Button onClick={() => navigate('/')} className="bg-slate-900 hover:bg-slate-800">Ir al inicio</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}