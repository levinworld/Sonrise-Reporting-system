// Admin-only diagnostic for the email notifications.
// Called by the "Email Notifications Check" card on the Admin tab. It:
//   1. confirms the Netlify settings are present,
//   2. confirms the caller is a signed-in admin,
//   3. lists who would receive each kind of email,
//   4. logs in to Gmail with the App Password, and
//   5. sends one test email to the admin who pressed the button.

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const json = (statusCode, body) => ({ statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const checks = [];
  const add = (ok, label, detail) => checks.push({ ok, label, detail: detail || '' });

  try {
    const header = event.headers.authorization || event.headers.Authorization || '';
    const token = header.replace(/^Bearer\s+/i, '');
    if (!token) return json(401, { error: 'Not signed in.' });

    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GMAIL_USER', 'GMAIL_APP_PASSWORD'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length) {
      add(false, 'Netlify settings', 'Missing environment variable(s): ' + missing.join(', ') + '. Add them in Netlify → Site settings → Environment variables, then redeploy.');
      return json(200, { checks });
    }

    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: auth, error: aErr } = await admin.auth.getUser(token);
    if (aErr || !auth || !auth.user) return json(401, { error: 'Your session could not be verified. Sign in again.' });
    const { data: me } = await admin.from('profiles').select('full_name, email, is_admin').eq('id', auth.user.id).single();
    if (!me || !me.is_admin) return json(403, { error: 'Admins only.' });

    add(true, 'Netlify settings', 'Supabase and Gmail settings are present.' + (process.env.SITE_URL ? '' : ' (SITE_URL is not set, so emails will not contain a link to open the report.)'));
    if (!process.env.SITE_URL) checks[checks.length - 1].ok = false;

    // Who gets what
    const { data: people } = await admin.from('profiles').select('full_name, email, is_leader, is_director, is_ministry_manager, department_id');
    const names = (list) => list.length ? list.map(p => `${p.full_name} <${p.email}>`).join('; ') : 'NOBODY';
    const leaders = (people || []).filter(p => p.is_leader);
    const directors = (people || []).filter(p => p.is_director);
    const managers = (people || []).filter(p => p.is_ministry_manager);
    add(leaders.length > 0, `Department report submitted → ${leaders.length} leader(s) emailed`, names(leaders));
    add(directors.length > 0, `Executive report submitted → ${directors.length} director(s) emailed`, names(directors));
    add(managers.length > 0 && directors.length > 0, 'Comment on the executive report → Ministry Manager + Directors', names([...managers, ...directors]));

    const { data: depts } = await admin.from('departments').select('id, name');
    const withHead = new Set((people || []).filter(p => p.department_id).map(p => p.department_id));
    const noHead = (depts || []).filter(d => !withHead.has(d.id));
    add(noHead.length === 0, 'Every department has an account that would receive comments and replies',
      noHead.length ? 'No account yet for: ' + noHead.map(d => d.name).join(', ') : '');

    // Gmail login + real test email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    try {
      await transporter.verify();
      add(true, 'Gmail login', 'Signed in to ' + process.env.GMAIL_USER + ' with the App Password.');
    } catch (e) {
      add(false, 'Gmail login', 'Gmail refused the login: ' + e.message + '. Check GMAIL_USER and generate a fresh App Password (needs 2-Step Verification on that Gmail account).');
      return json(200, { checks });
    }
    try {
      await transporter.sendMail({
        from: `"Sonrise Ministries Reports" <${process.env.GMAIL_USER}>`,
        to: me.email,
        subject: 'Sonrise Reports — email test',
        text: 'If you are reading this, report notification emails are working.',
        html: '<p>If you are reading this, report notification emails are working. ✅</p><p style="color:#666;font-size:12px;">Check your Spam folder the first time, and mark this sender as "Not spam" so real notifications reach your inbox.</p>',
      });
      add(true, 'Test email sent', 'Sent to ' + me.email + '. Check that inbox (and Spam).');
    } catch (e) {
      add(false, 'Test email', e.message);
    }
    return json(200, { checks });
  } catch (err) {
    console.error(err);
    add(false, 'Unexpected error', err.message);
    return json(500, { error: err.message, checks });
  }
};
