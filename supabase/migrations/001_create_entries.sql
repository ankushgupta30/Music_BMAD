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
