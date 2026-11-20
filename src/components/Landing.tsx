import JsonLd from "@/components/JsonLd";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { getEntry } from "@/lib/continut/colectii";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { whatsappUrl } from "@/lib/contact";
import { getAppName, getT } from "@/i18n/server";
import Image from "next/image";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { HOME_IMAGES_TAG, homeImages, type HomeImage } from "@/lib/home-images";
import BannerSlides from "@/components/BannerSlides";
import { DEFAULT_SETTINGS, LIMIT_KEYS, PLANS_TAG, TIERS, planSettings, tierBook, tierLimits, tierPrice } from "@/lib/plans";
import { money } from "@/lib/plati";
import { getLocale } from "@/i18n/server";
import { LANGUAGE_COUNT } from "@/i18n/locales";
import { GIFT_PATH, giftSeason } from "@/lib/cadou-sarbatori";
import { FAQ_TITLE, faqLang, homeFaq, homeJsonLd } from "@/lib/seo/home-faq";
import ZonaSugestii from "@/components/ZonaSugestii";
import FanChart from "@/components/FanChart";
import TryTree from "@/components/TryTree";

/**
 * Prima pagină pentru cine intră prima dată: bannerul cu o familie de mai multe generații, cele patru generații,
 * ce găsești aici, gândul din spate peste apus, cum începi și chemarea de la sfârșit.
 * Fotografiile sunt din public/home, de pe Unsplash, cu licență liberă (sursele în public/home/CREDITS.md).
 * Numele din evantai sunt de probă, o familie din satele noastre, la fel în orice limbă.
 */

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
const STATS = [["10", "stat1"], [String(LANGUAGE_COUNT), "stat2"], ["1", "stat3"], ["1", "stat4"]] as const;

/* O fotografie din public/home, servită de Next la mărimea potrivită ecranului (WebP/AVIF). */
/* O fotografie a primei pagini: cea inițială o servește Next la mărimea ecranului (WebP/AVIF); cea pusă de admin vine
   gata micșorată din /api/poza-acasa (vezi src/lib/home-images.ts și Admin → Poze prima pagină). */
/** O poză a primei pagini; `alt` gol doar la cele de fundal, puse sub text. */
const Photo = ({ img, sizes, alt = "", quality, priority = false, className }: { img: HomeImage; sizes: string; alt?: string; quality?: number; priority?: boolean; className?: string }) => (
  <Image src={img.src} alt={alt} fill sizes={sizes} quality={quality} priority={priority} unoptimized={img.custom} className={className ?? "lp-img"} />
);
const GENS = [["gen1", "50% 30%"], ["gen2", "50% 40%"], ["gen3", "50% 35%"], ["gen4", "50% 45%"]] as const;

/** Pozele alese în Admin se schimbă rar: le ținem în cache 10 minute, iar orice salvare golește cache-ul pe loc. */
const cachedHomeImages = unstable_cache(() => homeImages(db), ["home-images"], { tags: [HOME_IMAGES_TAG], revalidate: 600 });
/** Prețurile și plafoanele planurilor, din Admin → Manager control: în cache 10 minute, golit pe loc la salvare. */
const cachedPlans = unstable_cache(() => planSettings(db), ["plan-settings"], { tags: [PLANS_TAG], revalidate: 600 });

/** Huburile și cele 6 ghiduri de pornire din „Începe de aici”. */
const START_HUBS: [string, string][] = [
  ["/genealogie", "Genealogie pe regiuni, județe și orașe"], ["/nume", "Nume de familie explicate"], ["/localitati", "Arhive și registre pe județe"],
  ["/ghid", "Toate ghidurile"], ["/glosar", "Glosarul cuvintelor din acte"], ["/surse-publice", "Surse publice de genealogie"], ["/cadouri", "Idei de cadou pentru familie"], ["/unelte", "Unelte gratuite: rudenie, arbore de tipărit"],
];
const START_GUIDES = [
  "cum-incepi-arborele-genealogic", "intrebari-pentru-bunici", "cum-ceri-un-act-de-stare-civila",
  "registrele-de-stare-civila", "cum-citesti-un-registru-parohial", "familysearch-pentru-romania",
];

/** Câte arbori noi s-au început în ultimele 30 de zile (dovada de sub „Începe chiar acum”); se arată doar de la 10 în sus. */
const PROOF_MIN = 10;
const cachedProof = unstable_cache(async () => {
  const r = await db.execute(sql`select count(*)::int as c from tree where created_at > now() - interval '30 days'`);
  return Number((r.rows?.[0] as { c?: number } | undefined)?.c ?? 0);
}, ["home-proof"], { revalidate: 3600 });

export default async function Landing({ deleted }: { deleted: boolean }) {
  const [t, tc, th, tp, tg, tm, tt, proof, appName, imgs, s, locale] = await Promise.all([getT("Landing"), getT("ContactPage"), getT("Church"), getT("Plata"), getT("GiftPage"), getT("Meta"), getT("TryTree"), cachedProof().catch(() => 0), getAppName(), cachedHomeImages(),
    // La construirea fără bază de date (verificarea de pe GitHub) se arată prețurile propuse; o eroare nu rămâne în cache.
    cachedPlans().catch(() => DEFAULT_SETTINGS), getLocale()]);
  // Prețurile se arată doar cât vânzarea e pornită din Admin; în lei pe română, în euro în celelalte limbi.
  const sales = s.on;
  const lei = locale === "ro";
  const nf = new Intl.NumberFormat(locale);
  const b = (c: React.ReactNode) => <b>{c}</b>;
  const em = (c: React.ReactNode) => <em>{c}</em>;
  // Întrebările frecvente (română și engleză) se văd pe pagină și intră în datele pentru Google, cu prețurile din Admin.
  const faq = homeFaq(locale, s);
  const fl = faqLang(locale);
  const jsonLd = homeJsonLd(locale, s, tm("description"), faq, {
    app: appName, book: fl === "ro" ? "Cartea neamului în PDF" : "PDF family book",
    tiers: { basic: tp("tiers.basic.name"), familie: tp("tiers.familie.name"), premium: tp("tiers.premium.name") },
  });
  const ornament = <span className="lp-ornament" aria-hidden="true"><i /><b /><i /></span>;
  const cards = [
    { k: "tree", art: <div className="lp-card-fan"><FanChart you={t("visualYou")} /></div> },
    { k: "memories", art: <><Photo img={imgs.memories[0]} alt={t("alt.memories")} sizes="(max-width:640px) 100vw, 300px" /><div className="lp-card-badge"><VoiceArt title={t("voiceTitle")} /></div></> },
    { k: "map", art: <Photo img={imgs.map[0]} alt={t("alt.map")} sizes="(max-width:640px) 100vw, 300px" /> },
    { k: "book", art: <Photo img={imgs.book[0]} alt={t("alt.book")} sizes="(max-width:640px) 100vw, 300px" /> },
  ] as const;
  return (
    <div className="lp">
      <JsonLd data={jsonLd} />
      {/* Banda discretă pentru darul de Crăciun (Daniel, 2026-11-13): doar cât vânzarea e pornită, până pe 6 ianuarie. */}
      {sales && giftSeason() && (
        <p className="lp-gift-band">
          <span>{tg("band", { price: money(lei ? tierPrice("basic", true, s).lei : tierPrice("basic", true, s).eur, locale).label })}</span>{" "}
          <Link href={GIFT_PATH}>{tg("bandLink")}<span aria-hidden="true"> →</span></Link>
        </p>
      )}
      {deleted && <p className="notice lp-in" role="status">{t("deleted")}</p>}
      {/* Butonul rotund de WhatsApp, în colț, pentru cine vrea să ne scrie (Daniel, 11 noiembrie 2026). */}
      <a className="wa-float" href={whatsappUrl(tc("waGreeting"))} target="_blank" rel="noopener noreferrer" aria-label={tc("waFloat")} title={tc("waFloat")}>
        <WhatsAppIcon size={30} />
      </a>

      {/* Bannerul: familia pe toată lățimea, cu panoul întunecat la mijloc */}
      <section className="lp-band lp-banner">
        <BannerSlides imgs={imgs.banner.map(({ src, custom }) => ({ src, custom }))} />
        <div className="lp-banner-panel">
          {/* Un singur H1: „Arborele genealogic al familiei tale” deasupra, apoi numele, ca înainte la vedere. */}
          <h1 className="lp-h1"><span className="lp-tagline">{t("eyebrow")}</span><span className="sr-only"> – </span><span className="lp-name">{await getAppName()}</span></h1>
          {ornament}
          <p className="lp-subtitle">{t.rich("heroTitleRich", { em })}</p>
          {t("brandNote") && <p className="lp-brand">{t("brandNote")}</p>}
          {/* Începutul pe loc (19.11.2026): numele tău, apoi părinții, desenați pe loc în evantai; contul vine după. */}
          <TryTree />
          {sales && <p className="lp-free">{t("freeNote", { days: String(s.trialDays) })}</p>}
          <p className="lp-signin">{tt("haveAccount")} <Link href="/intrare">{t("signIn")}</Link></p>
          {proof >= PROOF_MIN && <p className="lp-proof">{tt("proof", { count: proof })}</p>}
        </div>
        <ul className="lp-trust">
          <li><Icon>{CHECK}</Icon>{t("trust1")}</li>
          <li><Icon>{LOCK}</Icon>{t("trust2")}</li>
          <li><Icon>{GLOBE}</Icon>{t("trust3", { count: String(LANGUAGE_COUNT) })}</li>
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
                <div className="lp-photo"><div className="lp-photo-in" style={{ ["--pos" as string]: pos }}><Photo img={imgs[k][0]} alt={t(`alt.${k}`)} sizes="(max-width:640px) 90vw, (max-width:1000px) 45vw, 280px" /></div></div>
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
        <Photo img={imgs.sunset[0]} sizes="100vw" quality={60} className="lp-img lp-sunset-img" />
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
          <div className="lp-how-photo"><div className="lp-photo"><div className="lp-photo-in"><Photo img={imgs.table[0]} alt={t("alt.table")} sizes="(max-width:1000px) 90vw, 480px" /></div></div></div>
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

      {/* Ce este un arbore genealogic, cum îți afli strămoșii și, pentru cine vrea, paginile de istorie */}
      <section className="lp-band lp-light lp-what" aria-labelledby="lp-what">
        <div className="lp-in lp-what-in">
          <div>
            <h2 id="lp-what">{t("whatTitle")}</h2>
            <p>{t("whatText")}</p>
          </div>
          <div>
            <h2>{t("ancestorsTitle")}</h2>
            <p>{t("ancestorsText")}</p>
          </div>
          <nav className="lp-history" aria-labelledby="lp-history">
            <h3 id="lp-history">{t("historyTitle")}</h3>
            <p>{t("historyText")}</p>
            <ul>
              <li><Link href="/istoria-umanitatii">{th("humanity")}</Link></li>
              <li><Link href="/genealogii-vechi">{th("genealogies")}</Link></li>
              <li><Link href="/libertatea-de-a-crede">{th("label")}</Link></li>
            </ul>
          </nav>
        </div>
      </section>

      {/* „Pentru românii din zona ta”: doar pentru cine vine din SUA, Canada (și, curând, din Europa); cerut după încărcare. */}
      <div className="lp-in lp-zona"><ZonaSugestii locale={locale} /></div>

      {/* „Începe de aici” (planul SEO, etapa 3): paginile-hub și primele ghiduri, doar în română, unde există conținutul. */}
      {lei && (
        <section className="lp-band lp-paper lp-what" aria-labelledby="lp-start">
          <div className="lp-in lp-what-in">
            <div>
              <h2 id="lp-start">Începe de aici</h2>
              <p>Nu știi de unde să pornești? Află unde sunt actele locului din care se trage familia, ce înseamnă numele vostru și cum îi întrebi pe bunici. Totul e gratuit de citit, fără cont.</p>
            </div>
            <nav className="lp-history" aria-label="Pagini de pornire">
              <h3>Caută după loc și nume</h3>
              <ul>{START_HUBS.map(([href, label]) => <li key={href}><Link href={href}>{label}</Link></li>)}</ul>
            </nav>
            <nav className="lp-history" aria-label="Primele ghiduri">
              <h3>Primele ghiduri</h3>
              <ul>{START_GUIDES.map((g) => getEntry("ghid", g)).filter((g) => !!g).map((g) => <li key={g!.path}><Link href={g!.path}>{g!.title}</Link></li>)}</ul>
            </nav>
          </div>
        </section>
      )}

      {/* Prețurile: cele trei planuri pe un an, cu plafoanele lor, citite din Admin (Daniel, 13 noiembrie 2026). */}
      {sales && (
        <section className="lp-band lp-paper" aria-labelledby="lp-plans" id="preturi">
          <div className="lp-in">
            <header className="lp-head">
              <p className="lp-eyebrow">{t("plansLabel")}</p>
              <h2 id="lp-plans">{t("plansTitle")}</h2>
              {ornament}
              <p>{t("plansText", { days: String(s.trialDays), persons: s.trialPersons, photos: s.trialPhotos, audio: s.trialAudio, docs: s.trialDocs })}</p>
            </header>
            <div className="lp-plans">
              {TIERS.map((x) => {
                const p = tierPrice(x, true, s), lim = tierLimits(x, s), book = tierBook(x, s);
                return (
                  <article key={x} className={`lp-plan${x === "familie" ? " lp-plan-rec" : ""}`}>
                    {x === "familie" && <span className="lp-plan-badge">{tp("recommended")}</span>}
                    <h3>{tp(`tiers.${x}.name`)}</h3>
                    <p className="lp-plan-price">{tp("perYear", { price: money(lei ? p.lei : p.eur, locale).label })}</p>
                    <p className="lp-plan-lead">{tp(`tiers.${x}.lead`, { days: String(s.trialDays), price: money(lei ? s.invitePriceLei : s.invitePriceEur, locale).label, writers: String(lim.writers ?? "∞"), trees: lim.trees ?? 0 })}</p>
                    <ul>
                      {LIMIT_KEYS.map((k) => <li key={k}><span>{tp(`lim.${k}`)}</span><b>{lim[k] === null ? tp("unlimited") : nf.format(lim[k])}</b></li>)}
                      <li><span>{tp("lim.book")}</span><b>{book === "toti" ? tp("bookAll") : book === "una" ? tp("bookOne") : tp("bookSeparate", { price: money(lei ? s.bookLei : s.bookEur, locale).label })}</b></li>
                    </ul>
                  </article>
                );
              })}
            </div>
            <p className="lp-plans-note">{tp("bookNote", { price: money(lei ? s.bookLei : s.bookEur, locale).label })}</p>
            <p className="lp-plans-note">{t("plansNote", { keep: money(lei ? s.keepLei : s.keepEur, locale).label })} {t("plansTerms")} <Link href="/termeni">{tp("terms")}</Link>.</p>
            <div className="lp-actions lp-plans-actions">
              <Link className="lp-btn lp-btn-gold" href="/intrare?mod=cont-nou">{t("signUp")}<span aria-hidden="true">→</span></Link>
            </div>
          </div>
        </section>
      )}

      {fl && faq.length > 0 && (
        <section className="lp-band lp-light lp-faq" aria-labelledby="lp-faq" id="intrebari">
          <div className="lp-in">
            <header className="lp-head">
              <h2 id="lp-faq">{FAQ_TITLE[fl]}</h2>
              {ornament}
            </header>
            <div className="lp-faq-list">
              {faq.map((f) => (
                <details key={f.q} className="lp-faq-item">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="lp-band lp-cta" aria-labelledby="lp-cta">
        <Photo img={imgs.hands[0]} sizes="100vw" quality={60} className="lp-img lp-cta-img" />
        <div className="lp-in">
          <h2 id="lp-cta">{t("ctaTitle")}</h2>
          {ornament}
          <p className="lp-cta-lead">{t("ctaText")}</p>
          <div className="lp-actions">
            <Link className="lp-btn lp-btn-gold" href="/intrare?mod=cont-nou">{t("start")}<span aria-hidden="true">→</span></Link>
            <Link className="lp-btn lp-btn-ghost" href="/intrare">{t("signIn")}</Link>
          </div>
          {sales && <p className="lp-free">{t("freeNote", { days: String(s.trialDays) })}</p>}
          <p className="lp-privacy">{t.rich("privacy", { link: (c) => <Link href="/confidentialitate">{c}</Link> })}</p>
        </div>
      </section>
    </div>
  );
}
