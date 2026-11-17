import type { Metadata } from "next";
import Link from "next/link";
import { searchSite } from "@/lib/continut/cautare";
import { canonicalUrl } from "@/lib/page-metadata";

/** Rezultatele căutării nu intră în Google (noindex), dar legăturile din ele se urmează. Adresa canonică e /cauta, fără ?q=. */
export const metadata: Metadata = {
  title: "Caută în Cartea Neamului: nume, localități, ghiduri",
  description: "Caută un nume de familie, o comună, un oraș sau un județ, un ghid ori un termen din glosar: unde găsești actele și arhivele familiei tale.",
  alternates: { canonical: canonicalUrl("/cauta") },
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw ?? "").slice(0, 80);
  const hits = searchSite(q);
  return (
    <section className="stack" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Caută</h1>
        <form action="/cauta" method="get" role="search" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input name="q" defaultValue={q} placeholder="un nume de familie, o comună, un județ, un ghid…" aria-label="Ce cauți" style={{ flex: "1 1 260px" }} autoFocus={!q} />
          <button className="btn primary">Caută</button>
        </form>
        {q.trim().length >= 2 && (
          hits.length === 0
            ? <p className="muted" style={{ marginBottom: 0 }}>N-am găsit nimic pentru „{q}”. Încearcă fără diacritice sau doar începutul numelui; poți căuta și în <Link href="/nume">numele de familie</Link> sau în <Link href="/localitati">localități</Link>.</p>
            : <ul className="search-hits">{hits.map((h) => <li key={h.href}><Link href={h.href}>{h.title}</Link> <small className="muted">{h.kind}</small></li>)}</ul>
        )}
      </div>
    </section>
  );
}
