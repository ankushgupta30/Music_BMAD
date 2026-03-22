---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - product-brief-Song-List-2026-03-22.md
  - ux-design-specification.md
  - prd.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-03-22'
---

# Architecture Decision Document — Rewind

_Collaborative architecture decisions ensuring consistent AI agent implementation._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
31 FRs organized across 7 capability areas: Index Browsing (FR1-10), Spotify Integration (FR11-15), Entry Management (FR16-18), Journaling (FR19-22), Digital Postcard (FR23-26), Sharing (FR27-28), Navigation (FR29-31).

The architectural load is front-heavy: the index browsing experience (FR1-10) drives the most complex technical decisions — flowing CSS layout, scale variation system, Wada color palette rotation, artwork zoom animations, full-page transitions. The backend is intentionally simple: one Supabase table, Spotify OAuth, search proxy.

**Non-Functional Requirements:**
20 NFRs across performance (sub-second index render, <200ms hover transitions, <500ms page transitions), accessibility (WCAG AA, keyboard nav, reduced motion), integration (Spotify OAuth refresh, graceful API failures), and responsiveness (320px to 2560px+, fluid typography with `clamp()`).

**Scale & Complexity:**
- Primary domain: Frontend-heavy web application
- Complexity level: Low — single user, no multi-tenancy, no real-time collaboration, no complex business logic
- Estimated architectural components: ~15 (mostly frontend)

### Technical Constraints & Dependencies

- **Spotify Web API**: Search requires OAuth access token. Token refresh must be transparent. Rate limits generous for single-user but still need caching consideration.
- **Custom font**: Dotted/stencil display font (Sélavy-inspired) must be sourced or created. Font loading strategy affects first paint.
- **Supabase**: Free tier sufficient. PostgreSQL underneath. Auth handles Spotify OAuth provider.
- **Vercel**: Deployment platform. Serverless functions for API routes. Edge network for static assets.

### Cross-Cutting Concerns

- **Typography rendering**: Affects every view. Font loading, scale calculation, responsive behavior.
- **Sanzo Wada color palette**: Used across index entries. Must be accessible, rotatable, and consistent.
- **Page transitions**: Index ↔ Detail navigation. Affects routing, animation, focus management.
- **`prefers-reduced-motion`**: Must be respected across all animations (hover, zoom, transitions).

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application with Next.js (App Router), heavy frontend emphasis.

### Selected Starter: `create-next-app`

**Initialization Command:**

```bash
npx create-next-app@latest rewind --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Rationale:** The official Next.js starter with Tailwind is the right foundation. It provides TypeScript, App Router, Tailwind CSS v4, ESLint, and a clean `src/` directory structure. No additional boilerplate frameworks (T3, etc.) are needed — Rewind's architecture is simple enough that adding abstractions would be overhead.

**Architectural Decisions Provided by Starter:**

| Decision | Value |
|----------|-------|
| Language | TypeScript (strict) |
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Linting | ESLint with Next.js config |
| Build | Turbopack (dev), Webpack (prod) |
| Routing | File-system based (App Router) |
| Rendering | Server Components by default, Client Components opt-in |

**Additional packages to install after scaffold:**

```bash
npm install @supabase/supabase-js@^2.99 motion@^12.38
npm install -D @supabase/ssr
```

---

## Core Architectural Decisions

### Data Architecture

**Database: Supabase (PostgreSQL)**

Single table for MVP, expandable later. No ORM — use Supabase client directly.

```sql
CREATE TABLE entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_id TEXT NOT NULL UNIQUE,
  artist_name TEXT NOT NULL,
  album_name TEXT NOT NULL,
  artwork_url TEXT NOT NULL,
  note_text TEXT,
  scale_tier TEXT DEFAULT 'medium' CHECK (scale_tier IN ('large', 'medium', 'small')),
  hover_color_index INTEGER DEFAULT 0,
  date_added TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_entries_date_added ON entries (date_added DESC);
```

**Rationale:** One table is all that's needed. `spotify_id` is unique to prevent duplicates. `scale_tier` controls typography size. `hover_color_index` assigns a Wada palette color. No joins, no relations, no complexity.

**Caching:** No application-level cache for MVP. Supabase client handles connection pooling. Spotify search results can use a simple in-memory cache (Map with TTL) to avoid redundant API calls during a session.

### Authentication & Security

**Auth: Supabase Auth with Spotify OAuth provider**

- Supabase handles the OAuth flow, token storage, and refresh
- Single user — no roles, no permissions, no RBAC
- Session stored in HTTP-only cookie via `@supabase/ssr`
- API routes check for valid session before mutations (adding entries, updating notes)
- Read-only views (shared journal, postcards) require no auth

**Rationale:** Supabase Auth wraps Spotify OAuth cleanly. No custom auth logic needed. The `@supabase/ssr` package handles cookie-based sessions for Next.js App Router.

### API & Communication

**No custom API layer.** Next.js Server Actions and Route Handlers are sufficient.

- **Server Actions**: For mutations (add entry, update note, delete entry). Co-located with the components that use them.
- **Route Handlers**: For Spotify search proxy (`/api/spotify/search`). Handles token refresh and search forwarding.
- **Supabase Client**: Direct client-side reads for the index (real-time not needed, but instant updates after mutations).

**Error Handling:** Errors return `{ error: string } | { data: T }` from Server Actions. No global error boundaries for the index — it either renders or shows a minimal fallback. Search panel handles its own errors inline.

### Frontend Architecture

**Rendering Strategy:**
- **Index page**: Server Component for initial data fetch + Client Components for interactivity (hover, transitions)
- **Detail page**: Server Component for entry data + Client Component for journal editor
- **Search panel**: Fully client-side (interactive, stateful)

**State Management:** No state management library. React `useState` and `useContext` for:
- Search panel open/close state
- Current Wada palette rotation
- Spotify connection status

**Animation Library: Motion (formerly Framer Motion) v12**
- Page transitions via `AnimatePresence` and `motion` layout animations
- Artwork zoom via CSS transforms (no library needed for simple scale)
- Color transitions via CSS `transition` (no library needed)
- Motion is only needed for the full-page transition between index and detail

**CSS Architecture:**
- **Tailwind CSS v4**: Utility classes for layout, spacing, responsive behavior
- **CSS Modules**: For the index layout flow, dotted font treatments, and any typographic expression too complex for utility classes
- **CSS Custom Properties**: Design tokens — Wada palette colors, type scale values, motion timing, background/text colors

### Infrastructure & Deployment

**Hosting: Vercel**
- Automatic deployments from git push
- Serverless functions for API routes (Spotify search proxy)
- Edge network for static assets (fonts, images)
- Environment variables via Vercel dashboard

**Environment Configuration:**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

**No CI/CD pipeline beyond Vercel's built-in.** No Docker. No staging environment for MVP. Deploy on push to main.

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database:**
- Table names: `snake_case`, plural (`entries`, not `entry`)
- Column names: `snake_case` (`artist_name`, `date_added`)
- Indexes: `idx_{table}_{columns}` (`idx_entries_date_added`)

**Files & Directories:**
- Components: `PascalCase.tsx` (`IndexEntry.tsx`, `SearchPanel.tsx`)
- Utilities/hooks: `camelCase.ts` (`useWadaPalette.ts`, `spotifyClient.ts`)
- CSS Modules: `PascalCase.module.css` (`IndexLayout.module.css`)
- Route directories: `kebab-case` (`/entry/[id]`)
- Server Actions: `camelCase.ts` in `actions/` directory (`addEntry.ts`)

**Code:**
- Components: `PascalCase` (`IndexEntry`, `InlineArtwork`)
- Functions/hooks: `camelCase` (`useWadaPalette`, `fetchEntries`)
- Variables: `camelCase` (`hoverColor`, `scaleTier`)
- Constants: `SCREAMING_SNAKE_CASE` (`WADA_PALETTE`, `SCALE_TIERS`)
- Types/interfaces: `PascalCase` (`Entry`, `SpotifySearchResult`)

### Structure Patterns

**Component Organization: By feature, co-located**
- Each component lives with its styles, tests, and sub-components
- Shared components in `src/components/shared/`
- Feature components in `src/components/{feature}/`

**Server Actions: Co-located with feature**
- `src/app/actions/entries.ts` for entry mutations
- `src/app/actions/spotify.ts` for Spotify operations

**Design Tokens: Single source of truth**
- All tokens in `src/styles/tokens.css` as CSS custom properties
- Tailwind config extends from these tokens
- Components reference tokens, never hardcoded values

### Format Patterns

**API Response Format (Route Handlers):**

```typescript
// Success
{ data: T }

// Error
{ error: string }
```

**Server Action Return Format:**

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: string }
```

**Date Format:** ISO 8601 strings in database and API. Formatted for display using `Intl.DateTimeFormat` in components.

### Process Patterns

**Error Handling:**
- Server Actions: Try/catch, return `{ success: false, error }`. Never throw to client.
- Route Handlers: Try/catch, return `NextResponse.json({ error }, { status })`.
- Components: Inline error display. No toast libraries. No global error banners.
- Spotify failures: Inline in search panel. Index is never affected by Spotify errors.

**Loading States:**
- Index: No loading spinner. Server-rendered on first paint. Client hydration is instant.
- Search panel: Minimal pulsing dots during fetch. No skeleton screens.
- Detail page: Server-rendered. No loading state.
- Mutations: Optimistic updates where possible (entry appears in index before server confirms).

**Font Loading:**
- Display font loaded via `@font-face` in global CSS with `font-display: swap`
- Fallback to system font stack during load
- Font file served from `/public/fonts/` (no external font service dependency)

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
rewind/
├── README.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── .env.local
├── .env.example
├── .gitignore
├── postcss.config.js
│
├── public/
│   └── fonts/
│       ├── selavy-dotted.woff2          # Display font
│       └── selavy-dotted.woff
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout (fonts, global styles)
│   │   ├── page.tsx                     # Index page (Server Component)
│   │   ├── globals.css                  # Global styles, font-face, resets
│   │   │
│   │   ├── entry/
│   │   │   └── [id]/
│   │   │       └── page.tsx             # Detail/journal page
│   │   │
│   │   ├── postcard/
│   │   │   └── [id]/
│   │   │       └── page.tsx             # Shared postcard view (public, no auth)
│   │   │
│   │   ├── api/
│   │   │   └── spotify/
│   │   │       └── search/
│   │   │           └── route.ts         # Spotify search proxy
│   │   │
│   │   └── actions/
│   │       ├── entries.ts               # addEntry, updateNote, deleteEntry
│   │       └── postcards.ts             # createPostcard
│   │
│   ├── components/
│   │   ├── index/
│   │   │   ├── IndexLayout.tsx          # Flowing text container
│   │   │   ├── IndexLayout.module.css   # Non-grid flow styles
│   │   │   ├── IndexEntry.tsx           # Single typographic entry
│   │   │   ├── IndexEntry.module.css    # Scale variants, hover colors
│   │   │   └── InlineArtwork.tsx        # Album art thumbnail with zoom
│   │   │
│   │   ├── search/
│   │   │   ├── SearchPanel.tsx          # Side panel container
│   │   │   ├── SearchInput.tsx          # Search input field
│   │   │   └── SearchResult.tsx         # Individual result row
│   │   │
│   │   ├── detail/
│   │   │   ├── DetailLayout.tsx         # Detail page layout
│   │   │   └── JournalEditor.tsx        # Handwritten-feel note editor
│   │   │
│   │   ├── postcard/
│   │   │   ├── PostcardComposer.tsx     # Create postcard UI
│   │   │   └── PostcardView.tsx         # Read-only postcard display
│   │   │
│   │   ├── shared/
│   │   │   ├── PageTransition.tsx       # Motion-based page transition wrapper
│   │   │   └── SpotifyIcon.tsx          # Persistent top icon
│   │   │
│   │   └── providers/
│   │       └── SupabaseProvider.tsx      # Supabase client context
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # Browser Supabase client
│   │   │   ├── server.ts               # Server Supabase client
│   │   │   └── middleware.ts            # Auth middleware helper
│   │   │
│   │   ├── spotify/
│   │   │   └── client.ts               # Spotify API wrapper (search, token refresh)
│   │   │
│   │   └── utils/
│   │       └── wadaPalette.ts           # Wada color palette definitions and rotation
│   │
│   ├── styles/
│   │   ├── tokens.css                   # CSS custom properties (colors, type scale, motion)
│   │   └── typography.css               # Font-face declarations, type utilities
│   │
│   ├── types/
│   │   ├── entry.ts                     # Entry type definition
│   │   ├── spotify.ts                   # Spotify API response types
│   │   └── postcard.ts                  # Postcard type definition
│   │
│   └── middleware.ts                     # Next.js middleware (Supabase session refresh)
│
└── supabase/
    └── migrations/
        └── 001_create_entries.sql        # Initial schema
```

### Architectural Boundaries

**Route Boundaries:**
- `/` — Index (public, server-rendered, requires auth only for mutations)
- `/entry/[id]` — Detail page (requires auth for editing notes)
- `/postcard/[id]` — Postcard view (public, no auth)
- `/api/spotify/search` — Spotify proxy (requires auth)

**Component Boundaries:**
- `index/` components only know about entries and the Wada palette
- `search/` components only know about Spotify search results and the add action
- `detail/` components only know about a single entry and its note
- `postcard/` components only know about a single postcard
- `shared/` components are generic (transitions, icons)

**Data Flow:**
```
Supabase DB ← Server Components (read) ← Client Components (display + interact)
                                        → Server Actions (mutate) → Supabase DB
Spotify API ← Route Handler ← Search Panel (client-side fetch)
```

### Requirements to Structure Mapping

| FR Category | Primary Location |
|-------------|-----------------|
| Index Browsing (FR1-10) | `src/components/index/`, `src/app/page.tsx` |
| Spotify Integration (FR11-15) | `src/components/search/`, `src/lib/spotify/`, `src/app/api/spotify/` |
| Entry Management (FR16-18) | `src/app/entry/`, `src/app/actions/entries.ts` |
| Journaling (FR19-22) | `src/components/detail/`, `src/app/actions/entries.ts` |
| Digital Postcard (FR23-26) | `src/components/postcard/`, `src/app/postcard/`, `src/app/actions/postcards.ts` |
| Sharing (FR27-28) | Public routes (`/`, `/postcard/[id]`) |
| Navigation (FR29-31) | `src/components/shared/PageTransition.tsx`, App Router |

---

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible. Next.js 16 + Tailwind v4 + Supabase JS v2 + Motion v12 are a well-tested combination. No version conflicts. TypeScript strict mode works with all libraries.

**Pattern Consistency:** Naming conventions (snake_case DB, PascalCase components, camelCase functions) follow Next.js/React community standards. Co-located file structure matches App Router conventions.

**Structure Alignment:** Project structure maps 1:1 to the feature areas in the PRD. Every FR has a clear home in the directory tree.

### Requirements Coverage

| FR Range | Coverage |
|----------|----------|
| FR1-10 (Index) | `IndexLayout`, `IndexEntry`, `InlineArtwork`, `tokens.css`, `wadaPalette.ts` |
| FR11-15 (Spotify) | `SearchPanel`, `SpotifyIcon`, `spotify/client.ts`, `/api/spotify/search` |
| FR16-18 (Entries) | `entry/[id]/page.tsx`, `actions/entries.ts`, Supabase schema |
| FR19-22 (Journal) | `JournalEditor`, `actions/entries.ts` (updateNote) |
| FR23-26 (Postcard) | `PostcardComposer`, `PostcardView`, `actions/postcards.ts`, `/postcard/[id]` |
| FR27-28 (Sharing) | Public routes, no-auth access |
| FR29-31 (Navigation) | `PageTransition`, App Router, `SpotifyIcon` |

**NFR Coverage:**
- Performance (NFR1-6): Server-rendered index, CSS transitions (not JS), Motion only for page transitions
- Accessibility (NFR7-13): Semantic HTML, ARIA labels, keyboard nav, `prefers-reduced-motion`, `clamp()` typography
- Integration (NFR14-16): Supabase Auth handles token refresh, inline errors, retry-capable actions
- Responsiveness (NFR17-20): Tailwind responsive utilities, vw-based type scale, mobile-first CSS

### Implementation Readiness

**Confidence Level:** High

The architecture is intentionally simple — one database table, one external API, no complex state management, no microservices. The complexity lives in the CSS (flowing layout, responsive typography, font treatments) which is correctly scoped to CSS Modules and design tokens rather than architectural decisions.

**First Implementation Priority:**
1. Run `create-next-app` with the specified options
2. Install additional dependencies (`@supabase/supabase-js`, `motion`, `@supabase/ssr`)
3. Set up Supabase project and run initial migration
4. Create design tokens (`tokens.css`) and font setup (`typography.css`)
5. Build `IndexLayout` and `IndexEntry` — the v0.1 MVP core
