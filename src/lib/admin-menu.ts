/**
 * Meniul din Admin (Daniel, 2026-11-13): două părți, Business și Infra & Dev, fiecare cu grupuri care se strâng.
 * Orice pagină nouă din panou se trece aici, ca să apară în meniu, în căutarea rapidă și la favorite.
 */
export type AdminSide = "business" | "infra";
export type AdminIcon = "home" | "people" | "chart" | "pulse" | "sliders" | "history" | "alert" | "text" | "image" | "inbox" | "search" | "dna" | "mail" | "shield" | "server" | "robot" | "book" | "map" | "graph" | "heart" | "share" | "calendar" | "gift";
export type AdminItem = { key: string; href: string; label: string; icon: AdminIcon; hint: string; isNew?: boolean; words?: string };
export type AdminGroup = { id: string; label: string; items: AdminItem[] };

export const ADMIN_HOME: AdminItem = { key: "home", href: "/admin", label: "Panou de bord", icon: "home", hint: "Rezumatul zilei", words: "acasa dashboard rezumat" };

export const ADMIN_SIDES: Record<AdminSide, { label: string; title: string; sub: string; groups: AdminGroup[] }> = {
  business: {
    label: "Business",
    title: "Afacerea",
    sub: "Oameni · Bani · Creștere · Conținut",
    groups: [
      {
        id: "oameni", label: "Oameni", items: [
          { key: "oameni", href: "/admin/oameni", label: "Oamenii", icon: "people", hint: "Fiecare cont și până unde a ajuns", words: "utilizatori conturi useri" },
          { key: "probleme", href: "/admin/probleme", label: "Probleme raportate", icon: "alert", hint: "Ce au scris oamenii și răspunsurile", words: "suport bug erori raport" },
          { key: "istoric", href: "/admin/istoric", label: "Istoric și limite", icon: "history", hint: "Cine a schimbat ce, puse înapoi, limite", words: "audit jurnal stergeri undo" },
        ],
      },
      {
        id: "bani", label: "Bani și creștere", items: [
          { key: "business", href: "/admin/business", label: "Business", icon: "chart", hint: "Conturi, arbori, activitate, venituri", words: "venituri statistici" },
          { key: "control", href: "/admin/control", label: "Manager control", icon: "sliders", hint: "Planuri, prețuri, pornirea plăților", words: "planuri preturi plati stripe gratuit" },
          { key: "analiza", href: "/admin/analiza", label: "Analiză", icon: "pulse", hint: "Vizite, surse, campanii, drumul spre plată", isNew: true, words: "trafic vizite analytics campanii" },
          { key: "sanatate", href: "/admin/sanatate", label: "Sănătatea afacerii", icon: "heart", hint: "Scoruri pe departamente față de ținta de 1000 de abonamente", isNew: true, words: "business health venituri crestere conversii seo scor tinta" },
          { key: "crestere", href: "/admin/crestere", label: "Creștere și recomandări", icon: "share", hint: "Invitații, rude aduse, daruri, emailuri cu acord, distribuiri", isNew: true, words: "referral invitatii viral marketing leaduri distribuire" },
          { key: "invatare", href: "/admin/invatare", label: "Învățare și conversii", icon: "pulse", hint: "Jurnalul recomandărilor, cine e aproape de plată, perspective din Analiză", isNew: true, words: "learning lead intent scor proba conversie canal ora iesire jurnal" },
          { key: "calendar", href: "/admin/calendar", label: "Calendar de conținut", icon: "calendar", hint: "Ce postezi, unde și când, cu textul gata scris", isNew: true, words: "postari facebook grupuri continut social" },
          { key: "carduri", href: "/admin/carduri", label: "Carduri cadou / Magazine", icon: "gift", hint: "Carduri vândute în magazine: parteneri, loturi de coduri, vânzări, comision", isNew: true, words: "gift card cadou magazin partener librarie cod qr activare lot comision raft" },
          { key: "adn", href: "/admin/adn", label: "Test ADN", icon: "dna", hint: "Cererile de test și laboratoarele", words: "dna laborator" },
        ],
      },
      {
        id: "continut", label: "Site și conținut", items: [
          { key: "seo", href: "/admin/seo", label: "SEO", icon: "search", hint: "Google, cuvinte căutate, indexare", words: "google search console indexare" },
          { key: "texte", href: "/admin/texte", label: "Texte", icon: "text", hint: "Cuvântul de la finalul Călătoriei", words: "epilog calatoria in timp" },
          { key: "poze", href: "/admin/poze", label: "Poze prima pagină", icon: "image", hint: "Banner și galeria de pe home", words: "banner galerie home" },
          { key: "propuneri", href: "/admin/propuneri", label: "Poze propuse", icon: "inbox", hint: "Pozele trimise de familii", words: "propuneri aprobare" },
        ],
      },
    ],
  },
  infra: {
    label: "Infra & Dev",
    title: "Tehnic",
    sub: "Sistem · Securitate · Email",
    groups: [
      {
        id: "sistem", label: "Sistem", items: [
          { key: "infra", href: "/admin/infra", label: "Infra & Dev", icon: "server", hint: "Baza de date, erori, chei, migrații", words: "server erori baza de date neon vercel chei" },
          { key: "autonomie", href: "/admin/autonomie", label: "Autonomie", icon: "robot", hint: "Cât merge site-ul singur, automatizări, recomandări", isNew: true, words: "automatizari cron scor autopilot bucla recomandari" },
          { key: "email", href: "/admin/email", label: "Email", icon: "mail", hint: "Adresa site-ului și trimiterile", words: "gmail resend contact dns" },
        ],
      },
      {
        id: "cunoastere", label: "Cunoaștere", items: [
          { key: "cunostinte", href: "/admin/cunostinte", label: "Centru de cunoștințe", icon: "book", hint: "Hotărâri, reguli, audituri și ce e de recitit (doar fondatori)", isNew: true, words: "documente decizii reguli registru knowledge memorie revizuire" },
          { key: "functii", href: "/admin/cunostinte/functii", label: "Harta funcțiilor", icon: "map", hint: "Fiecare funcție: sănătate, risc, verificare, matrice", isNew: true, words: "function map functionalitati matrice sanatate risc export csv json" },
          { key: "arhitectura", href: "/admin/cunostinte/arhitectura", label: "Navigator de arhitectură", icon: "map", hint: "De la reguli până la client, cu fișierele reale", isNew: true, words: "architecture flux straturi fisiere" },
          { key: "dependente", href: "/admin/cunostinte/dependente", label: "Harta dependențelor", icon: "graph", hint: "Documente → motoare → metrici → automatizări → API → tabele → panouri", isNew: true, words: "dependency graf legaturi tabele api" },
        ],
      },
      {
        id: "paza", label: "Securitate", items: [
          { key: "securitate", href: "/admin/securitate", label: "Securitate", icon: "shield", hint: "Alerte, intrări, 2 pași, proprietari", isNew: true, words: "parole 2fa alerte frauda" },
        ],
      },
    ],
  },
};

export const ALL_ADMIN_ITEMS: (AdminItem & { side: AdminSide | null })[] = [
  { ...ADMIN_HOME, side: null },
  ...(Object.entries(ADMIN_SIDES) as [AdminSide, (typeof ADMIN_SIDES)[AdminSide]][]).flatMap(([side, s]) => s.groups.flatMap((g) => g.items.map((i) => ({ ...i, side })))),
];

/** Pagina din meniu care se potrivește cel mai bine cu adresa (cea mai lungă, ca /admin/oameni/123 să fie „Oamenii”). */
export function activeItem(pathname: string) {
  return ALL_ADMIN_ITEMS.filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0] ?? ADMIN_HOME;
}

/** Căutare fără diacritice: „analiza” găsește „Analiză”. */
export const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function searchItems(q: string) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return ALL_ADMIN_ITEMS.filter((i) => {
    const hay = fold(`${i.label} ${i.hint} ${i.words ?? ""}`);
    return words.every((w) => hay.includes(w));
  });
}

export const DEFAULT_FAVORITES = ["probleme", "oameni", "analiza"];
