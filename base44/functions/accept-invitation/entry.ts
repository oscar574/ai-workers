import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { token } = body;
    if (!token) return Response.json({ error: 'Token requerido' }, { status: 400 });

    // Look up invitation by token (service role to bypass RLS)
    const invitations = await base44.asServiceRole.entities.Invitation.filter({ token, status: 'pending' });
    if (invitations.length === 0) {
      return Response.json({ error: 'Invitación no encontrada o ya utilizada' }, { status: 404 });
    }

    const invitation = invitations[0];

    // Check expiry
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
      await base44.asServiceRole.entities.Invitation.update(invitation.id, { status: 'expired' });
      return Response.json({ error: 'La invitación ha expirado' }, { status: 410 });
    }

    // Check email match
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return Response.json({
        error: 'Esta invitación fue enviada a otro correo electrónico. Inicia sesión con ' + invitation.email
      }, { status: 403 });
    }

    // Check if user already belongs to an org
    const existingMemberships = await base44.asServiceRole.entities.OrganizationUser.filter({
      user_id: user.id, status: 'active'
    });
    if (existingMemberships.length > 0) {
      return Response.json({ error: 'Ya perteneces a una organización' }, { status: 409 });
    }

    // Create OrganizationUser
    await base44.asServiceRole.entities.OrganizationUser.create({
      organization_id: invitation.organization_id,
      user_id: user.id,
      role: invitation.role,
      status: 'active',
      user_email: user.email,
      user_name: user.full_name || user.email
    });

    // Update User profile with org info
    await base44.asServiceRole.entities.User.update(user.id, {
      organization_id: invitation.organization_id,
      organization_role: invitation.role
    });

    // Mark invitation as accepted
    await base44.asServiceRole.entities.Invitation.update(invitation.id, { status: 'accepted' });

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      organization_id: invitation.organization_id,
      user_id: user.id,
      user_email: user.email,
      action: 'invitation_accepted',
      entity_type: 'Invitation',
      entity_id: invitation.id,
      details: { role: invitation.role, email: invitation.email }
    });

    return Response.json({ success: true, organization_id: invitation.organization_id, role: invitation.role });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});