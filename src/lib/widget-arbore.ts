import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import type { Db } from "@/db";
import { appSetting, person, relationship } from "@/db/schema";

/**
 * Widgetul gratuit „Arborele meu” (Etapa 5, Daniel, 17.11.2026): o mică fișă a neamului, pe care familia o pune pe blogul sau
 * site-ul ei (un <iframe> plus un link spre noi). Proprietarul arborelui îl pornește din /arbore/<id>/widget și alege titlul.
 * Arată doar cifre: câte persoane, câte generații, din ce an e cel mai vechi strămoș și din câte locuri vine neamul.
 * Nimic despre cei în viață, niciun nume în afară de titlul ales. Setarea stă în app_setting, cheia „widget:<cod>”.
 */
export const WIDGET_PREFIX = "widget:";
export const DEMO_TOKEN = "demo";
export type WidgetSetting = { treeId: string; title: string; by: string; at: string };
export type WidgetData = { title: string; persons: number; generations: number; oldestYear: number | null; places: number };

export const DEMO_WIDGET: WidgetData = { title: "Neamul Popescu din Vâlcea", persons: 148, generations: 7, oldestYear: 1792, places: 12 };

export const cleanTitle = (s: string) => s.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
const newToken = () => randomBytes(9).toString("base64url");

export async function widgetForTree(db: Db, treeId: string): Promise<{ token: string; setting: WidgetSetting } | null> {
  const [row] = await db.select({ key: appSetting.key, value: appSetting.value }).from(appSetting)
    .where(and(sql`${appSetting.key} like ${WIDGET_PREFIX + "%"}`, sql`${appSetting.value}->>'treeId' = ${treeId}`)).limit(1);
  return row ? { token: row.key.slice(WIDGET_PREFIX.length), setting: row.value as WidgetSetting } : null;
}

/** Pornește widgetul (sau îi schimbă titlul); codul rămâne același, ca linkurile puse deja pe alte site-uri să meargă. */
export async function enableWidget(db: Db, treeId: string, title: string, by: string, now = new Date()) {
  const cur = await widgetForTree(db, treeId);
  const token = cur?.token ?? newToken();
  const value: WidgetSetting = { treeId, title: cleanTitle(title) || "Arborele familiei", by, at: now.toISOString() };
  await db.insert(appSetting).values({ key: WIDGET_PREFIX + token, value, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value, updatedBy: by, updatedAt: now } });
  return token;
}

/** Oprește widgetul: codul se șterge, iar fișa de pe celelalte site-uri arată doar „widget oprit”. */
export async function disableWidget(db: Db, treeId: string) {
  const cur = await widgetForTree(db, treeId);
  if (cur) await db.delete(appSetting).where(eq(appSetting.key, WIDGET_PREFIX + cur.token));
}

/** Cel mai lung șir părinte → copil (numărul de generații), fără să se blocheze la o legătură greșită în cerc. */
export function countGenerations(ids: string[], edges: { parent: string; child: string }[]): number {
  if (!ids.length) return 0;
  const kids = new Map<string, string[]>();
  for (const e of edges) kids.set(e.parent, [...(kids.get(e.parent) ?? []), e.child]);
  const memo = new Map<string, number>();
  const busy = new Set<string>();
  const depth = (id: string): number => {
    const m = memo.get(id);
    if (m !== undefined) return m;
    if (busy.has(id)) return 0;
    busy.add(id);
    let best = 1;
    for (const c of kids.get(id) ?? []) best = Math.max(best, 1 + depth(c));
    busy.delete(id);
    memo.set(id, best);
    return best;
  };
  let max = 1;
  for (const id of ids) max = Math.max(max, depth(id));
  return max;
}

/** Locul, fără județ și țară: „Bogdand, Satu Mare” → „bogdand”, ca același sat scris puțin altfel să fie numărat o dată. */
const placeKey = (s: string) => s.split(",")[0].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

export async function widgetData(db: Db, token: string): Promise<WidgetData | null> {
  if (token === DEMO_TOKEN) return DEMO_WIDGET;
  if (!/^[A-Za-z0-9_-]{8,20}$/.test(token)) return null;
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, WIDGET_PREFIX + token)).limit(1);
  if (!row) return null;
  const s = row.value as WidgetSetting;
  const people = await db.select({ id: person.id, living: person.living, discreet: person.discreet, birthFrom: person.birthFrom, birthPlace: person.birthPlace })
    .from(person).where(eq(person.treeId, s.treeId));
  const shown = people.filter((p) => !p.discreet);
  const ids = new Set(shown.map((p) => p.id));
  const edges = (await db.select({ parent: relationship.personA, child: relationship.personB }).from(relationship)
    .where(and(eq(relationship.treeId, s.treeId), eq(relationship.type, "parent_child")))).filter((e) => ids.has(e.parent) && ids.has(e.child));
  const dead = shown.filter((p) => !p.living);
  const years = dead.map((p) => (p.birthFrom ? Number(String(p.birthFrom).slice(0, 4)) : NaN)).filter((y) => y > 1000 && y < 2100);
  const places = new Set(dead.map((p) => (p.birthPlace ? placeKey(p.birthPlace) : "")).filter(Boolean));
  return { title: s.title, persons: shown.length, generations: countGenerations([...ids], edges), oldestYear: years.length ? Math.min(...years) : null, places: places.size };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const n = (v: number) => v.toLocaleString("ro-RO");

/** Fișa din <iframe>: HTML simplu, fără scripturi, cu culorile site-ului și un link spre prima pagină (marcat ?src=widget). */
export function renderWidget(d: WidgetData | null, siteUrl: string): string {
  const home = `${siteUrl}/?src=widget`;
  const body = d ? `
    <p class="k">Arborele familiei</p>
    <h1>${esc(d.title)}</h1>
    <ul>
      <li><b>${n(d.persons)}</b><span>${d.persons === 1 ? "persoană" : "persoane"}</span></li>
      <li><b>${n(d.generations)}</b><span>${d.generations === 1 ? "generație" : "generații"}</span></li>
      ${d.oldestYear ? `<li><b>${d.oldestYear}</b><span>cel mai vechi strămoș</span></li>` : ""}
      ${d.places ? `<li><b>${n(d.places)}</b><span>${d.places === 1 ? "loc de baștină" : "locuri de baștină"}</span></li>` : ""}
    </ul>` : `<p class="k">Arborele familiei</p><h1>Widgetul nu mai e pornit</h1><p class="m">Familia l-a oprit sau adresa s-a schimbat.</p>`;
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>${d ? esc(d.title) : "Cartea Neamului"}</title><style>
:root{color-scheme:light dark;--bg:#fbf7f0;--fg:#2b2118;--mut:#7a6a58;--acc:#8a5a2b;--line:#e6dccb}
@media (prefers-color-scheme:dark){:root{--bg:#211a14;--fg:#f3ebe0;--mut:#bba98f;--acc:#e0a96d;--line:#3b3026}}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--fg);font:15px/1.4 Georgia,"Times New Roman",serif;padding:14px 16px;display:flex;flex-direction:column;border:1px solid var(--line);border-radius:12px}
.k{margin:0;color:var(--mut);font:600 11px/1.2 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase}
h1{margin:4px 0 10px;font-size:19px;line-height:1.2}
ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,1fr);gap:8px 12px}
li{display:flex;flex-direction:column}b{font-size:20px;color:var(--acc)}span{color:var(--mut);font:12px/1.2 system-ui,sans-serif}
.m{color:var(--mut);margin:0}
a{margin-top:auto;padding-top:10px;color:var(--acc);font:600 12px/1.2 system-ui,sans-serif;text-decoration:none}a:hover{text-decoration:underline}
</style></head><body>${body}
<a href="${esc(home)}" target="_blank" rel="noopener">🌳 Făcut cu Cartea Neamului · fă-ți și tu arborele</a></body></html>`;
}

/** Codul de pus pe blog: fișa și, sub ea, un link obișnuit (cel care contează pentru motoarele de căutare). */
export function embedCode(token: string, title: string, siteUrl: string): string {
  const t = esc(cleanTitle(title) || "Arborele familiei");
  return `<iframe src="${siteUrl}/widget/arbore/${token}" width="320" height="230" style="border:0;max-width:100%" loading="lazy" title="${t}"></iframe>
<p style="font-size:12px;margin:4px 0 0"><a href="${siteUrl}/arborele-meu">Arborele familiei, făcut cu Cartea Neamului</a></p>`;
}
