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
import { bookOptions, buildBook, cleanText, type BookModel, type BookOptions, type BookText, type BookUnion, type Entry, type Ref } from "@/lib/book";
import { isPlaceholder, normName } from "@/lib/family";
import { ordinalOf } from "@/lib/kinship";
import { amintiri, de } from "@/lib/ro-words";
import { bookMemories, type BookMemory } from "@/lib/lada-db";
import { CHAPTERS, chapterLabel } from "@/lib/questions";
import { memoryShortPath } from "@/lib/short-link";
import { siteOrigin } from "@/lib/site";
import BookView from "@/components/BookView";
import BookFan from "@/components/BookFan";
import BookTree from "@/components/BookTree";
import BookOptionsForm from "@/components/BookOptionsForm";
import BookTextForm from "@/components/BookTextForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cartea neamului" };
const UUID = /^[0-9a-f-]{36}$/i;

const oameni = (n: number) => (n === 1 ? "un om" : `${de(n)} oameni`);
/** Eticheta după sex: „Născut” / „Născută”; când sexul nu se știe, amândouă („Născut(ă)”, „Soț / soție”). */
const sexed = (sex: string, m: string, f: string, u = `${m}(ă)`) => (sex === "F" ? f : sex === "M" ? m : u);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
/** Un hash scurt al conținutului: când se schimbă ceva în carte, paginile se așază din nou. */
function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
/** Paragrafele unui text scris de mână: un rând gol începe un paragraf nou. */
const paragraphs = (t: string) => t.split(/\n\s*\n/).map((x, i) => <p key={i}>{x.split("\n").flatMap((line, j) => (j ? [<br key={j} />, line] : [line]))}</p>);

/** Numărul paginii unei fișe sau al unui capitol; se completează după ce cartea e așezată pe pagini. */
const Pg = ({ id, before = "", after = "" }: { id: string; before?: string; after?: string }) => (
  <span className="bk-pg" data-pg={id} data-before={before} data-after={after}>{`${before}00${after}`}</span>
);

/** Un nume din fișă, cu trimitere la pagina lui, dacă are fișă în carte. */
const RefName = ({ r }: { r: Ref }) => (r.id ? <><a href={`#p-${r.id}`}>{r.name}</a> <Pg id={`p-${r.id}`} before="(p. " after=")" /></> : <>{r.name}</>);
/** „Ana, Ion și Maria”. */
function Refs({ list, more }: { list: Ref[]; more?: string }) {
  const parts = [...list.map((r) => <RefName key={r.id ?? r.name} r={r} />), ...(more ? [<span key="more">{more}</span>] : [])];
  return <>{parts.map((x, i) => <span key={i}>{i === 0 ? "" : i === parts.length - 1 ? " și " : ", "}{x}</span>)}</>;
}
/** Cât ține o înregistrare: „3:07”. */
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec) % 60).padStart(2, "0")}`;

/** Un om care povestește în „Cu vorbele lor”: amintirile lui bifate pentru carte, cu codul QR la cele spuse cu glasul. */
type Voice = { id: string; name: string; sex: string; dates: string; memories: (BookMemory & { qr: string | null; url: string | null })[] };

const inLife = (n: number, kids: boolean) => (n === 1 ? (kids ? "un copil în viață" : "o persoană în viață") : `${de(n)} ${kids ? "copii" : "persoane"} în viață`);
const marriedOn = (m: string) => (!m ? "" : /^\d{2}\.\d{2}\.\d{4}$/.test(m) ? `, căsătoriți la ${m}` : /^\d/.test(m) ? `, căsătoriți în ${m}` : `, căsătoriți ${m}`);

function Unions({ e }: { e: Entry }) {
  const named = e.unions.filter((u) => u.spouse);
  const kids = (u: BookUnion) => <Refs list={u.children} more={u.hidden ? inLife(u.hidden, true) : undefined} />;
  return (
    <>
      {e.unions.map((u, i) => {
        if (!u.spouse) return (
          <div key="alta" className="bk-row"><dt>{named.length ? "Copii din altă relație" : "Copii"}</dt><dd>{kids(u)}</dd></div>
        );
        if (named.length === 1) return (
          <div key={i} className="bk-row-group">
            <div className="bk-row"><dt>{sexed(e.sex, "Soție", "Soț", "Soț / soție")}</dt><dd><RefName r={u.spouse} />{marriedOn(u.married)}</dd></div>
            {(u.children.length > 0 || u.hidden > 0) && <div className="bk-row"><dt>Copii</dt><dd>{kids(u)}</dd></div>}
          </div>
        );
        return (
          <div key={i} className="bk-row"><dt>{cap(ordinalOf(i + 1, "F"))} căsătorie</dt>
            <dd>cu <RefName r={u.spouse} />{marriedOn(u.married)}{u.children.length || u.hidden ? <>; copii: {kids(u)}</> : null}</dd></div>
        );
      })}
    </>
  );
}

function Person({ e, told }: { e: Entry; told?: number }) {
  const maiden = e.birthSurname && normName(e.birthSurname) !== normName(e.surname) ? e.birthSurname : null;
  const row = (label: string, value: React.ReactNode) => <div className="bk-row"><dt>{label}</dt><dd>{value}</dd></div>;
  return (
    <article className="bk-person" data-anchor={`p-${e.id}`}>
      <div className="bk-person-top">
        {e.photo && <img className="bk-photo" src={e.photo} alt="" referrerPolicy="no-referrer" loading="lazy" />}
        <div className="bk-person-main">
          <h3>{e.name}{maiden && <span className="bk-born"> (n. {maiden})</span>}</h3>
          {e.dates && <div className="bk-dates">{e.dates}</div>}
          <dl className="bk-facts">
            {e.born && row(sexed(e.sex, "Născut", "Născută"), e.born)}
            {e.died && row(sexed(e.sex, "Decedat", "Decedată"), e.died)}
            {e.lives && row("Locuiește", e.lives)}
            {e.occupation && row("Ocupația", e.occupation)}
            {e.parents.length > 0 && row("Părinți", <Refs list={e.parents} />)}
            <Unions e={e} />
            {e.carers.length > 0 && row(sexed(e.sex, "Crescut de", "Crescută de", "Crescut(ă) de"), <Refs list={e.carers} />)}
            {e.raised.length > 0 && row("A crescut", <Refs list={e.raised} />)}
            {!!told && row("Amintiri", <><a href={`#v-${e.id}`}>{amintiri(told)}, cu vorbele {sexed(e.sex, "lui", "ei", "lui")}</a> <Pg id={`v-${e.id}`} before="(p. " after=")" /></>)}
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
function Voices({ voices, options }: { voices: Voice[]; options: BookOptions }) {
  const told = voices.reduce((n, v) => n + v.memories.length, 0), heard = voices.some((v) => v.memories.some((m) => m.qr));
  return (
    <section className="bk-chapter bk-voices" data-anchor="c-vorbe">
      <h2>Cu vorbele lor</h2>
      <p className="bk-chapter-sub">
        {cap(amintiri(told))} din lada cu amintiri, povestite chiar de ei și lăsate de ei pentru carte.
        {heard ? " Lângă cele spuse cu glasul e un cod: scanează-l cu camera telefonului și le asculți." : ""}
        {options.living !== "tot" ? " Cele lăsate doar pentru familia apropiată nu intră în această ediție." : ""}
      </p>
      {voices.map((v) => {
        const lui = sexed(v.sex, "lui", "ei", "lui");
        return (
          <div key={v.id} className="bk-teller" data-anchor={`v-${v.id}`}>
            <h3><a href={`#p-${v.id}`}>{v.name}</a>{v.dates && <span className="bk-teller-dates"> {v.dates}</span>}</h3>
            {v.memories.map((m) => (
              <article key={m.id} className="bk-memory">
                <div className="bk-memory-head">
                  <div className="bk-memory-chapter">{chapterLabel(m.chapter)}</div>
                  {m.title && <h4>{m.title}</h4>}
                  {m.question && <p className="bk-q">„{m.question}”{m.askedBy && <span> · a întrebat {m.askedBy}</span>}</p>}
                  {(m.when || m.place) && <p className="bk-when">{[m.when, m.place].filter(Boolean).join(", ")}</p>}
                </div>
                {m.photoId && <img className="bk-memory-photo" src={`/api/document/${m.photoId}`} alt="" loading="lazy" />}
                {m.body ? <div className="bk-memory-body">{paragraphs(m.body)}</div> : <p className="bk-memory-body bk-muted">Povestea e spusă cu glasul.</p>}
                {m.qr && m.url && (
                  <div className="bk-listen">
                    <span className="bk-qr" dangerouslySetInnerHTML={{ __html: m.qr }} />
                    <span><b>Ascult-o cu glasul {lui}</b>{m.audioSeconds ? ` (${clock(m.audioSeconds)})` : ""}: scanează codul cu telefonul.
                      <br /><span className="bk-url">{m.url.replace(/^https?:\/\//, "")}</span></span>
                  </div>
                )}
                {m.recordedBy && <p className="bk-by">{m.audio ? "Înregistrată" : "Scrisă"} la bunici de {m.recordedBy}.</p>}
              </article>
            ))}
          </div>
        );
      })}
    </section>
  );
}

function Book({ model, options, text, title, subtitle, author, treeName, when, voices }: {
  model: BookModel; options: BookOptions; text: BookText; title: string; subtitle: string; author: string; treeName: string; when: string; voices: Voice[];
}) {
  const { stats, centerName, trunk } = model;
  const fanTitle = centerName ? `Strămoșii lui ${centerName}` : "Evantaiul strămoșilor";
  const urmasi = trunk ? `Urmașii lui ${trunk.name}` : "";
  const toc: { id: string; title: string; sub?: string }[] = [
    { id: "c-despre", title: "Despre această carte" },
    ...(text.preface ? [{ id: "c-cuvant", title: "Cuvânt înainte" }] : []),
    ...(model.fanGenerations >= 2 ? [{ id: "c-evantai", title: fanTitle }] : []),
    ...(model.tree ? [{ id: "c-copac", title: "Copacul neamului" }] : []),
    ...(model.outline.length >= 3 ? [{ id: "c-urmasi", title: urmasi }] : []),
    ...model.generations.map((g) => ({ id: g.id, title: g.title, sub: g.subtitle })),
    ...(voices.length ? [{ id: "c-vorbe", title: "Cu vorbele lor" }] : []),
    { id: "c-index", title: "Index de nume" },
  ];
  const told = new Map(voices.map((v) => [v.id, v.memories.length]));
  const memoriesCount = voices.reduce((n, v) => n + v.memories.length, 0);
  const privacy = options.living === "nume" ? "Cei în viață apar doar cu numele, fără date, locuri și poze, ca să poată fi dată cartea și altora."
    : options.living === "ascunsi" ? "Cei în viață nu apar în această ediție a cărții."
    : "Cei în viață apar cu toate datele: cartea e doar pentru familie.";
  return (
    <div className={`bk bk-${options.format}`}>
      <section className="bk-cover">
        <div className="bk-kicker">Cartea neamului</div>
        <h1 className="bk-title">{title}</h1>
        {subtitle && <p className="bk-subtitle">{subtitle}</p>}
        <Ornament />
        <div className="bk-cover-foot">Alcătuită de {author}<br />{when}</div>
      </section>

      <section className="bk-chapter bk-toc" data-anchor="c-cuprins">
        <h2>Cuprins</h2>
        <ol>
          {toc.map((t) => (
            <li key={t.id} className={t.sub !== undefined ? "sub" : undefined}>
              <a href={`#${t.id}`}>{t.title}{t.sub ? <span className="bk-muted"> · {t.sub}</span> : null}</a>
              <span className="bk-dots" /><Pg id={t.id} />
            </li>
          ))}
        </ol>
      </section>

      <section className="bk-chapter" data-anchor="c-despre">
        <h2>Despre această carte</h2>
        <p className="bk-chapter-sub">{treeName}</p>
        <p className="bk-lead">
          Cartea adună {oameni(stats.people)}{stats.generations > 1 ? `, pe ${stats.generations} generații` : ""}.
          {stats.oldest ? <> Cel mai vechi este <RefName r={stats.oldest} />{stats.oldest.dates ? `, ${stats.oldest.dates}` : ""}.</> : null}
          {stats.from && stats.to && stats.to > stats.from ? ` Primul s-a născut în ${stats.from}, cel mai tânăr în ${stats.to}.` : ""}
        </p>
        {stats.surnames.length > 0 && <><h3 className="bk-h">Numele de familie</h3><p>{stats.surnames.map(([s, n]) => `${s} (${n})`).join(", ")}.</p></>}
        {stats.places.length > 0 && <><h3 className="bk-h">Locurile unde s-au născut</h3><p>{stats.places.map(([s, n]) => `${s} (${n})`).join(", ")}.</p></>}
        <h3 className="bk-h">Cum se citește</h3>
        <p>Oamenii sunt așezați pe generații, de la cei mai vechi la cei mai tineri; în fiecare generație, fiecare om are alături soțul sau soția,
          iar frații vin în ordinea nașterii. Numărul de lângă un nume, de pildă (p. 14), arată pagina pe care e fișa acelui om.
          La final găsești indexul cu toate numele, și cu numele de fată.</p>
        {voices.length > 0 && <p>Înainte de index, în „Cu vorbele lor”, sunt {amintiri(memoriesCount)} povestite chiar de {voices.length === 1 ? voices[0].name : oameni(voices.length)} din neam,
          așa cum le-au scris sau le-au spus{voices.some((v) => v.memories.some((m) => m.qr)) ? "; pe cele spuse cu glasul le asculți scanând codul de lângă ele" : ""}.</p>}
        <p className="bk-note">{privacy}</p>
      </section>

      {text.preface && (
        <section className="bk-chapter bk-preface" data-anchor="c-cuvant">
          <h2>Cuvânt înainte</h2>
          <div style={{ marginTop: "6mm" }}>{paragraphs(text.preface)}</div>
          <p className="bk-sign">{author}</p>
        </section>
      )}

      {model.fanGenerations >= 2 && (
        <section className="bk-chapter" data-anchor="c-evantai">
          <h2>{fanTitle}</h2>
          <p className="bk-chapter-sub">{model.fanGenerations} generații: linia tatălui în stânga, a mamei în dreapta.</p>
          <figure className="bk-fig"><BookFan slots={model.fan} generations={model.fanGenerations} centerHidden={!centerName} /></figure>
          <div className="bk-legend">
            <span><i style={{ background: "#c9daef" }} />Linia tatălui</span>
            <span><i style={{ background: "#ecd8b4" }} />Linia mamei</span>
            <span><i style={{ border: "0.8pt dashed #a9b0b8" }} />Nu se știe încă</span>
          </div>
        </section>
      )}

      {model.tree && (
        <section className="bk-chapter" data-anchor="c-copac">
          <h2>Copacul neamului</h2>
          <p className="bk-chapter-sub">
            {urmasi}: {oameni(Object.keys(model.treePeople).length)}.{centerName ? ` Trunchiul duce până la ${centerName}.` : ""} În PDF, mărește desenul ca să citești toate numele.
          </p>
          <figure className="bk-fig" data-fit><BookTree root={model.tree} people={model.treePeople} path={model.path} /></figure>
        </section>
      )}

      {model.outline.length >= 3 && (
        <section className="bk-chapter" data-anchor="c-urmasi">
          <h2>{urmasi}</h2>
          <p className="bk-chapter-sub">Pe rând, cu numere: 1.2 e al doilea copil al primului, 1.2.1 primul lui copil; ⚭ înseamnă căsătorit cu.</p>
          <ol className="bk-outline">
            {model.outline.map((l) => (
              <li key={l.num} style={{ paddingLeft: `${Math.min(l.depth, 9) * 4}mm` }}>
                <span className="num">{l.num}</span>
                <span className="who">{l.person.id ? <a href={`#p-${l.person.id}`}>{l.person.name}</a> : l.person.name}</span>
                {l.person.dates && <span className="bk-muted"> {l.person.dates}</span>}
                {l.person.id && <> <Pg id={`p-${l.person.id}`} before="(p. " after=")" /></>}
                {l.from && <span className="from"> · {l.from}</span>}
                {l.spouses.map((s) => <span key={s.name} className="sp"> ⚭ <RefName r={s} /></span>)}
                {options.living === "ascunsi" && l.hidden > 0 && <span className="bk-muted"> · și {inLife(l.hidden, true)}</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {model.generations.map((g) => (
        <section key={g.id} className="bk-chapter" data-anchor={g.id}>
          <h2>{g.title}</h2>
          {g.subtitle && <p className="bk-chapter-sub">{g.subtitle} · {oameni(g.entries.length)}</p>}
          {g.entries.map((e) => <Person key={e.id} e={e} told={told.get(e.id)} />)}
        </section>
      ))}

      {voices.length > 0 && <Voices voices={voices} options={options} />}

      <section className="bk-chapter" data-anchor="c-index">
        <h2>Index de nume</h2>
        <ol className="bk-index">
          {model.index.map((l, i) => (
            <li key={`${l.id}-${i}`}><span className="name"><a href={`#p-${l.id}`}>{l.label}</a>{l.dates && <span className="bk-muted"> {l.dates}</span>}</span><Pg id={`p-${l.id}`} /></li>
          ))}
        </ol>
      </section>

      <section className="bk-colophon">
        <p><b>{title}</b></p>
        <p>Alcătuită de {author} pe Cartea Neamului, în {when}, din arborele „{treeName}”: {oameni(stats.people)}.</p>
        <p>{privacy}</p>
        <p>Cartea se poate reface oricând de pe site, cu tot ce a mai adăugat familia între timp.</p>
      </section>
    </div>
  );
}

/** Cartea neamului: coperta, cuprinsul, desenele și câte o fișă pentru fiecare om, gata de tipărit sau de salvat ca PDF. */
export default async function BookPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const q = await searchParams;
  if (!UUID.test(id)) notFound();
  const me = await requireUser(`/arbore/${id}/carte`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const options = bookOptions(q);
  const want = typeof q.p === "string" && UUID.test(q.p) ? q.p : undefined;
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const data = await loadTreeView(db, id, want ?? mine?.id, 6);
  if (!data) notFound();
  const [draft] = await db.select({ options: bookExport.options }).from(bookExport)
    .where(and(eq(bookExport.treeId, id), eq(bookExport.status, "draft"))).orderBy(desc(bookExport.createdAt)).limit(1);
  const text = cleanText((draft?.options as { text?: Partial<BookText> } | undefined)?.text);
  const model = buildBook({ people: data.people, rels: data.rels, raised: data.raised, centerId: data.centerId, slots: data.slots, options });
  const { stats } = model;
  // „Cu vorbele lor”: amintirile bifate pentru carte pe care cel care face cartea le vede și pe site, pe oameni (în ordinea fișelor) și pe capitole.
  const memories = await bookMemories(db, id, { userId: me.id, personId: mine?.id ?? null }, options.living, options.photos);
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
  const defaults = {
    title: data.tree.name,
    subtitle: `${cap(oameni(stats.people))}${stats.generations > 1 ? `, ${stats.generations} generații` : ""}${stats.from && stats.to && stats.to > stats.from ? ` · ${stats.from}–${stats.to}` : ""}`,
    author: me.name,
  };
  const title = text.title || defaults.title, subtitle = text.subtitle || defaults.subtitle, author = text.author || defaults.author;
  const when = new Intl.DateTimeFormat("ro-RO", { month: "long", year: "numeric", timeZone: "Europe/Bucharest" }).format(new Date());
  const choices = Object.values(data.people).filter((p) => !p.discreet && !isPlaceholder(p.givenName))
    .sort((a, b) => a.name.localeCompare(b.name, "ro"))
    .map((p) => ({ id: p.id, label: `${p.name}${p.birthYear ? ` (${p.birthYear})` : ""}` }));
  const renderKey = hash(JSON.stringify({ options, text, title, subtitle, author, model, memories, origin }));
  return (
    <section className="stack book-root">
      <div className="card book-chrome">
        <div className="toolbar" style={{ marginBottom: 4 }}>
          <div className="title">Cartea neamului</div>
          <Link className="btn" href={`/arbore/${id}${data.centerId ? `?p=${data.centerId}` : ""}`}>Înapoi la arbore</Link>
        </div>
        <p className="muted" style={{ margin: "0 0 10px" }}>
          Coperta, cuprinsul, strămoșii în evantai, copacul neamului și câte o fișă pentru fiecare om, cu poze și povești. Se face din ce e acum în arbore:
          când familia mai adaugă ceva, deschide pagina din nou și cartea are și noutățile.
        </p>
        <BookOptionsForm treeId={id} center={data.centerId} options={options} people={choices} />
      </div>
      {can(role, "editor") && <BookTextForm treeId={id} text={text} defaults={defaults} />}
      {stats.people === 0 ? (
        <div className="card"><p style={{ margin: 0 }}>Nu e încă nimeni de pus în carte. Adaugă oameni în arbore, apoi revino aici.</p></div>
      ) : (
        <BookView format={options.format} renderKey={renderKey} fileName={title}>
          <Book model={model} options={options} text={text} title={title} subtitle={subtitle} author={author} treeName={data.tree.name} when={when} voices={voices} />
        </BookView>
      )}
    </section>
  );
}
