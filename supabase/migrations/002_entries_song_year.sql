-- Align DB with app usage (addEntry / index)
ALTER TABLE entries ADD COLUMN IF NOT EXISTS song_name TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS release_year INTEGER DEFAULT 0;

UPDATE entries SET song_name = album_name WHERE song_name IS NULL;
