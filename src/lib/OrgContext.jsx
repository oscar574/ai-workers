import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Outlet } from 'react-router-dom';

const OrgContext = createContext();

export const OrgProvider = ({ children }) => {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();
  const [context, setContext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedOrg, setImpersonatedOrg] = useState(null);

  const loadContext = useCallback(async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('get-user-context', {});
      setContext(response.data);
    } catch (error) {
      console.error('Error al cargar contexto:', error);
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoadingAuth) {
      loadContext();
    } else if (!isAuthenticated && !isLoadingAuth) {
      setContext(null);
      setLoading(false);
    }
  }, [isAuthenticated, isLoadingAuth, loadContext]);

  const startImpersonation = useCallback(async (orgId) => {
    try {
      const org = await base44.entities.Organization.get(orgId);
      setImpersonatedOrg(org);
    } catch (error) {
      console.error('Error al impersonar:', error);
    }
  }, []);

  const stopImpersonation = useCallback(() => {
    setImpersonatedOrg(null);
  }, []);

  const reload = useCallback(async () => {
    await loadContext();
    if (impersonatedOrg) {
      try {
        const freshOrg = await base44.entities.Organization.get(impersonatedOrg.id);
        setImpersonatedOrg(freshOrg);
      } catch (error) {
        console.error('Error al refrescar organización impersonada:', error);
      }
    }
  }, [impersonatedOrg, loadContext]);

  const isSuperAdmin = context?.is_super_admin || false;
  const isImpersonating = !!impersonatedOrg;
  const effectiveOrg = impersonatedOrg || context?.organization || null;
  const organizationRole = isImpersonating ? 'organization_admin' : (context?.organization_role || null);
  const needsOnboarding = isImpersonating ? false : (context?.needs_onboarding || false);

  return (
    <OrgContext.Provider value={{
      user: context?.user || user,
      context,
      loading,
      reload,
      isSuperAdmin,
      isImpersonating,
      effectiveOrg,
      organizationRole,
      needsOnboarding,
      impersonatedOrg,
      startImpersonation,
      stopImpersonation
    }}>
      {children}
    </OrgContext.Provider>
  );
};

export const OrgLayout = () => (
  <OrgProvider>
    <Outlet />
  </OrgProvider>
);

export const useOrg = () => {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
};