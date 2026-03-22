---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - product-brief-Song-List-2026-03-22.md
  - ux-design-specification.md
workflowType: 'prd'
classification:
  projectType: web_app
  domain: creative_tools
  complexity: low
  projectContext: greenfield
---

# Product Requirements Document — Rewind

**Author:** Ankush G
**Date:** 2026-03-22

---

## Executive Summary

Rewind is a personal typographic music journal — a web application where saving, annotating, and browsing music is an aesthetic experience rather than a utility. The primary interface is a dense, flowing typographic index of artist and album names rendered in large-scale dotted/stencil letterforms, with album artwork appearing inline. Each entry links to a detail page for personal notes and reflections.

The product serves a single user (the maker) and an occasional secondary audience (a close friend receiving a shared link). It is not a social platform, a competitor to Spotify, or a productivity tool. It is a creative artifact — a design playground where typography, interaction design, and music reflection converge.

### What Makes This Special

- **Typography IS the interface.** No cards, no grids, no chrome. Artist and album names at massive scale are the entire visual experience. The index is designed for browsing as a first-class activity, not as a launchpad.
- **Reflection-first, not utility-first.** Rewind exists to deepen the listening experience through writing and re-encountering. The core loop — listen, reflect, capture, re-listen with richer presence — is the product.
- **A personal artifact, not a product.** Sharing is intimate (a link, a digital postcard), not broadcast. Design evolves alongside the journal as a living creative expression.
- **Sanzo Wada color palette as interaction language.** Hover states on text cycle through curated colors from Wada's Dictionary of Color Combinations, creating a culturally specific, intentional interaction layer.

## Project Classification

- **Project Type:** Web application (Next.js, deployed to Vercel)
- **Domain:** Personal creative tools / music journaling
- **Complexity:** Low — single user, no multi-tenancy, no regulated data, no complex business logic
- **Project Context:** Greenfield — new project, no existing codebase

---

## Success Criteria

### User Success

- **Intentionality:** Every design choice — typographic, interaction, layout — feels deliberate. Nothing is accidental or default.
- **The index as experience:** Opening Rewind and scrolling the typographic index feels like browsing a well-made book, not using an app. Time spent without a goal is time well spent.
- **The capture moment:** Writing a note on an album and feeling like something that would otherwise fade has been preserved.
- **The re-encounter:** Scrolling the index weeks later, seeing something forgotten, tapping in, reading what was written — the loop closes.
- **The share moment:** Sending a link to someone close. They browse, they feel something. No explanation needed.

### Technical Success

- **It works as it intends:** The core loop (search → save → annotate → browse → re-listen) functions without friction. Technology disappears behind the experience.
- **Visual fidelity:** The typographic index renders correctly and expressively across desktop and mobile. Typography at scale is the hardest technical challenge and must be solved well.
- **Speed of addition:** Adding music from Spotify search takes < 5 seconds.

### Business Success

N/A — personal project. No revenue, growth, or acquisition targets. Success is qualitative: does it feel intentional, does it work, does usage follow naturally.

### Measurable Outcomes

| Outcome | Indicator |
|---------|-----------|
| Index feels full and expressive | Dense from day one, regardless of entry count |
| Browsing is a first-class experience | No friction to open, scroll, linger |
| Adding music is fast | < 5 seconds from search to index entry |
| Typography renders at scale | Responsive, expressive across all viewports |
| Page transitions feel intentional | "Going inside" an entry, not loading a new page |

---

## Product Scope

### MVP — v0.1: The Index

The typographic index view is the entire MVP. Visual polish is the priority.

- Typographic index: large, expressive artist/album names in dotted/stencil letterforms, flowing non-grid layout
- Inline album artwork: scattered between entries, interactive zoom on hover
- Scale variation: entries at different sizes (large/medium/small) for visual rhythm and density
- Sanzo Wada hover states: text color shifts on hover from curated palette
- Responsive layout: fully expressive on desktop and mobile
- Pre-seeded with one curated entry for first-open experience
- Full-page transition on entry tap (navigates to detail page placeholder)

### v0.2: Add Music

- Spotify OAuth connect via side panel
- Spotify Web API search (artist, album, track)
- Save entries to Supabase (artist, album, artwork URL, Spotify ID, date)
- New entries appear in index immediately
- Minimal auth — only what Spotify OAuth requires

### v0.3: Journaling

- Detail page per entry with album artwork, metadata
- Journal note editor with handwritten-feel typography
- Auto-save
- Navigate back to index

### v0.4: Digital Postcard

- "This made me think of you" composer
- Select album, write handwritten-style note
- Generate shareable link
- Recipient sees self-contained postcard (read-only, no account needed)

### v0.5: Playback

- Optional Spotify Web Playback SDK integration
- In-app listening while browsing/writing

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Dotted/stencil font sourcing** | Identify open-source alternatives to Sélavy early; fall back to a custom CSS treatment if licensing is prohibitive |
| **Responsive typography at scale** | Use vw units with `clamp()` floors; test on real devices early in v0.1 |
| **Spotify API rate limits** | Cache search results; Spotify's rate limits are generous for single-user apps |
| **Supabase schema evolution** | Start simple (one table), migrate as needed. No complex relational model. |

---

## User Journeys

### Journey 1: First Open — "What is this?"

Ankush opens Rewind for the first time. The index is already there — a single curated entry fills the viewport with large dotted letterforms. He scrolls, hovers over the artist name, watches the color shift to a muted terracotta. He taps the artwork and sees it zoom. He taps the entry itself and is prompted to connect Spotify. He authorizes, searches for an album he just listened to, taps to add it. The name appears in the index — large, bold, his. The journal is alive.

**What this journey reveals:** First-open experience, pre-seeding, Spotify OAuth, search, first add.

### Journey 2: Post-Listen Capture — "I need to save this"

Just finished an album. Thoughts are fresh. Ankush opens Rewind, taps the Spotify icon, searches, adds the album in under 5 seconds. The entry appears in the index. He taps into it, writes a few lines — a feeling, a memory, a line from a lyric. Auto-saves. He closes Rewind. The moment is captured.

**What this journey reveals:** Speed of addition, journal note editor, auto-save, exit flow.

### Journey 3: Reflective Browsing — "Let me just scroll"

No specific agenda. Ankush opens the index and scrolls. Dense typography fills the viewport. An artist name he forgot about catches his eye — the color shifts as he hovers. He taps in, reads what he wrote months ago. Something clicks. He queues the album on Spotify and listens again, this time differently.

**What this journey reveals:** Index browsing experience, re-encounter loop, detail page reading, integration with external playback.

### Journey 4: The Share Moment — "Here, this is who I am"

Ankush shares a link with someone close. No announcement, no explanation. The friend opens it and sees the typographic index — they scroll through names, some familiar, some not. They tap into an album they recognize, read a note they didn't expect. They leave with a feeling: "I didn't know that album meant that to him."

**What this journey reveals:** Read-only sharing, shared index view, no-account access.

### Journey 5: Digital Postcard — "This made me think of you"

From a detail page, Ankush taps "This made me think of you." A postcard composer opens. He writes a short note in the handwritten-feel editor, generates a link, sends it. The recipient opens a self-contained postcard: album artwork, the note in handwritten typography, warm and intimate.

**What this journey reveals:** Postcard composer, shareable link generation, recipient view.

### Journey Requirements Summary

| Journey | Capabilities Revealed |
|---------|----------------------|
| First Open | Pre-seeded entry, Spotify OAuth, search, add to index |
| Post-Listen Capture | Fast add, journal note editor, auto-save |
| Reflective Browsing | Index browsing, hover interactions, detail page, re-encounter loop |
| The Share Moment | Read-only shared view, no-account access |
| Digital Postcard | Postcard composer, handwritten note, shareable link, recipient view |

---

## Innovation & Novel Patterns

### Typography as Interface

Rewind's primary innovation is using typography as the entire UI surface. No existing music app treats artist and album names as the visual experience. Spotify, Apple Music, and Last.fm all use album art grids or data tables. Rewind inverts this: text is the hero, artwork is punctuation.

This pattern is borrowed from gallery archive indexes (specifically Unlocked/Reconnected) and adapted for music. The adaptation is straightforward — artist/album names have the same expressive variety as institution/artwork names — but the combination with a personal journal layer is novel.

### Sanzo Wada Palette as Interaction Language

Using historically curated Japanese color combinations for hover states is a deliberate design choice that serves both aesthetic and functional purposes: it creates a culturally specific identity, ensures color harmony (Wada's combinations are tested and balanced), and turns a mundane interaction (hover) into a repeated moment of delight.

### Validation Approach

No external validation needed — this is a personal project. The validation is: does it feel right to use? Does the typographic index invite lingering? Does the color palette surprise and satisfy? These are tested through building and using it.

---

## Web Application Requirements

### Technical Architecture Overview

- **Frontend:** Next.js (App Router) deployed to Vercel
- **Database:** Supabase (PostgreSQL) for journal entries, notes, metadata
- **Authentication:** Supabase Auth with Spotify OAuth provider
- **External API:** Spotify Web API for search and metadata
- **Optional:** Spotify Web Playback SDK for in-app playback (v0.5)
- **Styling:** Custom design system on Tailwind CSS + raw CSS/CSS Modules + CSS custom properties

### Frontend Architecture

- Server-side rendering for the index (fast initial paint, SEO not a concern but performance is)
- Client-side interactivity for hover states, transitions, search panel
- Route-based page transitions (index ↔ detail) via Next.js App Router
- No global state management library — React state + Supabase client is sufficient for single-user

### Data Architecture

Single Supabase table for MVP, expandable later:

**entries:** artist, album, artwork_url, spotify_id, date_added, note_text, scale_tier, hover_color_index

### API Integration

- **Spotify Web API:** Search endpoint for artist/album/track lookup. Requires OAuth access token, refreshed via Supabase Auth session.
- **No backend API routes needed for MVP** beyond Next.js API routes for Spotify token refresh.

### Deployment

- Vercel (automatic deployments from git)
- Supabase hosted (free tier sufficient for single-user)
- No CI/CD complexity — deploy on push

---

## Functional Requirements

### Index Browsing

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

### Spotify Integration

- FR11: User can connect their Spotify account via OAuth from within Rewind
- FR12: User can search Spotify for artists, albums, or tracks from a side panel
- FR13: User can add a search result to their journal with a single tap
- FR14: System retrieves and stores artist name, album name, artwork URL, and Spotify ID for each added entry
- FR15: System displays the Spotify connect icon persistently at the top of the viewport

### Entry Management

- FR16: User can view a detail page for any saved entry showing album artwork and metadata
- FR17: Entries appear in the index in chronological order (newest first)
- FR18: New entries appear in the index immediately after being added

### Journaling (v0.3)

- FR19: User can write free-form notes on any entry's detail page
- FR20: Notes auto-save as the user types
- FR21: User can read their previously written notes when revisiting an entry
- FR22: Journal notes are displayed in a handwritten-feel typography

### Digital Postcard (v0.4)

- FR23: User can create a "This made me think of you" postcard from any entry
- FR24: User can write a handwritten-style note on the postcard
- FR25: System generates a shareable link for the postcard
- FR26: Recipient can view the postcard (album artwork + note) without an account

### Sharing (v0.4+)

- FR27: User can share a read-only view of their full journal via link
- FR28: Recipients can browse the typographic index in read-only mode without an account

### Navigation

- FR29: User can navigate back from detail page to the index
- FR30: User can open and close the Spotify search side panel
- FR31: Page transitions between index and detail feel like "going inside" an entry and back

---

## Non-Functional Requirements

### Performance

- NFR1: The index renders and becomes interactive within 1 second on desktop broadband
- NFR2: Hover color transitions complete within 200ms
- NFR3: Artwork zoom animations complete within 300ms
- NFR4: Page transitions between index and detail complete within 500ms
- NFR5: Spotify search results appear within 2 seconds of query
- NFR6: Adding an entry and seeing it in the index takes < 5 seconds end-to-end

### Accessibility

- NFR7: Text contrast meets WCAG AA (4.5:1 minimum against background)
- NFR8: All interactive elements are keyboard navigable (tab, enter, escape)
- NFR9: All interactive elements have visible focus indicators
- NFR10: All artwork has descriptive alt text
- NFR11: Touch targets are minimum 44×44px on mobile
- NFR12: Animations respect `prefers-reduced-motion` — content changes occur instantly when reduced motion is preferred
- NFR13: Font sizing uses `clamp()` with minimum floors to support user font-size preferences

### Integration

- NFR14: Spotify OAuth token refresh happens transparently without user intervention
- NFR15: Spotify API failures degrade gracefully with inline error messages (no global error states)
- NFR16: Supabase operations are resilient to temporary connectivity loss (retry logic)

### Responsiveness

- NFR17: The index is fully functional and visually expressive on viewports from 320px to 2560px+
- NFR18: The search panel adapts from side panel (desktop/tablet) to full-screen overlay (mobile)
- NFR19: Typography scales fluidly using viewport-relative units across all breakpoints
- NFR20: The layout reflows naturally without explicit breakpoints for the index itself
