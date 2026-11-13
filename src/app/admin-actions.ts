"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { tree, user } from "@/db/schema";
import { currentUser } from "@/lib/access";
import { isAdminUser } from "@/lib/admin";
import { adminReady } from "@/lib/admin-access";
import { PlanSettings, isPlan, isTier, savePlanSettings, setAccountPlan } from "@/lib/plans";
import { MAX_WORD } from "@/lib/cuvant-final";
import { saveBaseWord } from "@/lib/texte";
import { isLocale } from "@/i18n/locales";
import { undoChange } from "@/lib/admin-istoric";
import { homeImagesState, isHomeSlot, saveHomeImagesState, withActive, withoutUpload } from "@/lib/home-images";
import { deleteObjects } from "@/lib/storage";
import { markRemovedByUpload } from "@/lib/home-submissions";
import { activeServiceAccount, listSites, parseServiceAccount, parseVerification, parseWatch, pickSite, saveSeoSettings, sealCredentials, seoSettings, submitSitemap, type SeoSettings } from "@/lib/seo";
import { SITE_URL } from "@/lib/site-url";
import { TREE_MODES, USER_MODES, setTreeLimit, setUserLimit, type TreeMode, type UserMode } from "@/lib/edit-limits";

export type AdminFormState = { ok?: string; error?: string } | null;

/** Doar adminul schimbă planurile; ceilalți primesc un răspuns sec, fără să afle ce e aici. */
async function admin() {
  const me = await currentUser();
  return (await adminReady(me)) ? me : null;
}

/** Toate câmpurile setărilor din formular (zilele, prețurile și plafoanele fiecărui plan), în afară de comutator și ziua pornirii. */
const SETTING_FIELDS = Object.keys(PlanSettings.shape).filter((k) => k !== "on" && k !== "startedAt");

/** „Manager control”: zilele gratuite, prețurile și comutatorul care pornește regulile în site. */
export async function savePlanLimits(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const raw: Record<string, unknown> = { on: form.get("on"), startedAt: null };
  for (const k of SETTING_FIELDS) raw[k] = form.get(k);
  const parsed = PlanSettings.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifică cifrele." };
  const saved = await savePlanSettings(db, parsed.data, me.id);
  revalidatePath("/", "layout");
  return { ok: saved.on ? "Am salvat. Plățile sunt pornite în site." : "Am salvat. Plățile rămân oprite: nu e oprit nimeni." };
}

/** „Manager control”: planul unui cont (gratuit, gratuit mereu, plătit), planul anului (Basic, Familie, Premium), până când a plătit și o notă. */
export async function saveAccountPlan(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const userId = String(form.get("userId") ?? "");
  const plan = form.get("plan");
  if (!userId || !isPlan(plan)) return { error: "Alege un plan." };
  const until = String(form.get("paidUntil") ?? "").trim();
  if (until && !/^\d{4}-\d{2}-\d{2}$/.test(until)) return { error: "Alege o dată." };
  const paidUntil = until ? new Date(`${until}T23:59:59Z`) : null;
  const [u] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
  if (!u) return { error: "Contul nu mai există." };
  const tier = form.get("tier");
  await setAccountPlan(db, userId, plan, String(form.get("note") ?? ""), me.id, new Date(), paidUntil, isTier(tier) ? tier : null);
  revalidatePath("/", "layout");
  return { ok: "Salvat." };
}

/**
 * „Texte”: cuvântul de la finalul Călătoriei în timp, pentru toți arborii unde proprietarul n-a scris altul.
 * `null` = înapoi la textul inițial (cel din cod).
 */
export async function saveJourneyBaseWord(text: string | null, locale: string = "ro"): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const parsed = z.string().max(MAX_WORD).nullable().safeParse(text);
  if (!parsed.success) return { error: `Textul poate avea cel mult ${MAX_WORD} de caractere.` };
  if (parsed.data !== null && !parsed.data.trim()) return { error: "Textul e gol. Scrie-l sau pune înapoi textul inițial." };
  if (!isLocale(locale)) return { error: "Limba nu există." };
  await saveBaseWord(db, parsed.data, me.id, new Date(), locale);
  revalidatePath("/admin", "layout");
  revalidatePath("/arbore/[id]/calatorie", "page");
  return { ok: parsed.data === null ? "Am pus înapoi textul inițial." : "Am salvat. Așa se vede de acum la capătul călătoriei." };
}

/* ---------- „Istoric și limite”: anularea unei schimbări din arbori și limitele de editare ---------- */

/** Pune înapoi o fișă ștearsă, readuce o corectură sau scoate o persoană adăugată greșit (vezi src/lib/admin-istoric.ts). */
export async function undoTreeChange(logId: string): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  if (!z.string().uuid().safeParse(logId).success) return { error: "Schimbarea nu mai e în istoric." };
  const r = await undoChange(db, logId, me.id);
  if ("error" in r) return { error: r.error };
  revalidatePath("/admin/istoric");
  revalidatePath("/arbore/[id]", "layout");
  return { ok: r.ok };
}

/** Limita de editare a unui om: fără ștergeri, doar adaugă, blocat; „normal” o scoate. */
export async function saveUserLimit(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const userId = String(form.get("userId") ?? ""), mode = String(form.get("mode") ?? "");
  if (!userId) return { error: "Alege omul." };
  if (mode !== "normal" && !(mode in USER_MODES)) return { error: "Alege limita." };
  const [u] = await db.select().from(user).where(eq(user.id, userId));
  if (!u) return { error: "Contul nu mai există." };
  if (isAdminUser(u)) return { error: "Un admin nu poate fi limitat." };
  await setUserLimit(db, userId, mode === "normal" ? null : (mode as UserMode), String(form.get("note") ?? ""), me.id);
  revalidatePath("/admin", "layout");
  return { ok: mode === "normal" ? "Limita a fost scoasă." : "Limita e pusă. Se aplică de la următoarea lui schimbare." };
}

/** Limita unui arbore întreg: doar editorii, sau înghețat (doar proprietarul); „normal” o scoate. */
export async function saveTreeLimit(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const treeId = String(form.get("treeId") ?? ""), mode = String(form.get("mode") ?? "");
  if (!z.string().uuid().safeParse(treeId).success) return { error: "Alege arborele." };
  if (mode !== "normal" && !(mode in TREE_MODES)) return { error: "Alege limita." };
  const [t] = await db.select({ id: tree.id }).from(tree).where(eq(tree.id, treeId));
  if (!t) return { error: "Arborele nu mai există." };
  await setTreeLimit(db, treeId, mode === "normal" ? null : (mode as TreeMode), String(form.get("note") ?? ""), me.id);
  revalidatePath("/admin", "layout");
  return { ok: mode === "normal" ? "Arborele e din nou deschis, ca înainte." : "Limita arborelui e pusă." };
}

/* ---------- „Poze prima pagină” ---------- */

/** Pune înapoi poza inițială a unui loc de pe prima pagină și șterge din bucket poza încărcată (încărcarea e în /api/admin/poze). */
/** Admin → Poze prima pagină: ce poze stau pe pagină într-un loc (la banner pot fi mai multe, în ordinea dată). */
export async function setHomeActive(slot: string, ids: string[]): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  if (!isHomeSlot(slot) || !Array.isArray(ids) || ids.some((i) => typeof i !== "string")) return { error: "Locul pozei nu există." };
  if (!ids.length) return { error: "Lasă măcar o poză pe pagină." };
  await saveHomeImagesState(db, withActive(await homeImagesState(db), slot, ids), me.id);
  revalidatePath("/");
  revalidatePath("/admin/poze");
  return { ok: "Gata, prima pagină arată acum pozele alese." };
}

/** După o încărcare prin /api/admin/poze: aduce pagina la zi (o acțiune o reîmprospătează sigur, router.refresh nu mereu). */
export async function refreshHomeImages(): Promise<void> {
  if (!(await admin())) return;
  revalidatePath("/admin/poze");
}

/** Șterge o poză încărcată (și fișierul ei din bucket). */
export async function deleteHomeUpload(slot: string, id: string): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  if (!isHomeSlot(slot) || typeof id !== "string") return { error: "Locul pozei nu există." };
  const { state, key } = withoutUpload(await homeImagesState(db), slot, id);
  if (!key) return { error: "Poza nu mai există." };
  await saveHomeImagesState(db, state, me.id);
  await deleteObjects([key]);
  await markRemovedByUpload(db, id, me.id);
  revalidatePath("/");
  revalidatePath("/admin/poze");
  return { ok: "Am șters poza." };
}

/**
 * Admin → SEO: codul de verificare Google, proprietatea din Search Console, cuvintele urmărite și cheia contului de serviciu.
 * Cheia lăsată goală rămâne cea de dinainte; bifa „șterge cheia” o scoate.
 */
export async function saveSeoSetup(_: AdminFormState, form: FormData): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const patch: Partial<SeoSettings> = {};
  const ver = String(form.get("verification") ?? "");
  if (ver.trim()) {
    const code = parseVerification(ver);
    if (!code) return { error: "Codul de verificare nu arată bine. Lipește tot rândul <meta …> primit de la Google." };
    patch.verification = code;
  } else patch.verification = null;
  const siteUrl = String(form.get("siteUrl") ?? "").trim();
  patch.siteUrl = siteUrl || null;
  patch.watch = parseWatch(String(form.get("watch") ?? ""));
  const key = String(form.get("credentials") ?? "").trim();
  if (form.get("removeKey") === "on") patch.credentials = null;
  else if (key) {
    const sa = parseServiceAccount(key);
    if (!sa) return { error: "Cheia nu e bună: lipește tot conținutul fișierului .json descărcat din Google Cloud." };
    patch.credentials = sealCredentials(JSON.stringify(sa));
  }
  await saveSeoSettings(db, patch, me.id);
  revalidatePath("/admin/seo");
  revalidatePath("/");
  return { ok: "Am salvat." };
}

/** Admin → SEO: trimite sitemap.xml la Google Search Console (Google îl citește din nou în câteva ore sau zile). */
export async function submitSitemapNow(): Promise<AdminFormState> {
  const me = await admin();
  if (!me) return { error: "Nu ai voie aici." };
  const s = await seoSettings(db);
  const sa = activeServiceAccount(s);
  if (!sa) return { error: "Mai întâi pune cheia Search Console." };
  try {
    const site = pickSite(await listSites(sa.account), s.siteUrl, SITE_URL);
    if (!site) return { error: "Contul de serviciu nu are acces la nicio proprietate din Search Console." };
    await submitSitemap(sa.account, site, `${SITE_URL}/sitemap.xml`);
  } catch (e) {
    return { error: `Google a refuzat: ${e instanceof Error ? e.message : String(e)}. Verifică că adresa contului are permisiune „Complet” în Search Console.` };
  }
  revalidatePath("/admin/seo");
  return { ok: "Trimis. Google îl citește în câteva ore sau zile." };
}
