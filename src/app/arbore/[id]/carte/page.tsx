// Fontul cărții: Alegreya obișnuit și cursiv (site-ul are doar grosimile 500 și 700); doar literele latine, cu diacriticele românești.
import "@fontsource/alegreya/latin-400.css";
import "@fontsource/alegreya/latin-ext-400.css";
import "@fontsource/alegreya/latin-400-italic.css";
import "@fontsource/alegreya/latin-ext-400-italic.css";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { db } from "@/db";
import { bookExport, person } from "@/db/schema";
import { loadTreeView } from "@/lib/tree-data";
import { requireUser, roleIn, can } from "@/lib/access";
import { bookOptions, bookWords, buildBook, cleanText, type BookModel, type BookOptions, type BookText, type BookUnion, type Entry, type Ref } from "@/lib/book";
import { isPlaceholder, normName } from "@/lib/family";
import type { Sex } from "@/lib/kinship";
import { audioLeftOut, bookMemories, type BookMemory } from "@/lib/lada-db";
import { CHAPTERS, chapterKey } from "@/lib/questions";
import { memoryShortPath } from "@/lib/short-link";
import { siteOrigin } from "@/lib/site";
import { getLocale, getT } from "@/i18n/server";
import { isLocale, type Locale } from "@/i18n/locales";
import BookView from "@/components/BookView";
import BookFan from "@/components/BookFan";
import BookTree from "@/components/BookTree";
import PageIntl from "@/i18n/PageIntl";
import BookOptionsForm from "@/components/BookOptionsForm";
import BookTextForm from "@/components/BookTextForm";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: (await getT("Book"))("page.title") };
}
const UUID = /^[0-9a-f-]{36}$/i;

type TB = Awaited<ReturnType<typeof getT<"Book">>>;
/**
 * Ce le trebuie bucăților cărții ca să scrie în limba ei: textele („Book”), cum se scrie trimiterea la o pagină („(p. 14)”),
 * cum se înșiră numele („Ana, Ion și Maria”) și numele capitolelor din lada cu amintiri.
 */
type Words = { t: TB; pg: { before: string; after: string }; list: Intl.ListFormat; locale: Locale; chapter: (c: string) => string };

/** Un hash scurt al conținutului: când se schimbă ceva în carte, paginile se așază din nou. */
function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
/** Paragrafele unui text scris de mână: un rând gol începe un paragraf nou. */
const paragraphs = (t: string) => t.split(/\n\s*\n/).map((x, i) => <p key={i}>{x.split("\n").flatMap((line, j) => (j ? [<br key={j} />, line] : [line]))}</p>);

/** Ce vine înainte și după numărul paginii în trimiteri: „(p. ” și „)” în română, „(S. ” și „)” în germană, „(” și „. o.)” în maghiară. */
function pageParts(t: TB) {
  const mark = "\u0001";
  const [before, after = ""] = t("pageRef", { n: mark }).split(mark);
  return { before, after };
}

/** Numărul paginii unei fișe sau al unui capitol; se completează după ce cartea e așezată pe pagini. */
const Pg = ({ id, before = "", after = "" }: { id: string; before?: string; after?: string }) => (
  <span className="bk-pg" data-pg={id} data-before={before} data-after={after}>{`${before}00${after}`}</span>
);

/** Un nume din fișă, cu trimitere la pagina lui, dacă are fișă în carte. */
const RefName = ({ r, w }: { r: Ref; w: Words }) => (r.id ? <><a href={`#p-${r.id}`}>{r.name}</a> <Pg id={`p-${r.id}`} {...w.pg} /></> : <>{r.name}</>);
/** Același nume, în mijlocul unei fraze traduse (<ref>…</ref>). */
const refTag = (r: Ref, w: Words) => (c: React.ReactNode) => (r.id ? <><a href={`#p-${r.id}`}>{c}</a> <Pg id={`p-${r.id}`} {...w.pg} /></> : <>{c}</>);
/** „Ana, Ion și Maria”, cu „și”-ul și virgulele limbii cărții (în engleza americană, cu virgula dinainte de „and”). */
function Refs({ list, more, w }: { list: Ref[]; more?: string; w: Words }) {
  const items = [...list.map((r) => <RefName key={r.id ?? r.name} r={r} w={w} />), ...(more ? [<span key="more">{more}</span>] : [])];
  // Numele adevărate, ca regulile limbii să se potrivească (în spaniolă, „y” devine „e” înaintea lui „I”).
  let k = 0;
  const parts = w.list.formatToParts([...list.map((r) => r.name), ...(more ? [more] : [])]);
  return <>{parts.map((p, i) => <span key={i}>{p.type === "element" ? items[k++] : p.value}</span>)}</>;
}
/** Cât ține o înregistrare: „3:07”. */
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, "0")}`;

/** Un om care povestește în „Cu vorbele lor”: amintirile lui bifate pentru carte, cu codul QR la cele spuse cu glasul. */
type Voice = { id: string; name: string; sex: Sex; dates: string; memories: (BookMemory & { qr: string | null; url: string | null })[] };

function Unions({ e, w }: { e: Entry; w: Words }) {
  const { t } = w;
  const named = e.unions.filter((u) => u.spouse);
  const kids = (u: BookUnion) => <Refs list={u.children} more={u.hidden ? t("person.livingChildren", { count: u.hidden }) : undefined} w={w} />;
  const married = (u: BookUnion) => (u.married ? t("person.married", { kind: u.marriedKind, when: u.married }) : "");
  return (
    <>
      {e.unions.map((u, i) => {
        if (!u.spouse) return (
          <div key="alta" className="bk-row"><dt>{named.length ? t("person.childrenOther") : t("person.children")}</dt><dd>{kids(u)}</dd></div>
        );
        if (named.length === 1) return (
          <div key={i} className="bk-row-group">
            <div className="bk-row"><dt>{t("person.spouse", { sex: e.sex })}</dt><dd><RefName r={u.spouse} w={w} />{married(u)}</dd></div>
            {(u.children.length > 0 || u.hidden > 0) && <div className="bk-row"><dt>{t("person.children")}</dt><dd>{kids(u)}</dd></div>}
          </div>
        );
        return (
          <div key={i} className="bk-row"><dt>{t("person.nthMarriage", { n: i + 1 })}</dt>
            <dd>{t.rich("person.marriage", { name: u.spouse.name, married: married(u), kids: u.children.length || u.hidden ? "yes" : "no", ref: refTag(u.spouse, w), list: () => kids(u) })}</dd></div>
        );
      })}
    </>
  );
}

function Person({ e, told, w }: { e: Entry; told?: number; w: Words }) {
  const { t } = w;
  const maiden = e.birthSurname && normName(e.birthSurname) !== normName(e.surname) ? e.birthSurname : null;
  const row = (label: string, value: React.ReactNode) => <div className="bk-row"><dt>{label}</dt><dd>{value}</dd></div>;
  return (
    <article className="bk-person" data-anchor={`p-${e.id}`}>
      <div className="bk-person-top">
        {e.photo && <img className="bk-photo" src={e.photo} alt="" referrerPolicy="no-referrer" loading="lazy" />}
        <div className="bk-person-main">
          <h3>{e.name}{maiden && <span className="bk-born"> {t("model.maiden", { name: maiden, sex: e.sex })}</span>}</h3>
          {e.dates && <div className="bk-dates">{e.dates}</div>}
          <dl className="bk-facts">
            {e.born && row(t("person.born", { sex: e.sex }), e.born)}
            {e.died && row(t("person.died", { sex: e.sex }), e.died)}
            {e.lives && row(t("person.lives"), e.lives)}
            {e.occupation && row(t("person.occupation"), e.occupation)}
            {e.parents.length > 0 && row(t("person.parents"), <Refs list={e.parents} w={w} />)}
            <Unions e={e} w={w} />
            {e.carers.length > 0 && row(t("person.raisedBy", { sex: e.sex }), <Refs list={e.carers} w={w} />)}
            {e.raised.length > 0 && row(t("person.raised"), <Refs list={e.raised} w={w} />)}
            {!!told && row(t("person.memories"), <><a href={`#v-${e.id}`}>{t("person.memoriesLink", { count: told, sex: e.sex })}</a> <Pg id={`v-${e.id}`} {...w.pg} /></>)}
          </dl>
        </div>
      </div>
      {e.biography && <div className="bk-bio">{paragraphs(e.biography)}</div>}
      {e.album.length > 0 && (
        <div className="bk-album">
          {e.album.map((a) => <figure key={a.src}><img src={a.src} alt="" loading="lazy" />{a.caption && <figcaption>{a.caption}</figcaption>}</figure>)}
        </div>
      )}
    </article>
  );
}

/** Ornamentul de pe copertă: un copac cu coroana rotundă, deasă, din frunze așezate ca semințele de floarea-soarelui, și rădăcini. */
function Ornament() {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const greens = ["#8fbf7a", "#a9c98f", "#c4d99a", "#7fae6a", "#b5d39a"];
  const N = 86, leaves = [];
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt((i + 0.5) / N), t = i * 2.39996;
    const x = 100 + Math.cos(t) * r * 60 + (rnd() - 0.5) * 5, y = 76 + Math.sin(t) * r * 50 + (rnd() - 0.5) * 5;
    const rot = ((t * 180) / Math.PI + 90 + (rnd() - 0.5) * 50).toFixed(0);
    leaves.push(<ellipse key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} rx={(5.4 + rnd() * 2.2).toFixed(1)} ry={(2.7 + rnd() * 1.1).toFixed(1)}
      transform={`rotate(${rot} ${x.toFixed(1)} ${y.toFixed(1)})`} fill={greens[Math.floor(rnd() * greens.length)]} stroke="#6f8f5c" strokeWidth={0.45} />);
  }
  return (
    <svg className="bk-ornament" viewBox="0 0 200 190" aria-hidden>
      <path d="M93 176 C95 152 96 130 94 108 C93 99 88 92 82 87 M107 176 C105 152 104 130 106 108 C107 99 112 92 118 87 M100 124 C100 110 100 98 100 86"
        fill="none" stroke="#7a5a3a" strokeWidth={3} strokeLinecap="round" />
      <path d="M99 132 C89 122 77 113 63 106 M101 126 C111 116 123 108 137 102 M99 112 C93 101 85 92 74 84 M101 108 C108 97 116 89 127 82"
        fill="none" stroke="#7a5a3a" strokeWidth={1.8} strokeLinecap="round" />
      {leaves}
      <path d="M93 176 C84 178 73 180 61 184 M107 176 C116 178 127 180 139 184 M97 177 C92 181 86 184 79 188 M103 177 C108 181 114 184 121 188"
        fill="none" stroke="#7a5a3a" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M36 186 H164" stroke="#b9822a" strokeWidth={0.8} />
    </svg>
  );
}

/** „Cu vorbele lor”: amintirile din lada fiecăruia, pe care cine le-a scris a ales să intre în carte. */
function Voices({ voices, options, w }: { voices: Voice[]; options: BookOptions; w: Words }) {
  const { t } = w;
  const told = voices.reduce((n, v) => n + v.memories.length, 0), heard = voices.some((v) => v.memories.some((m) => m.qr));
  return (
    <section className="bk-chapter bk-voices" data-anchor="c-vorbe">
      <h2>{t("voices.title")}</h2>
      <p className="bk-chapter-sub">
        {t("voices.sub", { count: told })}
        {heard ? ` ${t("voices.audio", { count: told })}` : ""}
        {options.living !== "tot" ? ` ${t("voices.private")}` : ""}
      </p>
      {voices.map((v) => (
        <div key={v.id} className="bk-teller" data-anchor={`v-${v.id}`}>
          <h3><a href={`#p-${v.id}`}>{v.name}</a>{v.dates && <span className="bk-teller-dates"> {v.dates}</span>}</h3>
          {v.memories.map((m) => (
            <article key={m.id} className="bk-memory">
              <div className="bk-memory-head">
                <div className="bk-memory-chapter">{w.chapter(m.chapter)}</div>
                {m.title && <h4>{m.title}</h4>}
                {m.question && <p className="bk-q">{t("voices.question", { question: m.question })}{m.askedBy && <span> · {t("voices.askedBy", { name: m.askedBy })}</span>}</p>}
                {(m.when || m.place) && <p className="bk-when">{[m.when, m.place].filter(Boolean).join(", ")}</p>}
              </div>
              {m.photoId && <img className="bk-memory-photo" src={`/api/document/${m.photoId}`} alt="" loading="lazy" />}
              {m.body ? <div className="bk-memory-body">{paragraphs(m.body)}</div> : <p className="bk-memory-body bk-muted">{t("voices.toldAloud")}</p>}
              {m.qr && m.url && (
                <div className="bk-listen">
                  <span className="bk-qr" dangerouslySetInnerHTML={{ __html: m.qr }} />
                  <span>{t.rich("voices.listen", { sex: v.sex, time: m.audioSeconds ? ` (${clock(m.audioSeconds)})` : "", b: (c) => <b>{c}</b> })}
                    <br /><span className="bk-url">{m.url.replace(/^https?:\/\//, "")}</span></span>
                </div>
              )}
              {m.recordedBy && <p className="bk-by">{t("voices.recorded", { audio: m.audio ? "yes" : "no", name: m.recordedBy })}</p>}
            </article>
          ))}
        </div>
      ))}
    </section>
  );
}

/** Câți oameni are arborele și de ce nu sunt toți în carte (aceeași cifră ca pe prima pagină și în arbore). */
type Census = { all: number; livingHidden: number; other: number };

function Book({ model, options, text, title, subtitle, author, treeName, when, voices, oldestSex, census, w }: {
  model: BookModel; options: BookOptions; text: BookText; title: string; subtitle: string; author: string; treeName: string; when: string;
  voices: Voice[]; oldestSex: Sex; census: Census; w: Words;
}) {
  const { t } = w;
  const { stats, centerName, trunk } = model;
  const fanTitle = centerName ? t("fan.titleOf", { name: centerName }) : t("fan.title");
  const urmasi = trunk ? t("descendants.title", { name: trunk.name }) : "";
  const toc: { id: string; title: string; sub?: string }[] = [
    { id: "c-despre", title: t("about.title") },
    ...(text.preface ? [{ id: "c-cuvant", title: t("preface") }] : []),
    ...(model.fanGenerations >= 2 ? [{ id: "c-evantai", title: fanTitle }] : []),
    ...(model.tree ? [{ id: "c-copac", title: t("tree.title") }] : []),
    ...(model.outline.length >= 3 ? [{ id: "c-urmasi", title: urmasi }] : []),
    ...model.generations.map((g) => ({ id: g.id, title: g.title, sub: g.subtitle })),
    ...(voices.length ? [{ id: "c-vorbe", title: t("voices.title") }] : []),
    { id: "c-index", title: t("index") },
  ];
  const told = new Map(voices.map((v) => [v.id, v.memories.length]));
  const memoriesCount = voices.reduce((n, v) => n + v.memories.length, 0);
  const privacy = options.living === "nume" ? t("about.privacyNames") : options.living === "ascunsi" ? t("about.privacyHidden") : t("about.privacyAll");
  const oldest = stats.oldest;
  const treeCount = Object.keys(model.treePeople).length;
  return (
    <div className={`bk bk-${options.format}`} lang={w.locale}>
      <section className="bk-cover">
        <div className="bk-kicker">{t("cover.kicker")}</div>
        <h1 className="bk-title">{title}</h1>
        {subtitle && <p className="bk-subtitle">{subtitle}</p>}
        <Ornament />
        <div className="bk-cover-foot">{t("cover.by", { author })}<br />{when}</div>
      </section>

      <section className="bk-chapter bk-toc" data-anchor="c-cuprins">
        <h2>{t("toc")}</h2>
        <ol>
          {toc.map((x) => (
            <li key={x.id} className={x.sub !== undefined ? "sub" : undefined}>
              <a href={`#${x.id}`}>{x.title}{x.sub ? <span className="bk-muted"> · {x.sub}</span> : null}</a>
              <span className="bk-dots" /><Pg id={x.id} />
            </li>
          ))}
        </ol>
      </section>

      <section className="bk-chapter" data-anchor="c-despre">
        <h2>{t("about.title")}</h2>
        <p className="bk-chapter-sub">{treeName}</p>
        <p className="bk-lead">
          {stats.generations > 1 ? t("about.peopleGenerations", { count: stats.people, generations: stats.generations }) : t("about.people", { count: stats.people })}
          {oldest ? <> {oldest.dates
            ? t.rich("about.oldestDated", { sex: oldestSex, name: oldest.name, dates: oldest.dates, ref: refTag(oldest, w) })
            : t.rich("about.oldest", { sex: oldestSex, name: oldest.name, ref: refTag(oldest, w) })}</> : null}
          {stats.from && stats.to && stats.to > stats.from ? ` ${t("about.span", { from: String(stats.from), to: String(stats.to) })}` : ""}
        </p>
        {census.all > stats.people && (
          <p className="bk-note">{[
            t("about.ofTree", { count: stats.people, all: census.all }),
            census.livingHidden > 0 ? t("about.livingHidden", { count: census.livingHidden }) : "",
            census.other > 0 ? t("about.otherLeftOut", { count: census.other }) : "",
          ].filter(Boolean).join(" · ")}</p>
        )}
        {stats.surnames.length > 0 && <><h3 className="bk-h">{t("about.surnames")}</h3><p>{stats.surnames.map(([s, n]) => `${s} (${n})`).join(", ")}.</p></>}
        {stats.places.length > 0 && <><h3 className="bk-h">{t("about.places")}</h3><p>{stats.places.map(([s, n]) => `${s} (${n})`).join(", ")}.</p></>}
        <h3 className="bk-h">{t("about.howTitle")}</h3>
        <p>{t("about.how", { example: `${w.pg.before}14${w.pg.after}` })}</p>
        {voices.length > 0 && <p>{t("about.voices", {
          chapter: t("voices.title"), count: memoriesCount, audio: voices.some((v) => v.memories.some((m) => m.qr)) ? "yes" : "no",
          tellers: voices.length === 1 ? voices[0].name : t("about.tellers", { count: voices.length }),
        })}</p>}
        <p className="bk-note">{privacy}</p>
      </section>

      {text.preface && (
        <section className="bk-chapter bk-preface" data-anchor="c-cuvant">
          <h2>{t("preface")}</h2>
          <div style={{ marginTop: "6mm" }}>{paragraphs(text.preface)}</div>
          <p className="bk-sign">{author}</p>
        </section>
      )}

      {model.fanGenerations >= 2 && (
        <section className="bk-chapter" data-anchor="c-evantai">
          <h2>{fanTitle}</h2>
          <p className="bk-chapter-sub">{t("fan.sub", { count: model.fanGenerations })}</p>
          <figure className="bk-fig">
            <BookFan slots={model.fan} generations={model.fanGenerations} centerHidden={!centerName} locale={w.locale} label={t("fan.title")} livingLabel={t("fan.living")} />
          </figure>
          <div className="bk-legend">
            <span><i style={{ background: "#c9daef" }} />{t("fan.father")}</span>
            <span><i style={{ background: "#ecd8b4" }} />{t("fan.mother")}</span>
            <span><i style={{ border: "0.8pt dashed #a9b0b8" }} />{t("fan.unknown")}</span>
          </div>
        </section>
      )}

      {model.tree && (
        <section className="bk-chapter" data-anchor="c-copac">
          <h2>{t("tree.title")}</h2>
          <p className="bk-chapter-sub">
            {centerName ? t("tree.subTrunk", { title: urmasi, count: treeCount, name: centerName }) : t("tree.sub", { title: urmasi, count: treeCount })} {t("tree.zoom")}
          </p>
          <figure className="bk-fig" data-fit><PageIntl ns={["Charts"]} locale={w.locale}><BookTree root={model.tree} people={model.treePeople} path={model.path} /></PageIntl></figure>
        </section>
      )}

      {model.outline.length >= 3 && (
        <section className="bk-chapter" data-anchor="c-urmasi">
          <h2>{urmasi}</h2>
          <p className="bk-chapter-sub">{t("descendants.sub")}</p>
          <ol className="bk-outline">
            {model.outline.map((l) => (
              <li key={l.num} style={{ paddingLeft: `${Math.min(l.depth, 9) * 4}mm` }}>
                <span className="num">{l.num}</span>
                <span className="who">{l.person.id ? <a href={`#p-${l.person.id}`}>{l.person.name}</a> : l.person.name}</span>
                {l.person.dates && <span className="bk-muted"> {l.person.dates}</span>}
                {l.person.id && <> <Pg id={`p-${l.person.id}`} {...w.pg} /></>}
                {l.from && <span className="from"> · {l.from}</span>}
                {l.spouses.map((s) => <span key={s.name} className="sp"> ⚭ <RefName r={s} w={w} /></span>)}
                {options.living === "ascunsi" && l.hidden > 0 && <span className="bk-muted"> · {t("descendants.hidden", { count: l.hidden })}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {model.generations.map((g) => (
        <section key={g.id} className="bk-chapter" data-anchor={g.id}>
          <h2>{g.title}</h2>
          {g.subtitle && <p className="bk-chapter-sub">{g.subtitle} · {t("people", { count: g.entries.length })}</p>}
          {g.entries.map((e) => <Person key={e.id} e={e} told={told.get(e.id)} w={w} />)}
        </section>
      ))}

      {voices.length > 0 && <Voices voices={voices} options={options} w={w} />}

      <section className="bk-chapter" data-anchor="c-index">
        <h2>{t("index")}</h2>
        <ol className="bk-index">
          {model.index.map((l, i) => (
            <li key={`${l.id}-${i}`}><span className="name"><a href={`#p-${l.id}`}>{l.label}</a>{l.dates && <span className="bk-muted"> {l.dates}</span>}</span><Pg id={`p-${l.id}`} /></li>
          ))}
        </ol>
      </section>

      <section className="bk-colophon">
        <p><b>{title}</b></p>
        <p>{t("colophon.made", { author, when, tree: treeName, count: stats.people })}</p>
        <p>{privacy}</p>
        <p>{t("colophon.redo")}</p>
      </section>
    </div>
  );
}

/**
 * Cartea neamului: coperta, cuprinsul, desenele și câte o fișă pentru fiecare om, gata de tipărit sau de salvat ca PDF.
 * Cartea se scrie în limba aleasă cu `?limba=` (de la sine, limba cititorului), ca să poată fi tipărită și în română pentru
 * bunici, și în germană pentru nepoți; butoanele paginii rămân în limba cititorului.
 */
export default async function BookPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const q = await searchParams;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/carte`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const options = bookOptions(q);
  const uiLocale = await getLocale();
  const asked = typeof q.limba === "string" ? q.limba : undefined;
  const locale: Locale = isLocale(asked) ? asked : uiLocale;
  const [t, tb, tl] = await Promise.all([getT("Book"), getT("Book", locale), getT("Lada", locale)]);
  const w: Words = {
    t: tb, pg: pageParts(tb), locale,
    list: new Intl.ListFormat(locale, { style: "long", type: "conjunction" }),
    chapter: (c) => tl(`chapters.${chapterKey(c)}`),
  };
  const want = typeof q.p === "string" && UUID.test(q.p) ? q.p : undefined;
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const data = await loadTreeView(db, id, want ?? mine?.id, 6);
  if (!data) notFound();
  const [draft] = await db.select({ options: bookExport.options }).from(bookExport)
    .where(and(eq(bookExport.treeId, id), eq(bookExport.status, "draft"))).orderBy(desc(bookExport.createdAt)).limit(1);
  const text = cleanText((draft?.options as { text?: Partial<BookText> } | undefined)?.text);
  const model = buildBook({ people: data.people, rels: data.rels, raised: data.raised, centerId: data.centerId, slots: data.slots, options, words: bookWords(locale, tb) });
  const { stats } = model;
  // Câți sunt în arbore (cifra din arbore și de pe prima pagină) și câți lipsesc din carte: cei în viață ascunși în această ediție
  // și ceilalți (discreți, fără nume ca „Tată necunoscut”, ori prea departe de persoana de la care pornește cartea).
  const everyone = await db.select({ living: person.living, discreet: person.discreet, given: person.givenName }).from(person).where(eq(person.treeId, id));
  const livingHidden = options.living === "ascunsi" ? everyone.filter((p) => p.living && !p.discreet && !isPlaceholder(p.given)).length : 0;
  const census: Census = { all: everyone.length, livingHidden, other: Math.max(0, everyone.length - stats.people - livingHidden) };
  // „Cu vorbele lor”: amintirile bifate pentru carte pe care cel care face cartea le vede și pe site, pe oameni (în ordinea fișelor) și pe capitole.
  const [memories, leftOut] = await Promise.all([
    bookMemories(db, id, { userId: me.id, personId: mine?.id ?? null }, options.living, options.photos),
    audioLeftOut(db, id, { userId: me.id, personId: mine?.id ?? null }, options.living),
  ]);
  const entries = model.generations.flatMap((g) => g.entries);
  const place = new Map(entries.map((e, i) => [e.id, i]));
  const chapterAt = (c: string) => { const i = CHAPTERS.findIndex((x) => x.key === c); return i < 0 ? CHAPTERS.length : i; };
  const origin = await siteOrigin();
  const voices: Voice[] = await Promise.all(entries.filter((e) => memories.some((m) => m.personId === e.id)).map(async (e) => ({
    id: e.id, name: e.name, sex: e.sex, dates: e.dates,
    memories: await Promise.all(memories.filter((m) => m.personId === e.id)
      .sort((a, b) => chapterAt(a.chapter) - chapterAt(b.chapter) || (a.year ?? 9999) - (b.year ?? 9999) || a.createdAt.localeCompare(b.createdAt))
      .map(async (m) => {
        const url = m.audio ? `${origin}${memoryShortPath(m.id)}` : null;
        return { ...m, url, qr: url ? await QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#1b2430", light: "#ffffff" } }) : null };
      })),
  })));
  voices.sort((a, b) => place.get(a.id)! - place.get(b.id)!);
  const range = stats.from && stats.to && stats.to > stats.from ? ` · ${stats.from}–${stats.to}` : "";
  const defaults = {
    title: data.tree.name,
    subtitle: `${stats.generations > 1 ? tb("defaults.subtitleGenerations", { count: stats.people, generations: stats.generations }) : tb("defaults.subtitle", { count: stats.people })}${range}`,
    author: me.name,
  };
  const title = text.title || defaults.title, subtitle = text.subtitle || defaults.subtitle, author = text.author || defaults.author;
  const when = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date());
  const choices = Object.values(data.people).filter((p) => !p.discreet && !isPlaceholder(p.givenName))
    .sort((a, b) => a.name.localeCompare(b.name, uiLocale))
    .map((p) => ({ id: p.id, label: `${p.name}${p.birthYear ? ` (${p.birthYear})` : ""}` }));
  const oldestSex: Sex = (stats.oldest?.id && data.people[stats.oldest.id]?.sex) || "U";
  const renderKey = hash(JSON.stringify({ options, text, title, subtitle, author, model, memories, origin, locale }));
  return (
    <section className="stack book-root">
      <PageIntl ns={["BookUi"]}>
        <div className="card book-chrome">
          <div className="toolbar" style={{ marginBottom: 4 }}>
            <div className="title">{t("page.title")}</div>
            <Link className="btn" href={`/arbore/${id}${data.centerId ? `?p=${data.centerId}` : ""}`}>{t("page.back")}</Link>
          </div>
          <p className="muted" style={{ margin: "0 0 10px" }}>{t("page.lead")}</p>
          <BookOptionsForm treeId={id} center={data.centerId} options={options} people={choices} bookLocale={locale} uiLocale={uiLocale} />
          {leftOut.notTicked + leftOut.closeOnly + leftOut.livingHidden > 0 && (
            // Codurile QR apar doar lângă amintirile care intră în carte; spunem de ce unele spuse cu glasul lipsesc.
            <p className="muted" role="note" style={{ margin: "10px 0 0" }}>{[
              t("page.audioOut", { count: leftOut.notTicked + leftOut.closeOnly + leftOut.livingHidden }),
              leftOut.notTicked ? t("page.audioNotTicked", { count: leftOut.notTicked }) : "",
              leftOut.closeOnly ? t("page.audioCloseOnly", { count: leftOut.closeOnly }) : "",
              leftOut.livingHidden ? t("page.audioLivingHidden", { count: leftOut.livingHidden }) : "",
            ].filter(Boolean).join(" ")}</p>
          )}
        </div>
        {can(role, "editor") && <BookTextForm treeId={id} text={text} defaults={defaults} />}
        {stats.people === 0 ? (
          <div className="card"><p style={{ margin: 0 }}>{t("page.empty")}</p></div>
        ) : (
          <BookView format={options.format} renderKey={renderKey} fileName={title}>
            <Book model={model} options={options} text={text} title={title} subtitle={subtitle} author={author} treeName={data.tree.name} when={when}
              voices={voices} oldestSex={oldestSex} census={census} w={w} />
          </BookView>
        )}
      </PageIntl>
    </section>
  );
}
