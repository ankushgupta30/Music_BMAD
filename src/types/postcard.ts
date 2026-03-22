/** Row in `postcards` (Epic 4 — share one entry + note) */
export interface Postcard {
  id: string;
  entry_id: string;
  note_text: string;
  created_at: string;
}

/** Row in `journal_shares` — one read-only journal link per auth user */
export interface JournalShare {
  id: string;
  owner_id: string;
  token: string;
  created_at: string;
}
