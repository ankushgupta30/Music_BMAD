export type ScaleTier = 'large' | 'medium' | 'small';

/** Alternate recording / cover surfaced from search (not the journal row itself). */
export interface EntryRendition {
  spotify_id: string;
  title: string;
  artist_name: string;
}

export interface Entry {
  id: string;
  spotify_id: string;
  artist_name: string;
  album_name: string;
  /** Track or piece title shown beside the cover (line 1) */
  song_name: string;
  /** Release year shown under the song title (line 2) */
  release_year: number;
  artwork_url: string;
  note_text: string | null;
  scale_tier: ScaleTier;
  hover_color_index: number;
  date_added: string;
  updated_at: string;
  /** Plain-text wiki-style trivia; null if not fetched or unavailable */
  trivia_summary: string | null;
  /** Popular / alternate renditions of the same song title */
  renditions: EntryRendition[];
  /** ISO timestamp of last server refresh of trivia + renditions */
  context_fetched_at: string | null;
}
