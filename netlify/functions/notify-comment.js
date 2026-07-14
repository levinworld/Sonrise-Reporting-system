// Emails everyone who needs to know about a new comment or Way Forward:
// the department head who owns the report, PLUS every other leader
// (so leaders stay in sync even if they don't have the app open).
// The person who just posted the comment is never emailed about their own post.

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { reportId, authorId, authorName, comment, isWayForward } = JSON.parse(event.body);
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: report, error: rErr } = await admin.from('monthly_reports')
      .select('report_month, report_year, submitted_by, departments(name)')
      .eq('id', reportId).single();
    if (rErr) throw rErr;

    // Build recipient list: the department head who owns this report + every leader,
    // de-duplicated (covers people like Margaret who are both), minus the author.
    const recipients = new Map();
    if (report.submitted_by) {
      const { data: head } = await admin.from('profiles').select('id, email').eq('id', report.submitted_by).single();
      if (head) recipients.set(head.id, head.email);
    }
    const { data: leaders } = await admin.from('profiles').select('id, email').eq('is_leader', true);
    (leaders || []).forEach(l => recipients.set(l.id, l.email));
    recipients.delete(authorId);

    const toList = [...recipients.values()];
    if (!toList.length) return { statusCode: 200, body: JSON.stringify({ skipped: true }) };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala', day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit', hour12: true });
    const monthLabel = `${MONTHS[report.report_month - 1]} ${report.report_year}`;
    const deptName = report.departments.name;
    const kind = isWayForward ? 'Way Forward' : 'Comment';
    const siteUrl = process.env.SITE_URL || '';
    const link = siteUrl ? `${siteUrl}/#report-${reportId}` : '';

    await transporter.sendMail({
      from: `"Sonrise Ministries Reports" <${process.env.GMAIL_USER}>`,
      to: toList.join(','),
      subject: `${kind}: ${deptName} — ${monthLabel}`,
      text:
        `A ${kind.toLowerCase()} was posted on a monthly report.\n\n` +
        `From: ${authorName}\nDepartment: ${deptName}\nReport Month: ${monthLabel}\nDate: ${dateStr}\nTime: ${timeStr}\n\n` +
        `"${comment}"\n\nSign in to the reporting system to view and respond.\n${link}`,
      html:
        `<p>A <strong>${kind.toLowerCase()}</strong> was posted on a monthly report.</p>` +
        `<table style="border-collapse:collapse;font-size:14px;margin:10px 0;">
          <tr><td style="padding:3px 10px 3px 0;color:#666;">From</td><td><strong>${authorName}</strong></td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Department</td><td>${deptName}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Report Month</td><td>${monthLabel}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Date</td><td>${dateStr}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Time</td><td>${timeStr}</td></tr>
        </table>` +
        `<blockquote style="border-left:3px solid #B9852E;padding-left:10px;color:#333;">${comment.replace(/</g,'&lt;')}</blockquote>` +
        (link ? `<p><a href="${link}">Open the report</a></p>` : ''),
    });

    return { statusCode: 200, body: JSON.stringify({ sent: true, to: toList.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
