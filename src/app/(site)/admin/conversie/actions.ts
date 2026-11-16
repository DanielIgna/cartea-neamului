"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { ConvSettings, saveConvSettings } from "@/lib/conversie";
import { runConversion } from "@/lib/conversie-mail";
import { sendEmail, emailSent } from "@/lib/email";
import { simulatedNow } from "./sim";

/** Setările din Admin → Din gratuit în plătit: zilele emailurilor, procentul și durata reducerii, fereastra din ultima zi. */
export async function saveConversionSettings(form: FormData) {
  const me = await requireAdmin("/admin/conversie");
  const parsed = ConvSettings.safeParse({
    days: Object.fromEntries(["bunvenit", "progres", "planuri", "ultimazi", "reducere", "asteapta"].map((k) => [k, form.get(`d_${k}`)])),
    percent: form.get("percent"), hours: form.get("hours"), popup: form.get("popup"),
  });
  if (!parsed.success) redirect(`/admin/conversie?eroare=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Valoare greșită")}`);
  await saveConvSettings(db, parsed.data, me.id);
  revalidatePath("/admin/conversie");
  redirect("/admin/conversie?salvat=1");
}

/** Simulatorul: emailul pe care l-ar primi contul ales în ziua aleasă, trimis doar adminului (fără nimic scris la om). */
export async function sendSimulationToMe(form: FormData) {
  const me = await requireAdmin("/admin/conversie");
  const userId = String(form.get("u") ?? ""), day = Number(form.get("zi") ?? 1);
  const now = await simulatedNow(userId, day);
  const r = now ? await runConversion(db, { now, onlyUserId: userId, dryRun: true, simulate: true }) : null;
  const p = r?.previews[0];
  if (!p) redirect(`/admin/conversie?u=${encodeURIComponent(userId)}&zi=${day}&trimis=0`);
  const sent = await sendEmail({ to: me.email, subject: `[Test] ${p.mail.subject}`, html: p.mail.html, text: p.mail.text, tag: `conversie-test-${p.step}` });
  redirect(`/admin/conversie?u=${encodeURIComponent(userId)}&zi=${day}&trimis=${emailSent(sent) ? 1 : 0}`);
}
