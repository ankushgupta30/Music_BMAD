export interface SpotifySearchResult {
  id: string;
  name: string;
  artists: { name: string }[];
  album?: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
  images?: { url: string; width: number; height: number }[];
  type: 'album' | 'track' | 'artist';
}

export interface SpotifySearchResponse {
  albums?: { items: SpotifySearchResult[] };
  tracks?: { items: SpotifySearchResult[] };
  artists?: { items: SpotifySearchResult[] };
}
