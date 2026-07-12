import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOrg } from '@/lib/OrgContext';

export default function RootRedirect() {
  const { loading, isSuperAdmin, isImpersonating, effectiveOrg, needsOnboarding } = useOrg();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingToken = localStorage.getItem('pending_invitation_token');
  if (pendingToken && !isSuperAdmin) {
    return <Navigate to={`/accept-invitation?token=${pendingToken}`} replace />;
  }

  if (isSuperAdmin && !isImpersonating) return <Navigate to="/superadmin" replace />;
  if (isImpersonating) return <Navigate to="/app" replace />;
  if (!effectiveOrg) return <Navigate to="/no-organization" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/app" replace />;
}