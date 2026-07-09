# Sonrise Ministries — Monthly Reporting System

## What's built right now

- Full login system, role-based access (department head / leader / admin)
- Admin panel to add/edit every person's name, role, email, department, and access level
- A dynamic report engine — the **Farm Department** report is fully built (all 19 sections,
  auto-calculated totals, live dashboard) and proves the pattern
- Real-time comments and "way forward" flagging, visible to all leaders and to the
  department head who owns that report
- Deadline auto-lock after the 5th of the month — enforced in the database itself, so it
  can't be bypassed even by editing the website's code
- Email notification to all leaders (Melissa, Ivan, Brenda, Margaret) the instant a report
  is submitted, sent from **brendaarinda5@gmail.com**

**Still to come (next round):** the other 11 department report forms — Transport, Social
Work, Security, Children's Home, ICT, Tailoring, Maintenance, Medical, School, Procurement,
Accounts. Each one is a schema addition to `schemas.js`, following the exact same pattern
as Farm — no other file needs to change. Their tabs will show "being finalized" until then,
so the system runs correctly today for everyone.

---

## Step 1 — Create the Supabase project

1. Go to supabase.com → New Project. Name it something like `sonrise-reports`.
2. Once created, go to **SQL Editor → New query**, paste the entire contents of
   `schema.sql`, and run it. This creates all tables, the 12 departments, and the security
   rules that enforce who can see and submit what.
3. Go to **Project Settings → API**. You'll need three values from here shortly:
   - `Project URL`
   - `anon` `public` key
   - `service_role` key (⚠️ keep this one secret — never put it in `index.html`)

## Step 2 — Create the first admin account (you)

The admin panel can create every other account, but the very first admin has to be
created by hand:

1. In Supabase: **Authentication → Users → Add User**. Enter your email and a password,
   and tick "Auto Confirm User".
2. Copy the new user's ID (shown in the users list).
3. Back in **SQL Editor**, run:
   ```sql
   insert into profiles (id, full_name, email, role_title, is_admin)
   values ('PASTE-THE-USER-ID-HERE', 'George Ssekyanzi', 'you@example.com', 'System Administrator', true);
   ```
4. You can now sign in to the app and use the Admin tab to add everyone else — each
   person gets a temporary password shown on screen, which you relay to them directly
   (WhatsApp/SMS is fine).

## Step 3 — Set up the sending email (Gmail App Password)

Automated emails will be sent from **brendaarinda5@gmail.com**. Gmail will not accept
its normal login password for this — it needs an **App Password**:

1. On that Gmail account: go to myaccount.google.com/security.
2. Turn on **2-Step Verification** if it isn't already on (required for App Passwords to
   exist as an option).
3. Search settings for **App Passwords** → create one, name it "Sonrise Reports" → Google
   shows a 16-character code. Copy it — you won't be able to see it again.

## Step 4 — Deploy to Netlify

1. Push this folder to a GitHub repo, then in Netlify: **Add new site → Import from Git**,
   pick the repo.
2. In **Site settings → Environment variables**, add:
   | Key | Value |
   |---|---|
   | `SUPABASE_URL` | your Project URL from Step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key from Step 1 |
   | `GMAIL_USER` | `brendaarinda5@gmail.com` |
   | `GMAIL_APP_PASSWORD` | the 16-character code from Step 3 |
   | `SITE_URL` | your Netlify site URL, once you know it (e.g. `https://sonrise-reports.netlify.app`) |
3. In `index.html`, replace the two placeholder lines near the top of the `<script>` block:
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
   ```
   with your real Project URL and `anon` `public` key from Step 1. (The anon key is safe
   to expose publicly — it only ever acts within the security rules from `schema.sql`.)
4. Deploy. Netlify will pick up `netlify.toml` automatically and wire up the two functions.

## Step 5 — Add everyone through the Admin tab

Once you're signed in as admin, add each person below. Where an email is marked
"— add later", enter a placeholder (e.g. their name @ a temporary address) and swap it
for the real one once you have it; nothing else needs to change.

**Leaders** (see & comment on every report):
| Name | Email |
|---|---|
| Melissa Mukulu — Director | melissamukulu@sonriseminchildren.org |
| Ivan Mukulu — Director | ivanmukulu@sonriseminchildren.org |
| Brenda Arinda — Ministry Manager | brendaarinda@sonriseminchildren.org |
| Margaret Nambogwe — Accountant/Admin & HR Manager | margaretnambogwe@sonriseminchildren.org |

**Department heads** (submit only their own report):
| Department | Name | Email |
|---|---|---|
| Farm | Kidheba Rogers | farm.sonrisekamuli@gmail.com |
| Transport | Emmanuel Kigere | — add later |
| Social Work | Ochii Denis / Amuge Gloria | dennisochii@sonriseminchildren.org |
| Security | Opio John Richard | — add later |
| Children's Home | Namuddu Mariam | — add later |
| ICT | Musaba Ivan Mulinde | ivan.ictsonriseministries@gmail.com |
| Tailoring | Nakiranda Peninah | — add later |
| Maintenance | Kamoga Eriah (Acting) | — add later |
| Medical | Lakor Phillips | phillipslakor@sonriseminchildren.org |
| School | Nyaromo Alice | alicenyaromo@sonriseminchildren.org |
| Procurement | Waiswa Moses | moseswaiswa@sonriseminchildren.org |
| Accounts | Margaret Nambogwe *(also tick "Leader")* | margaretnambogwe@sonriseminchildren.org |

Note: only Farm's report form is live right now — the other 11 heads will see a
"being finalized" message when they sign in, until their department's schema is added.

---

## How the deadline lock actually works

It isn't just hidden in the interface — it's enforced as a database rule (`schema.sql`,
`is_within_submission_window()`), checked in Uganda time. Even someone editing the
website's code or calling the database directly cannot submit past the 5th unless their
account is flagged as admin. Admins can always submit/edit, which gives you a manual
override path for late submissions if a leader approves one.

## How adding a new department works (for future you)

1. Open `schemas.js`.
2. Copy the shape of `FARM_SCHEMA` — sections, fields, tables, a `dashboard` array.
3. Replace that department's `stub(...)` entry in `SCHEMAS` with your new object.
4. No changes needed anywhere else — the engine in `index.html` renders whatever schema
   it's given.
