import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tree, user } from "@/db/schema";
import { requireAdmin } from "@/lib/admin-access";
import { peopleList } from "@/lib/admin-people";
import { ACTION_LABELS, PAGE, changeLog, changeStats, fieldLines, isAction, undoKind } from "@/lib/admin-istoric";
import { TREE_MODES, USER_MODES, editLimits } from "@/lib/edit-limits";
import { AdminNav, Stat, day, num } from "@/components/admin/ui";
import { LiftLimit, TreeLimitForm, UndoButton, UserLimitForm } from "@/components/admin/IstoricForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Istoric și limite · Admin" };

const UUID = /^[0-9a-f-]{36}$/i;
const clip = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const PILL: Record<string, string> = { stergere: "pill bad", unire: "pill warn", anulare: "pill ok", legaturi: "pill warn" };

/**
 * Istoric și limite: fiecare schimbare din arbori (cine, ce, când), cu anulare pentru ștergeri, corecturi și adăugări greșite,
 * plus limitele de editare puse unui om sau unui arbore. Arată fișele (nume, date, locuri), niciodată amintirile sau mesajele.
 */
export default async function AdminIstoric({ searchParams }: { searchParams: Promise<{ arbore?: string; om?: string; fel?: string; inainte?: string }> }) {
  await requireAdmin("/admin/istoric");
  const sp = await searchParams;
  const f = { treeId: UUID.test(sp.arbore ?? "") ? sp.arbore : undefined, actorId: sp.om || undefined, action: isAction(sp.fel) ? sp.fel : undefined, before: sp.inainte };
  const [rows, stats, limits, people, trees] = await Promise.all([
    changeLog(db, f), changeStats(db), editLimits(db), peopleList(db),
    db.select({ id: tree.id, name: tree.name, owner: user.name }).from(tree).leftJoin(user, eq(user.id, tree.ownerId)).orderBy(asc(tree.name)),
  ]);
  const personOpts = people.map((p) => ({ id: p.id, label: `${p.name} · ${p.email}` }));
  const treeOpts = trees.map((t) => ({ id: t.id, label: `${t.name}${t.owner ? ` (${t.owner})` : ""}` }));
  const nameOf = (id: string) => people.find((p) => p.id === id)?.name ?? "cont șters";
  const treeOf = (id: string) => trees.find((t) => t.id === id)?.name ?? "arbore șters";
  const limitedUsers = Object.entries(limits.users), limitedTrees = Object.entries(limits.trees);
  const qs = (extra: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ arbore: f.treeId, om: f.actorId, fel: f.action, ...extra })) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `/admin/istoric?${s}` : "/admin/istoric";
  };
  const preset = f.actorId && limits.users[f.actorId] ? { userId: f.actorId, mode: limits.users[f.actorId].mode, note: limits.users[f.actorId].note } : f.actorId ? { userId: f.actorId, mode: "fara-stergeri", note: null } : undefined;

  return (
    <section className="stack">
      <AdminNav active="istoric" />

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Istoric și limite</h2>
        <p style={{ marginTop: 0, maxWidth: "78ch" }}>
          Fiecare schimbare din arbori, cu omul și ora: cine a adăugat, a corectat, a șters sau a schimbat legăturile cuiva. O ștergere greșită o
          <b> pui înapoi</b>, o corectură greșită o <b>anulezi</b>, iar cine strică datele poate fi <b>limitat</b> mai jos. Amintirile și mesajele nu apar aici.
        </p>
        <div className="stats">
          <Stat label="Schimbări în 7 zile" value={num(stats.total)} />
          <Stat label="Adăugări" value={num(stats.added)} />
          <Stat label="Corecturi" value={num(stats.edited)} />
          <Stat label="Ștergeri" value={num(stats.deleted)} tone={stats.deleted ? "warn" : undefined} />
          <Stat label="Limitați" value={num(limitedUsers.length + limitedTrees.length)} hint={`${limitedUsers.length} oameni · ${limitedTrees.length} arbori`} />
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Schimbările</h3>
        <form method="get" className="form" style={{ marginBottom: 10 }}>
          <div className="row">
            <label>Arborele
              <select name="arbore" defaultValue={f.treeId ?? ""}><option value="">Toți</option>{treeOpts.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            </label>
            <label>Cine
              <select name="om" defaultValue={f.actorId ?? ""}><option value="">Toți</option>{personOpts.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}</select>
            </label>
            <label>Ce
              <select name="fel" defaultValue={f.action ?? ""}><option value="">Orice</option>{Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
          </div>
          <div className="actions" style={{ marginTop: 0 }}><button className="btn">Arată</button>{(f.treeId || f.actorId || f.action || f.before) && <Link className="btn" href="/admin/istoric">Toate</Link>}</div>
        </form>
        {!rows.length ? <p className="muted">Nicio schimbare{f.treeId || f.actorId || f.action ? " pentru ce ai ales" : " încă"}. Istoricul pornește de la această versiune a site-ului.</p> : (
          <div className="tbl-wrap">
            <table className="tbl stacked">
              <thead><tr><th>Când</th><th>Cine</th><th>Ce</th><th>Pe cine</th><th>Amănunte</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => {
                  const lines = fieldLines(r.diff);
                  const undo = undoKind(r);
                  return (
                    <tr key={r.id}>
                      <td>{day(r.at, true)}</td>
                      <td>{r.actorId ? <><Link href={qs({ om: r.actorId, inainte: undefined })}>{r.actorName ?? "?"}</Link><small>{r.actorEmail}</small></> : <span className="muted">cont șters</span>}</td>
                      <td><span className={PILL[r.action] ?? "pill ok"}>{ACTION_LABELS[r.action]}</span></td>
                      <td>
                        {r.personExists && r.treeId ? <Link href={`/arbore/${r.treeId}/persoana/${r.personId}`}>{r.diff.name}</Link> : <b>{r.diff.name}</b>}
                        <small>{r.treeId ? <Link href={qs({ arbore: r.treeId, inainte: undefined })}>{r.treeName ?? "arbore șters"}</Link> : "—"}</small>
                      </td>
                      <td>
                        {r.diff.summary && <div>{r.diff.summary}</div>}
                        {lines.map((l) => <div key={l.label}><small style={{ display: "inline" }}>{l.label}:</small> <s className="muted">{clip(l.before, 80)}</s> → {clip(l.after, 80)}</div>)}
                        {r.diff.undone && <small className="muted">anulată pe {day(r.diff.undone.at, true)}</small>}
                      </td>
                      <td>{undo ? <UndoButton logId={r.id} kind={undo} /> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows.length === PAGE && <p><Link className="btn" href={qs({ inainte: rows[rows.length - 1].at })}>Mai vechi ▸</Link></p>}
      </div>

      <div className="card" id="limite">
        <h3 style={{ marginTop: 0 }}>Limite de editare</h3>
        <p className="muted" style={{ marginTop: 0, maxWidth: "78ch" }}>
          Fără limite, fiecare membru își completează și corectează familia apropiată din profilul lui. Pune o limită unui om care greșește des sau
          șterge din greșeală, ori unui arbore întreg, cât timp lămurești lucrurile cu familia. Omul vede un mesaj scurt când încearcă o schimbare oprită.
        </p>
        {(limitedUsers.length > 0 || limitedTrees.length > 0) && (
          <div className="tbl-wrap" style={{ marginBottom: 14 }}>
            <table className="tbl stacked">
              <thead><tr><th>Cine / ce</th><th>Limita</th><th>De când</th><th>Notă</th><th></th></tr></thead>
              <tbody>
                {limitedUsers.map(([id, l]) => (
                  <tr key={`u${id}`}>
                    <td><Link href={`/admin/oameni/${id}`}>{nameOf(id)}</Link><small>om</small></td>
                    <td>{USER_MODES[l.mode]}</td><td>{day(l.at)}</td><td>{l.note ?? "—"}</td><td><LiftLimit kind="user" id={id} /></td>
                  </tr>
                ))}
                {limitedTrees.map(([id, l]) => (
                  <tr key={`t${id}`}>
                    <td>{treeOf(id)}<small>arbore</small></td>
                    <td>{TREE_MODES[l.mode]}</td><td>{day(l.at)}</td><td>{l.note ?? "—"}</td><td><LiftLimit kind="tree" id={id} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-zones">
          <div>
            <h4 style={{ margin: "0 0 6px" }}>Limitează un om</h4>
            <UserLimitForm key={preset?.userId ?? "nou"} people={personOpts} modes={USER_MODES} preset={preset} />
          </div>
          <div>
            <h4 style={{ margin: "0 0 6px" }}>Limitează un arbore</h4>
            <TreeLimitForm key={f.treeId ?? "nou"} trees={treeOpts} modes={TREE_MODES} preset={f.treeId ? { treeId: f.treeId } : undefined} />
          </div>
        </div>
      </div>
    </section>
  );
}
