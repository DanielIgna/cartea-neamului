/**
 * Navigatorul de arhitectură (Admin → Centru de cunoștințe → Navigator, Daniel, 14 noiembrie 2026, după ecranul
 * „Architecture Navigator” din PropManage): fluxul de la regulile lui Daniel până la omul care folosește site-ul, în straturi.
 * Fiecare bloc arată fișierele reale din spatele lui; pagina verifică fiecare fișier în codul publicat (cod.json, scris la
 * publicare de scripts/harta-cod.ts), așa că un fișier mutat sau șters apare cu roșu.
 * Blocurile „Produs” se fac singure din Harta funcțiilor (functii.ts), câte unul pe zonă.
 */
import cod from "./cod.json";
import { AREA, FUNCTIONS, type Area } from "./functii";
import { DOCS } from "./documente";

export type Layer = "guvernanta" | "inteligenta" | "automatizare" | "crestere" | "produs" | "date" | "client";
export const LAYER: Record<Layer, string> = {
  guvernanta: "Guvernanță", inteligenta: "Inteligență (calculat din date)", automatizare: "Automatizare", crestere: "Creștere",
  produs: "Produs", date: "Date", client: "Client",
};
export type Block = { id: string; layer: Layer; title: string; what: string; files: string[]; href?: string; count?: string };

const FIXED: Block[] = [
  { id: "reguli", layer: "guvernanta", title: "Regulile și hotărârile lui Daniel", href: "/admin/cunostinte",
    what: "Documentele din Centrul de cunoștințe: plăți, ton, GDPR, spițe, securitate, creștere. Doar cele active guvernează.",
    files: ["src/lib/cunostinte/documente.ts", "src/lib/legal.ts"] },
  { id: "plan", layer: "guvernanta", title: "Planul de clienți fără reclame", href: "/admin/cunostinte?q=reclame",
    what: "Ținta de 1000 de abonamente pe lună, canalele fără bani și ce face platforma singură.",
    files: ["docs/plan-clienti-fara-reclame.md"] },
  { id: "sanatate", layer: "inteligenta", title: "Sănătatea afacerii", href: "/admin/sanatate",
    what: "Scoruri pe departamente din baza de date, față de ținta de bani, cu cauză, impact și pași.",
    files: ["src/lib/sanatate-afacere.ts", "src/app/(site)/admin/sanatate/page.tsx"] },
  { id: "autonomie", layer: "inteligenta", title: "Scorul de autonomie", href: "/admin/autonomie",
    what: "Cât merge site-ul singur: operațional, tehnic, securitate, dezvoltare, dependența de om.",
    files: ["src/lib/autonomie.ts", "src/app/(site)/admin/autonomie/page.tsx"] },
  { id: "analiza", layer: "inteligenta", title: "Analiza vizitelor", href: "/admin/analiza",
    what: "Vizite numărate anonim, fără cookie-uri: surse, campanii, drumul spre plată.",
    files: ["src/lib/analiza.ts", "src/lib/vizite.ts", "src/components/VisitBeacon.tsx"] },
  { id: "harta", layer: "inteligenta", title: "Harta funcțiilor", href: "/admin/cunostinte/functii",
    what: "Fiecare funcție cu fișierele, tabelele, testele și sănătatea ei, verificată la fiecare deschidere.",
    files: ["src/lib/cunostinte/functii.ts", "src/lib/cunostinte/verificare.ts", "scripts/harta-cod.ts"] },
  { id: "bucla", layer: "automatizare", title: "Bucla zilnică", href: "/admin/autonomie#automatizari",
    what: "Ceasul Vercel pornește automatizările pornite: sănătate, curățenie, sitemap, emailurile cu acord.",
    files: ["src/app/api/cron/autonomie/route.ts", "src/app/autonomie-actions.ts", "vercel.json"] },
  { id: "emailuri", layer: "automatizare", title: "Emailurile site-ului", href: "/admin/email",
    what: "Totul prin Resend: confirmări, aduceri aminte, sfaturile de bun venit (doar cu acord).",
    files: ["src/lib/email.ts", "src/lib/emailuri.ts", "src/lib/crestere.ts"] },
  { id: "invitatii", layer: "crestere", title: "Invitațiile rudelor", href: "/admin/crestere",
    what: "Linkul de invitație, butoanele WhatsApp / email, zilele în plus pentru cine aduce o rudă.",
    files: ["src/lib/invitations.ts", "src/components/InvitePanel.tsx", "src/lib/plati.ts"] },
  { id: "carduri", layer: "crestere", title: "Pagini publice și carduri", href: "/admin/seo",
    what: "~525 de pagini pentru Google (ghid, glosar, nume, localități) și cardurile lor de distribuit.",
    files: ["src/lib/continut/nume.ts", "src/lib/continut/localitati.ts", "src/components/continut/ShareCard.tsx", "src/app/api/card/route.tsx"] },
  { id: "calendar", layer: "crestere", title: "Calendarul de conținut", href: "/admin/calendar",
    what: "Ce postezi, unde și când, cu textul gata scris.",
    files: ["src/lib/calendar-continut.ts", "src/app/(site)/admin/calendar/page.tsx"] },
  { id: "schema", layer: "date", title: "Baza de date (Neon, Frankfurt)", href: "/admin/infra",
    what: "Tabelele și migrațiile; fișierele (poze, glas, acte) în stocarea Neon.",
    files: ["src/db/schema.ts", "src/db/migrate.ts", "src/lib/storage.ts"] },
  { id: "client", layer: "client", title: "Omul care folosește site-ul",
    what: "Prima pagină, arborele, lada cu amintiri, cartea, plata; pe telefon ca aplicație (PWA), în 9 limbi.",
    files: ["src/app/(site)/layout.tsx", "src/app/(site)/page.tsx", "src/middleware.ts", "src/app/manifest.ts"] },
];

const filesSet = new Set((cod as { files: string[] }).files);
const routes = (cod as { routes: { path: string; kind: string }[] }).routes;

export function architecture() {
  const areas = Object.keys(AREA) as Area[];
  const product: Block[] = areas.map((a) => {
    const fns = FUNCTIONS.filter((f) => f.area === a && f.lifecycle !== "planificat");
    const files = [...new Set(fns.flatMap((f) => f.engine))].sort();
    return { id: `produs-${a}`, layer: "produs" as const, title: AREA[a], href: `/admin/cunostinte/functii?q=${encodeURIComponent(AREA[a])}`,
      what: fns.map((f) => f.name).slice(0, 8).join(" · ") + (fns.length > 8 ? ` și încă ${fns.length - 8}` : ""), files, count: `${fns.length} funcții` };
  }).filter((b) => b.files.length);
  const order: Layer[] = ["guvernanta", "inteligenta", "automatizare", "crestere", "produs", "date", "client"];
  const blocks = [...FIXED, ...product].sort((x, y) => order.indexOf(x.layer) - order.indexOf(y.layer));
  const checked = blocks.map((b) => ({ ...b, files: b.files.map((f) => ({ path: f, ok: filesSet.has(f) })) }));
  const all = checked.flatMap((b) => b.files);
  return {
    blocks: checked,
    stats: { files: all.length, missing: all.filter((f) => !f.ok).length, pages: routes.filter((r) => r.kind === "pagina").length, api: routes.filter((r) => r.kind === "api").length,
      docs: DOCS.filter((d) => d.status === "activ").length, functions: FUNCTIONS.length },
  };
}
