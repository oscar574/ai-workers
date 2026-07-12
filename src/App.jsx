import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
// Add page imports here
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { OrgLayout } from '@/lib/OrgContext';
import RootRedirect from '@/components/RootRedirect';
import AcceptInvitation from '@/pages/AcceptInvitation';
import NoOrganization from '@/pages/NoOrganization';
import Onboarding from '@/pages/onboarding/Onboarding';
import SuperAdminLayout from '@/components/superadmin/SuperAdminLayout';
import SuperAdminDashboard from '@/pages/superadmin/SuperAdminDashboard';
import SuperAdminOrganizations from '@/pages/superadmin/SuperAdminOrganizations';
import SuperAdminTemplates from '@/pages/superadmin/SuperAdminTemplates';
import SuperAdminPlans from '@/pages/superadmin/SuperAdminPlans';
import SuperAdminAudit from '@/pages/superadmin/SuperAdminAudit';
import BusinessLayout from '@/components/business/BusinessLayout';
import BusinessHome from '@/pages/business/BusinessHome';
import Assistant from '@/pages/business/Assistant';
import Knowledge from '@/pages/business/Knowledge';
import TestChat from '@/pages/business/TestChat';
import Leads from '@/pages/business/Leads';
import Conversations from '@/pages/business/Conversations';
import HumanRequests from '@/pages/business/HumanRequests';
import Integrations from '@/pages/business/Integrations';
import Team from '@/pages/business/Team';
import Metrics from '@/pages/business/Metrics';
import Settings from '@/pages/business/Settings';
import Plan from '@/pages/business/Plan';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accept-invitation" element={<AcceptInvitation />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<OrgLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="organizations" element={<SuperAdminOrganizations />} />
            <Route path="templates" element={<SuperAdminTemplates />} />
            <Route path="plans" element={<SuperAdminPlans />} />
            <Route path="audit" element={<SuperAdminAudit />} />
          </Route>
          <Route path="/app" element={<BusinessLayout />}>
            <Route index element={<BusinessHome />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="test-chat" element={<TestChat />} />
            <Route path="leads" element={<Leads />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="human-requests" element={<HumanRequests />} />
            <Route path="integrations" element={<Integrations />} />
            <Route path="team" element={<Team />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="plan" element={<Plan />} />
          </Route>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/no-organization" element={<NoOrganization />} />
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App