import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { requireUser } from "@/lib/access";
import { INTERVIEW, KINSHIP_QUIZ, sheetOf } from "@/lib/scoala";
import SheetEditor from "@/components/scoala/SheetEditor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

/** Fișa completată pe ecran (doar cu cont); PDF-ul gol se descarcă fără cont de pe /scoala. */
export default async function SheetOnline({ params }: { params: Promise<{ slug: string }> }) {
  const s = sheetOf((await params).slug);
  if (!s) notFound();
  await requireUser(`/scoala/fisa/${s.slug}`);
  return (
    <section className="stack">
      <p className="no-print"><Link href="/scoala#fise">← Toate fișele</Link> · <a href={s.pdf} download>PDF gol</a></p>
      <div className="card"><SheetEditor slug={s.slug} title={s.title} questions={INTERVIEW} quiz={KINSHIP_QUIZ} /></div>
    </section>
  );
}
