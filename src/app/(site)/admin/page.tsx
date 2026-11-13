import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { domainEmail } from "@/lib/email-domeniu";
import { businessStats, infraStats } from "@/lib/admin-stats";
import { funnelOf, peopleList } from "@/lib/admin-people";
import { ENV_KEYS, NEON_FREE_BYTES, envSet } from "@/lib/admin";
import { baseWordInfo } from "@/lib/texte";
import { changeStats } from "@/lib/admin-istoric";
import { editLimits } from "@/lib/edit-limits";
import { newReportsCount } from "@/lib/probleme";
import { rangeOf, uniqueVisitors } from "@/lib/analiza";
import { AdminNav, Stat, Status, ago, bytes, day, eur, lei, num } from "@/components/admin/ui";
import { adminBriefing } from "@/lib/admin-briefing";
import { ownerOf } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Cartea Neamului" };

/** Panoul de admin: Oamenii, Business, Manager control, Texte și Infra & Dev, cu cifrele cele mai importante din fiecare. */
export default async function AdminHome() {
  const me = await requireAdmin("/admin");
  const [b, i, people, word, changes, limits, problems, br] = await Promise.all([businessStats(db), infraStats(db), peopleList(db), baseWordInfo(db), changeStats(db), editLimits(db),
    newReportsCount(db).catch(() => 0), adminBriefing(db)]);
  const visits = await uniqueVisitors(db, rangeOf("7z").cur).catch(() => ({ visitors: 0, views: 0 }));
  const funnel = funnelOf(people);
  const step = (k: number) => funnel[k]?.count ?? 0;
  const missing = ENV_KEYS.filter((k) => k.needed && !envSet(k.key));
  const migOk = i.migrations.applied >= i.migrations.expected;
  return (
    <section className="stack">
      <AdminNav active="home" heading={false} />
      <Briefing br={br} name={ownerOf(me.email)?.name ?? me.name?.split(" ")[0] ?? ""} problems={problems} />
      <h2 className="adm-section-h">Pe zone</h2>
      <div className="admin-zones">
        <Link href="/admin/oameni" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Oamenii</h2>
            <p className="muted" style={{ marginTop: 0 }}>Fiecare cont: cât și-a crescut arborele, ce folosește, până unde a ajuns.</p>
            <div className="stats">
              <Stat label="Conturi" value={num(step(0))} hint="fără contul de probă" />
              <Stat label="Au un arbore" value={num(step(1))} />
              <Stat label="Și-au chemat rudele" value={num(step(3))} hint={`${step(4)} au rude în arbore`} />
              <Stat label="Scriu amintiri" value={num(step(5))} />
              <Stat label="S-au întors" value={num(step(6))} hint="după prima zi" />
            </div>
          </div>
        </Link>
        <Link href="/admin/business" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Business</h2>
            <p className="muted" style={{ marginTop: 0 }}>Oameni, arbori, activitate și venituri.</p>
            <div className="stats">
              <Stat label="Conturi" value={num(b.users.total)} hint={`+${b.users.new7} în 7 zile`} />
              <Stat label="Activi în 7 zile" value={num(b.users.active7)} />
              <Stat label="Arbori" value={num(b.trees.total)} hint={`${b.trees.shared} cu mai mulți membri`} />
              <Stat label="Persoane trecute" value={num(b.content.persons)} hint={`+${b.content.persons7} în 7 zile`} />
            </div>
          </div>
        </Link>
        <Link href="/admin/analiza" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Analiză</h2>
            <p className="muted" style={{ marginTop: 0 }}>Vizite, surse, campanii și drumul de la vizită la cont, arbore și plată, numărate anonim.</p>
            <div className="stats">
              <Stat label="Vizitatori în 7 zile" value={num(visits.visitors)} />
              <Stat label="Pagini văzute" value={num(visits.views)} />
            </div>
          </div>
        </Link>
        <Link href="/admin/control" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Manager control</h2>
            <p className="muted" style={{ marginTop: 0 }}>Zilele gratuite, prețurile, pornirea plăților și cine e gratuit mereu sau a plătit.</p>
            <div className="stats">
              <Stat label="Gratuit mereu" value={num(b.plans.counts.mereu)} />
              <Stat label="Plătit" value={num(b.revenue.paying)} hint={b.plans.settings.on ? "plățile sunt pornite" : "plățile nu sunt pornite"} />
              <Stat label="Doar citire" value={num(b.plans.counts.expirat)} hint={b.plans.settings.on ? "zilele gratuite s-au terminat" : "dacă porneai azi"} />
              <Stat label="Venit posibil pe an" value={lei(b.revenue.potentialLeiYear)} />
            </div>
          </div>
        </Link>
        <Link href="/admin/istoric" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Istoric și limite</h2>
            <p className="muted" style={{ marginTop: 0 }}>Cine a schimbat ce în arbori și când. Ștergerile greșite se pun înapoi; cine strică datele poate fi limitat.</p>
            <div className="stats">
              <Stat label="Schimbări în 7 zile" value={num(changes.total)} />
              <Stat label="Ștergeri în 7 zile" value={num(changes.deleted)} />
              <Stat label="Limitați" value={num(Object.keys(limits.users).length + Object.keys(limits.trees).length)} />
            </div>
          </div>
        </Link>
        <Link href="/admin/texte" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Texte</h2>
            <p className="muted" style={{ marginTop: 0 }}>Cuvântul de la finalul Călătoriei în timp, pe care îl scrii tu pentru toți.</p>
            <div className="stats">
              <Stat label="Acum se vede" value={word.changed ? "textul tău" : "textul inițial"} hint={word.changed ? `schimbat pe ${day(word.updatedAt?.toISOString())}` : "cel scris la început"} />
            </div>
          </div>
        </Link>
        <Link href="/admin/email" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Email</h2>
            <p className="muted" style={{ marginTop: 0 }}>{domainEmail()}: căsuța în Gmail, trimise, mesajele din Contact și verificarea înregistrărilor.</p>
          </div>
        </Link>
        <Link href="/admin/infra" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Infra & Dev</h2>
            <p className="muted" style={{ marginTop: 0 }}>Baza de date, stocare, erori, chei și publicări.</p>
            <div className="stats">
              <Stat label="Baza de date" value={bytes(i.db.bytes)} hint={`din ${bytes(NEON_FREE_BYTES)} gratuit · ${i.db.pingMs} ms`} tone={i.db.bytes > NEON_FREE_BYTES * 0.85 ? "bad" : undefined} />
              <Stat label="Erori în 24 h" value={num(i.errors.d1)} hint={`${i.errors.d7} în 7 zile`} tone={i.errors.d1 ? "bad" : "ok"} />
              <Stat label="Migrații" value={`${i.migrations.applied}/${i.migrations.expected}`} hint={migOk ? "la zi" : "lipsesc migrații"} tone={migOk ? "ok" : "bad"} />
              <Stat label="Chei obligatorii" value={missing.length ? `${missing.length} lipsă` : "toate"} hint={missing.map((m) => m.key).join(", ") || "puse pe server"} tone={missing.length ? "warn" : "ok"} />
            </div>
            <p style={{ marginBottom: 0 }}>
              <Status ok={!!process.env.VERCEL_GIT_COMMIT_SHA} warn>{process.env.VERCEL_ENV ?? "local"}</Status>{" "}
              <span className="muted">{process.env.VERCEL_GIT_COMMIT_SHA ? `versiunea ${process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7)}` : "rulează pe calculatorul de dezvoltare"}</span>
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}

type Br = Awaited<ReturnType<typeof adminBriefing>>;
type Tone = "ok" | "warn" | "bad" | "calm";

/** O cutie din rezumat: ce verifică, cum stă, un rând de amănunt și unde mergi să rezolvi. */
function Brief({ tone, label, title, note, href, action }: { tone: Tone; label: string; title: React.ReactNode; note?: React.ReactNode; href: string; action: string }) {
  const mark = tone === "ok" ? "✓" : tone === "bad" ? "!" : tone === "warn" ? "!" : "·";
  return (
    <Link href={href} className={`brief ${tone}`}>
      <span className="brief-label"><span className="brief-mark" aria-hidden="true">{mark}</span>{label}</span>
      <span className="brief-title">{title}</span>
      {note != null && <span className="brief-note">{note}</span>}
      <span className="brief-go">{action} →</span>
    </Link>
  );
}

/** Ora din România, pentru salut. */
function greeting(now = new Date()) {
  const h = Number(new Intl.DateTimeFormat("ro-RO", { hour: "numeric", hour12: false, timeZone: "Europe/Bucharest" }).format(now));
  return h < 5 ? "Noapte bună" : h < 11 ? "Bună dimineața" : h < 18 ? "Bună ziua" : "Bună seara";
}

/** Rezumatul de sus (Daniel, 2026-11-13, după modelul din PropManage): ce merge, ce cere atenție, cu legătura spre pagina potrivită. */
function Briefing({ br, name, problems }: { br: Br; name: string; problems: number }) {
  const healthOk = br.checks.filter((c) => c.ok).length;
  const healthBad = br.checks.filter((c) => !c.ok);
  const sec = br.security;
  const urgent = [
    br.errors.d1 > 0 && `${br.errors.d1 === 1 ? "o eroare" : `${num(br.errors.d1)} erori`} pe server în 24 h`,
    problems > 0 && `${problems === 1 ? "o problemă raportată" : `${num(problems)} probleme raportate`} fără răspuns`,
    sec && sec.bad > 0 && `${sec.bad === 1 ? "o alertă" : `${sec.bad} alerte`} de securitate`,
  ].filter(Boolean) as string[];
  const payNote = br.pay7.count
    ? [br.pay7.lei ? lei(br.pay7.lei) : null, br.pay7.eur ? eur(br.pay7.eur) : null].filter(Boolean).join(" + ")
    : br.payments.lastAt ? `ultima ${ago(br.payments.lastAt)}` : "încă nicio plată";
  return (
    <div className="card briefing">
      <div className="briefing-head">
        <div>
          <h1>{greeting()}{name ? `, ${name}` : ""}</h1>
          <p className="muted">Pe scurt, cum stă site-ul acum.</p>
        </div>
        <span className="briefing-env"><Status ok={br.env.name === "production"} warn>{br.env.name}</Status>{br.env.sha ? <small className="muted"> versiunea {br.env.sha}</small> : null}</span>
      </div>
      {urgent.length > 0
        ? <div className="briefing-alert bad"><b>De văzut acum:</b> {urgent.join(" · ")}.</div>
        : <div className="briefing-alert ok"><b>Totul e liniștit.</b> Nicio eroare nouă, nicio problemă fără răspuns, nicio alertă.</div>}
      <div className="brief-grid">
        <Brief tone={healthBad.length ? "warn" : "ok"} label="Verificări" href="/admin/infra" action="Detalii"
          title={healthBad.length ? `${healthOk}/${br.checks.length} în regulă` : `Toate în regulă (${healthOk}/${br.checks.length})`}
          note={healthBad.length ? `De pus la punct: ${healthBad.map((c) => c.label).join(", ")}` : br.checks.slice(0, 2).map((c) => `${c.label}: ${c.note}`).join(" · ")} />
        <Brief tone={br.errors.d1 ? "bad" : br.errors.d7 ? "warn" : "ok"} label="Erori pe server" href="/admin/infra" action="Vezi erorile"
          title={br.errors.d1 ? `${num(br.errors.d1)} în ultimele 24 h` : "Niciuna în 24 h"}
          note={`${num(br.errors.d7)} în 7 zile${br.errors.last ? ` · ultima ${ago(br.errors.last)}` : ""}`} />
        <Brief tone={problems ? "warn" : "ok"} label="Probleme raportate" href="/admin/probleme" action="Răspunde"
          title={problems ? `${num(problems)} ${problems === 1 ? "nouă" : "noi"}` : "Niciuna nouă"} note="ce scriu oamenii din „Raportează o problemă”" />
        <Brief tone={!sec ? "warn" : sec.bad ? "bad" : sec.alerts.length ? "warn" : "ok"} label="Securitate" href="/admin/securitate" action="Verifică"
          title={!sec ? "Nu s-a putut citi" : sec.alerts.length ? `${sec.alerts.length} ${sec.alerts.length === 1 ? "alertă" : "alerte"}` : "Nimic ciudat în 24 h"}
          note={sec ? `${num(sec.day.parola_gresita ?? 0)} parole greșite · ${num(sec.day.intrare_blocata ?? 0)} intrări blocate (24 h)` : undefined} />
        <Brief tone={br.payments.salesOn ? "ok" : "calm"} label="Plăți" href="/admin/control" action="Manager control"
          title={br.pay7.count ? `${num(br.pay7.count)} în 7 zile` : "Niciuna în 7 zile"}
          note={`${payNote} · ${br.payments.salesOn ? "vânzările sunt pornite" : "vânzările sunt oprite"}`} />
        <Brief tone={br.seo.linked ? "ok" : "warn"} label="SEO" href="/admin/seo" action="Deschide SEO"
          title={br.seo.linked ? "Search Console legat" : "Search Console nelegat"}
          note={`${br.seo.verification ? "site verificat la Google" : "fără cod de verificare"} · ${num(br.seo.watch)} cuvinte urmărite`} />
        {(br.badges.propuneri > 0 || br.badges.adn > 0) && (
          <Brief tone="warn" label="Așteaptă răspuns" href={br.badges.propuneri ? "/admin/propuneri" : "/admin/adn"} action="Vezi"
            title={[br.badges.propuneri && `${num(br.badges.propuneri)} ${br.badges.propuneri === 1 ? "poză propusă" : "poze propuse"}`, br.badges.adn && `${num(br.badges.adn)} ${br.badges.adn === 1 ? "cerere ADN" : "cereri ADN"}`].filter(Boolean).join(" · ")}
            note="de la familii, prin site" />
        )}
      </div>
    </div>
  );
}
