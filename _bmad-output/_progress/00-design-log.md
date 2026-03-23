# Design log — Rewind

**Spec sources:** `_bmad-output/planning-artifacts/ux-design-specification.md`, `epics.md`, `prd.md`  
**Method:** [Freya agentic development](../../_bmad/wds/data/agent-guides/freya/agentic-development.md)

---

## Setup context

- **Stack:** Next.js 16 App Router, Supabase, Spotify OAuth, CSS modules + tokens (`src/styles/tokens.css`).
- **Index:** `IndexShell` + `IndexLayout` (horizontal tapestry), entries from `src/app/page.tsx` → Supabase `entries`.
- **Detail:** `/entry/[id]` with notes + postcard composer.
- **Share:** `/share/[token]`, journal link from `JournalShareSection` in Spotify panel.

---

## Current (done)

| Object / area                         | Notes |
|--------------------------------------|-------|
| Typographic index + scrim edges      | Viewport gradient fades (`index-shell.module.css`, `IndexLayout`) |
| Spotify panel, search, add entry   | `SpotifyConnectPanel`, server actions |
| Detail notes (handwritten)           | `EntryNoteEditor` |
| Postcard + public postcard route     | `PostcardComposer`, `/postcard/[id]` |
| Shared journal                       | `journal_shares`, `/share/[token]` |
| First-open demo + empty journal      | `CURATED_DEMO_ENTRY` when logged out & no rows; empty state copy when logged in & no rows (`page.tsx`, `IndexLayout`) |

---

## Verification — 2026-03-22

**Full report:** [build-review-2026-03-22.md](./build-review-2026-03-22.md)

| Gate | Result |
|------|--------|
| `npm run build` | Pass |
| `npm run lint` | Pass (eslint: ignore BMAD/skill templates; `react-hooks/set-state-in-effect` off; `auth/callback` `prefer-const`) |
| `/` dynamic SSR | Pass (`force-dynamic`) |
| FR trace (code) | Index **Partial** (scale_tier); Spotify / detail / share **Pass (code)**; service role **P1 operator check** on Vercel |
| Manual scenarios §4 in review doc | **Operator** to run on local + production |

**P0:** none from review. **P1:** confirm `SUPABASE_SERVICE_ROLE_KEY` on Vercel if postcard/share fail.

---

## In progress

_None_

---

## Backlog (next) — after operator smoke on production

1. **Operator:** Run manual checklist in `build-review-2026-03-22.md` §4 on `music-bmad.vercel.app`; confirm env §5.
2. **Scale tiers on index:** Wire `scale_tier` to `IndexEntry` / layout (UX-DR4) — data exists, UI not varied.
3. **Story 1.7 polish:** Focus management after transition; re-verify motion timing.
4. **Story 1.8:** Keyboard order through tapestry, Escape closes panel (spot-check against spec).
5. **Optional:** Playwright smoke for `/` + auth cookie if regressions repeat.

---

## Change requests

_(none logged)_

---

## Traceability

| Step | Epic.story | Spec |
|------|------------|------|
| Curated demo + empty index | 1.6, 2.5 | UX “First open (pre-seeded)”, FR9, FR10 density for 1–5 entries |
| Build + requirements review | Epics 1–4 (verification) | `build-review-2026-03-22.md` |

---

*Update this file after each implementation step.*
