---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-03-22
author: Ankush G
---

# Product Brief: Rewind

## Executive Summary

Rewind is a personal typographic music journal — a private, visually expressive space for saving, annotating, and reflecting on music. It sits at the intersection of mindful listening, personal archiving, and design craft. Rather than treating music as data to be managed, Rewind treats it as something sensory and emotional, worthy of the same attention a zine-maker gives to layout or a diarist gives to memory.

It is not a productivity tool, a social platform, or a competitor to existing music apps. It is a creative artifact built for one person — with the potential to be shared as a portrait of taste and identity.

---

## Core Vision

### Problem Statement

There is no place that combines music reflection with visual and typographic expression. Existing tools — Spotify playlists, Apple Music libraries, Notion pages, scrobbling services — treat music as functional data: tracks, ratings, timestamps. They optimize for utility, not meaning. The result is that the personal, emotional dimension of listening — the memories, the moods, the "this album changed something in me" moments — has nowhere to live in a form that feels as beautiful as the music itself.

### Problem Impact

Without a dedicated space for musical reflection, listening remains passive and forgettable. Albums blur together. Moments tied to songs go uncaptured. The relationship between a person and their music stays shallow — a list of plays rather than a lived history. For someone who cares deeply about music and design, this is a quiet but persistent loss.

### Why Existing Solutions Fall Short

- **Spotify / Apple Music**: Excellent for playback and discovery, but offer zero space for personal annotation or visual expression. Playlists are flat, functional, and visually identical.
- **Last.fm / Rate Your Music**: Data-oriented — scrobble counts, ratings, charts. They quantify listening but don't invite reflection.
- **Notion / Physical journals**: Flexible but generic. No native connection to music metadata, artwork, or playback. The writing exists in isolation from the listening.
- **Wrapped / Replay summaries**: Algorithmically generated, impersonal, ephemeral. They reflect consumption back at you without inviting you to add meaning.

None of these combine writing, visual design, and music in a single, crafted experience.

### Proposed Solution

Rewind is a Next.js web application backed by Supabase, integrated with the Spotify Web API. Its primary interface is a typographic index — large, expressive artist and album names flowing across the screen with album artwork appearing inline — inspired by gallery archive indexes and editorial zine layouts. Each entry links to a detail page where the user can write personal notes, memories, and reflections tied to the music. The aesthetic is intentionally raw and editorial, closer to a printed zine than a polished SaaS product.

The core loop is: **listen → reflect → capture → re-listen with richer presence**. Over time, the journal becomes a living archive that deepens the listening experience and serves as a shareable self-portrait — not through social features, but by offering a way to hand someone a window into your musical world.

### Key Differentiators

- **Typography as primary UI**: The index view treats artist/album names as the visual experience, not metadata beneath a grid of album covers. Design is the product.
- **Reflection-first, not utility-first**: Rewind prioritizes the act of writing and remembering over organizing or managing a music library.
- **Personal artifact, not social platform**: Sharing is intimate and intentional — like handing someone a zine — not broadcast or feed-based.
- **Design playground**: The project itself is a vehicle for creative expression and typographic experimentation, evolving alongside the journal it contains.
- **The mindfulness loop**: By capturing reflections, Rewind actively transforms future listening from passive consumption into present, intentional experience.

## Target Users

### Primary User

**Ankush — The Maker & Listener**

A design-minded developer who listens to music with intention. Rewind is built by and for this person. They move between three distinct modes of engagement:

- **Post-listen journaling**: Just finished an album. Thoughts are fresh. They open Rewind to capture a note — a feeling, a memory, a single line that anchors the experience before it fades.
- **Reflective browsing**: No specific agenda. They open the index and scroll through the typographic landscape of their own musical history. An artist name catches their eye, they tap in, re-read what they wrote months ago, and something clicks — they queue the album again, this time listening differently.
- **Discovery capture**: Found something new — a recommendation, an algorithm surprise, a deep cut. They search Spotify from within Rewind and add it to the journal, staking a claim: this matters enough to keep.

**What success looks like**: The journal feels like an extension of how they think about music. It's not a chore to maintain — it's a pleasure to use and a pleasure to look at. Opening it shifts their attention from passive scrolling to intentional engagement.

**Platform context**: Rewind must be fully responsive — used on desktop for longer journaling sessions and on mobile for quick captures, reflective browsing on the couch, or sharing a link with a friend. The typographic index should feel equally expressive on a phone screen.

### Secondary User

**The Close Reader — A Friend or Partner**

Someone Ankush trusts enough to hand a window into his inner world. They receive a link and browse the journal casually — not as a tool, but as an artifact. They scroll the typographic index, maybe click into an album they recognize, read a note they didn't expect. It's read-only. No accounts, no interaction, no comments.

**What success looks like**: They leave with a feeling — "I didn't know that album meant that to him" — not a feature request. The journal communicates something words in a text message couldn't.

### User Journey

**Discovery → First Entry**
Ankush builds Rewind himself. There's no onboarding — the first act is searching for an album on Spotify and adding it. The moment the artist name appears in the typographic index for the first time, the journal feels *alive*.

**Core Loop**
Listen → Open Rewind → Write something (a sentence, a paragraph, a memory) → Close it. Days later, browse the index → re-encounter an old entry → re-listen with richer context. The journal compounds over time.

**The Share Moment**
At some point, Ankush shares the link with someone close. No announcement, no explanation — just "here." The other person browses and gets it. That's the second kind of success: the journal speaks for itself.

**Long-term**
The journal grows into a living archive. The typographic index becomes denser, more expressive. Older entries gain new meaning. The design evolves as Ankush experiments. Rewind becomes a thing he maintains the way someone maintains a sketchbook — not out of obligation, but because it's part of how he processes the world.

## Success Metrics

Rewind is a personal creative project, not a business product. Success is measured by craft and feeling, not KPIs.

### Personal Success Criteria

- **Intentionality**: Every design choice — typographic, interaction, layout — feels deliberate. Nothing is accidental or default. The app looks and feels like it was *made*, not generated.
- **It works as it intends**: The core loop (search → save → annotate → browse → re-listen) functions smoothly and without friction. The technology disappears behind the experience.
- **Usage follows naturally**: There is no engagement target. If the design is right and the experience is honest, Rewind becomes something reached for organically — after a good listen, during a reflective moment, or when wanting to share something personal.
- **The share moment lands**: When someone receives a link to the journal, they browse it and *feel* something. No explanation needed.

### Functional Milestones

| Milestone | Description |
|-----------|-------------|
| **v0.1 — The Index** | Typographic index view — large expressive artist/album names, inline artwork, responsive on mobile. Visual polish is the priority. This *is* the product's first impression. |
| **v0.2 — Add Music** | Spotify search integration, save entries to Supabase, entries appear in the index |
| **v0.3 — Journaling** | Detail pages per entry, note-writing and personal annotations with a handwritten feel |
| **v0.4 — Digital Postcard** | "This made me think of you" — select music, write a handwritten-style note, forward as an intimate digital postcard |
| **v0.5 — Playback** | Optional Spotify Web Playback SDK integration |

### Business Objectives

N/A — This is a personal project. No revenue, growth, or acquisition targets.

### Key Performance Indicators

N/A — Success is qualitative: does it feel intentional, does it work, does usage follow.

## MVP Scope

### Core Features (v0.1 — The Index)

- **Typographic index view**: Large, expressive artist and album names as the primary visual element, following the dotted-letterform gallery/archive aesthetic from the style reference. This is the hero experience.
- **Inline album artwork**: Album art appearing between or alongside text entries, interactive on hover/tap.
- **Responsive layout**: Fully responsive — the typographic index must feel equally expressive on mobile and desktop.
- **Visual polish priority**: UI stability, interaction quality, and typographic craft take precedence over backend complexity. The index should feel finished, not scaffolded.

### Core Features (v0.2 — Add Music)

- **Spotify search**: Search the Spotify Web API from within Rewind to find artists, albums, or songs.
- **Save entries**: Persist entries to Supabase with metadata (artist, album, artwork URL, Spotify ID).
- **Entries appear in index**: Saved music populates the typographic index in real time.
- **Minimal auth**: Only what Spotify OAuth requires. No user management beyond a single authenticated session.
- **Backend philosophy**: Keep it simple — get the job done. No over-engineering. The backend serves the frontend, not the other way around.

### Out of Scope for MVP

No hard exclusions — features are sequenced by priority, not blocked. The following are deferred to later milestones, not rejected:

- Journaling / detail pages with handwritten-feel notes (v0.3)
- Digital postcard — "This made me think of you" (v0.4)
- Spotify playback (v0.5)

### MVP Success Criteria

- The typographic index looks and feels intentional on both desktop and mobile
- Adding music via Spotify search is frictionless
- The overall experience feels like a designed artifact, not a developer prototype

### Future Vision

- **Journaling (v0.3)**: Detail pages per entry with personal notes and annotations. Writing interface has a **handwritten feel** — script typography or hand-drawn texture that contrasts with the bold typographic index.
- **Digital Postcard — "This made me think of you" (v0.4)**: A dedicated sharing artifact. Select a song or album, write a short note with the same handwritten aesthetic, and forward it as a personal postcard. Not a share button — a crafted, intimate gesture delivered through design.
- **Spotify Playback (v0.5)**: Optional in-app playback via Web Playback SDK for a fully contained listening-and-reflecting experience.
- **Design evolution**: The typographic treatments, layouts, and interactions evolve over time as a creative playground. Rewind is never "done" — it's a living sketchbook.

### Style Direction

- **Index typography**: Inspired by the gallery/archive reference — dotted or stencil letterforms, large scale, flowing layout with artwork inline
- **Notes & postcards**: Handwritten feel — script fonts, hand-drawn textures, intimate and personal in contrast to the editorial index
- **Overall aesthetic**: Raw, editorial, zine-like. Intentionally not polished in the SaaS sense. Closer to printed matter than a tech product.
