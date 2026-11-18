import { describe, expect, it, beforeAll } from "vitest";
import { eq } from "drizzle-orm";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { crmActivities, crmOrganizations } from "@/db/schema";
import { isSuppressed, orgByEmail, upsertOrg } from "@/lib/crm";
import { authState, bouncedRecipient, checkAuthState, classifyMessage, fromAddress, gmailState, replyText, saveGmailState, seal, syncGmail, unseal, type GmailMessage } from "@/lib/crm-gmail";

const now = new Date("2026-11-18T09:00:00Z");
const b64 = (s: string) => Buffer.from(s).toString("base64url");
const msg = (id: string, from: string, subject: string, body: string, extra: { name: string; value: string }[] = []): GmailMessage => ({
  id, internalDate: String(now.getTime() - 3600_000), snippet: body.slice(0, 80),
  payload: { mimeType: "multipart/alternative", headers: [{ name: "From", value: from }, { name: "Subject", value: subject }, ...extra], parts: [{ mimeType: "text/plain", body: { data: b64(body) } }] },
});

beforeAll(() => {
  process.env.GMAIL_CLIENT_ID = "id-test";
  process.env.GMAIL_CLIENT_SECRET = "secret-test";
});

describe("bucățile", () => {
  it("cheia criptată și semnătura legării", () => {
    expect(unseal(seal("abc"))).toBe("abc");
    expect(unseal("stricat")).toBeNull();
    const s = authState("u1", now);
    expect(checkAuthState("u1", s, now)).toBe(true);
    expect(checkAuthState("u2", s, now)).toBe(false);
    expect(checkAuthState("u1", s, new Date(now.getTime() + 20 * 60_000))).toBe(false);
  });
  it("adresa, citatul, clasificarea, notificarea de nelivrare", () => {
    expect(fromAddress("Școala 1 <Secretariat@Scoala1.ro>")).toBe("secretariat@scoala1.ro");
    expect(replyText("Da, suntem interesați.\n\nOn Tue, 17 Nov 2026 at 10:00, Daniel <contact@carteaneamului.ro> wrote:\n> textul nostru")).toBe("Da, suntem interesați.");
    expect(replyText("Mulțumim.\nÎn mar., 17 nov. 2026, Daniel a scris:\n> x")).toBe("Mulțumim.");
    const ooo = msg("1", "a@b.ro", "Re: Proiect", "Sunt la birou luni.", [{ name: "Auto-Submitted", value: "auto-replied" }]);
    expect(classifyMessage(ooo, "Sunt la birou luni.")).toBe("automat");
    expect(classifyMessage(msg("2", "a@b.ro", "Automatic reply: Proiect", ""), "")).toBe("automat");
    expect(classifyMessage(msg("3", "a@b.ro", "Re: Proiect", ""), "Nu suntem interesați, mulțumim.")).toBe("refuz");
    expect(classifyMessage(msg("4", "a@b.ro", "Re: Proiect", ""), "Vă rog să ne scoateți din listă.")).toBe("dezabonare");
    expect(classifyMessage(msg("5", "a@b.ro", "Re: Proiect", ""), "Suntem interesați, trimiteți-ne detalii.")).toBe("interesat");
    const dsn = msg("6", "Mail Delivery Subsystem <mailer-daemon@googlemail.com>", "Delivery Status Notification (Failure)", "Address not found", [{ name: "X-Failed-Recipients", value: "office@nu-exista.ro" }]);
    expect(bouncedRecipient(dsn, "Address not found")).toBe("office@nu-exista.ro");
    expect(bouncedRecipient(msg("7", "a@b.ro", "x", ""), "")).toBeNull();
  });
});

describe("organizația după expeditor", () => {
  it("adresa exactă, apoi domeniul propriu (dar niciodată un domeniu gratuit)", async () => {
    const db = createDb();
    await runMigrations(db);
    const a = await upsertOrg(db, { tip: "scoala", nume: "Școala A", emailOficial: "secretariat@scoala-a.ro" });
    const y = await upsertOrg(db, { tip: "scoala", nume: "Școala Y", emailOficial: "scoalay@yahoo.com" });
    expect((await orgByEmail(db, "secretariat@scoala-a.ro"))?.id).toBe(a.id);
    expect((await orgByEmail(db, "director@scoala-a.ro"))?.id).toBe(a.id);
    expect((await orgByEmail(db, "scoalay@yahoo.com"))?.id).toBe(y.id);
    expect(await orgByEmail(db, "altcineva@yahoo.com")).toBeNull();
  });
});

describe("sincronizarea (fără rețea)", () => {
  it("doar mesajele de la organizații din CRM; clasifică, pune pe „nu contacta”, nelivrat → de sunat; a doua oară nimic nou", async () => {
    const db = createDb();
    await runMigrations(db);
    await upsertOrg(db, { tip: "scoala", nume: "Școala A", emailOficial: "secretariat@scoala-a.ro" });
    await upsertOrg(db, { tip: "scoala", nume: "Școala B", emailOficial: "secretariat@scoala-b.ro" });
    await upsertOrg(db, { tip: "firma", nume: "Firma C", emailOficial: "office@firma-c.ro" });
    await upsertOrg(db, { tip: "firma", nume: "Firma D", emailOficial: "office@nu-exista.ro" });
    expect((await syncGmail(db, { now })).skipped).toMatch(/nu e legat/);
    await saveGmailState(db, { sealed: seal("refresh-test") });
    const box: GmailMessage[] = [
      msg("m1", "Director <director@scoala-a.ro>", "Re: Proiect", "Suntem interesați, trimiteți-ne detalii.\n\nOn Tue wrote:\n> ..."),
      msg("m2", "secretariat@scoala-b.ro", "Re: Proiect", "Vă rugăm să ne scoateți din lista dumneavoastră."),
      msg("m3", "o.persoana@gmail.com", "Salut", "Un mesaj personal care nu ține de CRM."),
      msg("m4", "office@firma-c.ro", "Automatic reply", "Sunt în concediu.", [{ name: "Auto-Submitted", value: "auto-replied" }]),
      msg("m5", "mailer-daemon@googlemail.com", "Delivery Status Notification (Failure)", "Address not found", [{ name: "X-Failed-Recipients", value: "office@nu-exista.ro" }]),
    ];
    const calls: string[] = [];
    const f = (async (url: string | URL) => {
      const u = String(url);
      calls.push(u);
      if (u.includes("oauth2.googleapis.com/token")) return Response.json({ access_token: "acc" });
      if (u.includes("/messages?")) return Response.json({ messages: box.map((m) => ({ id: m.id })) });
      const id = u.split("/messages/")[1].split("?")[0];
      return Response.json(box.find((m) => m.id === id));
    }) as typeof fetch;
    const r = await syncGmail(db, { now, f });
    expect(r).toMatchObject({ read: 5, matched: 4, replies: 3, bounces: 1 });
    expect(r.byKind).toEqual({ interesat: 1, dezabonare: 1, automat: 1 });
    const orgs = new Map((await db.select().from(crmOrganizations)).map((o) => [o.nume, o]));
    expect(orgs.get("Școala A")!.status).toBe("interesat");
    expect(orgs.get("Școala B")!.status).toBe("nu_contacta");
    expect(await isSuppressed(db, "secretariat@scoala-b.ro")).toBe(true);
    expect(orgs.get("Firma C")!.status).toBe("nou"); // auto-reply nu schimbă nimic
    expect(orgs.get("Firma D")).toMatchObject({ status: "nelivrat", deSunat: true });
    const replies = await db.select().from(crmActivities).where(eq(crmActivities.tip, "raspuns"));
    expect(replies.find((a) => a.rezumat?.startsWith("Suntem interesați"))!.rezumat).not.toContain("wrote");
    expect(JSON.stringify(await db.select().from(crmActivities))).not.toContain("personal");
    const st = await gmailState(db);
    expect(st.lastError).toBeNull();
    expect(st.afterMs).toBeGreaterThan(now.getTime() - 3600_000);
    expect(calls.every((c) => !c.includes("send") && !c.includes("modify"))).toBe(true);
    const r2 = await syncGmail(db, { now, f });
    expect(r2.replies + r2.bounces).toBe(0);
  });

  it("o eroare de la Google se păstrează pentru pagina Sănătate", async () => {
    const db = createDb();
    await runMigrations(db);
    await saveGmailState(db, { sealed: seal("refresh-test") });
    const f = (async () => Response.json({ error: "invalid_grant" }, { status: 400 })) as unknown as typeof fetch;
    const r = await syncGmail(db, { now, f });
    expect(r.error).toMatch(/expirat/);
    expect((await gmailState(db)).lastError).toMatch(/expirat/);
  });
});
