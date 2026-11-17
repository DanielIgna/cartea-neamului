"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { currentUser } from "@/lib/access";
import { adminReady } from "@/lib/admin-access";
import { approveRequest, createSchoolCode, ensureSchool, recentRequests, rejectRequest, saveSchoolRequest, schoolYearEnd, setCodeActive, SchoolRequestInput } from "@/lib/scoli";
import { emailReady, sendEmail, siteInbox } from "@/lib/email";

export type FormState = { ok?: boolean; error?: string } | null;

/**
 * „Vreau coduri pentru clasa mea” (/scoala): cererea ajunge în Admin → Școli, iar Daniel primește un email scurt. Câmpul
 * `website` e ascuns oamenilor (doar roboții îl completează); cel mult 3 cereri pe oră de la aceeași adresă.
 */
export async function requestSchoolCodes(_: FormState, form: FormData): Promise<FormState> {
  if (String(form.get("website") ?? "").trim()) return { ok: true };
  if (form.get("acord") !== "on") return { error: "Bifează acordul ca să-ți putem răspunde." };
  const parsed = SchoolRequestInput.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifică datele din formular." };
  if ((await recentRequests(db, parsed.data.email)) >= 3) return { error: "Am primit deja cererile tale. Îți răspundem în curând." };
  await saveSchoolRequest(db, parsed.data);
  if (emailReady()) {
    const v = parsed.data;
    const text = `Cerere nouă de coduri pentru școală:\n\n${v.school}, ${v.locality}${v.county ? `, jud. ${v.county}` : ""}\nClasa: ${v.classLabel}, ${v.students} elevi\n${v.teacher ? `Cadrul didactic: ${v.teacher}\n` : ""}Email: ${v.email}${v.phone ? `\nTelefon: ${v.phone}` : ""}${v.message ? `\n\n${v.message}` : ""}\n\nAprobi din Admin → Școli, după confirmarea conducerii școlii.`;
    await sendEmail({ to: siteInbox(), subject: `Școală: ${v.school} (${v.classLabel})`, text, html: text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>"), replyTo: v.email, tag: "scoala" })
      .catch((e) => console.error("scoala: email", e));
  }
  revalidatePath("/admin/scoli");
  return { ok: true };
}

async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me : null;
}

/** Admin → Școli: aprobă cererea (după confirmarea conducerii școlii) și face codul clasei. */
export async function approveSchoolRequest(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const id = String(form.get("id") ?? "");
  const percent = Number(form.get("percent") ?? 90) || 90;
  const maxUses = Number(form.get("maxUses") ?? 0) || undefined;
  const exp = String(form.get("expiresAt") ?? "");
  try {
    await approveRequest(db, id, me.id, { percent, maxUses, expiresAt: /^\d{4}-\d{2}-\d{2}$/.test(exp) ? new Date(`${exp}T20:59:59Z`) : undefined });
  } catch (e) {
    console.error("scoli: aprobare", e);
  }
  revalidatePath("/admin/scoli");
}

export async function rejectSchoolRequest(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  await rejectRequest(db, String(form.get("id") ?? ""), me.id);
  revalidatePath("/admin/scoli");
}

/** Un cod făcut de mână (fără cerere), pe școală sau pe clasă. */
export async function newSchoolCode(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  const name = String(form.get("school") ?? "").trim(), locality = String(form.get("locality") ?? "").trim();
  if (name.length < 3 || locality.length < 2) return;
  const exp = String(form.get("expiresAt") ?? "");
  try {
    const schoolId = await ensureSchool(db, name, locality, String(form.get("county") ?? "").trim() || null);
    await createSchoolCode(db, {
      schoolId, classLabel: String(form.get("classLabel") ?? "").trim() || null, percentOff: Number(form.get("percent") ?? 90) || 90,
      maxUses: Number(form.get("maxUses") ?? 30) || 30, expiresAt: /^\d{4}-\d{2}-\d{2}$/.test(exp) ? new Date(`${exp}T20:59:59Z`) : schoolYearEnd(), by: me.id,
    });
  } catch (e) {
    console.error("scoli: cod nou", e);
  }
  revalidatePath("/admin/scoli");
}

export async function toggleSchoolCode(form: FormData): Promise<void> {
  const me = await admin();
  if (!me) return;
  await setCodeActive(db, String(form.get("id") ?? ""), form.get("on") === "1");
  revalidatePath("/admin/scoli");
}
