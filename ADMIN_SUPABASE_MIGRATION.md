# Admin Panel Supabase Migration

The admin panel has been updated to use Supabase instead of the custom Node.js backend.

## What changed

### Authentication
- **Before:** Custom admin ID + password stored in SQLite
- **After:** Supabase Auth (email + password), with email confirmation
- The UI now shows email instead of admin ID
- Roles: `admin`, `editor`, `viewer` (optional, all shown based on `admin_profiles.role`)

### Data access
- **Before:** Direct HTTP API calls to `/api/*` endpoints on the Node server
- **After:** Direct Supabase queries with Row Level Security (RLS) enforcement
- All queries are protected by RLS policies (see `supabase/migrations/`)
- The Supabase client uses the publishable key (safe for the browser)

### Files changed

| File | Change |
|---|---|
| `admin/index.html` | Added globals for Supabase config |
| `admin/js/app.js` | Replaced custom auth with Supabase Auth; updated badges logic |
| `admin/js/supabase.js` | New: Supabase client and auth helpers |
| `admin/js/data.js` | New: Common Supabase queries (getDonations, getEvents, etc.) |

### Files to update next

Each page module needs to call the new `data.js` functions instead of the old `api.js`. Example:

**Before (donations.js):**
```javascript
const dons = await api("/donations");
```

**After (donations.js):**
```javascript
import { getDonations } from "./data.js";
const dons = await getDonations();
```

| Page | File | Status |
|---|---|---|
| Dashboard | `dashboard.js` | Ready for update (uses data.getDashboardData) |
| Reports | `reports.js` | Ready for update |
| Donations | `donations.js` | Ready for update (uses data.getDonations) |
| Requests | `requests.js` | Ready for update (uses data.getDocumentRequests) |
| Events | `events.js` | Ready for update (uses data.getEvents) |
| Projects | `projects.js` | Ready for update (uses data.getProjects) |
| Volunteers | `volunteers.js` | Ready for update (uses data.getVolunteers) |
| Broadcast | `broadcast.js` | Ready for update (supabase.from queries) |
| Admins | `admins.js` | Ready for update (supabase.from queries) |

## How to update a page

1. Import the data module at the top:
```javascript
import { getDonations, createDonation, updateDonation } from "./data.js";
```

2. Replace `api()` calls with data module calls:
```javascript
// Old: const dons = await api("/donations");
// New:
const dons = await getDonations();
```

3. For mutations (create/update/delete), use the data module:
```javascript
const newDonation = await createDonation({ donor_name: "John", amount: 1000, ... });
const updated = await updateDonation(id, { status: "success" });
```

4. Add error handling:
```javascript
try {
  const data = await getDonations();
} catch (error) {
  // error.message contains Supabase error detail
  // Display to the user via run() or msg()
}
```

## Environment variables

The admin panel reads Supabase config from:
1. `window.VITE_SUPABASE_URL` and `window.VITE_SUPABASE_PUBLISHABLE_KEY` (injected by index.html)
2. Falls back to build-time environment variables
3. Throws an error if config is missing

**No changes needed** — the same `.env` variables used by the public site work here too.

## Testing locally

```bash
npm run dev
# Navigate to http://localhost:5174/admin
# You should see the login form
# Enter your admin email and password (created in Supabase Auth)
```

## Security notes

- The **publishable key** is in the browser; it's safe because all access is controlled by RLS
- There is no **service role key** in the browser (it stays on the server for webhooks)
- Admin panel calls only the Supabase REST API, never the Auth API directly
- Every query is subject to RLS policies defined in the Supabase migration
- Sensitive fields (PAN, donor addresses) are admin-only by policy

## Remaining work

1. **Update all page modules** to use the new `data.js` functions (dashboard, reports, donations, requests, events, projects, volunteers, broadcast, admins)
2. **Test each page** to ensure it displays and creates/updates data correctly
3. **Add any missing queries** to `data.js` as needed
4. **Remove `admin/js/api.js`** once all pages are migrated
5. **Deploy** to Vercel with Supabase integration

## Troubleshooting

| Problem | Solution |
|---|---|
| "Supabase URL and publishable key are required" | Check `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Run `npm run build`. |
| Login form appears but doesn't work | Verify Supabase Auth is configured: go to Supabase → Authentication → Providers and ensure Email is enabled. Also check that your email exists in Supabase → Users. |
| "Could not find the table" | The migration SQL hasn't run yet. Go to Supabase SQL Editor and run `supabase/migrations/20250101000000_init_schema.sql`. |
| Admin can see data but can't edit | Check RLS policies. Admins need the `admin` role (not just `editor`). Verify `admin_profiles.role = 'admin'`. |

---

**Next:** Update `dashboard.js` and other pages to use the data module, then test and deploy.
