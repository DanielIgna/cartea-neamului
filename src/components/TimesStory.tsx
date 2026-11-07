"use client";
import { useTranslations } from "use-intl";
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

/**
 * Cuvintele poveștii vremurilor în limba aleasă: felul anului, anii epocii, nașterea cu ținutul ei și vârsta de atunci.
 * (Călătoria în timp folosește încă variantele românești de mai sus; trece la acestea în etapa 4 a traducerii, cu tot cu povești.)
 */
export function useTimesWords() {
  const t = useTranslations("Times");
  return {
    tone: (x: Tone) => t(`tone.${x}`),
    eraYears: (s: Story) => (s.era.from === 0 ? t("eraUntil", { year: String(s.era.to + 1) }) : s.era.to >= 2100 ? t("eraFrom", { year: String(s.era.from) }) : `${s.era.from}–${s.era.to}`),
    born: (p: PersonView, s: Story) => {
      const o = s.origin, v = { sex: p.sex, approx: p.approx ? "yes" : "no", year: String(s.year) };
      if (!o) return t("born", v);
      return o.place && !o.guess && o.place.toLowerCase() !== o.region.toLowerCase() ? t("bornInPlace", { ...v, region: o.region, place: o.place }) : t("bornIn", { ...v, region: o.region });
    },
    age: (age: number, sex: PersonView["sex"], ongoing = false) =>
      ongoing ? t("ageOngoing") : age === 0 ? t("ageBirthYear") : age < 7 ? t("ageChild", { age, sex }) : t("ageAt", { age }),
  };
}

/** Secțiunea din fișa persoanei: lumea în care s-a născut și ce a trăit, cu vârsta pe care o avea atunci. */
export default function TimesStory({ p, origin, loading }: { p: PersonView; origin: Origin | null; loading: boolean }) {
  const t = useTranslations("Times");
  const w = useTimesWords();
  const s = storyFor(p, origin);
  if (!s) {
    return (
      <>
        <div className="section-label">{t("titleEmpty")}</div>
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t("needYear", { name: p.givenName || p.name })}</p>
      </>
    );
  }
  return (
    <div className="times">
      <div className="section-label">{t("title", { name: p.givenName })}</div>
      <p className="times-born">
        {w.born(p, s)}.{" "}
        <span className="muted">
          {s.origin?.guess ? t("guessNote", { name: s.origin.guess }) : !s.origin ? (loading ? t("findingRegion") : t("noRegion")) : ""}
        </span>
      </p>
      <div className="era-chip">{s.era.name} · {w.eraYears(s)}</div>
      <p className="times-life">{s.life}</p>
      {s.before.length > 0 && (
        <>
          <div className="times-sub">{t("before")}</div>
          <ul className="times-list">
            {s.before.map((e) => <li key={`${e.year}${e.text}`}><i style={{ background: toneColor(e.tone) }} title={w.tone(e.tone)} /><b>{e.to ? `${e.year}–${e.to}` : e.year}</b> {e.text}</li>)}
          </ul>
        </>
      )}
      {s.lived.length > 0 && (
        <>
          <div className="times-sub">{t("lived")}</div>
          <ul className="times-list">
            {s.lived.map(({ event: e, age, ongoing }) => (
              <li key={`${e.year}${e.text}`}>
                <i style={{ background: toneColor(e.tone) }} title={w.tone(e.tone)} />
                <b>{e.to ? `${e.year}–${e.to}` : e.year}</b> <span className="muted">({w.age(age, p.sex, ongoing)})</span> {e.text}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
        <i className="dot" style={{ background: "var(--good)" }} /> {w.tone("bine")} · <i className="dot" style={{ background: "var(--red)" }} /> {w.tone("greu")} · <i className="dot" style={{ background: "var(--ochre)" }} /> {w.tone("schimbare")}.{" "}
        {t("summaryNote")}
      </p>
    </div>
  );
}
