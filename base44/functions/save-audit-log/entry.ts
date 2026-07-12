import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, entity_type, entity_id, details, organization_id } = body;

    if (!action) return Response.json({ error: 'action es requerido' }, { status: 400 });

    const log = await base44.asServiceRole.entities.AuditLog.create({
      organization_id: organization_id || user.organization_id || null,
      user_id: user.id,
      user_email: user.email,
      action,
      entity_type: entity_type || '',
      entity_id: entity_id || '',
      details: details || {}
    });

    return Response.json({ success: true, log_id: log.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});