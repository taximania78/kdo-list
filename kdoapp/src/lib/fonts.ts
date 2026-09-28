import { Bricolage_Grotesque, Caveat, DM_Mono, Figtree } from 'next/font/google';

// Les 4 polices de DESIGN.md, chargées une seule fois ; globals.css les reprend via ces variables.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-bricolage',
});
const body = Figtree({ subsets: ['latin'], variable: '--font-figtree' });
const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
});
const hand = Caveat({ subsets: ['latin'], variable: '--font-caveat' });

export const fontVariables = [
  display.variable,
  body.variable,
  mono.variable,
  hand.variable,
].join(' ');
