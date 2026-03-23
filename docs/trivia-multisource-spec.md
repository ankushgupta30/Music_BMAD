# Multi-Source Trivia Spec

## Goal
Expand entry-detail trivia from a single Last.fm summary into a citation-backed, multi-source pipeline (Last.fm first, then Reddit and other trusted sources) with ranked, cacheable trivia items.

## Scope
- Keep current detail page stable while introducing a structured trivia model.
- Preserve backward compatibility with existing `trivia_summary`.
- Prepare backend contracts so Story 2 can add Reddit collection/ranking cleanly.

## Data Contract
- `entries.trivia_summary` remains the legacy plain-text field.
- Add `entries.trivia_items_json` as canonical structured trivia cache.
- Each item shape:
  - `text: string`
  - `source_type: "lastfm" | "reddit" | "wiki" | "interview" | "editorial" | "other"`
  - `source_url: string | null`
  - `score: number | null`
  - `fetched_at: string` (ISO)

## User Stories

### Story 1 — Structured trivia foundation (this story)
As a user, I want trivia to be stored as source-aware items so the app can later blend Last.fm and Reddit results without losing provenance.

Acceptance criteria:
- DB has `trivia_items_json` column with JSON array default.
- `Entry` type includes `trivia_items`.
- Row mapping parses `trivia_items_json` safely.
- Context enrichment persists Last.fm results into `trivia_items_json`.
- Existing UI behavior remains intact (still renders from `trivia_summary` for now).

### Story 2 — Reddit collector
As a user, I want relevant Reddit-derived trivia to appear when available.

Acceptance criteria (next):
- Reddit provider fetches candidate claims by song+artist query.
- Low-quality/off-topic results are filtered out.
- Top claim(s) are merged into `trivia_items_json` with `source_type: "reddit"`.

Status:
- Implemented provider scaffold at `src/lib/reddit/trivia.ts`.
- Uses allowlisted music communities + token relevance filtering.
- Controlled by `REDDIT_TRIVIA_ENABLED=1`.

### Story 3 — Ranking and citation-first rendering
As a user, I want concise, trustworthy trivia with clear citations.

Acceptance criteria (next):
- Combined scoring across sources.
- Dedupe/corroboration step before save.
- UI renders top ranked structured item(s) with source attribution.

