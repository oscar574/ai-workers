import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const ROLE_LABELS = { organization_admin: 'Administrador', agent: 'Agente', viewer: 'Lectura' };

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { email, role, organization_id: requestedOrgId } = body;
    if (!email || !role) return Response.json({ error: 'Email y rol son obligatorios' }, { status: 400 });
    if (!['organization_admin', 'agent', 'viewer'].includes(role)) {
      return Response.json({ error: 'Rol inválido' }, { status: 400 });
    }

    // Super_admin may target any org via organization_id; everyone else must be an active organization_admin of their own membership
    const SUPER_ADMIN_EMAIL = 'oscar@yong.mx';
    const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL || user.role === 'super_admin' || user.role === 'admin';
    let organization_id;
    if (isSuperAdmin && requestedOrgId) {
      let targetOrg;
      try { targetOrg = await base44.asServiceRole.entities.Organization.get(requestedOrgId); } catch (e) {}
      if (!targetOrg) return Response.json({ error: 'Organización no encontrada' }, { status: 404 });
      organization_id = requestedOrgId;
    } else {
      const orgUsers = await base44.asServiceRole.entities.OrganizationUser.filter({
        user_id: user.id, status: 'active'
      });
      const adminMembership = orgUsers.find(ou => ou.role === 'organization_admin');
      if (!adminMembership) {
        return Response.json({ error: 'No tienes permisos para invitar usuarios' }, { status: 403 });
      }
      organization_id = adminMembership.organization_id;
    }

    // Check if email already has active membership in this org
    const existingMembers = await base44.asServiceRole.entities.OrganizationUser.filter({
      organization_id, status: 'active'
    });
    const duplicateMember = existingMembers.find(m => m.user_email && m.user_email.toLowerCase() === email.toLowerCase());
    if (duplicateMember) {
      return Response.json({ error: 'Este usuario ya pertenece a la organización' }, { status: 409 });
    }

    // Check if email already has pending invitation in this org
    const existingInvites = await base44.asServiceRole.entities.Invitation.filter({
      organization_id, status: 'pending'
    });
    const duplicateInvite = existingInvites.find(inv => inv.email && inv.email.toLowerCase() === email.toLowerCase());
    if (duplicateInvite) {
      return Response.json({ error: 'Ya hay una invitación pendiente para este email' }, { status: 409 });
    }

    // Get org name
    const org = await base44.asServiceRole.entities.Organization.get(organization_id);

    // Generate token and expiration (7 days)
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation with service role
    await base44.asServiceRole.entities.Invitation.create({
      organization_id,
      organization_name: org.name,
      email,
      role,
      token,
      status: 'pending',
      invited_by_user_id: user.id,
      invited_by_name: user.email,
      expires_at: expiresAt.toISOString()
    });

    // Build invitation link from request URL
    const url = new URL(req.url);
    const origin = `${url.protocol}//${url.host}`;
    const link = `${origin}/accept-invitation?token=${token}`;

    // Send email
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `Invitación a ${org.name}`,
        body: `Has sido invitado a unirte a ${org.name} en AI Workers como ${ROLE_LABELS[role] || role}.\n\nHaz clic en el siguiente enlace para aceptar:\n${link}\n\nEl enlace expira en 7 días.`
      });
    } catch (e) {
      // Email failure is not critical — the link is returned to the UI
    }

    // Audit log with service role
    await base44.asServiceRole.entities.AuditLog.create({
      organization_id,
      user_id: user.id,
      user_email: user.email,
      action: 'invitation_created',
      entity_type: 'Invitation',
      entity_id: token,
      details: { email, role }
    });

    return Response.json({ success: true, link });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});