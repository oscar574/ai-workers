import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const SUPER_ADMIN_EMAIL = 'oscar@yong.mx';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Auto-promote bootstrap super admin
    const isBootstrapEmail = user.email === SUPER_ADMIN_EMAIL;
    if (isBootstrapEmail && user.role !== 'super_admin') {
      try {
        await base44.asServiceRole.entities.User.update(user.id, { role: 'super_admin' });
        user.role = 'super_admin';
      } catch (e) {
        // Can't update role (e.g., app owner has 'admin' role which is locked)
        // Treat as super_admin anyway
      }
    }

    if (isBootstrapEmail || user.role === 'super_admin' || user.role === 'admin') {
      return Response.json({
        user: { id: user.id, email: user.email, full_name: user.full_name, role: 'super_admin' },
        organization: null,
        organization_role: 'super_admin',
        needs_onboarding: false,
        is_super_admin: true
      });
    }

    // Look up organization membership
    const orgUsers = await base44.asServiceRole.entities.OrganizationUser.filter({
      user_id: user.id, status: 'active'
    });

    if (orgUsers.length === 0) {
      return Response.json({
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        organization: null,
        organization_role: null,
        needs_onboarding: false,
        is_super_admin: false
      });
    }

    const orgUser = orgUsers[0];
    let organization = null;
    try {
      organization = await base44.asServiceRole.entities.Organization.get(orgUser.organization_id);
    } catch (e) {
      // Org might not exist
    }

    if (!organization) {
      return Response.json({
        user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
        organization: null,
        organization_role: null,
        needs_onboarding: false,
        is_super_admin: false
      });
    }

    // Check if onboarding is complete
    const employees = await base44.asServiceRole.entities.AIEmployee.filter({
      organization_id: organization.id
    });
    const needs_onboarding = employees.length === 0 || (organization.onboarding_step && organization.onboarding_step < 6);

    // Ensure user profile has organization_id synced
    if (user.organization_id !== organization.id || user.organization_role !== orgUser.role) {
      await base44.asServiceRole.entities.User.update(user.id, {
        organization_id: organization.id,
        organization_role: orgUser.role
      });
    }

    return Response.json({
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      organization,
      organization_role: orgUser.role,
      needs_onboarding,
      is_super_admin: false
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});