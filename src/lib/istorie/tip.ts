/** Un articol din seria „Vremuri grele” (/istoria-umanitatii/<slug>): text public în Markdown-ul mic din src/lib/continut/markdown.ts. */
export type Articol = {
  slug: string;
  /** Numele scurt, în lista seriei. */
  label: string;
  /** O frază pentru lista seriei. */
  short: string;
  h1: string;
  title: string;
  description: string;
  updated: string;
  /** Marcajul [[fila]], pe un rând singur, arată locul filei pentru cei cu cont (src/lib/istorie/file.ts). */
  text: string;
};
