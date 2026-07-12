import React, { useState } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Shield } from 'lucide-react';
import { useOrg } from '@/lib/OrgContext';
import { useAuth } from '@/lib/AuthContext';
import SuperAdminSidebar from '@/components/superadmin/SuperAdminSidebar';

export default function SuperAdminLayout() {
  const { loading, isSuperAdmin, stopImpersonation } = useOrg();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isSuperAdmin) return <Navigate to="/" replace />;

  const handleLogout = () => { stopImpersonation(); logout(); };
  const handleExit = () => { stopImpersonation(); navigate('/'); };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 fixed inset-y-0 left-0 z-30">
        <div className="h-16 flex items-center px-5 border-b border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Shield className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
          </div>
          <div className="ml-2.5">
            <span className="font-semibold text-slate-900 text-sm block leading-tight">AI Workers</span>
            <span className="text-xs text-slate-400">SuperAdmin</span>
          </div>
        </div>
        <SuperAdminSidebar />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <Shield className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
                </div>
                <div className="ml-2.5">
                  <span className="font-semibold text-slate-900 text-sm block leading-tight">AI Workers</span>
                  <span className="text-xs text-slate-400">SuperAdmin</span>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <SuperAdminSidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm text-slate-500">Panel de administración</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 hidden sm:block">{user?.email}</span>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
              <LogOut className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}