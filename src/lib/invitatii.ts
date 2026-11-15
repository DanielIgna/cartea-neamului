/**
 * Programul de invitații (Daniel, 14.11.2026): fiecare om are o legătură personală, carteaneamului.ro/i/<cod>.
 *
 * - Cine o deschide primește un cookie de 30 de zile (doar codul, nimic despre el). Dacă își face cont în acest timp (cu email
 *   sau cu Google), contul nou e trecut pe cel care l-a invitat (`invite_referral`). Și invitația într-un arbore (/invitatie/…)
 *   acceptată de un cont nou se socotește la fel.
 * - Zilele se dau doar după dovada unui om adevărat: email confirmat (sau intrare cu Google) ȘI măcar o persoană adăugată în
 *   arbore. Atunci cel care a invitat primește `daysReferrer` zile, iar invitatul `daysReferred` (implicit 7 + 7: 14 zile în loc
 *   de 7). Zilele lungesc perioada gratuită sau, la cine are anul plătit, anul.
 * - Pază: nu se socotește invitarea propriei persoane (același email, același telefon/calculator sau aceeași adresă IP în
 *   aceeași zi), nici adresele de email de unică folosință; cel mult `monthlyCap` rude răsplătite pe lună pentru un om.
 * - Vești: email către cel care a invitat și o veste în cont pentru amândoi (`user_notice`).
 * Setările (zile, limită lunară, pornit/oprit) sunt în Admin → Invitații, în `app_setting` „invitatii”.
 */
import { randomInt } from "node:crypto";
import { and, desc, eq, gt, gte, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "@/db";
import { account, accountPlan, appSetting, inviteClick, inviteCode, inviteReferral, knownDevice, person, session, tree, treeMember, user, userNotice } from "@/db/schema";
import { isLocale, type Locale } from "@/i18n/locales";
import { isAdminUser } from "./admin";
import { isDemo } from "./demo";
import { accessFor, isTier, planSettings } from "./plans";
import { isPlan } from "./plan-names";
import { cookieValue, DEVICE_COOKIE, deviceHash, clientIp } from "./securitate";

const DAY = 86_400_000;
export const INVITE_COOKIE = "cn-invitat";
export const INVITE_COOKIE_DAYS = 30;
/** Literele codului: fără 0/O și 1/I, ca să nu se încurce când e citit cu voce tare sau scris de mână. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const CODE_LEN = 7;
export const isInviteCode = (c: unknown): c is string => typeof c === "string" && new RegExp(`^[${ALPHABET}]{${CODE_LEN}}$`).test(c);
export const newInviteCode = () => Array.from({ length: CODE_LEN }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
/** Codul din adresă, cum l-a scris omul (litere mici, spații). */
export const cleanCode = (c: string | null | undefined) => (c ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

/* ------------------------------ Setările din Admin ------------------------------ */

const flag = z.preprocess((v) => v === true || v === "on" || v === "true" || v === "1", z.boolean());
const days = z.coerce.number({ invalid_type_error: "Scrie un număr." }).int("Scrie un număr întreg.").min(0, "Nu poate fi negativ.").max(90, "Cel mult 90 de zile.");
export const InviteSettings = z.object({
  on: flag,
  daysReferrer: days,
  daysReferred: days,
  monthlyCap: z.coerce.number({ invalid_type_error: "Scrie un număr." }).int("Scrie un număr întreg.").min(0, "Nu poate fi negativ.").max(1000, "E prea mult."),
  requirePerson: flag,
  shareTree: flag,
});
export type InviteSettings = z.infer<typeof InviteSettings>;
export const DEFAULT_INVITE: InviteSettings = { on: true, daysReferrer: 7, daysReferred: 7, monthlyCap: 20, requirePerson: true, shareTree: true };
const KEY = "invitatii";

export async function inviteSettings(db: Pick<Db, "select">): Promise<InviteSettings> {
  const [row] = await db.select({ value: appSetting.value }).from(appSetting).where(eq(appSetting.key, KEY));
  const parsed = InviteSettings.safeParse({ ...DEFAULT_INVITE, ...(row?.value as object | undefined) });
  return parsed.success ? parsed.data : DEFAULT_INVITE;
}

export async function saveInviteSettings(db: Pick<Db, "insert">, v: InviteSettings, by: string | null, now = new Date()) {
  await db.insert(appSetting).values({ key: KEY, value: v, updatedBy: by, updatedAt: now })
    .onConflictDoUpdate({ target: appSetting.key, set: { value: v, updatedBy: by, updatedAt: now } });
}

/* ------------------------------ Codul fiecăruia ------------------------------ */

/** Codul omului; dacă nu are încă (conturile de dinainte), i se face acum. */
export async function ensureInviteCode(db: Pick<Db, "select" | "insert">, userId: string): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const [have] = await db.select({ code: inviteCode.code }).from(inviteCode).where(eq(inviteCode.userId, userId));
    if (have) return have.code;
    try {
      await db.insert(inviteCode).values({ userId, code: newInviteCode() }).onConflictDoNothing({ target: inviteCode.userId });
    } catch {
      // Cod deja luat de altcineva (rar): încercăm altul.
    }
  }
  throw new Error("invitatii: nu am putut face un cod");
}

export async function ownerOfCode(db: Pick<Db, "select">, code: string) {
  if (!isInviteCode(code)) return null;
  const [r] = await db.select({ userId: inviteCode.userId, shareTreeId: inviteCode.shareTreeId, name: user.name })
    .from(inviteCode).innerJoin(user, eq(user.id, inviteCode.userId)).where(eq(inviteCode.code, code));
  return r ?? null;
}

/** Prenumele, pentru vești și pentru pagina de bun venit (fără nume de familie). */
export const firstName = (name: string | null | undefined) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/** Încă o deschidere a legăturii cuiva, numărată pe zi. */
export async function recordClick(db: Pick<Db, "insert">, userId: string, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  await db.insert(inviteClick).values({ userId, day, clicks: 1 })
    .onConflictDoUpdate({ target: [inviteClick.userId, inviteClick.day], set: { clicks: sql`${inviteClick.clicks} + 1` } });
}

/** Ce arbore vede (doar citire) cine vine prin legătura omului: doar unul în care e proprietar sau editor. */
export async function setShareTree(db: Pick<Db, "select" | "update" | "insert">, userId: string, treeId: string | null) {
  await ensureInviteCode(db, userId);
  if (treeId) {
    const [m] = await db.select({ role: treeMember.role }).from(treeMember).where(and(eq(treeMember.treeId, treeId), eq(treeMember.userId, userId)));
    if (!m || (m.role !== "owner" && m.role !== "editor")) return false;
  }
  await db.update(inviteCode).set({ shareTreeId: treeId }).where(eq(inviteCode.userId, userId));
  return true;
}

/* ------------------------------ Cine a invitat contul nou ------------------------------ */

/** Codul cu care a venit cererea: din cookie-ul de 30 de zile sau, dacă lipsește, din adresa paginii (`?inv=COD`). */
export function codeFromRequest(h: Headers | null | undefined): string | null {
  const c = cleanCode(cookieValue(h?.get("cookie"), INVITE_COOKIE));
  if (isInviteCode(c)) return c;
  try {
    const ref = h?.get("referer");
    const v = ref ? cleanCode(new URL(ref).searchParams.get("inv")) : "";
    return isInviteCode(v) ? v : null;
  } catch {
    return null;
  }
}

/** Emailul „de bază”: litere mici, fără „+ceva”, iar la Gmail fără puncte (a.b+x@gmail.com = ab@gmail.com). */
export function baseEmail(email: string) {
  const [local = "", domain = ""] = email.trim().toLowerCase().split("@");
  const d = domain === "googlemail.com" ? "gmail.com" : domain;
  let l = local.split("+")[0];
  if (d === "gmail.com") l = l.replace(/\./g, "");
  return `${l}@${d}`;
}

/** Adrese de email de unică folosință (cele mai folosite); se socotește și orice subdomeniu al lor. */
const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamailblock.com", "sharklasers.com", "grr.la",
  "10minutemail.com", "10minutemail.net", "10minutemail.co.uk", "20minutemail.com", "tempmail.com", "temp-mail.org", "temp-mail.io",
  "tempmail.net", "tempmailo.com", "tempmail.dev", "tempr.email", "throwawaymail.com", "yopmail.com", "yopmail.fr", "yopmail.net",
  "trashmail.com", "trashmail.de", "trashmail.net", "getnada.com", "nada.email", "dispostable.com", "maildrop.cc", "mailnesia.com",
  "mintemail.com", "mohmal.com", "emailondeck.com", "fakeinbox.com", "fakemail.net", "spamgourmet.com", "mailcatch.com", "moakt.com",
  "burnermail.io", "33mail.com", "mytemp.email", "tempinbox.com", "discard.email", "spambox.us", "mailpoof.com", "inboxkitten.com",
  "harakirimail.com", "emailfake.com", "byom.de", "einrot.com", "dropmail.me", "1secmail.com", "1secmail.net", "1secmail.org",
  "linshiyouxiang.net", "tmpmail.org", "tmpmail.net", "tmail.ws", "cuvox.de", "armyspy.com", "dayrep.com", "fleckens.hu", "gustr.com",
  "jourrapide.com", "rhyta.com", "superrito.com", "teleworm.us", "mailtemp.net", "emltmp.com", "tempmailaddress.com", "spam4.me",
  "anonbox.net", "mail-temp.com", "temporarymail.com", "minuteinbox.com", "luxusmail.org", "zetmail.com", "tempail.com", "mvrht.net",
  "wegwerfmail.de", "wegwerfmail.net", "sofort-mail.de", "trash-mail.com", "mailforspam.com", "spamfree24.org", "kurzepost.de",
  "objectmail.com", "proxymail.eu", "rcpt.at", "trash-me.com", "wh4f.org", "jetable.org", "mail.tm", "mailsac.com", "inboxbear.com",
  "getairmail.com", "fexpost.com", "fexbox.org", "mailbox.in.ua", "chacuo.net", "zeroe.ml", "smailpro.com", "emailnax.com", "tempm.com",
]);
export function isDisposable(email: string) {
  const d = email.trim().toLowerCase().split("@")[1] ?? "";
  if (!d) return true;
  const parts = d.split(".");
  for (let i = 0; i < parts.length - 1; i++) if (DISPOSABLE.has(parts.slice(i).join("."))) return true;
  return false;
}

export const REASONS = ["acelasi-email", "acelasi-dispozitiv", "aceeasi-ip", "email-temporar", "limita-lunara", "oprit"] as const;
export type Reason = (typeof REASONS)[number];

/**
 * De ce n-ar trebui socotit contul nou (sau null): același email ca al celui care invită, un telefon/calculator pe care a mai
 * intrat el, aceeași adresă IP ca a lui în ultimele 24 de ore, sau un email de unică folosință.
 */
export async function selfInviteReason(db: Pick<Db, "select">, o: { referrerId: string; email: string; ip: string | null; deviceId: string | null; now?: Date }): Promise<Reason | null> {
  const now = o.now ?? new Date();
  const [ref] = await db.select({ email: user.email }).from(user).where(eq(user.id, o.referrerId));
  if (ref && baseEmail(ref.email) === baseEmail(o.email)) return "acelasi-email";
  if (o.deviceId) {
    const [d] = await db.select({ h: knownDevice.deviceHash }).from(knownDevice)
      .where(and(eq(knownDevice.userId, o.referrerId), eq(knownDevice.deviceHash, deviceHash(o.deviceId)))).limit(1);
    if (d) return "acelasi-dispozitiv";
  }
  if (o.ip) {
    const [s] = await db.select({ id: session.id }).from(session)
      .where(and(eq(session.userId, o.referrerId), eq(session.ipAddress, o.ip), gt(session.updatedAt, new Date(now.getTime() - DAY)))).limit(1);
    if (s) return "aceeasi-ip";
  }
  if (isDisposable(o.email)) return "email-temporar";
  return null;
}

/**
 * Trece contul nou pe cel care l-a invitat (o singură dată pe cont). `via`: „link” (codul personal) sau „arbore” (invitația
 * într-un arbore). Dacă cel care invită a ales un arbore de arătat, contul nou intră în el doar să vadă.
 * Întoarce rândul făcut (sau null dacă nu s-a făcut nimic).
 */
export async function attachReferral(db: Db, o: {
  referredId: string; referrerId: string; via: "link" | "arbore"; email: string; headers?: Headers | null; shareTreeId?: string | null; now?: Date;
}) {
  const now = o.now ?? new Date();
  if (o.referrerId === o.referredId) return null;
  const s = await inviteSettings(db);
  const h = o.headers ?? null;
  const reason = !s.on ? "oprit" : await selfInviteReason(db, {
    referrerId: o.referrerId, email: o.email, ip: h ? clientIp(h) : null, deviceId: cookieValue(h?.get("cookie"), DEVICE_COOKIE), now,
  });
  const [row] = await db.insert(inviteReferral).values({
    referredId: o.referredId, referrerId: o.referrerId, via: o.via, status: reason ? "respins" : "asteapta", reason, createdAt: now,
  }).onConflictDoNothing().returning();
  if (!row) return null;
  if (!reason && s.shareTree && o.shareTreeId) {
    // Arborele ales e arătat doar cât cel care invită mai e proprietar sau editor în el.
    const [m] = await db.select({ role: treeMember.role }).from(treeMember).where(and(eq(treeMember.treeId, o.shareTreeId), eq(treeMember.userId, o.referrerId)));
    if (m && (m.role === "owner" || m.role === "editor"))
      await db.insert(treeMember).values({ treeId: o.shareTreeId, userId: o.referredId, role: "viewer", invitedBy: o.referrerId, joinedAt: now }).onConflictDoNothing();
  }
  if (!reason) {
    const [r] = await db.select({ name: user.name }).from(user).where(eq(user.id, o.referrerId));
    await addNotice(db, o.referredId, "invitatie-bun-venit", { name: firstName(r?.name), days: s.daysReferrer + s.daysReferred > 0 ? s.daysReferred : 0 });
  }
  return row;
}

/** Contul nou, la facere (src/lib/auth.ts): dacă a venit cu un cod, îl trece pe cel care l-a invitat. */
export async function referralOnSignup(db: Db, u: { id: string; email: string }, h: Headers | null | undefined, now = new Date()) {
  const code = codeFromRequest(h);
  await ensureInviteCode(db, u.id).catch((e) => console.error("invitatii: codul contului nou", e));
  if (!code) return null;
  const owner = await ownerOfCode(db, code);
  if (!owner) return null;
  return attachReferral(db, { referredId: u.id, referrerId: owner.userId, via: "link", email: u.email, headers: h, shareTreeId: owner.shareTreeId, now });
}

/* ------------------------------ Răsplata ------------------------------ */

/** Dovada unui om adevărat: email confirmat sau intrare cu Google, și câte rude a adăugat el în arbori. */
export async function proofOf(db: Pick<Db, "select">, userId: string) {
  const [u] = await db.select({ verified: user.emailVerified }).from(user).where(eq(user.id, userId));
  const [g] = await db.select({ id: account.id }).from(account).where(and(eq(account.userId, userId), eq(account.providerId, "google"))).limit(1);
  // O rudă adăugată de el (fișa lui proprie, făcută odată cu arborele, nu se socotește).
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(person)
    .where(and(eq(person.createdBy, userId), sql`${person.claimedByUserId} is distinct from ${userId}`));
  return { verified: !!u?.verified, google: !!g, persons: Number(n) };
}

/**
 * Adaugă zile unui om: la anul plătit (cu dată), direct la an; altfel la zilele gratuite (sau la primul an din beta), de la
 * sfârșitul lor ori de azi, dacă s-au terminat. Cei „gratuit mereu” nu au nevoie de zile. Întoarce noua dată (sau null).
 */
export async function grantDays(db: Db, userId: string, days: number, now = new Date()): Promise<Date | null> {
  if (days <= 0) return null;
  const s = await planSettings(db);
  const sim = s.on ? s : { ...s, on: true, startedAt: now.toISOString() };
  const [u] = await db.select({
    email: user.email, emailVerified: user.emailVerified, createdAt: user.createdAt, freeUntil: user.freeUntil,
    plan: accountPlan.plan, paidUntil: accountPlan.paidUntil, tier: accountPlan.tier, keepUntil: accountPlan.keepUntil,
  }).from(user).leftJoin(accountPlan, eq(accountPlan.userId, user.id)).where(eq(user.id, userId));
  if (!u) return null;
  const exempt = isDemo(u.email) || isAdminUser(u);
  const a = accessFor({ createdAt: u.createdAt, plan: isPlan(u.plan) ? u.plan : null, paidUntil: u.paidUntil, tier: isTier(u.tier) ? u.tier : null, exempt,
    keepUntil: u.keepUntil, freeUntil: u.freeUntil }, sim, now);
  if (a.kind === "mereu" || (a.kind === "platit" && !a.until)) return null;
  if (a.kind === "platit" && a.until) {
    const until = new Date(a.until.getTime() + days * DAY);
    await db.update(accountPlan).set({ paidUntil: until, updatedAt: now }).where(eq(accountPlan.userId, userId));
    return until;
  }
  const from = a.kind === "proba" || a.kind === "beta" ? a.until : now;
  const until = new Date(Math.max(from.getTime(), now.getTime()) + days * DAY);
  await db.update(user).set({ freeUntil: until }).where(eq(user.id, userId));
  return until;
}

/** Câte rude i-au adus deja zile omului luna aceasta. */
export async function rewardsThisMonth(db: Pick<Db, "select">, referrerId: string, now = new Date()) {
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(inviteReferral)
    .where(and(eq(inviteReferral.referrerId, referrerId), eq(inviteReferral.status, "acordat"), gt(inviteReferral.daysReferrer, 0), gte(inviteReferral.rewardedAt, month)));
  return Number(n);
}

export type RewardResult = { status: "acordat"; referrerId: string; referrerDays: number; referredDays: number; referrerUntil: Date | null; referredUntil: Date | null } | { status: "asteapta" | "nimic" };

/**
 * Se cheamă după ce omul își confirmă emailul, adaugă o persoană sau deschide „Invitațiile mele” (și o dată pe zi, pentru toți):
 * dacă a venit printr-o invitație și acum are dovada, se dau zilele, o singură dată.
 */
export async function checkReward(db: Db, referredId: string, now = new Date(), mail: typeof sendRewardMail | null = sendRewardMail): Promise<RewardResult> {
  const [row] = await db.select().from(inviteReferral).where(eq(inviteReferral.referredId, referredId));
  if (!row || row.status !== "asteapta") return { status: "nimic" };
  const s = await inviteSettings(db);
  if (!s.on) return { status: "asteapta" };
  const p = await proofOf(db, referredId);
  if (!(p.verified || p.google) || (s.requirePerson && p.persons < 1)) return { status: "asteapta" };
  const capped = s.monthlyCap > 0 && (await rewardsThisMonth(db, row.referrerId, now)) >= s.monthlyCap;
  const referrerDays = capped ? 0 : s.daysReferrer;
  // Doar o dată: rândul trece din „asteapta” în „acordat” într-un singur pas; o a doua cerere în paralel nu mai găsește nimic.
  const [claimed] = await db.update(inviteReferral).set({
    status: "acordat", reason: capped ? "limita-lunara" : null, daysReferrer: referrerDays, daysReferred: s.daysReferred, rewardedAt: now,
  }).where(and(eq(inviteReferral.referredId, referredId), eq(inviteReferral.status, "asteapta"))).returning({ id: inviteReferral.referredId });
  if (!claimed) return { status: "nimic" };
  const referrerUntil = await grantDays(db, row.referrerId, referrerDays, now);
  const referredUntil = await grantDays(db, referredId, s.daysReferred, now);
  const [ref, inv] = await Promise.all([
    db.select({ name: user.name }).from(user).where(eq(user.id, row.referrerId)).then((r) => r[0]),
    db.select({ name: user.name }).from(user).where(eq(user.id, referredId)).then((r) => r[0]),
  ]);
  await db.update(userNotice).set({ readAt: now }).where(and(eq(userNotice.userId, referredId), eq(userNotice.kind, "invitatie-bun-venit"), isNull(userNotice.readAt)));
  if (referrerDays > 0) await addNotice(db, row.referrerId, "invitatie-rasplata", { name: firstName(inv?.name), days: referrerDays });
  else await addNotice(db, row.referrerId, "invitatie-limita", { name: firstName(inv?.name) });
  if (s.daysReferred > 0) await addNotice(db, referredId, "invitatie-primita", { name: firstName(ref?.name), days: s.daysReferred });
  if (referrerDays > 0 && mail) await mail(db, row.referrerId, firstName(inv?.name), referrerDays, referrerUntil).catch((e) => console.error("invitatii: emailul", e));
  return { status: "acordat", referrerId: row.referrerId, referrerDays, referredDays: s.daysReferred, referrerUntil, referredUntil };
}

/** O dată pe zi (ceasul din Admin → Autonomie): invitațiile din ultimele 60 de zile care încă așteaptă. */
export async function sweepRewards(db: Db, now = new Date()) {
  const rows = await db.select({ id: inviteReferral.referredId }).from(inviteReferral)
    .where(and(eq(inviteReferral.status, "asteapta"), gt(inviteReferral.createdAt, new Date(now.getTime() - 60 * DAY))));
  let given = 0;
  for (const r of rows) if ((await checkReward(db, r.id, now).catch(() => ({ status: "nimic" }))).status === "acordat") given++;
  return { checked: rows.length, given };
}

/* ------------------------------ Vești în cont ------------------------------ */

export const NOTICE_KINDS = ["invitatie-rasplata", "invitatie-primita", "invitatie-bun-venit", "invitatie-limita"] as const;
export type NoticeKind = (typeof NOTICE_KINDS)[number];

export async function addNotice(db: Pick<Db, "insert">, userId: string, kind: NoticeKind, data: Record<string, string | number>) {
  await db.insert(userNotice).values({ userId, kind, data });
}

export async function unreadNotices(db: Pick<Db, "select">, userId: string) {
  return db.select({ id: userNotice.id, kind: userNotice.kind, data: userNotice.data, createdAt: userNotice.createdAt }).from(userNotice)
    .where(and(eq(userNotice.userId, userId), isNull(userNotice.readAt))).orderBy(desc(userNotice.createdAt)).limit(3);
}

export async function closeNotice(db: Pick<Db, "update">, userId: string, id: string, now = new Date()) {
  await db.update(userNotice).set({ readAt: now }).where(and(eq(userNotice.id, id), eq(userNotice.userId, userId)));
}

/* ------------------------------ Emailul către cel care a invitat ------------------------------ */

export async function sendRewardMail(db: Pick<Db, "select">, userId: string, who: string, days: number, until: Date | null) {
  const [u] = await db.select({ name: user.name, email: user.email, locale: user.locale }).from(user).where(eq(user.id, userId));
  if (!u?.email || isDemo(u.email)) return null;
  const { renderMail, footerFor } = await import("./emailuri");
  const { sendEmail, siteInbox } = await import("./email");
  const { getAppName, getT } = await import("@/i18n/server");
  const { SITE_URL } = await import("./site-url");
  const l: Locale = isLocale(u.locale) ? u.locale : "ro";
  const [t, app] = await Promise.all([getT("InviteMail", l), getAppName(l)]);
  const blocks: Parameters<typeof renderMail>[0] = [
    { p: firstName(u.name) ? t("hello", { name: firstName(u.name) }) : t("helloNoName") },
    { p: t("body", { who: who || t("someone"), app, days: String(days) }) },
  ];
  if (until) blocks.push({ p: t("until", { date: new Intl.DateTimeFormat(l, { dateStyle: "long", timeZone: "Europe/Bucharest" }).format(until) }) });
  blocks.push({ button: t("button"), href: `${SITE_URL}/invitatii` }, { p: t("thanks") });
  const { html, text } = renderMail(blocks, await footerFor(l));
  return sendEmail({ to: u.email, subject: t("subject", { days: String(days) }), html, text, replyTo: siteInbox(), tag: "invitatie", idempotencyKey: `invitatie/${userId}/${who}/${until?.getTime() ?? 0}` });
}

/* ------------------------------ „Invitațiile mele” și Admin ------------------------------ */

export async function myInvites(db: Pick<Db, "select">, userId: string) {
  const [clicks] = await db.select({ n: sql<number>`coalesce(sum(${inviteClick.clicks}), 0)::int` }).from(inviteClick).where(eq(inviteClick.userId, userId));
  const people = await db.select({ name: user.name, status: inviteReferral.status, reason: inviteReferral.reason, days: inviteReferral.daysReferrer, at: inviteReferral.createdAt })
    .from(inviteReferral).innerJoin(user, eq(user.id, inviteReferral.referredId)).where(eq(inviteReferral.referrerId, userId)).orderBy(desc(inviteReferral.createdAt)).limit(200);
  const [mine] = await db.select({ referrerId: inviteReferral.referrerId, status: inviteReferral.status, name: user.name }).from(inviteReferral)
    .innerJoin(user, eq(user.id, inviteReferral.referrerId)).where(eq(inviteReferral.referredId, userId));
  return {
    clicks: Number(clicks?.n ?? 0),
    accounts: people.filter((p) => p.status !== "respins").length,
    rewarded: people.filter((p) => p.status === "acordat").length,
    daysEarned: people.reduce((a, p) => a + (p.status === "acordat" ? p.days : 0), 0),
    people: people.map((p) => ({ ...p, name: firstName(p.name) })),
    invitedBy: mine ? { name: firstName(mine.name), status: mine.status } : null,
  };
}

const n = (v: unknown) => Number(v ?? 0) || 0;

/** Pentru Admin → Invitații: totalurile, ultimele invitații și cei care au adus cele mai multe conturi. */
export async function adminInvites(db: Db, now = new Date()) {
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [tot] = ((await db.execute(sql`select
      (select coalesce(sum(clicks), 0) from invite_click) as clicks,
      (select coalesce(sum(clicks), 0) from invite_click where day >= ${month.toISOString().slice(0, 10)}) as clicks_month,
      count(*) as accounts,
      count(*) filter (where status = 'asteapta') as waiting,
      count(*) filter (where status = 'acordat') as rewarded,
      count(*) filter (where status = 'respins') as rejected,
      count(*) filter (where created_at >= ${month}) as accounts_month,
      coalesce(sum(days_referrer + days_referred) filter (where status = 'acordat'), 0) as days,
      count(distinct referrer_id) as inviters,
      (select count(*) from "user") as users,
      (select count(*) from invite_referral r join account_plan p on p.user_id = r.referred_id where p.paid_until is not null) as paid
    from invite_referral`)).rows ?? []) as Record<string, unknown>[];
  const list = await db.select({
    at: inviteReferral.createdAt, via: inviteReferral.via, status: inviteReferral.status, reason: inviteReferral.reason,
    daysReferrer: inviteReferral.daysReferrer, daysReferred: inviteReferral.daysReferred, rewardedAt: inviteReferral.rewardedAt,
    referredId: inviteReferral.referredId, referrerId: inviteReferral.referrerId,
  }).from(inviteReferral).orderBy(desc(inviteReferral.createdAt)).limit(200);
  const ids = [...new Set(list.flatMap((r) => [r.referredId, r.referrerId]))];
  const names = new Map<string, { name: string; email: string }>();
  if (ids.length) {
    const us = ((await db.execute(sql`select id, name, email from "user" where id in (${sql.join(ids.map((i) => sql`${i}`), sql`, `)})`)).rows ?? []) as Record<string, unknown>[];
    for (const u of us) names.set(String(u.id), { name: String(u.name ?? ""), email: String(u.email ?? "") });
  }
  const top = ((await db.execute(sql`select r.referrer_id as id, u.name, u.email, count(*) as accounts,
      count(*) filter (where r.status = 'acordat') as rewarded, coalesce(sum(r.days_referrer) filter (where r.status = 'acordat'), 0) as days,
      count(*) filter (where r.status = 'respins') as rejected,
      (select coalesce(sum(c.clicks), 0) from invite_click c where c.user_id = r.referrer_id) as clicks
    from invite_referral r join "user" u on u.id = r.referrer_id group by r.referrer_id, u.name, u.email order by rewarded desc, accounts desc limit 20`)).rows ?? []) as Record<string, unknown>[];
  return {
    totals: {
      clicks: n(tot?.clicks), clicksMonth: n(tot?.clicks_month), accounts: n(tot?.accounts), accountsMonth: n(tot?.accounts_month), waiting: n(tot?.waiting),
      rewarded: n(tot?.rewarded), rejected: n(tot?.rejected), days: n(tot?.days), inviters: n(tot?.inviters), users: n(tot?.users), paid: n(tot?.paid),
    },
    list: list.map((r) => ({ ...r, referred: names.get(r.referredId) ?? null, referrer: names.get(r.referrerId) ?? null })),
    top: top.map((t) => ({ id: String(t.id), name: String(t.name ?? ""), email: String(t.email ?? ""), accounts: n(t.accounts), rewarded: n(t.rewarded),
      days: n(t.days), rejected: n(t.rejected), clicks: n(t.clicks) })),
  };
}

/** Arborii pe care omul îi poate arăta prin legătura lui (al lui sau unde e editor). */
export async function shareableTrees(db: Pick<Db, "select">, userId: string) {
  return db.select({ id: tree.id, name: tree.name }).from(treeMember).innerJoin(tree, eq(tree.id, treeMember.treeId))
    .where(and(eq(treeMember.userId, userId), sql`${treeMember.role} in ('owner', 'editor')`)).orderBy(tree.name);
}
