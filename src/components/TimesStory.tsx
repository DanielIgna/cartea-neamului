"use client";
import type { PersonView } from "@/lib/tree-data";
import type { Graph } from "@/lib/kinship";
import { ageWords, storyFor, type Origin, type Story, type Tone } from "@/lib/vremuri";

/**
 * Ținutul cuiva pentru povestea vremurilor: după locul nașterii lui; dacă fișa nu-l are, după al părinților,
 * al soțului sau al copiilor (oamenii se nășteau de obicei unde trăia familia) și spunem de unde l-am luat.
 */
export function originFor(id: string, graph: Graph, origins: Record<string, Origin>, people: Record<string, PersonView>): Origin | null {
  if (origins[id]) return origins[id];
  for (const ids of [graph.parents.get(id) ?? [], graph.partners.get(id) ?? [], graph.children.get(id) ?? []])
    for (const x of ids) if (origins[x] && people[x]) return { ...origins[x], guess: people[x].givenName || people[x].name };
  return null;
}

export const TONE_LABEL: Record<Tone, string> = { bine: "an bun", greu: "an greu", schimbare: "cumpănă" };
export const toneColor = (t: Tone) => (t === "bine" ? "var(--good)" : t === "greu" ? "var(--red)" : "var(--ochre)");

export const eraYears = (s: Story) => (s.era.from === 0 ? `până la ${s.era.to + 1}` : s.era.to >= 2100 ? `din ${s.era.from}` : `${s.era.from}–${s.era.to}`);

/** „S-a născut în 1932, în Transilvania (Huedin)”. */
export function bornLine(p: PersonView, s: Story) {
  const o = s.origin;
  const place = o ? (o.place && !o.guess && o.place.toLowerCase() !== o.region.toLowerCase() ? `, în ${o.region} (${o.place})` : `, în ${o.region}`) : "";
  return `S-a născut în ${p.approx ? "jurul anului " : ""}${s.year}${place}`;
}

/** Secțiunea din fișa persoanei: lumea în care s-a născut și ce a trăit, cu vârsta pe care o avea atunci. */
export default function TimesStory({ p, origin, loading }: { p: PersonView; origin: Origin | null; loading: boolean }) {
  const s = storyFor(p, origin);
  if (!s) {
    return (
      <>
        <div className="section-label">Vremurile în care a trăit</div>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>Trece anul nașterii lui {p.givenName || p.name} în fișă și aici apare povestea vremurilor în care a trăit, după locul de unde e.</p>
      </>
    );
  }
  return (
    <div className="times">
      <div className="section-label">Vremurile în care a trăit {p.givenName}</div>
      <p className="times-born">
        {bornLine(p, s)}.{" "}
        <span className="muted">
          {s.origin?.guess ? `Locul nașterii nu e trecut; l-am luat după ${s.origin.guess}.` : !s.origin ? (loading ? "Caut ținutul…" : "Nu știm încă locul nașterii, așa că povestim ce a atins tot neamul românesc.") : ""}
        </span>
      </p>
      <div className="era-chip">{s.era.name} · {eraYears(s)}</div>
      <p className="times-life">{s.life}</p>
      {s.before.length > 0 && (
        <>
          <div className="times-sub">Cu puțin înainte să vină pe lume</div>
          <ul className="times-list">
            {s.before.map((e) => <li key={`${e.year}${e.text}`}><i style={{ background: toneColor(e.tone) }} title={TONE_LABEL[e.tone]} /><b>{e.to ? `${e.year}–${e.to}` : e.year}</b> {e.text}</li>)}
          </ul>
        </>
      )}
      {s.lived.length > 0 && (
        <>
          <div className="times-sub">Ce a trăit</div>
          <ul className="times-list">
            {s.lived.map(({ event: e, age, ongoing }) => (
              <li key={`${e.year}${e.text}`}>
                <i style={{ background: toneColor(e.tone) }} title={TONE_LABEL[e.tone]} />
                <b>{e.to ? `${e.year}–${e.to}` : e.year}</b> <span className="muted">({ageWords(age, p.sex, ongoing)})</span> {e.text}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
        <i className="dot" style={{ background: "var(--good)" }} /> an bun · <i className="dot" style={{ background: "var(--red)" }} /> an greu · <i className="dot" style={{ background: "var(--ochre)" }} /> cumpănă.
        Rezumat scris pe ținuturi istorice, după județul locului nașterii.
      </p>
    </div>
  );
}
