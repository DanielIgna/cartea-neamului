"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { person } from "@/db/schema";
import { currentUser, roleIn } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { inchide, pornesteSursa, salveazaSchimbare, verificaSchimbare } from "@/lib/surse-publice-db";

const UUID = /^[0-9a-f-]{36}$/i;

/** „Nu mai arăta”: cardul „Caută în arhive publice” dispare pentru acest om, la această persoană. */
export async function dismissArchiveHint(treeId: string, personId: string): Promise<{ ok: true } | { error: string }> {
  if (!UUID.test(treeId) || !UUID.test(personId)) return { error: "bad" };
  const me = await currentUser();
  if (!me || !(await roleIn(db, treeId, me.id))) return { error: "denied" };
  const [p] = await db.select({ id: person.id }).from(person).where(and(eq(person.id, personId), eq(person.treeId, treeId)));
  if (!p) return { error: "gone" };
  await inchide(db, me.id, p.id);
  return { ok: true };
}

/* ---------- Admin → Surse publice ---------- */

async function admin() {
  const me = await currentUser();
  if (!(await adminReady(me))) redirect("/");
  return me!;
}
const done = (q = "") => { revalidatePath("/admin/surse-publice"); revalidatePath("/surse-publice"); redirect(`/admin/surse-publice${q}`); };

/** Schimbă textul, adresa, ordinea sau starea unei surse (fără publicare). */
export async function saveSursa(form: FormData) {
  const me = await admin();
  const id = String(form.get("id") ?? "");
  const r = verificaSchimbare(Object.fromEntries(form));
  if ("error" in r) done(`?eroare=${encodeURIComponent(r.error)}#${id}`);
  else { await salveazaSchimbare(db, id, r.ok, me.id); done(`?salvat=${encodeURIComponent(id)}#${id}`); }
}

/** Pornește sau oprește o sursă dintr-un clic. */
export async function toggleSursa(form: FormData) {
  const me = await admin();
  const id = String(form.get("id") ?? "");
  await pornesteSursa(db, id, form.get("activ") === "1", me.id);
  done(`#${id}`);
}

/** Pune sursa înapoi cum e în cod. */
export async function resetSursa(form: FormData) {
  const me = await admin();
  const id = String(form.get("id") ?? "");
  await salveazaSchimbare(db, id, null, me.id);
  done(`?salvat=${encodeURIComponent(id)}#${id}`);
}
