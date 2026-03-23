-- Structured, source-aware trivia cache for multi-source aggregation.
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS trivia_items_json JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN entries.trivia_items_json IS
  'JSON array of ranked trivia items: { text, source_type, source_url, score, fetched_at }';

