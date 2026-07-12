import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'super_admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, industry, plan_id, owner_email, owner_name, website, phone, city, timezone, primary_color, logo_url } = body;

    if (!name || !owner_email) {
      return Response.json({ error: 'Nombre y email del dueño son obligatorios' }, { status: 400 });
    }

    // Generate unique slug
    const slugBase = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    let slug = slugBase;
    let slugSuffix = 1;
    let existing = await base44.asServiceRole.entities.Organization.filter({ slug });
    while (existing.length > 0) {
      slugSuffix++;
      slug = slugBase + '-' + slugSuffix;
      existing = await base44.asServiceRole.entities.Organization.filter({ slug });
    }

    // Get plan defaults
    let conversationLimit = 50;
    let messageLimit = 500;
    if (plan_id) {
      try {
        const plan = await base44.asServiceRole.entities.SubscriptionPlan.get(plan_id);
        if (plan) {
          conversationLimit = plan.conversation_limit;
          messageLimit = plan.message_limit;
        }
      } catch (e) {}
    }

    // Create organization
    const org = await base44.asServiceRole.entities.Organization.create({
      name,
      slug,
      industry: industry || 'generico',
      website: website || '',
      phone: phone || '',
      city: city || '',
      logo_url: logo_url || '',
      primary_color: primary_color || '#4f46e5',
      timezone: timezone || 'America/Mexico_City',
      status: 'active',
      plan_id: plan_id || '',
      monthly_conversation_limit: conversationLimit,
      monthly_message_limit: messageLimit,
      current_conversation_usage: 0,
      current_message_usage: 0,
      usage_period_start: new Date().toISOString().split('T')[0],
      onboarding_step: 1,
      selected_template_id: ''
    });

    // Invite owner
    try {
      await base44.users.inviteUser(owner_email, 'user');
    } catch (e) {
      // User might already exist
    }

    // Find the user by email
    const users = await base44.asServiceRole.entities.User.filter({});
    const ownerUser = users.find(u => u.email.toLowerCase() === owner_email.toLowerCase());

    if (ownerUser) {
      // Create OrganizationUser for existing user
      await base44.asServiceRole.entities.OrganizationUser.create({
        organization_id: org.id,
        user_id: ownerUser.id,
        role: 'organization_admin',
        status: 'active',
        user_email: ownerUser.email,
        user_name: owner_name || ownerUser.full_name || ownerUser.email
      });

      // Update User profile
      await base44.asServiceRole.entities.User.update(ownerUser.id, {
        organization_id: org.id,
        organization_role: 'organization_admin'
      });
    }

    // Update org owner_user_id
    if (ownerUser) {
      await base44.asServiceRole.entities.Organization.update(org.id, { owner_user_id: ownerUser.id });
    }

    // Create invitation for owner (in case they haven't registered yet)
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await base44.asServiceRole.entities.Invitation.create({
      organization_id: org.id,
      organization_name: org.name,
      email: owner_email,
      role: 'organization_admin',
      token,
      status: ownerUser ? 'accepted' : 'pending',
      invited_by_user_id: user.id,
      invited_by_name: user.email,
      expires_at: expiresAt.toISOString()
    });

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      organization_id: org.id,
      user_id: user.id,
      user_email: user.email,
      action: 'organization_created',
      entity_type: 'Organization',
      entity_id: org.id,
      details: { name: org.name, slug: org.slug, industry: org.industry, owner_email }
    });

    return Response.json({ success: true, organization: org, invitation_token: token });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});