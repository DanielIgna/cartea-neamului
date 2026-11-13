import Link from "next/link";
import { pageHref } from "@/lib/continut/paginare";

/** Paginile unei liste lungi: 1 2 3… cu legături simple (?pagina=N), pe care le urmează și Google. */
export default function Pager({ base, page, pages }: { base: string; page: number; pages: number }) {
  if (pages <= 1) return null;
  return (
    <nav className="chips pager" aria-label="Paginile listei">
      {page > 1 && <Link className="chip" href={pageHref(base, page - 1)} rel="prev">‹ Înapoi</Link>}
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <Link key={n} className={`chip${n === page ? " on" : ""}`} href={pageHref(base, n)} aria-current={n === page ? "page" : undefined}>{n}</Link>
      ))}
      {page < pages && <Link className="chip" href={pageHref(base, page + 1)} rel="next">Înainte ›</Link>}
    </nav>
  );
}
