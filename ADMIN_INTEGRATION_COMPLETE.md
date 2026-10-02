# Admin Panel Integration: Complete Build Setup

The admin panel is now properly integrated with Supabase and the Vite build. This document explains what's been done and what remains.

## What's Complete ✅

### Build Wiring
- ✅ `vite.config.ts`: Admin is now a second entry point (`admin/index.html` → `dist/admin/index.html`)
- ✅ `admin/index.html`: Removed placeholders, added CSP header
- ✅ `vercel.json`: Added rewrites for `/admin` and `/admin/` to `/admin/index.html`; added security headers
- ✅ Build produces `dist/admin/` without any hardcoded secrets
- ✅ Admin imports `@supabase/supabase-js` from npm (not CDN)
- ✅ Admin reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `import.meta.env`

### Authentication
- ✅ `admin/js/supabase.js`: Email/password login via Supabase Auth
- ✅ Requires `admin_profiles` row to be active, otherwise signs out with error
- ✅ Updates `last_login_at` on sign-in
- ✅ `admin/js/app.js`: Replaced custom login with Supabase Auth

### Database (Migrations)
- ✅ First migration (`20250101000000_init_schema.sql`): All tables with initial RLS
- ✅ Second migration (`20250102000000_admin_ui_support.sql`): Admin mutation policies, activity log triggers, Storage buckets
- ✅ `is_admin()` function accepts all active `admin_profiles` rows (equal powers)
- ✅ Activity log triggers on all mutable tables (automatic logging)
- ✅ Views recreated with `security_invoker = true` for RLS enforcement

## What Remains ⏳

### 1. Run the Migrations (you do this)
Before anything else works:

1. Go to **Supabase SQL Editor** → **New Query**
2. Copy and run the contents of `supabase/migrations/20250101000000_init_schema.sql`
3. Copy and run the contents of `supabase/migrations/20250102000000_admin_ui_support.sql`
4. Verify the tables exist: **Table Editor** should show 16 tables

### 2. Create an Admin User (you do this)
1. Go to **Supabase → Authentication → Users**
2. Click **Invite user** and send an invite to your email
3. Follow the link, set a password
4. **Very important:** Don't just create the user. You must also add an `admin_profiles` row:
   - Go to **SQL Editor → New Query** and run:
   ```sql
   insert into public.admin_profiles (id, display_name, role, is_active)
   select id, 'Your Name', 'admin', true
   from auth.users
   where email = 'your-email@example.com'
   on conflict (id) do nothing;
   ```

### 3. Test the Build Locally (optional, for verification)
```bash
npm run dev
# Then in another terminal:
npm run admin  # Start the old Node server (not needed for the admin, but for /api calls)
# Visit http://localhost:5174/admin
# You should see the Supabase login form (not the old admin ID form)
```

### 4. Update the 9 Page Modules
The admin pages still call the old `/api/*` endpoints. They need to be rewritten to use Supabase. Each page follows the same pattern:

**Before (donations.js, donations.tsx):**
```javascript
import { api } from "./api.js";
const dons = await api("/donations");
```

**After (donations.js, using new data.js):**
```javascript
import { getDonations } from "./data.js";
const dons = await getDonations();
```

**Pages to update:**
1. `admin/js/dashboard.js` — fetch KPIs, recent submissions, activity log
2. `admin/js/donations.js` — fetch, create, update donations (with receipt_no calculation)
3. `admin/js/requests.js` — fetch, update document requests (with attachment handling)
4. `admin/js/events.js` — fetch, create, update, delete events (with image upload)
5. `admin/js/projects.js` — fetch, create, update, delete projects
6. `admin/js/volunteers.js` — fetch, create, update, delete volunteers
7. `admin/js/broadcast.js` — fetch history, send broadcasts (without email since no SMTP)
8. `admin/js/admins.js` — fetch admin list and activity log (read-only)
9. `admin/js/reports.js` — fetch monthly aggregations and analytics

### 5. Data Layer (`admin/js/data.js`)
This file needs to be rewritten to:
- Fetch from Supabase instead of the old API
- Return data shapes that match what the pages expect
- Handle pagination (1000-row limit on Supabase reads)
- Throw `Error` on Supabase errors, `AuthError` on 401/403
- Support mutations (create, update, delete)

**Key functions needed:**
- `getDashboardData()` — counts, funds, pending items, recent, activity, months
- `getDonations(filter?)` — with receipt_no calculation
- `getRequests(status?)` — with attachment counts and file handling
- `getEvents()` — with image URLs from Storage
- `getProjects()` — CRUD
- `getVolunteers()` — CRUD with status updates
- `getAdmins()` — read-only, with action counts
- `getActivityLog()` — with pagination
- `getBroadcastData()` — counts and history (no sending without SMTP)

Email features that show as disabled (since Vercel+Supabase-only doesn't include SMTP):
- "Email receipt" button → disabled with note "Email not configured"
- "Send to requester" → disabled with note "Email not configured"
- "Send broadcast" → disabled with note "Email not configured"
- Receipts and tax certificates → read-only views in the browser
- CSV export → generated client-side

### 6. Test Each Page
After updating each page module:
1. Load it at `/admin` in dev
2. Verify data loads (no errors in console)
3. Test create/update/delete where applicable
4. Check activity log entries appear
5. Verify RLS by testing with the anon key (should fail on admin tables)

## Security Notes

- The **publishable key** is visible in `dist/admin/` and the browser. This is safe because all data access is protected by RLS.
- The **service-role key** is never included anywhere in the browser code. (Grep confirms this.)
- Every admin mutation goes through RLS policies:
  - You can only insert/update/delete if `is_admin()` returns true
  - `is_admin()` checks `auth.uid()` against `admin_profiles`
  - Activity log entries are created automatically by database triggers
- Storage uploads go to Supabase buckets with separate RLS policies

## Timeline

1. **Now:** Migrations exist, build works, code is clean
2. **Next (you):** Run migrations, create admin user
3. **Then (you or me):** Update the 9 page modules to use Supabase
4. **Finally:** Test, deploy to Vercel

## Questions?

Refer to:
- `ADMIN_SUPABASE_MIGRATION.md` — older guide, still partially relevant
- `supabase/migrations/` — SQL code with inline comments
- `admin/js/supabase.js` — Supabase client setup and auth helpers
- `admin/js/app.js` — Example of how to use the new auth in a page

---

**Ready?** Run the migrations in Supabase, then create an admin user. The next step is filling in `admin/js/data.js` and updating the page modules.
