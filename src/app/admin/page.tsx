import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { businessStats, infraStats } from "@/lib/admin-stats";
import { funnelOf, peopleList } from "@/lib/admin-people";
import { ENV_KEYS, NEON_FREE_BYTES, envSet } from "@/lib/admin";
import { baseWordInfo } from "@/lib/texte";
import { changeStats } from "@/lib/admin-istoric";
import { editLimits } from "@/lib/edit-limits";
import { AdminNav, Stat, Status, bytes, day, eur, num } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Cartea Neamului" };

/** Panoul de admin: Oamenii, Business, Manager control, Texte și Infra & Dev, cu cifrele cele mai importante din fiecare. */
export default async function AdminHome() {
  await requireAdmin("/admin");
  const [b, i, people, word, changes, limits] = await Promise.all([businessStats(db), infraStats(db), peopleList(db), baseWordInfo(db), changeStats(db), editLimits(db)]);
  const funnel = funnelOf(people);
  const step = (k: number) => funnel[k]?.count ?? 0;
  const missing = ENV_KEYS.filter((k) => k.needed && !envSet(k.key));
  const migOk = i.migrations.applied >= i.migrations.expected;
  return (
    <section className="stack">
      <AdminNav active="home" />
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
        <Link href="/admin/control" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Manager control</h2>
            <p className="muted" style={{ marginTop: 0 }}>Cine e gratuit mereu, cine ar plăti, limitele planului gratuit. Nu se vede în site.</p>
            <div className="stats">
              <Stat label="Gratuit mereu" value={num(b.plans.counts.mereu)} />
              <Stat label="Marcați „Familie”" value={num(b.revenue.subscriptionsActive)} hint="plățile nu sunt pornite" />
              <Stat label="Peste limite" value={num(b.trees.overLimit)} hint={`${b.plans.counts.overFree} cu planul gratuit`} />
              <Stat label="Venit posibil pe an" value={eur(b.revenue.potentialEurYear)} />
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
