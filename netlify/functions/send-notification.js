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
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala', day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit', hour12: true });

    await transporter.sendMail({
      from: `"Sonrise Ministries Reports" <${process.env.GMAIL_USER}>`,
      to: leaders.map(l => l.email).join(','),
      subject: `New Report: ${departmentName} — ${month} ${year}`,
      text:
        `A monthly report has just been submitted.\n\n` +
        `From: ${submitterName}\nDepartment: ${departmentName}\nReport Month: ${month} ${year}\nDate: ${dateStr}\nTime: ${timeStr}\n\n` +
        `Sign in to the reporting system to view it and leave feedback or a way forward.\n${link}`,
      html:
        `<p>A monthly report has just been submitted.</p>` +
        `<table style="border-collapse:collapse;font-size:14px;margin:10px 0;">
          <tr><td style="padding:3px 10px 3px 0;color:#666;">From</td><td><strong>${submitterName}</strong></td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Department</td><td>${departmentName}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Report Month</td><td>${month} ${year}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Date</td><td>${dateStr}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Time</td><td>${timeStr}</td></tr>
        </table>` +
        (link ? `<p><a href="${link}">Open the report</a></p>` : ''),
    });

    return { statusCode: 200, body: JSON.stringify({ sent: true, to: leaders.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
