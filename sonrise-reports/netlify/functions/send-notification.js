// Sends an email to every "leader" the instant a department report is submitted.
// Uses Gmail SMTP with an App Password (NOT your normal Gmail password —
// see the setup README for how to generate one).

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { departmentName, month, year, submitterName, reportId } = JSON.parse(event.body);

    // Service-role client so we can read the leader list server-side, bypassing RLS.
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: leaders, error } = await admin.from('profiles').select('email, full_name').eq('is_leader', true);
    if (error) throw error;
    if (!leaders || !leaders.length) {
      return { statusCode: 200, body: JSON.stringify({ warning: 'No leaders configured — no email sent.' }) };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,           // e.g. brendaarinda5@gmail.com
        pass: process.env.GMAIL_APP_PASSWORD,    // 16-character App Password, not the account password
      },
    });

    const siteUrl = process.env.SITE_URL || '';
    const link = siteUrl ? `${siteUrl}/#report-${reportId}` : '';

    await transporter.sendMail({
      from: `"Sonrise Ministries Reports" <${process.env.GMAIL_USER}>`,
      to: leaders.map(l => l.email).join(','),
      subject: `New Report: ${departmentName} — ${month} ${year}`,
      text: `${submitterName} has just submitted the ${departmentName} monthly report for ${month} ${year}.\n\n` +
            `Sign in to the reporting system to view it and leave feedback or a "way forward".\n${link}`,
      html: `<p><strong>${submitterName}</strong> has just submitted the <strong>${departmentName}</strong> monthly report for <strong>${month} ${year}</strong>.</p>` +
            `<p>Sign in to the reporting system to view it and leave feedback or a "way forward".</p>` +
            (link ? `<p><a href="${link}">Open the report</a></p>` : ''),
    });

    return { statusCode: 200, body: JSON.stringify({ sent: true, to: leaders.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
