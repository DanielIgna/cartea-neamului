import { SITE_URL } from "./site-url";

/**
 * Admin → SEO → Inspector URL: deschide o pagină a site-ului așa cum o vede Google (fără cont, fără cookie-uri) și verifică
 * ce contează pentru indexare: răspunsul, titlul, descrierea, adresa canonică, „noindex”, H1, câte cuvinte are, datele
 * structurate. Doar adrese de pe carteaneamului.ro.
 */

export type OwnInspection = {
  path: string; url: string; status: number | null; finalUrl: string | null; error: string | null; ms: number | null;
  title: string | null; description: string | null; canonical: string | null; robots: string | null; xRobots: string | null;
  h1: string[]; words: number; jsonLd: string[]; ogImage: string | null; links: number;
  checks: { ok: boolean; warn?: boolean; label: string; detail?: string }[];
};

/** Din ce a scris omul („/ghid/x”, „carteaneamului.ro/ghid/x”, adresa întreagă) → calea pe site, sau null. */
export function ownPath(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("/") ? raw : /^https?:\/\//.test(raw) ? raw : `https://${raw}`, SITE_URL);
    const host = u.hostname.replace(/^www\./, "");
    if (host !== new URL(SITE_URL).hostname.replace(/^www\./, "")) return null;
    const p = u.pathname.replace(/\/+$/, "") || "/";
    return /^\/[\w\-/.%]*$/.test(p) && p.length <= 300 ? p + (u.search && u.search.length < 100 ? u.search : "") : null;
  } catch { return null; }
}

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
const attr = (tag: string, name: string) => { const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i")) ?? tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, "i")); return m ? decode(m[1]) : null; };
function meta(html: string, key: string, by = "name") {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) if (attr(tag, by)?.toLowerCase() === key) return attr(tag, "content");
  return null;
}

/** Citește HTML-ul (separat de cerere, ca să se poată testa). */
export function readHtml(html: string) {
  const head = html.slice(0, html.search(/<\/head>/i) + 7 || 200_000);
  const title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const canonicalTag = (head.match(/<link\b[^>]*>/gi) ?? []).find((t) => attr(t, "rel")?.toLowerCase() === "canonical");
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const main = body.match(/<main[\s\S]*?<\/main>/i)?.[0] ?? body;
  const text = decode(main.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  const jsonLd = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].flatMap((m) => {
    try { const j = JSON.parse(m[1]) as unknown; const arr = Array.isArray(j) ? j : [j]; return arr.flatMap((x) => { const t = (x as { "@type"?: string | string[] })["@type"]; return t ? (Array.isArray(t) ? t : [t]) : []; }); } catch { return []; }
  });
  return {
    title: title ? decode(title).trim() : null,
    description: meta(head, "description"),
    canonical: canonicalTag ? attr(canonicalTag, "href") : null,
    robots: meta(head, "robots"),
    ogImage: meta(head, "og:image", "property"),
    h1: [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, "")).trim()),
    words: text ? text.split(" ").length : 0,
    jsonLd: [...new Set(jsonLd)],
    links: (main.match(/<a\b[^>]*href="\/[^"]*"/gi) ?? []).length,
  };
}

export async function inspectOwnPage(path: string, o: { inSitemap: boolean; gate: string | null }, fetcher: typeof fetch = fetch): Promise<OwnInspection> {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  const base: OwnInspection = { path, url, status: null, finalUrl: null, error: null, ms: null, title: null, description: null, canonical: null, robots: null, xRobots: null, h1: [], words: 0, jsonLd: [], ogImage: null, links: 0, checks: [] };
  const t0 = Date.now();
  try {
    const res = await fetcher(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; CarteaNeamuluiInspector/1.0; +https://carteaneamului.ro)", "accept-language": "ro" }, redirect: "follow", cache: "no-store", signal: AbortSignal.timeout(15_000) });
    base.ms = Date.now() - t0;
    base.status = res.status; base.finalUrl = res.url || url; base.xRobots = res.headers.get("x-robots-tag");
    const html = (await res.text()).slice(0, 2_000_000);
    Object.assign(base, readHtml(html));
  } catch (e) {
    base.error = e instanceof Error ? e.message : String(e);
  }
  const noindex = /noindex/i.test(`${base.robots ?? ""} ${base.xRobots ?? ""}`);
  const want = !o.gate;
  const canonOk = base.canonical != null && base.canonical.replace(/\/$/, "") === url.split("?")[0].replace(/\/$/, "");
  base.checks = [
    { ok: base.status === 200, label: "Răspunsul paginii", detail: base.error ?? `HTTP ${base.status ?? "—"}${base.ms != null ? ` · ${base.ms} ms` : ""}` },
    { ok: !base.finalUrl || base.finalUrl.replace(/\/$/, "") === url.replace(/\/$/, ""), warn: true, label: "Fără redirecționare", detail: base.finalUrl && base.finalUrl.replace(/\/$/, "") !== url.replace(/\/$/, "") ? `duce la ${base.finalUrl}` : "adresa e cea finală" },
    { ok: want ? !noindex : noindex, label: want ? "Poate intra în Google (fără noindex)" : "Ținută corect în afara Google (noindex)", detail: [base.robots, base.xRobots].filter(Boolean).join(" · ") || "fără etichetă robots" },
    { ok: want === o.inSitemap, label: want ? "În sitemap" : "Lăsată afară din sitemap", detail: o.gate ?? (o.inSitemap ? "da" : "nu e în sitemap") },
    { ok: canonOk, label: "Adresa canonică e chiar pagina", detail: base.canonical ?? "lipsește" },
    { ok: !!base.title && base.title.length >= 15 && base.title.length <= 70, warn: !!base.title, label: "Titlul", detail: base.title ? `${base.title.length} semne: ${base.title}` : "lipsește" },
    { ok: !!base.description && base.description.length >= 70 && base.description.length <= 165, warn: !!base.description, label: "Descrierea", detail: base.description ? `${base.description.length} semne: ${base.description}` : "lipsește" },
    { ok: base.h1.length === 1, warn: base.h1.length > 1, label: "Un singur titlu H1", detail: base.h1.length ? base.h1.join(" · ") : "lipsește" },
    { ok: base.words >= 250, warn: base.words >= 120, label: "Destul text", detail: `${base.words} cuvinte în conținut` },
    { ok: base.jsonLd.length > 0, warn: true, label: "Date structurate (JSON-LD)", detail: base.jsonLd.join(", ") || "niciunele" },
    { ok: !!base.ogImage, warn: true, label: "Poza pentru linkuri (Open Graph)", detail: base.ogImage ?? "lipsește" },
    { ok: base.links >= 3, warn: true, label: "Legături spre alte pagini ale site-ului", detail: `${base.links}` },
  ];
  return base;
}
