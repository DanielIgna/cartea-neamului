import Link from "next/link";
import { getT } from "@/i18n/server";

/**
 * Prima pagină pentru cine intră prima dată: deschiderea cu arborele în evantai, ce găsești aici,
 * cum începi în trei pași, gândul din spatele platformei și chemarea de la sfârșit.
 * Totul e desenat în pagină (SVG și CSS), fără poze de descărcat, ca să se deschidă repede și pe telefon.
 */

/* Arborele din deschidere: tu în mijloc, părinții, bunicii și străbunicii pe inele, tata în stânga, mama în dreapta.
   Numele sunt de probă; o familie din satele noastre, la fel în orice limbă. */
const CX = 210, CY = 214;
const RINGS = [
  { r0: 54, r1: 104, names: [["Ion", "1948"], ["Maria", "1951"]] },
  { r0: 106, r1: 154, names: [["Mihai", "1921"], ["Ana", "1924"], ["Vasile", "1919"], ["Elena", "1926"]] },
  { r0: 156, r1: 202, names: [["Petru"], ["Ileana"], ["Toma"], ["Sofia"], ["Simion"], ["Lucia"], ["Iacob"], ["Irina"]] },
] as const;

const pt = (r: number, a: number) => [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
const f = (n: number) => n.toFixed(1);
function sector(r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = pt(r1, a0), [x1, y1] = pt(r1, a1), [x2, y2] = pt(r0, a1), [x3, y3] = pt(r0, a0);
  return `M${f(x0)} ${f(y0)}A${r1} ${r1} 0 0 1 ${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}A${r0} ${r0} 0 0 0 ${f(x3)} ${f(y3)}Z`;
}
const FAN = RINGS.flatMap((ring, depth) => ring.names.map((name, i) => {
  const n = ring.names.length, a0 = Math.PI + (Math.PI * i) / n, a1 = Math.PI + (Math.PI * (i + 1)) / n;
  const [tx, ty] = pt((ring.r0 + ring.r1) / 2, (a0 + a1) / 2);
  return { d: sector(ring.r0, ring.r1, a0 + 0.006, a1 - 0.006), side: i < n / 2 ? "pat" : "mat", depth, tx, ty, name };
}));

function FanChart({ you }: { you: string }) {
  return (
    <svg className="lp-fan" viewBox="0 0 420 228" aria-hidden="true">
      {FAN.map((s, i) => (
        <g key={i}>
          <path d={s.d} className={`lp-seg lp-${s.side}-${s.depth + 1}`} />
          <text x={f(s.tx)} y={f(s.ty + (s.name.length > 1 ? -2 : 4))} className={s.depth === 2 ? "lp-fan-sm" : "lp-fan-name"}>{s.name[0]}</text>
          {s.name.length > 1 && <text x={f(s.tx)} y={f(s.ty + 13)} className="lp-fan-year">{s.name[1]}</text>}
        </g>
      ))}
      <path d={`M${CX - 50} ${CY}A50 50 0 0 1 ${CX + 50} ${CY}Z`} className="lp-you" />
      <text x={CX} y={CY - 16} className="lp-you-text">{you}</text>
    </svg>
  );
}

/* Iconițe simple, desenate cu linie, care iau culoarea textului. */
const ICONS = {
  tree: <><circle cx="12" cy="5" r="2.5" /><circle cx="5" cy="17" r="2.5" /><circle cx="19" cy="17" r="2.5" /><path d="M12 7.5v4M12 11.5H5v3M12 11.5h7v3" /></>,
  memories: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M3 12h18M10 12v2h4v-2M5 8l2-4h10l2 4" /></>,
  map: <><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8 8h8M8 11h6" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></>,
  play: <path d="M9 7v10l8-5z" fill="currentColor" />,
};
function Icon({ name }: { name: keyof typeof ICONS }) {
  return <svg className="lp-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{ICONS[name]}</svg>;
}

const FEATURES = ["tree", "memories", "map", "book"] as const;
const WAVE = [6, 12, 18, 10, 22, 14, 8, 16, 20, 11, 7, 15, 19, 9, 13, 6];

export default async function Landing({ deleted, jsonLd }: { deleted: boolean; jsonLd: object }) {
  const t = await getT("Landing");
  const b = (c: React.ReactNode) => <b>{c}</b>;
  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {deleted && <p className="notice" role="status">{t("deleted")}</p>}

      <section className="lp-hero">
        <div className="lp-hero-text">
          <p className="lp-eyebrow">{t("eyebrow")}</p>
          <h1 className="lp-title">{t("heroTitle")}</h1>
          {t("brandNote") && <p className="lp-brand">{t("brandNote")}</p>}
          <p className="lp-lead">{t("heroText")}</p>
          <div className="lp-actions">
            <Link className="btn primary lp-btn" href="/intrare?mod=cont-nou">{t("signUp")}</Link>
            <Link className="btn lp-btn" href="/intrare">{t("signIn")}</Link>
          </div>
          <ul className="lp-trust">
            <li><Icon name="check" />{t("trust1")}</li>
            <li><Icon name="lock" />{t("trust2")}</li>
            <li><Icon name="globe" />{t("trust3")}</li>
          </ul>
        </div>
        <figure className="lp-visual" role="img" aria-label={t("visualLabel")}>
          <FanChart you={t("visualYou")} />
          <div className="lp-float lp-float-voice" aria-hidden="true">
            <span className="lp-play"><Icon name="play" /></span>
            <span className="lp-float-body">
              <b>{t("voiceTitle")}</b>
              <span className="lp-wave">{WAVE.map((h, i) => <i key={i} style={{ height: h }} />)}</span>
              <small>{t("memoriesTitle")} · 2:14</small>
            </span>
          </div>
          <div className="lp-float lp-float-book" aria-hidden="true">
            <span className="lp-book-cover"><Icon name="book" /></span>
            <span className="lp-float-body"><b>{t("bookTitle")}</b><small>{t("bookMeta")}</small></span>
          </div>
          <div className="lp-float lp-float-join" aria-hidden="true">
            <span className="lp-avatar">I</span>
            <span className="lp-float-body"><span>{t.rich("joinText", { b })}</span></span>
          </div>
        </figure>
      </section>

      <section className="lp-section" aria-labelledby="lp-features">
        <header className="lp-head">
          <p className="lp-eyebrow">{t("featuresLabel")}</p>
          <h2 id="lp-features">{t("featuresTitle")}</h2>
          <p>{t("featuresText")}</p>
        </header>
        <div className="lp-features">
          {FEATURES.map((f, i) => (
            <article key={f} className={`lp-feature lp-feature-${f}`}>
              <span className="lp-feature-icon"><Icon name={f} /></span>
              <span className="lp-feature-no">0{i + 1}</span>
              <h3>{t(`${f}Title`)}</h3>
              <p>{t(`${f}Text`)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lp-section lp-how" aria-labelledby="lp-how">
        <header className="lp-head">
          <h2 id="lp-how">{t("howTitle")}</h2>
          <p>{t("howText")}</p>
        </header>
        <ol className="lp-steps">
          <li>{t.rich("step1", { b })}</li>
          <li>{t.rich("step2", { b })}</li>
          <li>{t.rich("step3", { b })}</li>
        </ol>
      </section>

      <section className="lp-quote">
        <blockquote><p>{t("quote")}</p></blockquote>
        <p className="lp-quote-text">{t("quoteText")}</p>
      </section>

      <section className="lp-cta" aria-labelledby="lp-cta">
        <h2 id="lp-cta">{t("ctaTitle")}</h2>
        <p className="lp-lead">{t("ctaText")}</p>
        <div className="lp-actions">
          <Link className="btn primary lp-btn" href="/intrare?mod=cont-nou">{t("start")}</Link>
          <Link className="btn lp-btn" href="/intrare">{t("signIn")}</Link>
        </div>
        <p className="lp-privacy">{t.rich("privacy", { link: (c) => <Link href="/confidentialitate">{c}</Link> })}</p>
      </section>
    </div>
  );
}
