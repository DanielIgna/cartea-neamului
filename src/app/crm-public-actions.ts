"use server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { checkSendSig, trackSend } from "@/lib/crm-campanii";

/** Dezabonarea unei organizații din emailul de campanie (o apăsare pe buton): adresa și organizația intră pe „nu contacta”. */
export async function unsubscribeOrgAction(form: FormData) {
  const d = String(form.get("d") ?? ""), s = String(form.get("s") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(d) || !checkSendSig(d, s)) redirect("/dezabonare-organizatie?gata=0");
  const ok = await trackSend(db, d, "dezabonat").then(() => true).catch(() => false);
  redirect(`/dezabonare-organizatie?gata=${ok ? 1 : 0}`);
}
