---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
---

# Rewind - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Rewind, decomposing the requirements from the PRD, UX Design Specification, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: User can view a typographic index of all saved music entries on the home page
- FR2: User can scroll through the index with entries displayed in flowing, non-grid layout
- FR3: User can see entries at varied typographic scales (large, medium, small) creating visual rhythm
- FR4: User can see inline album artwork thumbnails scattered between text entries
- FR5: User can hover over artist/album text to see a color shift from the Sanzo Wada palette (desktop)
- FR6: User can hover over artwork thumbnails to see an animated zoom effect (desktop)
- FR7: User can tap/click any entry to navigate to its detail page via full-page transition
- FR8: User can tap/click any artwork thumbnail to navigate to its detail page
- FR9: User can see a pre-seeded curated entry on first open before adding their own music
- FR10: System displays the index as dense and visually full regardless of entry count
- FR11: User can connect their Spotify account via OAuth from within Rewind
- FR12: User can search Spotify for artists, albums, or tracks from a side panel
- FR13: User can add a search result to their journal with a single tap
- FR14: System retrieves and stores artist name, album name, artwork URL, and Spotify ID for each added entry
- FR15: System displays the Spotify connect icon persistently at the top of the viewport
- FR16: User can view a detail page for any saved entry showing album artwork and metadata
- FR17: Entries appear in the index in chronological order (newest first)
- FR18: New entries appear in the index immediately after being added
- FR19: User can write free-form notes on any entry's detail page
- FR20: Notes auto-save as the user types
- FR21: User can read their previously written notes when revisiting an entry
- FR22: Journal notes are displayed in a handwritten-feel typography
- FR23: User can create a "This made me think of you" postcard from any entry
- FR24: User can write a handwritten-style note on the postcard
- FR25: System generates a shareable link for the postcard
- FR26: Recipient can view the postcard (album artwork + note) without an account
- FR27: User can share a read-only view of their full journal via link
- FR28: Recipients can browse the typographic index in read-only mode without an account
- FR29: User can navigate back from detail page to the index
- FR30: User can open and close the Spotify search side panel
- FR31: Page transitions between index and detail feel like "going inside" an entry and back

### NonFunctional Requirements

- NFR1: The index renders and becomes interactive within 1 second on desktop broadband
- NFR2: Hover color transitions complete within 200ms
- NFR3: Artwork zoom animations complete within 300ms
- NFR4: Page transitions between index and detail complete within 500ms
- NFR5: Spotify search results appear within 2 seconds of query
- NFR6: Adding an entry and seeing it in the index takes < 5 seconds end-to-end
- NFR7: Text contrast meets WCAG AA (4.5:1 minimum against background)
- NFR8: All interactive elements are keyboard navigable (tab, enter, escape)
- NFR9: All interactive elements have visible focus indicators
- NFR10: All artwork has descriptive alt text
- NFR11: Touch targets are minimum 44×44px on mobile
- NFR12: Animations respect `prefers-reduced-motion`
- NFR13: Font sizing uses `clamp()` with minimum floors
- NFR14: Spotify OAuth token refresh happens transparently
- NFR15: Spotify API failures degrade gracefully with inline error messages
- NFR16: Supabase operations are resilient to temporary connectivity loss
- NFR17: The index is fully functional on viewports from 320px to 2560px+
- NFR18: The search panel adapts from side panel to full-screen overlay on mobile
- NFR19: Typography scales fluidly using viewport-relative units
- NFR20: The layout reflows naturally without explicit breakpoints

### Additional Requirements

From Architecture:
- Starter template: `create-next-app` with TypeScript, Tailwind, ESLint, App Router, src directory
- Additional packages: `@supabase/supabase-js`, `motion`, `@supabase/ssr`
- Supabase entries table with schema as defined in architecture
- Spotify OAuth via Supabase Auth provider
- Server Actions for mutations, Route Handler for Spotify search proxy
- CSS Modules for complex typographic treatments
- CSS custom properties for design tokens
- Font files served from `/public/fonts/`

### UX Design Requirements

- UX-DR1: Implement Sanzo Wada color palette system with 6-10 curated colors and rotation logic for hover states
- UX-DR2: Implement dotted/stencil display font via @font-face with font-display: swap and system font fallback
- UX-DR3: Implement flowing non-grid layout where entries wrap and fill viewport naturally with irregular spacing
- UX-DR4: Implement scale variation system assigning large (6-10vw), medium (3-5vw), small (1.5-2.5vw) sizes to entries
- UX-DR5: Implement inline artwork placement with asymmetric positioning between text entries (40-120px sizes)
- UX-DR6: Implement full-page transition where index recedes and detail emerges ("going inside"), 400-500ms
- UX-DR7: Implement color-shift hover on artist/album text using Wada palette, ~200ms CSS transition (desktop only)
- UX-DR8: Implement animated zoom hover on artwork from 1.0 to 1.15 scale, ~300ms ease-out (desktop only)
- UX-DR9: Implement side panel sliding from right (~250ms) for search/connect, with background dim
- UX-DR10: Implement handwritten-feel typography (Caveat, Reenie Beanie, or similar) for journal notes and postcards
- UX-DR11: Implement `prefers-reduced-motion` support — disable all animations, content changes occur instantly
- UX-DR12: Implement keyboard navigation for index entries (tab through, enter to navigate, escape to close panel)
- UX-DR13: Test and validate WCAG AA contrast for all Wada palette hover colors against off-white background
- UX-DR14: Implement responsive type scale using vw units with `clamp()` floors to prevent unreadable text

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Typographic index on home page |
| FR2 | Epic 1 | Flowing non-grid layout |
| FR3 | Epic 1 | Scale variation (large/medium/small) |
| FR4 | Epic 1 | Inline artwork thumbnails |
| FR5 | Epic 1 | Wada palette hover color shift |
| FR6 | Epic 1 | Artwork zoom on hover |
| FR7 | Epic 1 | Tap entry → detail page transition |
| FR8 | Epic 1 | Tap artwork → detail page |
| FR9 | Epic 1 | Pre-seeded curated entry |
| FR10 | Epic 1 | Dense from day one |
| FR11 | Epic 2 | Spotify OAuth connect |
| FR12 | Epic 2 | Spotify search side panel |
| FR13 | Epic 2 | Single-tap add to journal |
| FR14 | Epic 2 | Store metadata from Spotify |
| FR15 | Epic 2 | Persistent Spotify icon |
| FR16 | Epic 3 | Detail page with artwork/metadata |
| FR17 | Epic 2 | Chronological order |
| FR18 | Epic 2 | Immediate index update on add |
| FR19 | Epic 3 | Write free-form notes |
| FR20 | Epic 3 | Auto-save notes |
| FR21 | Epic 3 | Read previous notes |
| FR22 | Epic 3 | Handwritten-feel typography |
| FR23 | Epic 4 | Create postcard from entry |
| FR24 | Epic 4 | Handwritten note on postcard |
| FR25 | Epic 4 | Shareable postcard link |
| FR26 | Epic 4 | Recipient views postcard without account |
| FR27 | Epic 4 | Share read-only journal link |
| FR28 | Epic 4 | Recipients browse index read-only |
| FR29 | Epic 1 | Navigate back from detail |
| FR30 | Epic 2 | Open/close search panel |
| FR31 | Epic 1 | Page transition feels like "going inside" |

## Epic List

### Epic 1: The Typographic Index
Users can browse a visually expressive typographic index of music entries with interactive hover states, inline artwork, and full-page transitions — the core experience of Rewind.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR29, FR31

### Epic 2: Spotify Integration & Adding Music
Users can connect Spotify, search for music, and add entries to their journal — building their personal archive.
**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR17, FR18, FR30

### Epic 3: Journaling & Detail Page
Users can view rich detail pages for each entry and write personal journal notes with handwritten-feel typography.
**FRs covered:** FR16, FR19, FR20, FR21, FR22

### Epic 4: Digital Postcard & Sharing
Users can create intimate "this made me think of you" postcards and share their journal as a read-only artifact.
**FRs covered:** FR23, FR24, FR25, FR26, FR27, FR28

---

## Epic 1: The Typographic Index

Users can browse a visually expressive typographic index of music entries — large dotted letterforms, inline artwork, Sanzo Wada color hover states, and full-page transitions. This IS the product's first impression.

### Story 1.1: Project Scaffold & Environment Setup

As a developer,
I want a properly configured Next.js project with all dependencies installed,
So that I have a working foundation to build Rewind on.

**Acceptance Criteria:**

**Given** a fresh workspace
**When** the project is initialized
**Then** a Next.js 16 app exists with TypeScript, Tailwind CSS v4, ESLint, App Router, and `src/` directory
**And** `@supabase/supabase-js`, `@supabase/ssr`, and `motion` packages are installed
**And** `.env.local` and `.env.example` exist with Supabase and Spotify environment variable placeholders
**And** the project directory structure matches the architecture specification
**And** `npm run dev` starts the development server without errors

### Story 1.2: Design Tokens & Typography Foundation

As a user,
I want the visual foundation of Rewind to feel like a printed archive,
So that every page has the intentional, editorial aesthetic from the first pixel.

**Acceptance Criteria:**

**Given** the project scaffold is complete
**When** I open any page in the browser
**Then** CSS custom properties are defined in `tokens.css` for: background color (#F5F3EF range), text color (#1A1A1A range), metadata color (#8A8A8A range), and 6-10 Sanzo Wada palette hover colors
**And** the dotted/stencil display font loads via `@font-face` with `font-display: swap` and falls back to a system font
**And** a monospace font is available for metadata (Suisse Int'l Mono or similar)
**And** type scale CSS custom properties define large (6-10vw), medium (3-5vw), small (1.5-2.5vw) with `clamp()` floors
**And** responsive type scale adapts correctly on mobile viewports (320px-767px)
**And** the off-white background covers the full viewport

### Story 1.3: IndexEntry Component

As a user,
I want to see artist and album names rendered as large, expressive typographic entries,
So that browsing the index feels like reading a gallery archive.

**Acceptance Criteria:**

**Given** design tokens and fonts are loaded
**When** an IndexEntry renders with artist name, album name, and a scale tier
**Then** the entry displays in the dotted/stencil display font at the correct scale (large, medium, or small)
**And** hovering over the text shifts the color to a Sanzo Wada palette color with a ~200ms CSS transition (desktop)
**And** the entry is focusable via keyboard (tab) and shows a visible warm-toned focus ring
**And** clicking/tapping the entry navigates to `/entry/[id]`
**And** on mobile, no hover state is applied — interaction is tap-only
**And** the entry is announced by screen readers as "[Artist] — [Album]"

### Story 1.4: InlineArtwork Component

As a user,
I want to see album artwork thumbnails scattered between text entries,
So that the index has visual texture and artwork creates moments of discovery.

**Acceptance Criteria:**

**Given** the IndexEntry component exists
**When** an InlineArtwork renders with an artwork URL and size variant
**Then** the artwork displays at the specified size (between 40px and 120px)
**And** hovering over the artwork scales it from 1.0 to 1.15 with a ~300ms ease-out transition (desktop)
**And** clicking/tapping the artwork navigates to `/entry/[id]`
**And** the artwork has alt text in the format "[Album Name] album artwork"
**And** the touch target is at least 44×44px on mobile (padding if artwork is smaller)
**And** `prefers-reduced-motion` disables the zoom animation — hover still changes cursor but no scale transform

### Story 1.5: IndexLayout — Flowing Non-Grid Container

As a user,
I want the index to flow like typeset prose rather than a structured list,
So that browsing feels like reading a beautifully composed page.

**Acceptance Criteria:**

**Given** IndexEntry and InlineArtwork components exist
**When** the IndexLayout renders with a collection of entries and artwork
**Then** entries and artwork flow naturally across the viewport without a grid structure
**And** artwork is placed asymmetrically between text entries as visual punctuation
**And** spacing between entries is irregular and fluid, feeling composed rather than computed
**And** viewport margins are ~5-8vw on desktop and ~4vw on mobile
**And** the layout feels dense and full even with only 1-5 entries (scale variation fills the canvas)
**And** the layout reflows naturally on resize without breakpoint jumps

### Story 1.6: Index Page with Pre-Seeded Entry

As a user,
I want to see one curated entry when I first open Rewind,
So that I immediately experience what the journal feels like before adding my own music.

**Acceptance Criteria:**

**Given** IndexLayout, IndexEntry, and InlineArtwork are implemented
**When** a user opens the Rewind home page for the first time
**Then** the index renders immediately (no splash screen, no loading state, no landing page)
**And** one pre-seeded entry is visible with a real artist name, album name, and artwork
**And** the entry displays at large scale, filling the viewport expressively
**And** hover states work on the pre-seeded entry (color shift on text, zoom on artwork)
**And** the page is server-rendered and interactive within 1 second on desktop broadband
**And** the SpotifyIcon component is visible at the top of the viewport (non-functional placeholder for now)

### Story 1.7: Page Transition & Detail Page Shell

As a user,
I want tapping an entry to feel like "going inside" it,
So that the transition between browsing and detail feels intentional, not like loading a new page.

**Acceptance Criteria:**

**Given** the index page renders with entries
**When** a user taps/clicks an entry or artwork
**Then** a full-page transition occurs: the index recedes (scale down + fade out) and the detail page emerges (scale up + fade in)
**And** the transition completes within 400-500ms
**And** navigating back from the detail page reverses the transition (detail recedes, index re-emerges)
**And** the detail page shell shows the entry's artist name, album name, and artwork as a placeholder layout
**And** browser back button and a minimal back affordance both trigger the reverse transition
**And** `prefers-reduced-motion` skips the animation — navigation still works but changes are instant
**And** focus moves to the detail page content after transition completes

### Story 1.8: Responsive & Accessibility Polish

As a user,
I want Rewind to work beautifully on my phone and be usable with keyboard and screen reader,
So that the experience is inclusive and expressive on every device.

**Acceptance Criteria:**

**Given** the full index experience (stories 1.1-1.7) is implemented
**When** tested on mobile (320px-767px)
**Then** type scale adjusts to mobile range (large: 12-18vw, medium: 8-12vw, small: 5-7vw)
**And** artwork sizes adjust to mobile range (40-80px)
**And** all touch targets are at least 44×44px
**And** the SpotifyIcon is reachable and tappable
**When** tested with keyboard only
**Then** all entries are focusable via tab in sequential order
**And** enter navigates to detail page
**And** escape closes any open panel
**And** focus indicators are visible on every interactive element
**When** tested with screen reader
**Then** entries are announced as "[Artist] — [Album]"
**And** artwork announces "[Album Name] album artwork"
**And** page transition announces the new context
**When** tested with `prefers-reduced-motion: reduce`
**Then** no animations play — all interactions still function but state changes are instant

---

## Epic 2: Spotify Integration & Adding Music

Users can connect their Spotify account, search for music, and add entries to their personal archive. New entries appear in the typographic index immediately.

### Story 2.1: Supabase Schema & Data Layer

As a developer,
I want the entries table and Supabase client configured,
So that entries can be persisted and read from the database.

**Acceptance Criteria:**

**Given** the project scaffold exists with Supabase environment variables
**When** the Supabase migration runs
**Then** an `entries` table exists with columns: id (UUID), spotify_id (TEXT UNIQUE), artist_name (TEXT), album_name (TEXT), artwork_url (TEXT), note_text (TEXT nullable), scale_tier (TEXT default 'medium'), hover_color_index (INTEGER default 0), date_added (TIMESTAMPTZ), updated_at (TIMESTAMPTZ)
**And** a descending index exists on `date_added`
**And** Supabase browser client (`lib/supabase/client.ts`) and server client (`lib/supabase/server.ts`) are configured
**And** Next.js middleware refreshes Supabase auth sessions on every request
**And** the index page reads entries from Supabase instead of using pre-seeded data (falls back to pre-seeded if no entries exist)

### Story 2.2: Spotify OAuth & Connection Flow

As a user,
I want to connect my Spotify account from within Rewind,
So that I can search and add my own music.

**Acceptance Criteria:**

**Given** Supabase Auth is configured with Spotify as an OAuth provider
**When** a user taps the SpotifyIcon at the top of the viewport
**Then** a side panel slides in from the right (~250ms) with a "Connect Spotify" prompt
**And** tapping "Connect" initiates the Spotify OAuth flow via Supabase Auth
**And** after successful OAuth, the side panel updates to show a search interface (the ability to search IS the confirmation)
**And** if OAuth is cancelled, the panel shows "Connect when you're ready" and returns to the index
**And** if OAuth fails, an inline error message appears in the panel with a retry option
**And** on subsequent visits, the user's Spotify connection persists (session stored in cookie)
**And** the SpotifyIcon visually indicates connection status (subtle difference between connected/disconnected)

### Story 2.3: Spotify Search & Side Panel

As a user,
I want to search Spotify for music from within Rewind,
So that I can find albums and artists to add to my journal.

**Acceptance Criteria:**

**Given** the user has connected their Spotify account
**When** the user types in the search input in the side panel
**Then** search results appear from the Spotify Web API within 2 seconds
**And** each result shows: album artwork thumbnail, artist name, and album name
**And** the search proxies through `/api/spotify/search` route handler (handles token refresh transparently)
**And** if no results match, "Nothing found" text appears inline
**And** if the network fails, a subtle inline error appears and the panel stays open
**And** on mobile (<768px), the search panel renders as a full-screen overlay instead of a side panel
**And** the panel can be closed by tapping outside it or pressing escape

### Story 2.4: Add Entry to Index

As a user,
I want to add a search result to my journal with a single tap,
So that adding music is fast and frictionless.

**Acceptance Criteria:**

**Given** Spotify search results are visible in the side panel
**When** the user taps a search result
**Then** a Server Action creates an entry in the Supabase `entries` table with artist_name, album_name, artwork_url, spotify_id, and date_added
**And** the new entry appears in the index immediately (optimistic update or fast revalidation)
**And** the entry is assigned a random scale_tier and hover_color_index
**And** no confirmation dialog appears — the tap IS the action
**And** if the spotify_id already exists, the duplicate is silently ignored (no error shown)
**And** the search panel stays open after adding (user can add multiple entries)
**And** the entire flow from icon tap to entry visible in index takes < 5 seconds

### Story 2.5: Index Populated from Database

As a user,
I want the index to show all my saved entries in chronological order,
So that my journal grows over time as a living archive.

**Acceptance Criteria:**

**Given** entries exist in the Supabase database
**When** the index page loads
**Then** all entries are fetched and displayed in chronological order (newest first)
**And** each entry renders as an IndexEntry with its assigned scale_tier and hover_color_index
**And** artwork thumbnails render inline using stored artwork_url
**And** the layout remains dense and expressive regardless of entry count
**And** if no entries exist and the user is not authenticated, the pre-seeded entry is shown
**And** server-side rendering fetches entries at request time for fast initial paint

---

## Epic 3: Journaling & Detail Page

Users can view rich detail pages for each entry and write personal journal notes with handwritten-feel typography that auto-saves.

### Story 3.1: Detail Page with Entry Data

As a user,
I want to see a beautiful detail page for each album with artwork and metadata,
So that I have a dedicated space to engage with each entry.

**Acceptance Criteria:**

**Given** the page transition from Epic 1 navigates to `/entry/[id]`
**When** the detail page loads for a specific entry
**Then** the page displays the album artwork at a generous size
**And** the artist name and album name are prominently displayed
**And** the date added is shown in monospace metadata typography
**And** the layout is responsive: generous on desktop, stacked vertically on mobile
**And** a back affordance is visible to return to the index
**And** the page is server-rendered with entry data fetched from Supabase

### Story 3.2: Journal Note Editor

As a user,
I want to write personal notes on any entry with a handwritten feel,
So that I can capture what I'd otherwise forget about an album.

**Acceptance Criteria:**

**Given** the detail page renders for an entry
**When** the user taps the note area
**Then** a text editor activates with handwritten-feel typography (Caveat, Reenie Beanie, or similar)
**And** the user can write free-form text
**And** notes auto-save as the user types (debounced Server Action updating `note_text` in Supabase)
**And** when revisiting the entry, previously written notes are loaded and displayed
**And** if auto-save fails, a subtle inline indicator appears (no data loss — retry on next keystroke)
**And** the handwritten font is loaded via @font-face with appropriate fallback

---

## Epic 4: Digital Postcard & Sharing

Users can create intimate "this made me think of you" postcards and share their full journal as a read-only artifact.

### Story 4.1: Postcard Composer

As a user,
I want to create a "this made me think of you" postcard from any entry,
So that I can share a personal, intimate musical recommendation.

**Acceptance Criteria:**

**Given** the user is on a detail page for an entry
**When** the user taps "This made me think of you"
**Then** a postcard composer opens with the album artwork visible
**And** a handwritten-style text field is available for writing a personal note
**And** on completion, a Server Action creates a postcard record and generates a unique shareable link
**And** the link is displayed for copying/sending
**And** the postcard data includes: entry reference, note text, creation date

### Story 4.2: Postcard View

As a recipient,
I want to view a shared postcard without creating an account,
So that I can experience the personal recommendation as intended.

**Acceptance Criteria:**

**Given** a valid postcard link exists
**When** a recipient opens the link at `/postcard/[id]`
**Then** the page displays the album artwork prominently
**And** the handwritten note is displayed in the same handwritten-feel typography
**And** no login or account creation is required
**And** the page is self-contained — it communicates the full gesture without context
**And** the page is server-rendered and shareable (proper meta tags for link previews)

### Story 4.3: Shared Journal View

As a user,
I want to share a read-only view of my full journal via link,
So that someone close can browse my musical world.

**Acceptance Criteria:**

**Given** the user wants to share their journal
**When** a recipient opens the shared journal link
**Then** the typographic index renders in read-only mode with all entries
**And** hover states work (color shift, artwork zoom)
**And** tapping an entry shows the detail page (without journal notes — notes are private)
**And** no login or account creation is required
**And** the shared view is visually identical to the owner's index (same typography, layout, colors)
