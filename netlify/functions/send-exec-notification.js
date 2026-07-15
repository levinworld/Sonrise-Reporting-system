// Notifies ONLY the Executive Directors when the Ministry Manager submits her
// monthly executive report. Uses the same Gmail sender as the other notifications.

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { month, year, submitterName, reportId } = JSON.parse(event.body);
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Directors only — not the full leader group.
    const { data: directors, error } = await admin.from('profiles').select('email, full_name').eq('is_director', true);
    if (error) throw error;
    if (!directors || !directors.length) {
      return { statusCode: 200, body: JSON.stringify({ warning: 'No directors configured — no email sent.' }) };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala', day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit', hour12: true });
    const siteUrl = process.env.SITE_URL || '';
    const link = siteUrl ? `${siteUrl}/#exec-${reportId}` : '';

    await transporter.sendMail({
      from: `"Sonrise Ministries Reports" <${process.env.GMAIL_USER}>`,
      to: directors.map(d => d.email).join(','),
      subject: `Executive Report: Ministry Manager — ${month} ${year}`,
      text:
        `The Ministry Manager's monthly executive report has been submitted for your review.\n\n` +
        `From: ${submitterName}\nReport: Ministry Manager Executive Report\nMonth: ${month} ${year}\nDate: ${dateStr}\nTime: ${timeStr}\n\n` +
        `Sign in to review it and provide your comments or final directives.\n${link}`,
      html:
        `<p>The Ministry Manager's monthly executive report has been submitted for your review.</p>` +
        `<table style="border-collapse:collapse;font-size:14px;margin:10px 0;">
          <tr><td style="padding:3px 10px 3px 0;color:#666;">From</td><td><strong>${submitterName}</strong></td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Report</td><td>Ministry Manager Executive Report</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Month</td><td>${month} ${year}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Date</td><td>${dateStr}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Time</td><td>${timeStr}</td></tr>
        </table>` +
        (link ? `<p><a href="${link}">Open the executive report</a></p>` : ''),
    });

    return { statusCode: 200, body: JSON.stringify({ sent: true, to: directors.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
