# Crumb & Frost: cake shop website

React + Vite site hosted on Vercel, with:

- **Shop:** cakes, search, cart, custom orders, WhatsApp ordering
- **M-Pesa payments** through PayHero (`api/payhero.ts`)
- **Admin page** at `/admin`: log in with email and password to manage **Orders**, **Cakes** (with photo upload), **Accounts** (money received, who still owes) and **Request payment**. Data is stored in Supabase.

## Setting up the admin page (one time)

### 1. Create the database
1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor → New query**.
3. Open [`supabase/setup.sql`](supabase/setup.sql), copy all of it, and paste it in.
4. Near the top, change `you@example.com` to the email you'll log in with.
5. Press **Run**. This creates the tables, the security rules, the photo storage, and loads the cakes currently on the site.

### 2. Create your login
1. In Supabase, go to **Authentication → Users → Add user → Create new user**.
2. Enter the **same email** as in step 1 and a strong password, and tick **Auto Confirm User**.
3. Go to **Authentication → Sign In / Providers** and turn **off** "Allow new users to sign up", so nobody else can make an account.
4. Go to **Authentication → URL Configuration** and set **Site URL** to your website address (e.g. `https://bakery-tawny-six.vercel.app`), so "Forgot password" emails link back to your site.

### 3. Connect the website
In Supabase, open **Project Settings → API Keys** (and **Data API** for the URL). In Vercel, open **your project → Settings → Environment Variables** and add:

| Name | Where to find it | Secret? |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL, e.g. `https://abcd1234.supabase.co` | No |
| `VITE_SUPABASE_ANON_KEY` | The `anon` / publishable key | No (safe to be public) |
| `SUPABASE_SERVICE_ROLE_KEY` | The `service_role` / secret key | **Yes: only ever in Vercel** |

Then redeploy (Vercel → Deployments → ⋯ → Redeploy).

These are already set from the PayHero setup: `PAYHERO_AUTH_TOKEN`, `PAYHERO_CHANNEL_ID`. (`ADMIN_PASSWORD` is no longer used and can be deleted.)

### 4. Log in
Go to `your-site/admin` and log in. To add a staff member, create their user (step 2) and add their email to the admins list:

```sql
insert into public.admins (email) values ('staff@example.com');
```

## Running locally

```bash
npm install
npm run dev
```

To use the database locally, create a `.env.local` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Without them the site uses the built-in cake list in `src/data/products.ts`. The `api/` functions (payments, link previews) only run on Vercel.
