// Admin-only endpoint: edits an existing person's profile, and — if their
// email changed — updates their actual Supabase Auth login email too, so the
// two never fall out of sync (which would otherwise break login + notifications).

const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Missing auth token' }) };

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !caller) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) };

  const { data: callerProfile } = await admin.from('profiles').select('is_admin').eq('id', caller.id).single();
  if (!callerProfile || !callerProfile.is_admin) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Only admins can edit accounts.' }) };
  }

  try {
    const { userId, full_name, email, role_title, department_id, is_leader, is_admin } = JSON.parse(event.body);
    if (!userId || !full_name || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId, full_name, and email are required.' }) };
    }

    // Check whether the email is actually changing before touching Auth —
    // updateUserById on an unchanged email is harmless, but no need to call it.
    const { data: existing } = await admin.from('profiles').select('email').eq('id', userId).single();
    const emailChanged = existing && existing.email !== email;
    if (emailChanged) {
      const { error: authUpdateErr } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
      if (authUpdateErr) throw authUpdateErr;
    }

    const { error: profileErr } = await admin.from('profiles').update({
      full_name, email, role_title: role_title || null,
      department_id: department_id || null, is_leader: !!is_leader, is_admin: !!is_admin,
    }).eq('id', userId);
    if (profileErr) throw profileErr;

    return { statusCode: 200, body: JSON.stringify({ success: true, emailChanged }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
