import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const ALLOWED_FIELDS = ['name', 'industry', 'website', 'phone', 'city', 'timezone', 'logo_url', 'primary_color', 'onboarding_step', 'selected_template_id'];
const BUSINESS_FIELDS = ['name', 'industry', 'website', 'phone', 'city', 'timezone', 'logo_url', 'primary_color'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    // Super_admin may target any org via organization_id; everyone else must be an active organization_admin of their own membership
    const SUPER_ADMIN_EMAIL = 'oscar@yong.mx';
    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL || user.role === 'super_admin' || user.role === 'admin';
    let organization_id;
    if (isSuperAdmin && body.organization_id) {
      let targetOrg;
      try { targetOrg = await base44.asServiceRole.entities.Organization.get(body.organization_id); } catch (e) {}
      if (!targetOrg) return Response.json({ error: 'Organización no encontrada' }, { status: 404 });
      organization_id = body.organization_id;
    } else {
      const orgUsers = await base44.asServiceRole.entities.OrganizationUser.filter({
        user_id: user.id, status: 'active'
      });
      const adminMembership = orgUsers.find(ou => ou.role === 'organization_admin');
      if (!adminMembership) {
        return Response.json({ error: 'No tienes permisos para editar esta organización' }, { status: 403 });
      }
      organization_id = adminMembership.organization_id;
    }

    // Filter to only allowed fields (whitelist) — ignores plan_id, limits, counters, status, etc.
    const filteredUpdates = {};
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        filteredUpdates[field] = body[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return Response.json({ error: 'No hay campos válidos para actualizar' }, { status: 400 });
    }

    // Get current org for audit comparison
    const currentOrg = await base44.asServiceRole.entities.Organization.get(organization_id);

    // Update with service role
    await base44.asServiceRole.entities.Organization.update(organization_id, filteredUpdates);

    // Audit log ONLY when business data changes (not onboarding_step advances)
    const changedBusinessFields = BUSINESS_FIELDS.filter(f =>
      f in filteredUpdates && String(filteredUpdates[f] ?? '') !== String(currentOrg[f] ?? '')
    );
    if (changedBusinessFields.length > 0) {
      const details = {};
      for (const f of changedBusinessFields) {
        details[f] = { from: currentOrg[f], to: filteredUpdates[f] };
      }
      await base44.asServiceRole.entities.AuditLog.create({
        organization_id,
        user_id: user.id,
        user_email: user.email,
        action: 'organization_settings_updated',
        entity_type: 'Organization',
        entity_id: organization_id,
        details
      });
    }

    return Response.json({ success: true, organization_id, updated_fields: Object.keys(filteredUpdates) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});