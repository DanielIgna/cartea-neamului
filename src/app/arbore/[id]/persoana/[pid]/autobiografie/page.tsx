import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { loadTreeView } from "@/lib/tree-data";
import { can, requireUser, roleIn } from "@/lib/access";
import { buildGraph } from "@/lib/kinship";
import { isPlaceholder } from "@/lib/family";
import { questionContext } from "@/lib/lada";
import { loadLada } from "@/lib/lada-db";
import { bookPlan, verse } from "@/lib/autobiografie";
import { years } from "@/lib/person-text";
import { storageConfigured } from "@/lib/storage";
import AutoBook from "@/components/AutoBook";
import { hasConsent } from "@/lib/consent";
import PageIntl from "@/i18n/PageIntl";
import { getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Autobiografia de scris, pentru omul în viață care își are fișa în arbore. Ceilalți o citesc ca pe o carte (`/carte`),
 * iar pentru cel fără cont o rudă o poate scrie cu el în modul „la bunici”, cu întrebările cărții.
 */
export default async function AutobiographyPage({ params }: { params: Promise<{ id: string; pid: string }> }) {
  const { id, pid } = await params;
  if (!UUID.test(id) || !UUID.test(pid)) notFound();
  const me = await requireUser(`/arbore/${id}/persoana/${pid}/autobiografie`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const locale = await getLocale();
  const [t, tq] = await Promise.all([getT("Auto", locale), getT("Questions", locale)]);
  const data = await loadTreeView(db, id, undefined, 1, locale);
  const p = data?.people[pid];
  if (!data || !p) notFound();
  const back = `/arbore/${id}/persoana/${pid}`;
  const sex = p.sex === "F" ? "F" : "M";

  if (p.claimedBy !== me.id) {
    if (p.claimed || !p.living) redirect(`${back}/autobiografie/carte`);
    // În viață, fără cont: o scrie el, după ce intră, sau o rudă împreună cu el, în modul „la bunici”.
    return (
      <section className="card" style={{ maxWidth: 680, margin: "0 auto" }}>
        <div className="section-label" style={{ marginTop: 0 }}>{t("pageLabel")}</div>
        <p>{t("noAccount", { name: p.givenName, sex })}</p>
        {can(role, "contributor") && <p>{t("together", { name: p.givenName, sex })}</p>}
        <div className="actions">
          {can(role, "contributor") && <Link className="btn primary" href={`${back}/la-bunici?carte=1`}>{t("togetherButton")}</Link>}
          <Link className="btn" href={back}>{t("backTo", { sex })}</Link>
        </div>
      </section>
    );
  }
  if (!p.living) redirect(`${back}/autobiografie/carte`);

  const g = buildGraph(Object.values(data.people), data.rels);
  const ctx = questionContext(g, data.people, pid);
  const [mine] = await db.select({ id: person.id }).from(person).where(and(eq(person.treeId, id), eq(person.claimedByUserId, me.id))).limit(1);
  const lada = await loadLada(db, id, pid, { userId: me.id, personId: mine?.id ?? null }, g, data.tree.chatMaxDegree);
  const plan = ctx ? bookPlan(ctx, tq, locale) : [];
  const people = Object.values(data.people).filter((x) => !isPlaceholder(x.givenName))
    .map((x) => ({ id: x.id, name: x.name, years: years(x, locale) })).sort((a, b) => a.name.localeCompare(b.name, locale));
  return (
    <section style={{ maxWidth: 860, margin: "0 auto" }}>
      <PageIntl ns={["Auto", "MemoryForm", "Lada", "Voice"]}>
        <AutoBook treeId={id} owner={{ id: p.id, givenName: p.givenName }} own={lada.own} people={people} storage={storageConfigured()}
          defaultDegree={data.tree.chatMaxDegree} verse={verse(tq, "book")} faithConsent={await hasConsent(db, me.id, "faith")}
          chapters={plan.map((c) => ({ key: c.key, title: c.title, intro: c.intro, verse: c.verse, questions: c.questions.map((q) => ({ key: q.key, text: q.text, mentions: q.mentions ?? [] })) }))} />
      </PageIntl>
    </section>
  );
}
