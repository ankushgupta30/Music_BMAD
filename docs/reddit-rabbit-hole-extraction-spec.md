# Reddit Rabbit-Hole Extraction Spec

This document describes the deterministic heuristics used to turn Reddit threads/comments about `"[SONG]" by "[ARTIST]"` into structured “listener takes” that power the post-it UI.

## Inputs
- For a given `(artist, song)` query, we search Reddit and select up to `MAX_THREADS_FOR_COMMENTS` seed submissions.
- For each seed submission:
  - We fetch up to `MAX_COMMENTS_PER_THREAD` top comments (`depth=1`).
  - We create “utterances” from:
    - the submission selftext (if present; otherwise submission title)
    - each fetched comment body

## Category eligibility (6 buckets)
Each utterance is tested against category regex triggers. An utterance may contribute to multiple buckets, but final output is rank-selected per bucket.

1. **Similar sounds** (`similar`)
   - Trigger: phrases like `sounds like`, `reminds me of`, `same vibe`, `same era`, `same producer`, `in the lane of`, `gives me... vibes`.
2. **Sonic detail** (`sonic`)
   - Trigger: production/sound terms like `sample`, `producer`, `mix`, `master`, `808`, `synth`, `reverb`, `distortion`, `strings`, `keys`, etc.
3. **Emotional texture** (`emotional`)
   - Trigger: feeling/metaphor terms like `feels like`, `makes me feel`, `hits different`, `nostalgia`, `intimate`, `cathartic`, `goosebumps`, etc.
4. **Hidden gem** (`hidden`)
   - Trigger: `underrated`, `slept on`, `deep cut`, `hidden gem`, `buried`, etc.
5. **Debate & friction** (`debate`)
   - Trigger: `overrated`, `underrated`, `skip`, `no skip`, `hot take`, plus question marks (`?`) as debate proxy.
6. **Personal stories** (`stories`)
   - Trigger: memory triggers like `first time i heard`, `in the car`, `during college`, `after my breakup`, etc.

## Quote extraction (verbatim slice)
- We sanitize comment/selftext by removing `[deleted]` / `[removed]` and collapsing whitespace.
- We create a quote snippet from the utterance:
  - Prefer the first 2–3 sentences depending on length
  - Hard-cap by `SNIPPET_MAX`

## Entities & “why” extraction (deterministic heuristics)
For any utterance that passes category eligibility:

### Entities
We extract up to 3 entities using regex + lightweight keyword scanning per category:
- `similar`: extract text following `sounds like/reminds me of/same vibe/...`
- `sonic`: extract producer/sample targets (`produced by`, `sampled`, `interpolation`) and instrument tokens (`808`, `synth`, `guitar`, `strings`, `reverb`, `distortion`, etc.)
- `emotional`: extract phrase following `feels like/makes me feel/hits different/...`
- `hidden`: extract candidate deep-cut targets following `underrated/slept on/deep cut/...`
- `debate`: extract the contested target following `overrated/skip/hot take/...`
- `stories`: extract the trigger phrase and the following short tail (place/time context)

### “Why” snippet
- We take a fixed “window around the first regex match” for the category.
- This yields a short excerpt that explains *why* the utterance belongs to the bucket.

## Scoring / ranking (“confidence” without an LLM)
Each candidate item receives a numeric score:
- `threadBaseScore(utterance, ups, num_comments)`
  - boosts discussion/opinion language and first-person markers
  - includes log-scaled upvotes and comment count
- category bonus (`bonus`)
- additional boosts:
  - comment vs submission (`isComment`)
  - longer utterances
  - extra opinion markers

Final UI output picks the top candidate(s) per category, with a second pick for `hidden` when available.

## Output format
Each emitted `EntryTriviaItem.text` is formatted as:

`<Label> · r/<subreddit>: "<quote>" · [<entity1, entity2, ...>] — <why window>`

Special casing:
- `hidden` items are labeled as **`Hidden gem:`** for obvious flagging in the post-it.

## Deduping
- We dedupe by `(categoryKey + normalizedSnippetPrefix)` so repeated “same idea” utterances don’t flood results.

