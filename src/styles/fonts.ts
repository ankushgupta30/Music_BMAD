import { Space_Grotesk, Space_Mono, Caveat } from 'next/font/google';

export const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-display',
  display: 'swap',
});

export const metaFont = Space_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-meta',
  display: 'swap',
});

export const handFont = Caveat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-hand',
  display: 'swap',
});
