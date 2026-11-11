import Link from "next/link";
import { getAppName, getT } from "@/i18n/server";
import Image from "next/image";
import { db } from "@/db";
import { homeImages, type HomeImage } from "@/lib/home-images";
import BannerSlides from "@/components/BannerSlides";

/**
 * Prima pagină pentru cine intră prima dată: bannerul cu o familie de mai multe generații, cele patru generații,
 * ce găsești aici, gândul din spate peste apus, cum începi și chemarea de la sfârșit.
 * Fotografiile sunt din public/home, de pe Unsplash, cu licență liberă (sursele în public/home/CREDITS.md).
 * Numele din evantai sunt de probă, o familie din satele noastre, la fel în orice limbă.
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
const CHECK = <path d="M5 12.5l4.5 4.5L19 7.5" />;
const LOCK = <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>;
const GLOBE = <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18" /></>;
const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg className="lp-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
);
const STATS = [["10", "stat1"], ["9", "stat2"], ["1", "stat3"], ["1", "stat4"]] as const;

/* O fotografie din public/home, servită de Next la mărimea potrivită ecranului (WebP/AVIF). */
/* O fotografie a primei pagini: cea inițială o servește Next la mărimea ecranului (WebP/AVIF); cea pusă de admin vine
   gata micșorată din /api/poza-acasa (vezi src/lib/home-images.ts și Admin → Poze prima pagină). */
const Photo = ({ img, sizes, priority = false, className }: { img: HomeImage; sizes: string; priority?: boolean; className?: string }) => (
  <Image src={img.src} alt="" fill sizes={sizes} priority={priority} unoptimized={img.custom} className={className ?? "lp-img"} />
);
const GENS = [["gen1", "50% 30%"], ["gen2", "50% 40%"], ["gen3", "50% 35%"], ["gen4", "50% 45%"]] as const;

export default async function Landing({ deleted, jsonLd }: { deleted: boolean; jsonLd: object }) {
  const [t, imgs] = await Promise.all([getT("Landing"), homeImages(db)]);
  const b = (c: React.ReactNode) => <b>{c}</b>;
  const em = (c: React.ReactNode) => <em>{c}</em>;
  const ornament = <span className="lp-ornament" aria-hidden="true"><i /><b /><i /></span>;
  const cards = [
    { k: "tree", art: <div className="lp-card-fan"><FanChart you={t("visualYou")} /></div> },
    { k: "memories", art: <><Photo img={imgs.memories[0]} sizes="(max-width:640px) 100vw, 300px" /><div className="lp-card-badge"><VoiceArt title={t("voiceTitle")} /></div></> },
    { k: "map", art: <Photo img={imgs.map[0]} sizes="(max-width:640px) 100vw, 300px" /> },
    { k: "book", art: <Photo img={imgs.book[0]} sizes="(max-width:640px) 100vw, 300px" /> },
  ] as const;
  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {deleted && <p className="notice lp-in" role="status">{t("deleted")}</p>}

      {/* Bannerul: familia pe toată lățimea, cu panoul întunecat la mijloc */}
      <section className="lp-band lp-banner">
        <BannerSlides imgs={imgs.banner.map(({ src, custom }) => ({ src, custom }))} />
        <div className="lp-banner-panel">
          <p className="lp-tagline">{t("eyebrow")}</p>
          <h1 className="lp-name">{await getAppName()}</h1>
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

      {/* Patru generații, în rame albe ca pozele de familie */}
      <section className="lp-band lp-dark" aria-labelledby="lp-gens">
        <div className="lp-in">
          <header className="lp-head">
            <h2 id="lp-gens">{t("gensTitle")}</h2>
            {ornament}
            <p>{t("gensText")}</p>
          </header>
          <div className="lp-gens">
            {GENS.map(([k, pos]) => (
              <figure key={k} className="lp-gen">
                <div className="lp-photo"><div className="lp-photo-in" style={{ ["--pos" as string]: pos }}><Photo img={imgs[k][0]} sizes="(max-width:640px) 90vw, (max-width:1000px) 45vw, 280px" /></div></div>
                <figcaption><h3>{t(`${k}Title`)}</h3><p>{t(`${k}Text`)}</p></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Ce găsești aici */}
      <section className="lp-band lp-light" aria-labelledby="lp-features">
        <div className="lp-in">
          <header className="lp-head">
            <p className="lp-eyebrow">{t("featuresLabel")}</p>
            <h2 id="lp-features">{t("featuresTitle")}</h2>
            {ornament}
            <p>{t("featuresText")}</p>
          </header>
          <div className="lp-cards">
            {cards.map(({ k, art }) => (
              <article key={k} className={`lp-card lp-card-${k}`}>
                <div className="lp-card-art">{art}</div>
                <div className="lp-card-text"><h3>{t(`${k}Title`)}</h3><p>{t(`${k}Text`)}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Gândul din spate, peste siluetele unei familii la apus, cu cifrele dedesubt */}
      <section className="lp-band lp-sunset">
        <Photo img={imgs.sunset[0]} sizes="100vw" className="lp-img lp-sunset-img" />
        <div className="lp-in lp-quote">
          <span className="lp-quote-mark" aria-hidden="true">“</span>
          <blockquote><p>{t("quote")}</p></blockquote>
          {ornament}
          <p className="lp-quote-text">{t("quoteText")}</p>
        </div>
        <dl className="lp-in lp-stats">
          {STATS.map(([n, k]) => <div key={k}><dt>{n}</dt><dd>{t(k)}</dd></div>)}
        </dl>
      </section>

      {/* Cum începi, lângă o masă în familie */}
      <section className="lp-band lp-paper" aria-labelledby="lp-how">
        <div className="lp-in lp-how">
          <div className="lp-how-photo"><div className="lp-photo"><div className="lp-photo-in"><Photo img={imgs.table[0]} sizes="(max-width:1000px) 90vw, 480px" /></div></div></div>
          <div>
            <h2 id="lp-how">{t("howTitle")}</h2>
            <p className="lp-how-text">{t("howText")}</p>
            <ol className="lp-steps">
              <li>{t.rich("step1", { b })}</li>
              <li>{t.rich("step2", { b })}</li>
              <li>{t.rich("step3", { b })}</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="lp-band lp-cta" aria-labelledby="lp-cta">
        <Photo img={imgs.hands[0]} sizes="100vw" className="lp-img lp-cta-img" />
        <div className="lp-in">
          <h2 id="lp-cta">{t("ctaTitle")}</h2>
          {ornament}
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
