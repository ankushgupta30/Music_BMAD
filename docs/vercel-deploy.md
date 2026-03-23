# Deploy Rewind to Vercel

## 1. Push code to Git

Vercel deploys from Git (GitHub, GitLab, or Bitbucket).

```bash
cd "Song List"
git init
git add .
git commit -m "Initial commit"
```

Create a **new empty repo** on GitHub, then:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

## 2. Import the project in Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub login is easiest).
2. **Add New… → Project**.
3. **Import** your GitHub repository.
4. **Framework Preset:** Next.js (auto-detected).
5. **Root Directory:** leave default if the repo root is the app (where `package.json` lives).
6. Click **Deploy** (first deploy may fail until env vars are set — you can add them before deploy in **Environment Variables**).

---

## 3. Environment variables (required)

In Vercel: **Project → Settings → Environment Variables**, add for **Production** (and **Preview** if you want preview deployments to work):

| Name | Value | Notes |
|------|--------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API → anon public |
| `SPOTIFY_CLIENT_ID` | from Spotify Dashboard | Same as local |
| `SPOTIFY_CLIENT_SECRET` | from Spotify Dashboard | Same as local |

Optional:

| Name | Value |
|------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (shared journals / postcards / entry context cache on shared views) |
| `LASTFM_API_KEY` | [Last.fm API](https://www.last.fm/api/account/create) — powers **Trivia** on entry detail (wiki excerpt) |
| `SPOTIFY_DEFAULT_MARKET` | ISO country code for catalog search (default `US`) |

Apply Supabase migration `004_entry_context_cache.sql` (or run SQL) so `entries` has `trivia_summary`, `renditions_json`, and `context_fetched_at`.

**Do not** commit `.env.local`. Copy values from your machine into Vercel’s UI.

After saving variables, **Redeploy** (Deployments → … on latest → Redeploy).

---

## 4. Supabase: allow your Vercel URL

OAuth redirects use `https://YOUR-VERCEL-DOMAIN/auth/callback`.

1. Supabase → **Authentication** → **URL Configuration**.
2. **Site URL:** set to your production site, e.g. `https://rewind-xxx.vercel.app` (or your custom domain).
3. **Redirect URLs:** add:
   - `https://YOUR-VERCEL-DOMAIN.vercel.app/auth/callback`
   - Keep `http://localhost:3000/auth/callback` for local dev if you want.

Save.

---

## 5. Spotify Developer Dashboard

- **Redirect URI** for Supabase OAuth should stay:  
  `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`  
  (You usually **do not** add the Vercel URL here — Spotify talks to Supabase first.)

No change required for Vercel unless you switched away from Supabase-hosted OAuth.

---

## 6. Custom domain (optional)

Vercel → **Project → Settings → Domains** → add `yourdomain.com` and follow DNS instructions.

Then update Supabase **Site URL** and **Redirect URLs** to use `https://yourdomain.com` and `https://yourdomain.com/auth/callback`.

---

## 7. Verify

1. Open your Vercel URL.
2. Sign in with Spotify from the sidebar.
3. You should return to `/` after auth; search and add should work if Spotify + Supabase env vars are correct on Vercel.

---

## Troubleshooting

| Issue | Check |
|--------|--------|
| OAuth redirect error | Supabase Redirect URLs include exact `https://…/auth/callback` |
| “Supabase not configured” | `NEXT_PUBLIC_*` vars set on Vercel and redeployed |
| Search fails | `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` set on Vercel |
| Empty index after add | Supabase `entries` table exists; RLS policies allow insert/select for authenticated users |

If Row Level Security (RLS) blocks inserts, add policies in Supabase **SQL Editor** for the `entries` table (authenticated users can `insert` / `select` as needed for your product rules).
