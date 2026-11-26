/**
 * Paginile spre care trimite subsolul în română (26.11.2026): cele care au deja afișări în Google, plus câteva noi și importante.
 * Search Console arăta că legăturile interne mergeau mai ales spre /termeni, /parteneri și /cadou-de-sarbatori (din subsol), iar
 * ghidurile primeau puține. Lista se schimbă după raportul săptămânal: scoate ce nu mai are afișări, pune ce urcă.
 */
export const POPULAR_LINKS: { href: string; label: string }[] = [
  { href: "/glosar/act-de-nastere", label: "Actul de naștere" },
  { href: "/ghid/scrierea-chirilica-romaneasca", label: "Alfabetul chirilic românesc" },
  { href: "/glosar/livret-militar", label: "Livretul militar" },
  { href: "/unelte/rudenie/cumnat", label: "Cine e cumnatul" },
  { href: "/ghid/grade-de-rudenie", label: "Gradele de rudenie" },
  { href: "/ghid/transcrierea-actelor-din-strainatate", label: "Transcrierea actelor din străinătate" },
  { href: "/diaspora/sasi-si-svabi", label: "Sași și șvabi" },
  { href: "/diaspora/canada/toronto", label: "Românii din Toronto" },
  { href: "/ghid/carte-cu-arborele-genealogic", label: "Cartea familiei" },
  { href: "/ghid/nasterea-lui-isus-in-evanghelii", label: "Povestea Nașterii" },
];
