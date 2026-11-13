"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { checkLab, deleteDnaRequest, deleteLab, resolveDnaRequest, saveLab } from "@/lib/resurse";

const UUID = /^[0-9a-f-]{36}$/i;
async function admin() {
  const me = await currentUser();
  if (!isAdminUser(me)) redirect("/");
}
const done = (q = "") => { revalidatePath("/admin/adn"); revalidatePath("/resurse-genealogie"); redirect(`/admin/adn${q}`); };

/** Cererea „Vreau un test ADN”: marcată rezolvată (sau din nou deschisă). */
export async function toggleDnaRequest(form: FormData) {
  await admin();
  const id = String(form.get("id") ?? "");
  if (UUID.test(id)) await resolveDnaRequest(db, id, form.get("done") === "1");
  done();
}

/** Ștergerea unei cereri, la cererea omului. */
export async function removeDnaRequest(form: FormData) {
  await admin();
  const id = String(form.get("id") ?? "");
  if (UUID.test(id)) await deleteDnaRequest(db, id);
  done();
}

/** Adaugă sau schimbă un laborator din listă (fără parametri de urmărire sau afiliere în adresă). */
export async function saveDnaLab(form: FormData) {
  await admin();
  const id = String(form.get("id") ?? "");
  const r = checkLab(Object.fromEntries(form));
  if ("error" in r) done(`?eroare=${encodeURIComponent(r.error)}`);
  else { await saveLab(db, UUID.test(id) ? id : null, r.ok); done("?salvat=1"); }
}

export async function removeDnaLab(form: FormData) {
  await admin();
  const id = String(form.get("id") ?? "");
  if (UUID.test(id)) await deleteLab(db, id);
  done();
}
