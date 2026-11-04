import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { businessStats, infraStats } from "@/lib/admin-stats";
import { ENV_KEYS, NEON_FREE_BYTES, envSet } from "@/lib/admin";
import { AdminNav, Stat, Status, bytes, eur, num } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin · Cartea Neamului" };

/** Panoul de admin: două zone separate, Business și Infra & Dev, cu cifrele cele mai importante din fiecare. */
export default async function AdminHome() {
  await requireAdmin("/admin");
  const [b, i] = await Promise.all([businessStats(db), infraStats(db)]);
  const missing = ENV_KEYS.filter((k) => k.needed && !envSet(k.key));
  const migOk = i.migrations.applied >= i.migrations.expected;
  return (
    <section className="stack">
      <AdminNav active="home" />
      <div className="admin-zones">
        <Link href="/admin/business" className="zone-link">
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Business</h2>
            <p className="muted" style={{ marginTop: 0 }}>Oameni, arbori, activitate și venituri.</p>
            <div className="stats">
              <Stat label="Conturi" value={num(b.users.total)} hint={`+${b.users.new7} în 7 zile`} />
              <Stat label="Activi în 7 zile" value={num(b.users.active7)} />
              <Stat label="Arbori" value={num(b.trees.total)} hint={`${b.trees.shared} cu mai mulți membri`} />
              <Stat label="Persoane trecute" value={num(b.content.persons)} hint={`+${b.content.persons7} în 7 zile`} />
              <Stat label="Peste limita gratuită" value={num(b.trees.overLimit)} hint={`≈ ${eur(b.revenue.potentialEurYear)}/an`} />
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
