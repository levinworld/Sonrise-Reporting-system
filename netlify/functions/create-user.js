// Admin-only endpoint: creates a Supabase Auth user + profile row for a new
// department head or leader. Protected two ways:
//   1. The caller must send a valid Supabase session token (Authorization header).
//   2. That token's user must have is_admin = true in the profiles table.
// The service-role key (which can bypass all security) never reaches the browser —
// it only ever lives here, on the server.

const { createClient } = require('@supabase/supabase-js');

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const authHeader = event.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return { statusCode: 401, body: JSON.stringify({ error: 'Missing auth token' }) };

  const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // 1. Identify the caller from their token.
  const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !caller) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) };

  // 2. Confirm the caller is an admin.
  const { data: callerProfile } = await admin.from('profiles').select('is_admin').eq('id', caller.id).single();
  if (!callerProfile || !callerProfile.is_admin) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Only admins can create accounts.' }) };
  }

  try {
    const { full_name, email, role_title, department_id, is_leader, is_admin } = JSON.parse(event.body);
    if (!full_name || !email) return { statusCode: 400, body: JSON.stringify({ error: 'Full name and email are required.' }) };

    const tempPassword = randomPassword();

    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email, password: tempPassword, email_confirm: true,
    });
    if (createErr) throw createErr;

    const { error: profileErr } = await admin.from('profiles').insert({
      id: newUser.user.id, full_name, email, role_title: role_title || null,
      department_id: department_id || null, is_leader: !!is_leader, is_admin: !!is_admin,
    });
    if (profileErr) throw profileErr;

    return { statusCode: 200, body: JSON.stringify({ success: true, tempPassword }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
