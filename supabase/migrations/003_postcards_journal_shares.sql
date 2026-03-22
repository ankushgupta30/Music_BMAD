-- Postcards: share a single entry + handwritten note (Epic 4)
CREATE TABLE postcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL CHECK (char_length(note_text) <= 8000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_postcards_entry_id ON postcards(entry_id);
CREATE INDEX idx_postcards_created_at ON postcards(created_at DESC);

-- One share link per Supabase auth user (full journal read-only)
CREATE TABLE journal_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT journal_shares_owner_unique UNIQUE (owner_id)
);

CREATE INDEX idx_journal_shares_token ON journal_shares(token);

-- No RLS policies: only service role / server uses these tables from the app.
ALTER TABLE postcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_shares ENABLE ROW LEVEL SECURITY;
