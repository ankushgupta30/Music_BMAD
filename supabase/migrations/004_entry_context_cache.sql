-- Cached trivia (Last.fm wiki) + cover renditions (Spotify search) for entry detail (Epic 3)
ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS trivia_summary TEXT,
  ADD COLUMN IF NOT EXISTS renditions_json JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS context_fetched_at TIMESTAMPTZ;

COMMENT ON COLUMN entries.trivia_summary IS 'Plain-text track wiki excerpt (e.g. Last.fm), server-fetched';
COMMENT ON COLUMN entries.renditions_json IS 'JSON array of { spotify_id, title, artist_name } alternate recordings';
COMMENT ON COLUMN entries.context_fetched_at IS 'When trivia/renditions were last refreshed';
