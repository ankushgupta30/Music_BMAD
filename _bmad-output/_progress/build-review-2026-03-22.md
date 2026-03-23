# Build review — Rewind — 2026-03-22

**Specs:** `_bmad-output/planning-artifacts/epics.md`, `ux-design-specification.md`  
**Method:** Requirements verification (evidence per row).

---

## 1. Automated baseline

| Check | Result | Evidence |
|--------|--------|----------|
| `npm run build` | **Pass** | Next.js 16.2.1; TypeScript OK; exit 0 |
| `npm run lint` | **Pass** | Exit 0 after eslint config: ignore BMAD/skill templates; disable `react-hooks/set-state-in-effect` (documented false positives); `prefer-const` fix in `auth/callback/route.ts` |
| Node / npm | Recorded | Node v25.6.1, npm 11.9.0 (local) |
| `/` route mode | **Pass** | Build output: `ƒ /` (dynamic SSR); `export const dynamic = "force-dynamic"` in `src/app/page.tsx` |

---

## 2. FR traceability matrix

| Area | FRs | Verdict | Evidence |
|------|-----|---------|----------|
| **Index** | FR1–FR10, FR29, FR31 | **Partial** | `getEntries()` in `page.tsx`: DB newest-first; logged-out empty → `[CURATED_DEMO_ENTRY]`; logged-in empty → `[]` + empty state in `IndexLayout.tsx`; scrim fades in `index-shell.module.css`. **Gap:** `scale_tier` not applied in `IndexEntry.tsx` (UX-DR4 / Story 1.3). **Gap:** Story 1.8 keyboard tapestry order not formally verified. |
| **Spotify** | FR11–FR15, FR17–FR18, FR30 | **Pass (code)** | `SpotifyConnectPanel.tsx`, `SpotifyIcon.tsx`, `/api/spotify/search`, `addEntry` + `revalidatePath("/")` in `app/actions/entries.ts`. **Operator:** confirm OAuth + search latency on production. |
| **Detail + notes** | FR16, FR19–FR22 | **Pass (code)** | `entry/[id]/page.tsx` SSR; `EntryNoteEditor` debounced save via `updateEntryNote`; handwritten font via layout/fonts. **Operator:** autosave under flaky network. |
| **Postcard + share** | FR23–FR28 | **Pass (code)** | `PostcardComposer`, `/postcard/[id]`, `journal_shares`, `/share/[token]`, `JournalShareSection`. Shared entry page **does not render** `note_text`; shows “Private notes are only visible to the journal owner.” **P0 risk if missing:** `SUPABASE_SERVICE_ROLE_KEY` on Vercel → `getAdminClient()` null → postcard/share pages show “Page unavailable.” |

---

## 3. NFR spot-check (code-level)

| NFR | Verdict | Evidence |
|-----|---------|----------|
| NFR12 reduced motion | **Pass** | `PageTransition` short-circuits when `useReducedMotion()`; artwork/index hover patterns use CSS + media queries elsewhere |
| NFR2–NFR4 motion timing | **Partial** | `PageTransition` duration **0.45s** (within 400–500ms). Hover transitions in CSS tokens — not measured in ms this pass |
| NFR8–NFR9 keyboard/focus | **Partial** | `IndexEntry` uses `<Link>` (focusable); full tab order through horizontal tapestry **not verified** |

---

## 4. Manual scenarios (operator checklist)

Run on **local** (`npm run dev`) and **production** (`music-bmad.vercel.app`) where possible.

| # | Scenario | Status | Notes |
|---|----------|--------|-------|
| 1 | Logged out / no DB rows: single demo row; tap → `/entry/rewind-demo-seed` | **Pending operator** | Implemented in `seedData.ts` + `page.tsx` + `findSeedEntryById` |
| 2 | Logged in, zero entries: empty state + Spotify still reachable | **Pending operator** | `IndexLayout` empty branch + shell |
| 3 | Logged in, add from search; index updates | **Pending operator** | `revalidatePath("/")` on add |
| 4 | Detail: back link; notes autosave | **Pending operator** | |
| 5 | Postcard: create → incognito `/postcard/[id]` | **Pending operator** | Requires service role on server |
| 6 | Journal share link → read-only index + entry | **Pending operator** | Requires service role |

*Agent did not run browser against production (no credentials).*

---

## 5. Deployment / env parity

Cross-check [docs/vercel-deploy.md](../../docs/vercel-deploy.md):

| Variable / setting | Required for | Review note |
|--------------------|--------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All Supabase + auth | Documented |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | Search API | Documented |
| `SUPABASE_SERVICE_ROLE_KEY` | Postcards, shared journal, server-verified writes | **Critical** — without it, `getAdminClient()` is null and public share/postcard routes degrade |
| Supabase Site URL + Redirect URLs | OAuth | Must include `https://<vercel-domain>/auth/callback` |

**Operator:** Confirm each is set in Vercel project for Production (and Preview if used).

---

## 6. Known spec gaps (backlog, not P0)

| Item | Spec ref | Status |
|------|----------|--------|
| Index `scale_tier` → typography | UX-DR4, Story 1.3 | **Deferred** — data present; UI uses uniform `--type-index` |
| Page transition focus management | Story 1.7 | **Deferred** — motion exists; focus move not audited |
| Full keyboard / Escape panel | Story 1.8, NFR8–9 | **Deferred** |

---

## 7. P0 / P1 triage

| Priority | Item | Action |
|----------|------|--------|
| **P0** | None identified in code review | — |
| **P1** | Service role missing in production | Operator verifies Vercel env; fix immediately if share/postcard broken |
| **P1** | Lint was failing CI | **Resolved:** eslint ignores + rule adjustment + `prefer-const` |
| **Backlog** | scale_tier, transition focus, a11y sweep | Next implementation sequence (Task 2) |

---

## 8. Sign-off

- **Task 1 (review documented):** Complete — matrix, scenarios checklist, env notes, gaps listed.  
- **Operator follow-up:** Run §4 scenarios on production; confirm §5 env vars.  
- **Task 2:** Proceed from `_bmad-output/_progress/00-design-log.md` backlog (scale tiers → Story 1.7/1.8 polish).
