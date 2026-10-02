# Supabase Setup Guide

This document walks through setting up the Supabase project for production deployment.

## Prerequisites

- A Supabase account and project (already created at https://phphmpaopfdvqcnzxmna.supabase.co)
- The project URL and publishable API key (already in `.env`)
- Access to Supabase SQL Editor

## Step 1: Run the migration SQL

The database schema is defined in `supabase/migrations/20250101000000_init_schema.sql`.

**To run it:**

1. Go to Supabase → Your Project → SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/20250101000000_init_schema.sql`
4. Paste into the editor and click "Run"

The migration will:
- Create 16 tables (donations, volunteers, campaigns, projects, events, etc.)
- Set up Row Level Security (RLS) on all tables
- Create views for the public site and admin dashboard
- Create indexes for performance
- Add triggers for automatic `updated_at` timestamps
- Insert sample data (for testing; delete before production)

**Verify:** In the Supabase dashboard, go to the Table Editor. You should see all 16 tables listed.

## Step 2: Set up Supabase Authentication

1. Go to Supabase → Your Project → Authentication → Providers
2. Ensure "Email" provider is enabled
3. Go to Authentication → Settings:
   - **Disable** "Enable sign-ups" (only admins, invited by email)
   - **Enable** "Confirm email before signing in"
   - **Set Site URL** to your production domain (e.g., `https://saharangosag.com`) or local dev (`http://localhost:5174` for development)
   - **Add Redirect URLs:**
     - `http://localhost:5174/admin` (for local dev)
     - `http://localhost:5174` (for local dev)
     - `https://yourdomain.com/admin` (for production)
     - `https://yourdomain.com` (for production)

4. Go to Authentication → Users:
   - Click "Invite user"
   - Enter your admin email
   - Supabase sends an invitation link
   - Create a password

## Step 3: Create the admin profile

After the admin user is created in Auth:

1. Go to Supabase → SQL Editor → New Query
2. Run this SQL (replace the email with your actual admin email):

```sql
insert into public.admin_profiles (id, display_name, role, is_active)
select id, 'Admin Name', 'admin', true
from auth.users
where email = 'admin@example.com'
on conflict (id) do nothing;
```

This links the auth user to an admin profile with full permissions.

## Step 4: Enable Row Level Security

RLS is already enabled and configured in the migration. Verify:

1. Go to Supabase → Your Project → SQL Editor → New Query
2. Run:

```sql
select tablename from pg_tables
where schemaname = 'public'
and tablename not like 'pg_%'
order by tablename;
```

3. For each table, check that RLS is on:
   - Go to Table Editor → select a table
   - Click the "lock" icon in the top-right corner
   - Verify RLS is "enabled"

All tables should already have RLS enabled by the migration.

## Step 5: Delete sample data (before production)

The migration includes sample campaigns, projects and stats for testing. Before launching:

1. Go to Supabase → SQL Editor → New Query
2. Run:

```sql
delete from public.campaigns where slug = 'test-campaign';
delete from public.projects where name = 'Test Project';
delete from public.site_stats where label in (
  'Direct & indirect beneficiaries',
  'Children in education programmes',
  'Patients supported',
  'Women in SHGs & livelihoods',
  'Environment participants',
  'Working since'
);
```

3. Re-insert your real data using SQL or the Supabase Table Editor

## Step 6: Configure backups (production only)

1. Go to Supabase → Your Project → Settings → Backups
2. Enable **Point-in-Time Recovery (PITR)** (allows recovery to any point in the past 7 days)
3. This is crucial for financial records

## Step 7: Local development environment

If you want to use Supabase locally:

```bash
npm install -g supabase
supabase start
```

This runs Postgres, Auth, and Storage locally. For development, the remote project (already set in `.env`) is simpler.

## Testing the connection

Run the provided health check in the app:

```bash
npm run dev
# Then in the browser, open DevTools and check the console
```

The site should connect to Supabase Auth and fetch events/projects/campaigns.

## Troubleshooting

| Problem | Solution |
|---|---|
| "Secret API key required" error | You're using the wrong key. Use the **publishable** key (`sb_publishable_...`) in `VITE_SUPABASE_PUBLISHABLE_KEY`, never the secret key. |
| "Could not find the table" | The migration SQL didn't run. Go to SQL Editor and verify all 16 tables exist in the Table Editor. |
| "No such table: admin_users" or old SQLite references | The Vercel deployment is still using the old Node server code. Make sure the new Vercel functions are deployed. |
| Admin can't log in | Check that: (1) the auth user exists (Authentication → Users), (2) admin_profiles has a matching row, (3) the email is confirmed. |
| Forms submit but nothing is saved | Check RLS policies in Supabase. The public insert policies for `document_requests` and `volunteers` may need to be enabled, or the Vercel function may not be deployed yet. |

## Security notes

- The **publishable key** is safe to use in the browser (it's already in your `.env` and in the built JS).
- The **service role key** (secret) is never used in the browser. It stays on the server only, for webhooks and privileged operations.
- All table access is controlled by RLS policies, which check `is_admin()` or allow specific public operations.
- Sensitive data (donor PAN, donation amounts, volunteer emails) are read-only by admins and never exposed to the public.

## Next steps

1. ✅ Supabase project created and database schema running
2. ⬜ Rewrite the admin panel to use Supabase Auth and the client
3. ⬜ Create Vercel functions for public forms (document requests and volunteers)
4. ⬜ Migrate `live.json` data into the database tables
5. ⬜ Deploy to Vercel with environment variables set
6. ⬜ Test responsiveness and RLS policies
7. ⬜ Go live

---

For more help, see the [Supabase docs](https://supabase.com/docs) and the inline comments in `supabase/migrations/20250101000000_init_schema.sql`.
