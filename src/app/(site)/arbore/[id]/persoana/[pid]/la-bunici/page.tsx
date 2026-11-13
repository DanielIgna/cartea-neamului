import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { memory, memoryQuestion, person, user } from "@/db/schema";
import { loadTreeView } from "@/lib/tree-data";
import { can, requireUser, roleIn } from "@/lib/access";
import { buildGraph } from "@/lib/kinship";
import { isPlaceholder } from "@/lib/family";
import { questionContext } from "@/lib/lada";
import { chapterKey, questionsFor, sundayQuestion } from "@/lib/questions";
import { bookPlan, bookQueue } from "@/lib/autobiografie";
import { storageConfigured } from "@/lib/storage";
import LaBunici, { type GrandQuestion } from "@/components/LaBunici";
import PageIntl from "@/i18n/PageIntl";
import { isLocale } from "@/i18n/locales";
import { getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Modul „la bunici” pentru un om în viață fără cont: întâi întrebările lăsate de rude, apoi cele scrise din arbore și din istoria
 * pe care a trăit-o (fără cele la care a răspuns deja). Îl deschide o rudă care poate adăuga în arbore.
 * Butoanele sunt în limba celui care ține telefonul; întrebările, în limba aleasă cu `?limba=` (de la sine aceeași),
 * pentru nepotul din diaspora care citește site-ul în engleză, dar o întreabă pe bunica în română.
 */
export default async function LaBuniciPage({ params, searchParams }: { params: Promise<{ id: string; pid: string }>; searchParams: Promise<{ carte?: string; limba?: string }> }) {
  const { id, pid } = await params;
  const sp = await searchParams;
  // `?carte=1`: întrebările autobiografiei, capitol cu capitol, în locul celor de duminică.
  const book = sp.carte === "1";
  if (!UUID.test(id) || !UUID.test(pid)) notFound();
  const me = await requireUser(`/arbore/${id}/persoana/${pid}/la-bunici`);
  const role = await roleIn(db, id, me.id);
  if (!role) notFound();
  const locale = await getLocale();
  const qLocale = isLocale(sp.limba) ? sp.limba : locale;
  const [t, tq, tlq, tgq] = await Promise.all([getT("Grand", locale), getT("Questions", qLocale), getT("Lada", qLocale), getT("Grand", qLocale)]);
  const data = await loadTreeView(db, id, undefined, 1, locale);
  const p = data?.people[pid];
  if (!data || !p) notFound();
  const back = `/arbore/${id}/persoana/${pid}`;
  const sex = p.sex === "F" ? "F" : "M";
  const problem = !p.living ? t("onlyLiving")
    : p.claimed ? t("hasAccount", { name: p.givenName, sex })
    : !can(role, "contributor") ? t("needRight")
    : null;
  if (problem) {
    return (
      <section className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="section-label" style={{ marginTop: 0 }}>{t("kicker")}</div>
        <p>{problem}</p>
        <Link href={back}>{t("backToProfile", { sex })}</Link>
      </section>
    );
  }

  const g = buildGraph(Object.values(data.people), data.rels);
  const ctx = questionContext(g, data.people, pid);
  const answered = (await db.select({ k: memory.questionKey }).from(memory).where(and(eq(memory.personId, pid), isNotNull(memory.questionKey)))).map((r) => r.k!);
  const all = ctx ? questionsFor(ctx, tq, qLocale) : [];
  const left = all.filter((q) => !answered.includes(q.key)).length;
  const now = new Date();
  const kicker = (c: string) => tlq(`chapters.${chapterKey(c)}`);
  const fromTree = book && ctx
    ? bookQueue(bookPlan(ctx, tq, qLocale), answered).map((q): GrandQuestion => ({ text: q.text, chapter: q.chapter, kicker: kicker(q.chapter), key: q.key, mentions: q.mentions }))
    : Array.from({ length: Math.min(40, left) }, (_, k) => sundayQuestion(all, answered, now, k)).filter((q) => !!q)
      .map((q): GrandQuestion => ({ text: q!.text, chapter: q!.chapter, kicker: kicker(q!.chapter), key: q!.key }));

  // Întrebările lăsate de rude în lada lui, încă fără răspuns, cu numele celui care a întrebat (din fișa lui sau din cont).
  const asked = await db.select().from(memoryQuestion).where(and(eq(memoryQuestion.treeId, id), eq(memoryQuestion.personId, pid), isNull(memoryQuestion.memoryId)));
  const askers = [...new Set(asked.map((q) => q.askedBy).filter((x): x is string => !!x))];
  const claimed = askers.length ? await db.select({ by: person.claimedByUserId, given: person.givenName, surname: person.surname }).from(person)
    .where(and(eq(person.treeId, id), inArray(person.claimedByUserId, askers))) : [];
  const accounts = askers.length ? await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, askers)) : [];
  const nameOf = (uid: string | null) => {
    const c = claimed.find((x) => x.by === uid);
    return c ? `${c.given} ${c.surname}`.trim() : accounts.find((a) => a.id === uid)?.name ?? null;
  };
  const fromFamily = asked.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map((q): GrandQuestion => {
    const by = nameOf(q.askedBy);
    return { text: q.text, chapter: "altele", kicker: by ? tgq("questionFrom", { name: by }) : tgq("questionFromFamily"), askedId: q.id, askedBy: by };
  });

  const people = Object.values(data.people).filter((x) => !isPlaceholder(x.givenName)).map((x) => x.id);
  return (
    <PageIntl ns={["Grand", "Voice"]}>
      <LaBunici treeId={id} back={back} storage={storageConfigured()} questions={[...fromFamily, ...fromTree]} people={people} questionLocale={qLocale}
        words={{ consentQuestion: tgq("consentQ", { name: p.givenName }), thanks: tgq("thanks", { name: p.givenName }) }}
        person={{ id: p.id, givenName: p.givenName, surname: p.surname, sex: p.sex, photoId: p.photoId, accountImage: p.accountImage ?? null }} />
    </PageIntl>
  );
}
