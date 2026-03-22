export type ScaleTier = 'large' | 'medium' | 'small';

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
}
