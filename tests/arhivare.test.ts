import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createDb, type Db } from "@/db";
import { runMigrations } from "@/db/migrate";
import { accountPlan, appSetting, archivePlan, document, payment, tree, treeMember, user } from "@/db/schema";
import { DEFAULT_SETTINGS } from "@/lib/plans";
import { archiveAppliesTo, runArchive, saveArchiveSettings, treeArchiveState } from "@/lib/arhivare";
import { getObjectBytes, putObject } from "@/lib/storage";

/**
 * Arhiva sigilată (Daniel, 2026-11-14): fără plată, după un an rămân pozele în mic; cu cartea PDF, totul trece în arhivă 5 ani;
 * doar după emailurile de anunț; conturile vechi și arborii ținuți de cineva nu se ating.
 */
const DAY = 86_400_000;
const RULES_FROM = new Date("2026-12-01T00:00:00Z");
const T0 = new Date("2028-06-01T00:00:00Z"); // „azi” în test
let db: Db;
const sent: { to: string; subject: string; text: string }[] = [];
const mail = async (to: string, subject: string, text: string) => { sent.push({ to, subject, text }); return true; };
const env = process.env.NODE_ENV;

async function photo() {
  return new Uint8Array(await sharp({ create: { width: 1200, height: 900, channels: 3, background: { r: 180, g: 120, b: 60 } } }).jpeg({ quality: 90 }).toBuffer());
}

/** Un arbore cu titularul lui, o poză și un glas. `paidUntil` = sfârșitul anului plătit. */
async function family(id: string, opts: { createdAt?: Date; paidUntil: Date }) {
  await db.insert(user).values({ id, name: id, email: `${id}@test.ro`, createdAt: opts.createdAt ?? new Date("2027-01-10T00:00:00Z") });
  await db.insert(accountPlan).values({ userId: id, plan: "familie", tier: "basic", paidUntil: opts.paidUntil });
  const [t] = await db.insert(tree).values({ name: `Neamul ${id}`, ownerId: id }).returning({ id: tree.id });
  await db.insert(treeMember).values({ treeId: t.id, userId: id, role: "owner" });
  const pk = `arbori/${t.id}/documente/${id}-poza.jpg`, ak = `arbori/${t.id}/documente/${id}-glas.webm`;
  await putObject(pk, await photo(), "image/jpeg");
  await putObject(ak, new Uint8Array([1, 2, 3, 4, 5]), "audio/webm");
  const [p] = await db.insert(document).values({ treeId: t.id, kind: "photo", title: "Bunicii", fileKey: pk, mimeType: "image/jpeg", uploadedBy: id }).returning({ id: document.id });
  const [a] = await db.insert(document).values({ treeId: t.id, kind: "audio", title: "Glasul bunicii", fileKey: ak, mimeType: "audio/webm", uploadedBy: id }).returning({ id: document.id });
  return { treeId: t.id, photoId: p.id, audioId: a.id, photoKey: pk };
}
const doc = async (id: string) => (await db.select().from(document).where(eq(document.id, id)))[0];
const plan = async (treeId: string) => db.select().from(archivePlan).where(eq(archivePlan.treeId, treeId));

beforeAll(async () => {
  // Fișierele merg în ./.data/files (ca pe calculatorul de dezvoltare), sub un dosar al testului.
  (process.env as Record<string, string>).NODE_ENV = "development";
  db = createDb();
  await runMigrations(db);
  await db.insert(appSetting).values({ key: "planuri", value: { ...DEFAULT_SETTINGS, on: true, startedAt: "2026-01-01T00:00:00.000Z", betaDays: 0 } });
  await saveArchiveSettings(db, { on: true, freeYears: 1, sealYears: 5 }, null, RULES_FROM);
});
afterAll(async () => {
  (process.env as Record<string, string>).NODE_ENV = env!;
});

describe("arhiva sigilată", () => {
  it("fără plată: după un an și după anunțurile de 90, 30 și 7 zile, poza rămâne doar în mic; glasul nu se atinge", async () => {
    const f = await family("ana", { paidUntil: new Date("2027-02-01T00:00:00Z") });
    const st = await treeArchiveState(db, f.treeId, (await import("@/lib/arhivare")).DEFAULT_ARCHIVE, T0);
    expect(st.kind).toBe("oprit");
    const live = await treeArchiveState(db, f.treeId, { on: true, from: RULES_FROM.toISOString(), freeYears: 1, sealYears: 5 }, T0);
    expect(live.kind).toBe("liber");
    expect(live.kind === "liber" && live.next.event).toBe("reducere");

    sent.length = 0;
    let r = await runArchive(db, T0, { mail });
    expect(r.notices).toBe(1);
    expect(sent[0].to).toBe("ana@test.ro");
    expect(sent[0].subject).toContain("rămân doar în mic");
    const [p1] = await plan(f.treeId);
    // Regulile au venit târziu: ziua micșorării e la 90 de zile de la primul anunț, nu mai devreme.
    expect(p1.dueAt.getTime()).toBe(T0.getTime() + 90 * DAY);

    // A doua zi nu pleacă nimic; la 30 și la 7 zile înainte, câte un email.
    expect((await runArchive(db, new Date(T0.getTime() + DAY), { mail })).notices).toBe(0);
    expect((await runArchive(db, new Date(T0.getTime() + 61 * DAY), { mail })).notices).toBe(1);
    expect((await runArchive(db, new Date(T0.getTime() + 84 * DAY), { mail })).notices).toBe(1);
    expect(sent).toHaveLength(3);
    expect((await runArchive(db, new Date(T0.getTime() + 89 * DAY), { mail })).reduced).toBe(0);

    r = await runArchive(db, new Date(T0.getTime() + 91 * DAY), { mail });
    expect(r.reduced).toBe(1);
    const p = await doc(f.photoId);
    expect(p.reducedAt).not.toBeNull();
    expect(p.fileKey).toBe(p.previewKey);
    const small = await sharp(Buffer.from(await getObjectBytes(p.fileKey!))).metadata();
    expect(Math.max(small.width!, small.height!)).toBeLessThanOrEqual(480);
    await expect(getObjectBytes(f.photoKey)).rejects.toThrow();
    const a = await doc(f.audioId);
    expect(a.reducedAt).toBeNull();
    expect(a.fileKey).toContain("glas.webm");
    expect((await treeArchiveState(db, f.treeId, { on: true, from: RULES_FROM.toISOString(), freeYears: 1, sealYears: 5 }, new Date(T0.getTime() + 92 * DAY))).kind).toBe("redus");
  });

  it("cu cartea PDF: originalele trec în arhivă (poza ca AVIF, cu poza mică online) și se pot citi de acolo", async () => {
    const f = await family("bogdan", { paidUntil: new Date("2027-05-01T00:00:00Z") });
    await db.insert(payment).values({ id: "cs_carte_bogdan", userId: "bogdan", kind: "carte", treeId: f.treeId, amount: 9900, currency: "ron", createdAt: new Date("2027-04-20T00:00:00Z") });
    sent.length = 0;
    const t = new Date("2028-04-01T00:00:00Z"); // cu o lună înainte de sfârșitul anului cu originalele
    await runArchive(db, t, { mail });
    expect(sent.filter((m) => m.to === "bogdan@test.ro")[0].subject).toContain("arhiva sigilată");
    const [p1] = (await plan(f.treeId)).filter((x) => x.event === "arhivare");
    expect(p1.dueAt.toISOString()).toBe("2028-05-01T00:00:00.000Z");
    await runArchive(db, new Date("2028-04-24T00:00:00Z"), { mail });
    const r = await runArchive(db, new Date("2028-05-02T00:00:00Z"), { mail });
    expect(r.archived).toBe(2);
    const p = await doc(f.photoId);
    expect(p.fileKey!.startsWith("arhiva/")).toBe(true);
    expect(p.mimeType).toBe("image/avif");
    expect(p.previewKey).toBeTruthy();
    expect((await getObjectBytes(p.fileKey!)).length).toBeGreaterThan(0);
    await expect(getObjectBytes(f.photoKey)).rejects.toThrow();
    expect((await doc(f.audioId)).fileKey!.startsWith("arhiva/")).toBe(true);
    const st = await treeArchiveState(db, f.treeId, { on: true, from: RULES_FROM.toISOString(), freeYears: 1, sealYears: 5 }, new Date("2028-05-03T00:00:00Z"));
    expect(st.kind).toBe("sigilat");
    // Arhiva ține 5 ani de la cumpărarea cărții.
    expect(st.kind === "sigilat" && st.sealedUntil.getUTCFullYear()).toBe(2032);
  });

  it("nu se atinge nimic: cont de dinainte de reguli, arbore ținut de o rudă cu anul plătit, email care nu pleacă", async () => {
    const old = await family("vechi", { createdAt: new Date("2026-06-01T00:00:00Z"), paidUntil: new Date("2027-02-01T00:00:00Z") });
    expect(await archiveAppliesTo(db, "vechi")).toBeNull();
    expect((await archiveAppliesTo(db, "ana"))?.freeYears).toBe(1);

    const kept = await family("cosmin", { paidUntil: new Date("2027-02-01T00:00:00Z") });
    await db.insert(user).values({ id: "ruda", name: "Ruda", email: "ruda@test.ro", createdAt: new Date("2027-01-10T00:00:00Z") });
    await db.insert(accountPlan).values({ userId: "ruda", plan: "familie", tier: "basic", paidUntil: new Date("2030-01-01T00:00:00Z") });
    await db.insert(treeMember).values({ treeId: kept.treeId, userId: "ruda", role: "editor" });

    const quiet = await family("dan", { paidUntil: new Date("2027-02-01T00:00:00Z") });
    const r = await runArchive(db, T0, { mail: async () => false });
    expect(r.waiting).toBeGreaterThan(0);
    for (const f of [old, kept, quiet]) expect(await plan(f.treeId)).toHaveLength(0);
    for (let i = 0; i < 4; i++) await runArchive(db, new Date(T0.getTime() + (i + 1) * 40 * DAY), { mail: async () => false });
    for (const f of [old, kept, quiet]) expect((await doc(f.photoId)).reducedAt).toBeNull();
    expect((await treeArchiveState(db, old.treeId, { on: true, from: RULES_FROM.toISOString(), freeYears: 1, sealYears: 5 }, T0)).kind).toBe("vechi");
    expect((await treeArchiveState(db, kept.treeId, { on: true, from: RULES_FROM.toISOString(), freeYears: 1, sealYears: 5 }, T0)).kind).toBe("tinut");
  });

  it("cu regulile oprite din Admin nu face nimic", async () => {
    await saveArchiveSettings(db, { on: false, freeYears: 1, sealYears: 5 }, null);
    const r = await runArchive(db, T0, { mail });
    expect(r.skipped).toBeTruthy();
    await saveArchiveSettings(db, { on: true, freeYears: 1, sealYears: 5 }, null, RULES_FROM);
  });
});

afterAll(async () => {
  await rm(path.join(process.cwd(), ".data", "files", "arhiva"), { recursive: true, force: true }).catch(() => undefined);
});
