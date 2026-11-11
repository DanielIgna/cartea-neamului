import Link from "next/link";
import { getT } from "@/i18n/server";
import BannerScene from "@/components/BannerScene";

/**
 * Prima pagină pentru cine intră prima dată: deschiderea pe fond de noapte cu arborele în evantai,
 * cifrele, ce găsești aici (cu desene mici ale fiecărei părți), cum începi, gândul din spate și chemarea de la sfârșit.
 * Totul e desenat în pagină (SVG și CSS), fără poze de descărcat, ca să se deschidă repede și pe telefon.
 * Numele din desene sunt de probă, o familie din satele noastre, la fel în orice limbă.
 */

/* Arborele în evantai: tu în mijloc, părinții, bunicii și străbunicii pe inele; tata în stânga, mama în dreapta. */
const CX = 220, CY = 222;
const RINGS = [
  { r0: 58, r1: 108, names: [["Ion", "1948"], ["Maria", "1951"]] },
  { r0: 110, r1: 160, names: [["Mihai", "1921"], ["Ana", "1924"], ["Vasile", "1919"], ["Elena", "1926"]] },
  { r0: 162, r1: 208, names: [["Petru"], ["Ileana"], ["Toma"], ["Sofia"], ["Simion"], ["Lucia"], ["Iacob"], ["Irina"]] },
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
  return { d: sector(ring.r0, ring.r1, a0 + 0.008, a1 - 0.008), side: i < n / 2 ? "pat" : "mat", depth, tx, ty, name };
}));
const [ax, ay] = pt(222, Math.PI), [bx, by] = pt(222, 2 * Math.PI);

function FanChart({ you }: { you: string }) {
  return (
    <svg className="lp-fan" viewBox="0 0 440 232" aria-hidden="true">
      <path d={`M${f(ax)} ${f(ay)}A222 222 0 0 1 ${f(bx)} ${f(by)}`} className="lp-fan-orbit" />
      {FAN.map((s, i) => (
        <g key={i}>
          <path d={s.d} className={`lp-seg lp-${s.side}-${s.depth + 1}`} />
          <text x={f(s.tx)} y={f(s.ty + (s.name.length > 1 ? -2 : 4))} className={s.depth === 2 ? "lp-fan-sm" : "lp-fan-name"}>{s.name[0]}</text>
          {s.name.length > 1 && <text x={f(s.tx)} y={f(s.ty + 13)} className="lp-fan-year">{s.name[1]}</text>}
        </g>
      ))}
      <path d={`M${CX - 54} ${CY}A54 54 0 0 1 ${CX + 54} ${CY}Z`} className="lp-you" />
      <text x={CX} y={CY - 18} className="lp-you-text">{you}</text>
    </svg>
  );
}

/* Desenele mici din „Ce găsești aici”. */
const BARS = Array.from({ length: 38 }, (_, i) => Math.round(10 + 26 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45))));
function VoiceArt({ title }: { title: string }) {
  return (
    <div className="lp-art-voice" aria-hidden="true">
      <b>{title}</b>
      <span className="lp-play lp-play-lg"><svg viewBox="0 0 24 24"><path d="M9 7v10l8-5z" fill="currentColor" /></svg></span>
      <span className="lp-bars">{BARS.map((h, i) => <i key={i} style={{ height: h }} />)}</span>
      <span className="lp-time">2:14</span>
    </div>
  );
}
function MapArt() {
  return (
    <svg className="lp-art-svg" viewBox="0 0 300 150" aria-hidden="true">
      <defs><pattern id="lp-dots" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" className="lp-dot" /></pattern></defs>
      <rect width="300" height="150" fill="url(#lp-dots)" />
      <path className="lp-route" d="M62 98Q110 30 168 62M168 62Q214 90 246 52" />
      {[[62, 98, "Ieud"], [168, 62, "Breb"], [246, 52, "Rimetea"]].map(([x, y, n]) => (
        <g key={n as string} transform={`translate(${x} ${y})`}>
          <path className="lp-pin" d="M0 0c-9-11-13-17-13-23a13 13 0 1 1 26 0c0 6-4 12-13 23z" /><circle cy="-23" r="4.5" className="lp-pin-hole" />
          <text y="18" className="lp-pin-t">{n}</text>
        </g>
      ))}
    </svg>
  );
}
function BookArt() {
  const qr = [0, 1, 2, 3, 5, 6, 8, 10, 12, 13, 15, 17, 18, 19, 20, 21, 23, 24];
  return (
    <svg className="lp-art-svg" viewBox="0 0 320 190" aria-hidden="true">
      <path className="lp-book-shadow" d="M30 172Q160 186 290 172" />
      <path className="lp-page" d="M160 34Q110 16 34 26V166Q110 156 160 172z" />
      <path className="lp-page" d="M160 34Q210 16 286 26V166Q210 156 160 172z" />
      <path className="lp-spine" d="M160 34V172" />
      <path className="lp-text-line" d="M56 50H136M56 62H140M56 74H128M56 96H138M56 108H134M56 120H122M56 132H136" />
      <g className="lp-mini-tree"><circle cx="223" cy="56" r="7" /><circle cx="203" cy="86" r="7" /><circle cx="243" cy="86" r="7" /><path d="M223 63V74H203V79M223 74H243V79" /></g>
      <g transform="translate(240 112)">{qr.map((q) => <rect key={q} x={(q % 5) * 6} y={Math.floor(q / 5) * 6} width="5" height="5" className="lp-qr" />)}</g>
      <path className="lp-text-line" d="M184 116H228M184 128H224M184 140H230" />
    </svg>
  );
}

const CHECK = <path d="M5 12.5l4.5 4.5L19 7.5" />;
const LOCK = <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>;
const GLOBE = <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></>;
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg className="lp-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const STATS = [["10", "stat1"], ["9", "stat2"], ["1", "stat3"], ["1", "stat4"]] as const;

export default async function Landing({ deleted, jsonLd }: { deleted: boolean; jsonLd: object }) {
  const t = await getT("Landing");
  const b = (c: React.ReactNode) => <b>{c}</b>;
  const em = (c: React.ReactNode) => <em>{c}</em>;
  const ornament = <span className="lp-ornament" aria-hidden="true"><i /><b /><i /></span>;
  const tiles = [
    { k: "memories", art: <VoiceArt title={t("voiceTitle")} /> },
    { k: "map", art: <MapArt /> },
    { k: "book", art: <BookArt /> },
  ] as const;
  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {deleted && <p className="notice lp-in" role="status">{t("deleted")}</p>}

      {/* Bannerul: scena la apus pe toată lățimea, cu panoul întunecat la mijloc */}
      <section className="lp-band lp-banner">
        <BannerScene /><BannerScene phone />
        <div className="lp-banner-panel">
          <p className="lp-tagline">{t("eyebrow")}</p>
          <h1 className="lp-name">Cartea Neamului</h1>
          {ornament}
          <p className="lp-subtitle">{t.rich("heroTitleRich", { em })}</p>
          {t("brandNote") && <p className="lp-brand">{t("brandNote")}</p>}
          <p className="lp-banner-lead">{t("heroText")}</p>
          <div className="lp-actions">
            <Link className="lp-btn lp-btn-gold" href="/intrare?mod=cont-nou">{t("signUp")}<span aria-hidden="true">→</span></Link>
            <Link className="lp-btn lp-btn-ghost" href="/intrare">{t("signIn")}</Link>
          </div>
        </div>
        <ul className="lp-trust">
          <li><Icon>{CHECK}</Icon>{t("trust1")}</li>
          <li><Icon>{LOCK}</Icon>{t("trust2")}</li>
          <li><Icon>{GLOBE}</Icon>{t("trust3")}</li>
        </ul>
      </section>

      {/* Ce găsești aici: rame albe ca pozele de familie, pe maro cald */}
      <section className="lp-band lp-dark" aria-labelledby="lp-features">
        <div className="lp-in">
          <header className="lp-head">
            <p className="lp-eyebrow">{t("featuresLabel")}</p>
            <h2 id="lp-features">{t("featuresTitle")}</h2>
            {ornament}
            <p>{t("featuresText")}</p>
          </header>
          <div className="lp-frames">
            {tiles.map(({ k, art }) => (
              <article key={k} className={`lp-frame lp-frame-${k}`}>
                <div className="lp-photo">{art}</div>
                <h3>{t(`${k}Title`)}</h3>
                <p>{t(`${k}Text`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Arborele: evantaiul răsare ca soarele, cu cifrele dedesubt */}
      <section className="lp-band lp-sunset" aria-labelledby="lp-tree">
        <div className="lp-in lp-tree">
          <div className="lp-tree-text">
            <p className="lp-eyebrow">{t("eyebrow")}</p>
            <h2 id="lp-tree">{t("treeTitle")}</h2>
            <p>{t("treeText")}</p>
            <div className="lp-actions"><Link className="lp-btn lp-btn-gold" href="/intrare?mod=cont-nou">{t("start")}<span aria-hidden="true">→</span></Link></div>
          </div>
          <figure className="lp-visual" role="img" aria-label={t("visualLabel")}>
            <FanChart you={t("visualYou")} />
            <div className="lp-float lp-float-join" aria-hidden="true">
              <span className="lp-avatar">I</span>
              <span>{t.rich("joinText", { b })}</span>
            </div>
          </figure>
        </div>
        <dl className="lp-in lp-stats">
          {STATS.map(([n, k]) => <div key={k}><dt>{n}</dt><dd>{t(k)}</dd></div>)}
        </dl>
      </section>

      <section className="lp-band lp-light" aria-labelledby="lp-how">
        <div className="lp-in">
          <header className="lp-head">
            <h2 id="lp-how">{t("howTitle")}</h2>
            {ornament}
            <p>{t("howText")}</p>
          </header>
          <ol className="lp-steps">
            <li>{t.rich("step1", { b })}</li>
            <li>{t.rich("step2", { b })}</li>
            <li>{t.rich("step3", { b })}</li>
          </ol>
        </div>
      </section>

      <section className="lp-band lp-paper">
        <div className="lp-in lp-quote">
          <span className="lp-quote-mark" aria-hidden="true">“</span>
          <blockquote><p>{t("quote")}</p></blockquote>
          {ornament}
          <p className="lp-quote-text">{t("quoteText")}</p>
        </div>
      </section>

      <section className="lp-band lp-dark lp-cta" aria-labelledby="lp-cta">
        <svg className="lp-cta-rings" viewBox="0 0 400 200" aria-hidden="true">
          {[60, 100, 140, 180].map((r) => <path key={r} d={`M${200 - r} 200A${r} ${r} 0 0 1 ${200 + r} 200`} />)}
        </svg>
        <div className="lp-in">
          <h2 id="lp-cta">{t("ctaTitle")}</h2>
          <p className="lp-cta-lead">{t("ctaText")}</p>
          <div className="lp-actions">
            <Link className="lp-btn lp-btn-gold" href="/intrare?mod=cont-nou">{t("start")}<span aria-hidden="true">→</span></Link>
            <Link className="lp-btn lp-btn-ghost" href="/intrare">{t("signIn")}</Link>
          </div>
          <p className="lp-privacy">{t.rich("privacy", { link: (c) => <Link href="/confidentialitate">{c}</Link> })}</p>
        </div>
      </section>
    </div>
  );
}
