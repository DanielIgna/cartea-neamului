import Link from "next/link";
import { cereDe } from "@/lib/ro-words";
import type { LimitState, Plan } from "@/lib/plans";
import { STAGES, type Stage } from "@/lib/admin-people";

export const num = (v: number) => v.toLocaleString("ro-RO");
/** „5 persoane”, dar „1.200 de persoane”, cu cifrele despărțite ca în română. */
export const count = (v: number, noun: string) => `${num(v)}${cereDe(v) ? " de" : ""} ${noun}`;
export const lei = (v: number) => `${v.toLocaleString("ro-RO", { maximumFractionDigits: 2 })} lei`;
export const eur = (v: number) => `${v.toLocaleString("ro-RO")} €`;
export function bytes(b: number) {
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  while (b >= 1024 && i < u.length - 1) { b /= 1024; i++; }
  return `${b.toLocaleString("ro-RO", { maximumFractionDigits: i ? 1 : 0 })} ${u[i]}`;
}
export function day(isoDate: string | null | undefined, withTime = false) {
  if (!isoDate) return "—";
  const d = new Date(isoDate);
  const p = (x: number) => String(x).padStart(2, "0");
  const s = `${p(d.getUTCDate())}.${p(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
  return withTime ? `${s} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}` : s;
}
export function ago(isoDate: string | null | undefined) {
  if (!isoDate) return "niciodată";
  const min = Math.round((Date.now() - new Date(isoDate).getTime()) / 60_000);
  if (min < 60) return min <= 1 ? "acum" : `acum ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `acum ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? "ieri" : `acum ${d} zile`;
}

export function AdminNav({ active }: { active: "home" | "oameni" | "business" | "control" | "texte" | "infra" }) {
  const tab = (key: typeof active, href: string, label: string) => (
    <Link href={href} className="btn" aria-current={active === key ? "page" : undefined}>{label}</Link>
  );
  return (
    <nav className="admin-nav" aria-label="Panoul de admin">
      <span className="admin-tag">Admin</span>
      {tab("home", "/admin", "Prezentare")}
      {tab("oameni", "/admin/oameni", "Oamenii")}
      {tab("business", "/admin/business", "Business")}
      {tab("control", "/admin/control", "Manager control")}
      {tab("texte", "/admin/texte", "Texte")}
      {tab("infra", "/admin/infra", "Infra & Dev")}
    </nav>
  );
}

/** Planul unui cont sau al proprietarului unui arbore, cu locul arborelui față de limitele gratuite. */
export function PlanPill({ plan, limit }: { plan: Plan; limit?: LimitState }) {
  if (plan === "mereu") return <span className="pill ok">gratuit mereu</span>;
  if (plan === "familie") return <span className="pill ok">Familie</span>;
  if (limit === "peste") return <span className="pill warn">peste limită</span>;
  if (limit === "aproape") return <span className="pill warn">aproape de limită</span>;
  return <span className="muted">gratuit</span>;
}

/** Bare orizontale cu eticheta în stânga și „număr · procent” în dreapta (drumul oamenilor, ce folosesc, timpul pe părți). */
export function HBars({ data, total, label, format = num }: { data: { label: string; count: number }[]; total: number; label: string; format?: (v: number) => string }) {
  return (
    <ul className="hbars" aria-label={label}>
      {data.map((d) => {
        const pct = total ? Math.round((100 * d.count) / total) : 0;
        return (
          <li key={d.label}>
            <span className="hbars-label">{d.label}</span>
            <span className="hbars-track" aria-hidden="true"><span className="hbars-fill" style={{ width: `${d.count ? Math.max(pct, 1.5) : 0}%` }} /></span>
            <span className="hbars-value">{format(d.count)} <small>· {pct}%</small></span>
          </li>
        );
      })}
    </ul>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div className={`stat${tone ? ` ${tone}` : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint != null && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

export function Status({ ok, warn, children }: { ok: boolean; warn?: boolean; children: React.ReactNode }) {
  return <span className={`pill ${ok ? "ok" : warn ? "warn" : "bad"}`}>{children}</span>;
}

/** Bare verticale simple, cu valoarea deasupra fiecărei bare. */
export function Bars({ data, label, format = String }: { data: { key: string; label: string; value: number }[]; label: string; format?: (v: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 640, H = 170, pad = 22, bw = (W - pad) / data.length;
  return (
    <svg viewBox={`-16 0 ${W + 32} ${H + 26}`} role="img" aria-label={label} style={{ width: "100%", maxWidth: 720, height: "auto", display: "block" }}>
      <line x1={0} x2={W} y1={H} y2={H} stroke="var(--line)" />
      {data.map((d, i) => {
        const h = Math.max(d.value ? 3 : 0, ((H - pad) * d.value) / max);
        const x = i * bw + bw * 0.18, w = bw * 0.64;
        return (
          <g key={d.key}>
            <title>{`${d.label}: ${format(d.value)}`}</title>
            <rect x={x} y={H - h} width={w} height={h} rx={3} fill="var(--accent)" />
            {d.value > 0 && <text x={x + w / 2} y={H - h - 5} textAnchor="middle" fontSize={12} fill="var(--ink)">{format(d.value)}</text>}
            {(i % 2 === data.length % 2 || data.length <= 8) && <text x={x + w / 2} y={H + 17} textAnchor="middle" fontSize={11} fill="var(--muted)">{d.label}</text>}
          </g>
        );
      })}
    </svg>
  );
}

/** Bară orizontală de folosire față de o limită (ex. 0,5 GB pe Neon gratuit). */
export function Meter({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = Math.min(100, (100 * used) / limit);
  const tone = pct > 85 ? "bad" : pct > 60 ? "warn" : "ok";
  return (
    <div className="meter" aria-label={label}>
      <div className={`meter-fill ${tone}`} style={{ width: `${Math.max(pct, 0.6)}%` }} />
    </div>
  );
}

/** Unde a ajuns un om cu arborele lui: ce n-a pornit încă e ocru, ce a adus familia sau amintirile e verde. */
export function StagePill({ stage }: { stage: Stage }) {
  const tone = stage === "cont" || stage === "arbore" ? "warn" : stage === "familie" || stage === "amintiri" ? "ok" : "";
  return tone ? <span className={`pill ${tone}`}>{STAGES[stage]}</span> : <span className="chip">{STAGES[stage]}</span>;
}
