export const WADA_PALETTE = [
  'var(--color-wada-1)', // Muted terracotta
  'var(--color-wada-2)', // Moss green
  'var(--color-wada-3)', // Slate blue
  'var(--color-wada-4)', // Soft vermillion
  'var(--color-wada-5)', // Ochre
  'var(--color-wada-6)', // Deep teal
  'var(--color-wada-7)', // Dusty rose
  'var(--color-wada-8)', // Sage
] as const;

export function getWadaColor(index: number): string {
  return WADA_PALETTE[index % WADA_PALETTE.length];
}

export function getRandomWadaIndex(): number {
  return Math.floor(Math.random() * WADA_PALETTE.length);
}
