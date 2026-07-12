import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, AlertCircle } from 'lucide-react';
import { useOrg } from '@/lib/OrgContext';
import { useAuth } from '@/lib/AuthContext';
import BusinessSidebar from '@/components/business/BusinessSidebar';

export default function BusinessLayout() {
  const { loading, isSuperAdmin, isImpersonating, effectiveOrg, needsOnboarding, stopImpersonation } = useOrg();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSuperAdmin && !isImpersonating) return <Navigate to="/superadmin" replace />;
  if (!effectiveOrg) return <Navigate to="/no-organization" replace />;
  if (needsOnboarding && !isImpersonating) return <Navigate to="/onboarding" replace />;

  const orgColor = effectiveOrg?.primary_color || '#4f46e5';

  const handleLogout = () => {
    logout();
  };

  const handleStopImpersonation = () => {
    stopImpersonation();
    navigate('/superadmin/organizations');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <div className="h-16 flex items-center px-5 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: orgColor }}>
            {effectiveOrg?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <span className="ml-2.5 font-semibold text-slate-900 truncate">{effectiveOrg?.name || 'AI Workers'}</span>
        </div>
        <BusinessSidebar />
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: orgColor }}>
                  {effectiveOrg?.name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <span className="ml-2.5 font-semibold text-slate-900 truncate text-sm">{effectiveOrg?.name || 'AI Workers'}</span>
              </div>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <BusinessSidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: orgColor }} />
            <span className="text-sm text-slate-500 hidden sm:block">Panel del negocio</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">{effectiveOrg?.name}</span>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <LogOut className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </header>

        {/* Impersonation banner */}
        {isImpersonating && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 lg:px-8 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4" />
              <span>Estás viendo <strong>{effectiveOrg?.name}</strong> como superadministrador</span>
            </div>
            <button onClick={handleStopImpersonation} className="text-sm font-medium text-amber-800 hover:text-amber-900">
              Salir
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}