// Emails everyone who needs to know about a new comment, reply or Way Forward.
//
// Department report:  the department's own staff + every leader.
// Executive report:   the Ministry Manager + every Director.
// The person who just posted is never emailed about their own post, so a leader's
// comment reaches the department, and the department's reply reaches the leaders.

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  try {
    const { reportId, executiveReportId, authorId, authorName, comment, isWayForward } = JSON.parse(event.body);
    const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    const recipients = new Map();   // id -> email (de-duplicates people who hold two roles)
    let monthLabel, deptName, link, hashPrefix;
    const siteUrl = process.env.SITE_URL || '';

    if (executiveReportId) {
      const { data: rep, error } = await admin.from('executive_reports')
        .select('report_month, report_year').eq('id', executiveReportId).single();
      if (error) throw error;
      monthLabel = `${MONTHS[rep.report_month - 1]} ${rep.report_year}`;
      deptName = 'Ministry Manager Executive Report';
      hashPrefix = 'exec';
      const { data: people } = await admin.from('profiles').select('id, email, is_director, is_ministry_manager');
      (people || []).filter(p => p.is_director || p.is_ministry_manager).forEach(p => recipients.set(p.id, p.email));
      link = siteUrl ? `${siteUrl}/#exec-${executiveReportId}` : '';
    } else {
      const { data: report, error: rErr } = await admin.from('monthly_reports')
        .select('report_month, report_year, submitted_by, department_id, departments(name)')
        .eq('id', reportId).single();
      if (rErr) throw rErr;
      monthLabel = `${MONTHS[report.report_month - 1]} ${report.report_year}`;
      deptName = report.departments.name;
      hashPrefix = 'report';
      // Everyone who belongs to the department (not only the person who pressed Submit).
      const { data: members } = await admin.from('profiles').select('id, email').eq('department_id', report.department_id);
      (members || []).forEach(m => recipients.set(m.id, m.email));
      if (report.submitted_by && !recipients.has(report.submitted_by)) {
        const { data: head } = await admin.from('profiles').select('id, email').eq('id', report.submitted_by).single();
        if (head) recipients.set(head.id, head.email);
      }
      const { data: leaders } = await admin.from('profiles').select('id, email').eq('is_leader', true);
      (leaders || []).forEach(l => recipients.set(l.id, l.email));
      link = siteUrl ? `${siteUrl}/#report-${reportId}` : '';
    }
    recipients.delete(authorId);

    const toList = [...recipients.values()].filter(Boolean);
    if (!toList.length) return { statusCode: 200, body: JSON.stringify({ skipped: true }) };

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { timeZone: 'Africa/Kampala', day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Africa/Kampala', hour: '2-digit', minute: '2-digit', hour12: true });
    const kind = isWayForward ? (executiveReportId ? 'Final Directive' : 'Way Forward') : 'Comment';

    await transporter.sendMail({
      from: `"Sonrise Ministries Reports" <${process.env.GMAIL_USER}>`,
      to: toList.join(','),
      subject: `${kind}: ${deptName} — ${monthLabel}`,
      text:
        `A ${kind.toLowerCase()} was posted on a report.\n\n` +
        `From: ${authorName}\nReport: ${deptName}\nReport Month: ${monthLabel}\nDate: ${dateStr}\nTime: ${timeStr}\n\n` +
        `"${comment}"\n\nSign in to the reporting system to view and respond.\n${link}`,
      html:
        `<p>A <strong>${esc(kind.toLowerCase())}</strong> was posted on a report.</p>` +
        `<table style="border-collapse:collapse;font-size:14px;margin:10px 0;">
          <tr><td style="padding:3px 10px 3px 0;color:#666;">From</td><td><strong>${esc(authorName)}</strong></td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Report</td><td>${esc(deptName)}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Report Month</td><td>${esc(monthLabel)}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Date</td><td>${dateStr}</td></tr>
          <tr><td style="padding:3px 10px 3px 0;color:#666;">Time</td><td>${timeStr}</td></tr>
        </table>` +
        `<blockquote style="border-left:3px solid #B9852E;padding-left:10px;color:#333;white-space:pre-wrap;">${esc(comment)}</blockquote>` +
        (link ? `<p><a href="${esc(link)}">Open the report</a></p>` : ''),
    });

    return { statusCode: 200, body: JSON.stringify({ sent: true, to: toList.length }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
