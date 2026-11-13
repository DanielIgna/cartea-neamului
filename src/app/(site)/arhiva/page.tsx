import Link from "next/link";
import { db } from "@/db";
import { requireUser } from "@/lib/access";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";
import { archiveOf } from "@/lib/pastrare";
import { mediaFullIn } from "@/lib/plata";
import { getAppName, getT } from "@/i18n/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  return { title: `${(await getT("Archive"))("title")} · ${await getAppName()}`, robots: PRIVATE_ROBOTS };
}

const KINDS = ["photo", "audio", "act", "letter", "other"] as const;
type Kind = (typeof KINDS)[number];

/**
 * „Arhiva mea” (/arhiva): ce poate lua omul cu el, oricând: fiecare arbore ca GEDCOM, cartea neamului și fișierele (cele puse la
 * persoane și tot ce a încărcat el). Legătura vine o dată pe an pe email, cu „Păstrarea” (src/lib/pastrare.ts). Fișierele se
 * deschid după aceleași reguli ca în arbore (src/app/api/document/[docId]/route.ts).
 */
export default async function ArchivePage() {
  const me = await requireUser("/arhiva");
  const t = await getT("Archive");
  const trees = await archiveOf(db, me.id);
  const full = new Map(await Promise.all(trees.map(async (x) => [x.id, await mediaFullIn(db, x.id, me.id)] as const)));
  const kind = (k: string) => t(`kinds.${(KINDS as readonly string[]).includes(k) ? (k as Kind) : "other"}`);
  return (
    <section className="stack">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{t("title")}</h1>
        <p>{t("intro")}</p>
        {[...full.values()].some((f) => !f) && <p className="muted">{t("limited")}</p>}
        <p className="muted" style={{ marginBottom: 0 }}>{t("memories")} {t("myData")} <Link href="/datele-mele">{t("myDataLink")}</Link>.</p>
      </div>
      {!trees.length && <div className="card"><p style={{ margin: 0 }}>{t("noTrees")}</p></div>}
      {trees.map((x) => (
        <div className="card" key={x.id}>
          <h2 style={{ marginTop: 0 }}>{x.name}{x.owner && <span className="muted" style={{ fontSize: 15, fontWeight: 400 }}> · {t("owner")}</span>}</h2>
          <div className="actions">
            <a className="btn" href={`/api/arbore/${x.id}/gedcom?living=1`} download>{t("gedcom")}</a>
            <Link className="btn" href={`/arbore/${x.id}/carte`}>{t("book")}</Link>
          </div>
          <details>
            <summary>{t("files", { n: x.files.length })}</summary>
            {x.files.length ? (
              <ul>
                {x.files.map((f) => (
                  <li key={f.id}>
                    <a href={`/api/document/${f.id}`} target="_blank" rel="noopener">{kind(f.kind)}: {f.title}</a>
                    {f.mine && <span className="muted"> · {t("mine")}</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="muted">{t("none")}</p>}
          </details>
        </div>
      ))}
    </section>
  );
}
