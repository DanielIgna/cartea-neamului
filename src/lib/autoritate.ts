/**
 * Etapa 5, autoritate (Daniel, 17.11.2026): paginile prin care alte site-uri ajung să vorbească despre noi și să ne dea linkuri.
 * /presa: kitul de presă (ce e Cartea Neamului, cifre, unghiuri de articol, sigla, contact).
 * /arborele-meu: widgetul gratuit pe care familiile îl pun pe blogul lor (src/lib/widget-arbore.ts), cu un link spre noi.
 * Doar în română, ca /scoala; intră în sitemap prin grupul „autoritate” și în Admin → SEO.
 */
export type AuthorityPage = { path: string; title: string; description: string; h1: string };

export const AUTHORITY_UPDATED = new Date("2026-11-17T00:00:00Z");

export const PRESS_PAGE: AuthorityPage = {
  path: "/presa",
  title: "Presă: Cartea Neamului, date, sigle și contact",
  h1: "Cartea Neamului pentru presă",
  description: "Kitul de presă al Cartea Neamului: ce face platforma, cifre la zi, idei de articole, sigla de descărcat și adresa de contact pentru jurnaliști.",
};

export const WIDGET_PAGE: AuthorityPage = {
  path: "/arborele-meu",
  title: "Widgetul gratuit „Arborele meu” pentru blog",
  h1: "Widgetul gratuit „Arborele meu”",
  description: "Pune pe blogul familiei o fișă a neamului: câte persoane, generații și locuri de baștină are arborele. Gratuit, fără nume și fără datele celor vii.",
};

export const AUTHORITY_PAGES = [PRESS_PAGE, WIDGET_PAGE];

/** Unghiurile de articol din kitul de presă: subiecte care țin de familie și istorie, nu de produs. */
export const PRESS_ANGLES: { title: string; text: string }[] = [
  { title: "Vocea bunicilor, păstrată pentru strănepoți", text: "Familiile înregistrează poveștile bătrânilor și le leagă de paginile cărții tipărite, cu un cod pe care nepoții îl scanează cu telefonul." },
  { title: "Românii din diaspora își caută satul de baștină", text: "Milioane de români trăiesc în afara țării. Mulți copii crescuți în Italia, Spania sau Germania vor să știe de unde vin bunicii lor." },
  { title: "Arborele genealogic, temă de școală", text: "Fișe gratuite pentru clasele primare și gimnaziu, pe care copiii le completează împreună cu părinții și bunicii." },
  { title: "Ce spun registrele vechi despre satele noastre", text: "Registrele parohiale, catagrafiile și conscripțiile arată cum trăiau oamenii acum două sute de ani. Ghidurile gratuite explică pe înțeles cum se citesc." },
  { title: "Cadoul de sărbători care rămâne în familie", text: "Un arbore al familiei, făcut împreună și tipărit ca o carte, oferit părinților și bunicilor." },
];
