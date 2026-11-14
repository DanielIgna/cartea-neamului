import Link from "next/link";

type Summary = { docs: number; review: number; functions: number; live: number; green: number; yellow: number; red: number; broken: number; files: number; routes: number; commit: string | null; dbOk: boolean };

/**
 * Antetul comun al Centrului de cunoștințe: titlul, „doar fondatori”, cifrele de azi, căutarea în documente și filele
 * Documente / De revizuit / Harta funcțiilor / Harta dependențelor.
 */
export default function CunostinteHead({ s, active, counts, q }: { s: Summary; active: "documente" | "revizuire" | "functii" | "dependente"; counts: Record<string, number>; q?: string }) {
  const tabs = [
    { k: "documente", href: "/admin/cunostinte", label: "Documente" },
    { k: "revizuire", href: "/admin/cunostinte?v=revizuire", label: `De revizuit${s.review ? ` · ${s.review}` : ""}` },
    { k: "functii", href: "/admin/cunostinte/functii", label: "Harta funcțiilor" },
    { k: "dependente", href: "/admin/cunostinte/dependente", label: "Harta dependențelor" },
  ];
  return (
    <header className="kc-head">
      <div className="kc-title">
        <h1>Centru de cunoștințe</h1>
        <span className="kc-founder">DOAR FONDATORI</span>
      </div>
      <p className="kc-counts">
        {s.docs} documente · <b className="t-ok">{counts.activ ?? 0} active</b> · <b className="t-info">{counts.revizuire ?? 0} de revizuit</b> · <b className="t-warn">{counts.ciorna ?? 0} ciorne</b> · {counts.arhivat ?? 0} arhivate
        <span className="muted"> · doar documentele active guvernează.</span>
      </p>
      <p className="kc-counts muted">
        {s.functions} funcții ({s.live} în lucru): <b className="t-ok">{s.green} verzi</b>, <b className="t-warn">{s.yellow} galbene</b>, <b className="t-bad">{s.red} roșii</b>
        {s.broken ? <> · <b className="t-bad">{s.broken} cu legături rupte</b></> : " · nicio legătură ruptă"}
        {" "}· verificat față de {s.files} fișiere și {s.routes} adrese{ s.commit ? ` (publicarea ${s.commit})` : ""}{s.dbOk ? " și baza de date" : " · baza de date n-a răspuns"}.
      </p>
      <form className="kc-searchrow" action="/admin/cunostinte" role="search">
        <input name="q" type="search" defaultValue={q} placeholder="Caută în documente…" aria-label="Caută în documente" />
        <button className="btn primary" type="submit">Caută</button>
        <Link className="btn" href={active === "functii" ? "/admin/cunostinte/functii" : active === "dependente" ? "/admin/cunostinte/dependente" : "/admin/cunostinte"} title="Verifică din nou">↻ Reîmprospătează</Link>
      </form>
      <p className="kc-examples muted">
        Exemple: <Link href="/admin/cunostinte?q=stare:activ">stare:activ</Link> <Link href="/admin/cunostinte?q=tip:regula">tip:regula</Link>{" "}
        <Link href="/admin/cunostinte?q=categorie:bani">categorie:bani</Link> <Link href="/admin/cunostinte?q=avocat">avocat</Link>
      </p>
      <nav className="kc-tabs" aria-label="Centrul de cunoștințe">
        {tabs.map((t) => <Link key={t.k} href={t.href} className={active === t.k ? "on" : ""} aria-current={active === t.k ? "page" : undefined}>{t.label}</Link>)}
      </nav>
    </header>
  );
}
