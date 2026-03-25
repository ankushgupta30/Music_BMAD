# Reddit Listener Takes Audit & Validation

## What this is for
We want “listener takes” (personal opinions, comparisons, sonic observations) to show reliably in the `From listeners` section.

Because the pipeline is deterministic + regex-based, the easiest path to high accuracy is:
1. Inspect where recall drops (search → seed threads → comments → category extraction → mapping).
2. Iterate on thresholds and regexes.
3. Re-run the same audit sample and compare coverage/quality metrics.

## Debugging a single entry
Open any entry and append:
- `?debugReddit=1`

Example:
- `/entry/song-123?debugReddit=1`

This shows the per-track `redditDebug` JSON including:
- `searchResultsCount`
- `postsConsideredCount`
- `postsDroppedReasons` (buckets)
- `seedPostsCount`
- `commentsFetchedTotal`
- `utterancesCount`
- `categoryUtteranceMatches` + `categoryItemsCreated`
- `extractedItemsCount`
- `usedFallback`
- `persistedTriviaItemsCount`

## Audit runner (N=30)
Call:
- `GET /api/debug/reddit-listener-audit?limit=30`

The endpoint returns:
- `stages` histogram (inferred failure stage)
- per-entry `redditDebug` + `stage`

If Supabase admin credentials aren’t available, the runner falls back to `SEED_ENTRIES` from `src/lib/utils/seedData.ts`.

## Stage inference mapping
We classify failures using the returned debug fields:
- `search_empty`: `searchResultsCount === 0`
- `filtered_out`: `postsConsideredCount === 0`
- `seed_empty`: `seedPostsCount === 0`
- `comments_empty`: `commentsFetchedTotal === 0`
- `category_miss_fallback`: `extractedItemsCount === 0` and `usedFallback === true`
- `category_miss`: `extractedItemsCount === 0`
- `persistence_mapping_drop`: `persistedTriviaItemsCount === 0`
- `ok`: otherwise

## Validation metrics (quality gates)
Run the audit sample and track:

### Coverage
- `coverage_reddit_present`:
  - % of tracks where `stage === "ok"` or `persistedTriviaItemsCount > 0`
- `coverage_category_miss`:
  - % of tracks where `stage` contains `category_miss`

### Quality (deterministic proxy checks)
Because the output is regex deterministic, we validate “listener take-ness” via heuristics on the returned `finalItemsPreview` strings:
- `subjective_language_rate`:
  - % of reddit items containing first-person/opinion markers (`"I "`, `"imo"`, `"in my opinion"`, `"feels"`, `"hits different"`, `"wish"`, `"slaps"`, etc.)
- `entity_presence_rate`:
  - % of reddit items containing:
    - a bracketed entity list: `[ ... ]`
    - or sonic keywords (`808`, `synth`, `sampled`, `producer`, `reverb`, etc.)

## Re-run loop
After any regex/threshold/code change:
1. Re-run the same audit endpoint with `limit=30`.
2. Compare:
   - drop-off stage histogram (`stages`)
   - coverage rates
   - subjective language rate
3. Only promote changes once:
   - `category_miss_*` drops
   - `coverage_reddit_present` increases
   - `subjective_language_rate` stays high

