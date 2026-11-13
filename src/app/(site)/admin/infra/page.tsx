import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { infraStats } from "@/lib/admin-stats";
import { ENV_KEYS, NEON_FREE_BYTES, envSet } from "@/lib/admin";
import { googleEnabled } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { realtimeConfigured } from "@/lib/realtime";
import { bucketReachable, localStorageMode, storageConfigured } from "@/lib/storage";
import { AdminNav, Meter, Stat, Status, bytes, day, num } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Infra & Dev · Admin" };

async function timed(fn: () => Promise<unknown>) {
  const t = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - t, detail: "" };
  } catch (e) {
    return { ok: false, ms: Date.now() - t, detail: e instanceof Error ? e.message : String(e) };
  }
}

const LINKS = [
  { href: "https://vercel.com/prop-manage/cartea-neamului", label: "Vercel: publicări și jurnal" },
  { href: "https://vercel.com/prop-manage/cartea-neamului/logs", label: "Vercel: jurnalul de erori" },
  { href: "https://console.neon.tech/app/projects/noisy-sound-55943781", label: "Neon: baza de date" },
  { href: "https://github.com/DanielIgna/cartea-neamului/pulls", label: "GitHub: cereri de modificare" },
];

/** Zona Infra & Dev: sănătatea serviciilor, baza de date, erorile prinse pe server și ce versiune rulează. Doar citiri. */
export default async function AdminInfra() {
  await requireAdmin("/admin/infra");
  const fnUrl = process.env.NEON_FUNCTION_HELLO_BASE_URL;
  const [i, storage, fn] = await Promise.all([
    infraStats(db),
    storageConfigured() ? (localStorageMode() ? Promise.resolve({ ok: true, ms: 0, detail: "fișiere locale (.data/files)" }) : timed(bucketReachable)) : null,
    fnUrl ? timed(() => fetch(fnUrl, { signal: AbortSignal.timeout(8_000) }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); })) : null,
  ]);
  const services = [
    { name: "Postgres (Neon)", ok: true, detail: `${process.env.DATABASE_URL ? "Neon" : "PGlite local"} · ${i.db.pingMs} ms`, optional: false },
    { name: "Stocare poze și documente", ok: !!storage?.ok, detail: storage ? (storage.ok ? storage.detail || `bucket assets · ${storage.ms} ms` : storage.detail) : "cheile NEON_STORAGE_* lipsesc: pozele nu se pot încărca", optional: false },
    { name: "Arbore în timp real", ok: realtimeConfigured(), detail: realtimeConfigured() ? "configurat" : "neconfigurat (arborele se reîncarcă la cerere)", optional: true },
    { name: "Intrare cu Google", ok: googleEnabled(), detail: googleEnabled() ? "pornită" : "GOOGLE_CLIENT_ID / SECRET lipsesc", optional: true },
    { name: "Funcția Neon „hello”", ok: !!fn?.ok, detail: fn ? (fn.ok ? `${fn.ms} ms` : fn.detail) : "neconfigurată", optional: true },
    { name: "AI (sugestii de biografie)", ok: aiConfigured(), detail: aiConfigured() ? "configurat" : "nu e pe planul gratuit Neon", optional: true },
  ];
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const migOk = i.migrations.applied >= i.migrations.expected;
  return (
    <section className="stack">
      <AdminNav active="infra" />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Servicii</h2>
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              {services.map((s) => (
                <tr key={s.name}>
                  <td style={{ width: 1 }}><Status ok={s.ok} warn={s.optional}>{s.ok ? "merge" : s.optional ? "oprit" : "problemă"}</Status></td>
                  <td>{s.name}<small>{s.detail}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Erori pe server</h2>
        <div className="stats">
          <Stat label="În ultimele 24 h" value={num(i.errors.d1)} tone={i.errors.d1 ? "bad" : "ok"} />
          <Stat label="În ultimele 7 zile" value={num(i.errors.d7)} />
        </div>
        {i.errors.recent.length === 0
          ? <p className="muted" style={{ marginBottom: 0 }}>Nicio eroare prinsă. Erorile de pe server se scriu aici de la această versiune încolo; cele mai vechi sunt doar în jurnalul Vercel.</p>
          : (
            <div className="tbl-wrap" style={{ marginTop: 12 }}>
              <table className="tbl">
                <thead><tr><th>Când (UTC)</th><th>Unde</th><th>Eroarea</th></tr></thead>
                <tbody>
                  {i.errors.recent.map((e, k) => (
                    <tr key={k}>
                      <td style={{ whiteSpace: "nowrap" }}>{day(e.at, true)}</td>
                      <td>{e.method} {e.path}<small>{e.kind}{e.route ? ` · ${e.route}` : ""}</small></td>
                      <td><div className="err-msg">{e.message}</div>{e.digest && <small>cod {e.digest}</small>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Baza de date</h2>
        <div className="stats">
          <Stat label="Mărime" value={bytes(i.db.bytes)} hint={`din ${bytes(NEON_FREE_BYTES)} pe planul gratuit`} />
          <Stat label="Răspunde în" value={`${i.db.pingMs} ms`} />
          <Stat label="Migrații aplicate" value={`${i.migrations.applied}/${i.migrations.expected}`} hint={migOk ? `ultima: ${i.migrations.latestTag}` : "rulează publicarea din nou"} tone={migOk ? "ok" : "bad"} />
          <Stat label="Sesiuni deschise" value={num(i.sessions.live)} hint={`${num(i.sessions.expired)} expirate`} />
          <Stat label="Căutări după nume (24 h)" value={num(i.joinAttempts.d1)} hint={`${i.joinAttempts.miss1} fără rezultat`} tone={i.joinAttempts.miss1 > 50 ? "warn" : undefined} />
          <Stat label="Fișiere în bucket" value={num(i.storedFiles)} />
        </div>
        <div className="section-label">Spațiu folosit pe Neon gratuit</div>
        <Meter used={i.db.bytes} limit={NEON_FREE_BYTES} label="Spațiu folosit în baza de date" />
        <p className="muted" style={{ fontSize: 13 }}>{i.db.version}{i.missingTables.length ? ` · tabele lipsă: ${i.missingTables.join(", ")}` : ""}</p>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Tabel</th><th className="n">Rânduri</th><th className="n">Mărime</th></tr></thead>
            <tbody>
              {i.tables.map((t) => (
                <tr key={t.name}><td>{t.name}</td><td className="n">{num(t.rows)}</td><td className="n">{bytes(t.bytes)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Chei pe server</h2>
        <p className="muted" style={{ marginTop: 0 }}>Doar dacă sunt puse sau nu; valorile nu apar niciodată aici. Se pun în Vercel, la Settings → Environment Variables, apoi trebuie o publicare nouă.</p>
        <div className="tbl-wrap">
          <table className="tbl">
            <tbody>
              {ENV_KEYS.map((k) => {
                const set = envSet(k.key);
                return (
                  <tr key={k.key}>
                    <td style={{ width: 1 }}><Status ok={set} warn={!k.needed}>{set ? "pusă" : k.needed ? "lipsește" : "nu e pusă"}</Status></td>
                    <td><code>{k.key}</code><small>{k.what}{k.needed ? "" : " · opțional"}</small></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Ce versiune rulează</h2>
        <dl className="facts">
          <dt>Mediu</dt><dd>{process.env.VERCEL_ENV ?? "local (dezvoltare)"}{process.env.VERCEL_REGION ? ` · regiunea ${process.env.VERCEL_REGION}` : ""}</dd>
          <dt>Versiune</dt><dd>{sha ? <a href={`https://github.com/DanielIgna/cartea-neamului/commit/${sha}`}>{sha.slice(0, 7)}</a> : "—"}{process.env.VERCEL_GIT_COMMIT_REF ? ` pe ${process.env.VERCEL_GIT_COMMIT_REF}` : ""}</dd>
          <dt>Ultima schimbare</dt><dd>{process.env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0] ?? "—"}</dd>
          <dt>Adresa</dt><dd>{process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.BETTER_AUTH_URL ?? "localhost"}</dd>
          <dt>Node.js</dt><dd>{process.versions.node}</dd>
        </dl>
        <div className="actions">
          {LINKS.map((l) => <a key={l.href} className="btn" href={l.href} target="_blank" rel="noreferrer">{l.label}</a>)}
        </div>
      </div>
    </section>
  );
}
