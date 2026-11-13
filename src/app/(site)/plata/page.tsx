import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accountPlan, tree } from "@/db/schema";
import { requireUser, roleInTree } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { operator } from "@/lib/legal";
import { bookPaid, priceFor, stripeReady } from "@/lib/plati";
import { userAccess } from "@/lib/plata";
import { getLocale, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: (await getT("Plata"))("title"), robots: { index: false } };
}

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * Plata: anul în Cartea Neamului și, cu `?carte=<arbore>`, cartea PDF a acelui arbore. Omul bifează că accesul începe imediat
 * (fără cele 14 zile de retragere), apoi plătește pe pagina Stripe. Cât timp plățile sunt oprite din Admin, doar adminul vede
 * butoanele (ca să încerce plata); ceilalți află că nu trebuie să plătească nimic.
 */
export default async function PlataPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const me = await requireUser("/plata");
  const q = await searchParams;
  const str = (k: string) => (typeof q[k] === "string" ? (q[k] as string) : "");
  const [t, locale] = await Promise.all([getT("Plata"), getLocale()]);
  const { access, settings, ownsTree } = await userAccess(db, me.id);
  const admin = isAdminUser(me);
  const open = settings.on || admin;
  const date = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(d);
  const op = operator();
  // Cât timp plățile sunt oprite, adminul poate face o plată de probă: îi arătăm până când a plătit, nu „totul e gratuit”.
  const adminPaidUntil = admin && !settings.on
    ? (await db.select({ until: accountPlan.paidUntil }).from(accountPlan).where(eq(accountPlan.userId, me.id)))[0]?.until ?? null : null;

  const treeId = UUID.test(str("carte")) ? str("carte") : null;
  const book = treeId && (await roleInTree(db, treeId, me.id))
    ? { id: treeId, name: (await db.select({ name: tree.name }).from(tree).where(eq(tree.id, treeId)))[0]?.name ?? "", paid: await bookPaid(db, me.id, treeId) }
    : null;

  const err = str("eroare");
  const notice = str("gata") ? t("thanks") : str("renuntat") ? t("cancelled")
    : err === "acord" ? t("errAcord") : err === "curand" ? t("errSoon") : err ? t("err") : null;

  const status = access.kind === "mereu" ? t("freeForever")
    : access.kind === "platit" ? (access.until ? t("paidUntil", { date: date(access.until) }) : t("freeForever"))
    : access.kind === "beta" ? t("beta", { date: date(access.until) })
    : access.kind === "proba" ? t("trial", { days: access.daysLeft })
    : access.kind === "expirat" ? t("ended")
    : admin ? (adminPaidUntil && adminPaidUntil > new Date() ? t("adminPaid", { date: date(adminPaidUntil) }) : t("adminTest"))
    : t("notNeeded");

  const payForm = (kind: "an" | "carte") => {
    const price = priceFor(kind, locale, ownsTree, settings);
    return (
      <form action="/api/plata/start" method="post" className="form pay-form">
        <input type="hidden" name="kind" value={kind} />
        {kind === "carte" && book && <input type="hidden" name="treeId" value={book.id} />}
        <label className="check"><input type="checkbox" name="acord" required /> {t("consent")}</label>
        <div className="actions"><button className="btn primary">{t("pay", { price: price.label })}</button></div>
      </form>
    );
  };

  return (
    <section className="stack plata">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{t("title")}</h1>
        {notice && <p role="status" className={err ? "err" : "pay-ok"}>{notice}{err === "curand" && <> <Link href="/contact">{t("contact")}</Link></>}</p>}
        <h2>{t("yearTitle")}</h2>
        <p>{status}</p>
        {open && access.kind !== "mereu" && !(access.kind === "platit" && !access.until) && (
          <>
            <p className="muted">{t("yearText")}</p>
            {payForm("an")}
          </>
        )}
      </div>

      {book && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>{t("bookTitle")}</h2>
          {book.paid ? <p>{t("bookPaid")}</p> : <p className="muted">{t("bookText", { tree: book.name })}</p>}
          {!book.paid && open && payForm("carte")}
          <div className="actions"><Link className="btn" href={`/arbore/${book.id}/carte`}>{t("backToBook")}</Link></div>
        </div>
      )}

      <p className="muted" style={{ fontSize: 14 }}>
        {t("secure")} {t("seller", { name: op.name, cui: op.cui })} <Link href="/termeni">{t("terms")}</Link>
      </p>
    </section>
  );
}
