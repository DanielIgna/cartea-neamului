import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";

/** Clientul Resend e înlocuit: nu pleacă nimic în afară, doar ținem minte ce s-ar fi trimis. */
const resendSend = vi.hoisted(() => vi.fn());
const resendCtor = vi.hoisted(() => vi.fn());
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resendSend };
    constructor(key: string) { resendCtor(key); }
  },
}));

import { EMAIL_FROM_DEFAULT, sendEmail } from "@/lib/email";

describe("sendEmail", () => {
  const env = { ...process.env };
  beforeEach(() => {
    resendSend.mockReset(); resendCtor.mockReset();
    delete process.env.RESEND_API_KEY; delete process.env.EMAIL_FROM; delete process.env.MAIL_FROM; delete process.env.REMINDER_FROM;
  });
  afterEach(() => { process.env = { ...env }; vi.restoreAllMocks(); });

  it("fără cheie sare curat: nu crapă, nu cheamă Resend, întoarce { skipped: true }", async () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const r = await sendEmail({ to: "ana@test.ro", subject: "Salut", html: "<p>x</p>", text: "x", tag: "test" });
    expect(r).toEqual({ skipped: true });
    expect(resendCtor).not.toHaveBeenCalled();
    expect(resendSend).not.toHaveBeenCalled();
    expect(String(info.mock.calls[0]?.[0])).toContain("sărit");
    expect(JSON.stringify(info.mock.calls)).not.toContain("ana@test.ro");
  });

  it("cu cheie trimite de la EMAIL_FROM (implicit contact@carteaneamului.ro), cu Reply-To", async () => {
    process.env.RESEND_API_KEY = "re_test";
    resendSend.mockResolvedValue({ data: { id: "m1" }, error: null });
    expect(await sendEmail({ to: "ana@test.ro", subject: "S", html: "<p>h</p>", text: "t", replyTo: "ion@test.ro" })).toEqual({ ok: true, id: "m1" });
    expect(resendSend.mock.calls[0][0]).toMatchObject({ from: EMAIL_FROM_DEFAULT, to: "ana@test.ro", replyTo: "ion@test.ro", html: "<p>h</p>", text: "t" });
    process.env.MAIL_FROM = "Vechi <vechi@carteaneamului.ro>";
    await sendEmail({ to: "a@b.ro", subject: "S", html: "h", text: "t" });
    expect(resendSend.mock.calls[1][0].from).toBe("Vechi <vechi@carteaneamului.ro>");
    process.env.EMAIL_FROM = "Nou <nou@carteaneamului.ro>";
    await sendEmail({ to: "a@b.ro", subject: "S", html: "h", text: "t", idempotencyKey: "k1" });
    expect(resendSend.mock.calls[2][0].from).toBe("Nou <nou@carteaneamului.ro>");
    expect(resendSend.mock.calls[2][1]).toEqual({ idempotencyKey: "k1" });
  });

  it("o greșeală Resend se scrie în jurnal fără adresă sau text și nu aruncă", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    resendSend.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "Invalid `to`: ana@test.ro", statusCode: 422 } });
    expect(await sendEmail({ to: "ana@test.ro", subject: "Mesaj de la Ana", html: "h", text: "secret" })).toEqual({ ok: false });
    resendSend.mockRejectedValueOnce(new TypeError("fetch failed for ana@test.ro"));
    expect(await sendEmail({ to: "ana@test.ro", subject: "Mesaj de la Ana", html: "h", text: "secret" })).toEqual({ ok: false });
    const logged = JSON.stringify(err.mock.calls);
    expect(logged).not.toContain("ana@test.ro");
    expect(logged).not.toContain("Ana");
    expect(logged).not.toContain("secret");
  });
});

/** Formularele: serverul Next și emailul sunt înlocuite, ca să vedem doar ce i se cere lui sendEmail. */
const sendEmailSpy = vi.hoisted(() => vi.fn());
const ip = vi.hoisted(() => ({ value: "10.0.0.1" }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": ip.value }),
  cookies: async () => ({ get: () => undefined, getAll: () => [] }),
}));

describe("formularul de contact", () => {
  beforeEach(() => { sendEmailSpy.mockReset(); sendEmailSpy.mockResolvedValue({ ok: true, id: "x" }); });

  async function load() {
    vi.resetModules();
    vi.doMock("@/lib/email", async (orig) => ({ ...(await orig<typeof import("@/lib/email")>()), sendEmail: sendEmailSpy }));
    vi.doMock("@/i18n/server", async (orig) => ({ ...(await orig<typeof import("@/i18n/server")>()), getLocale: async () => "ro" }));
    return (await import("@/app/contact-actions")).sendContactMessage;
  }
  const form = (v: Record<string, string>) => { const f = new FormData(); for (const [k, x] of Object.entries(v)) f.set(k, x); return f; };

  it("trimite notificarea la contact@carteaneamului.ro cu Reply-To = cel care a scris, apoi confirmarea către el", async () => {
    ip.value = "10.0.0.1";
    const send = await load();
    const r = await send(null, form({ name: "Ana Pop", email: "ana@test.ro", message: "Bună ziua, am o întrebare.", from: "/preturi" }));
    expect(r).toEqual({ ok: true });
    expect(sendEmailSpy).toHaveBeenCalledTimes(2);
    const [note, ack] = sendEmailSpy.mock.calls.map((c) => c[0]);
    expect(note).toMatchObject({ to: "contact@carteaneamului.ro", replyTo: "ana@test.ro", tag: "contact" });
    expect(note.text).toContain("Ana Pop");
    expect(note.text).toContain("ana@test.ro");
    expect(note.text).toContain("Bună ziua, am o întrebare.");
    expect(note.html).toContain("IGNA IOAN DANIEL PFA, CUI 51278711, Cluj-Napoca");
    expect(note.html).toContain("https://carteaneamului.ro");
    expect(note.html).not.toMatch(/<img/i);
    expect(ack).toMatchObject({ to: "ana@test.ro" });
    expect(ack.text).toContain("Am primit mesajul tău, revenim în curând.");
    expect(ack.text).not.toContain("am o întrebare");
  });

  it("textul omului e scăpat în HTML", async () => {
    ip.value = "10.0.0.2";
    const send = await load();
    await send(null, form({ name: "<b>Ion</b>", email: "ion@test.ro", message: "<script>x</script> salut" }));
    expect(sendEmailSpy.mock.calls[0][0].html).not.toContain("<script>");
    expect(sendEmailSpy.mock.calls[0][0].html).toContain("&lt;script&gt;");
  });

  it("honeypot-ul: robotul primește „trimis”, dar nu pleacă nimic", async () => {
    ip.value = "10.0.0.3";
    const send = await load();
    expect(await send(null, form({ name: "Bot", email: "bot@test.ro", message: "spam spam", website: "http://x" }))).toEqual({ ok: true });
    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  it("cel mult 5 trimiteri pe oră de pe același IP", async () => {
    ip.value = "10.0.0.4";
    const send = await load();
    for (let i = 0; i < 5; i++) expect(await send(null, form({ name: "Ana", email: "ana@test.ro", message: `mesajul ${i}` }))).toEqual({ ok: true });
    expect(await send(null, form({ name: "Ana", email: "ana@test.ro", message: "al șaselea" }))).toEqual({ error: "tooMany" });
  });
});

describe("webhook-ul Stripe", () => {
  it("trimite confirmarea plății o singură dată, chiar dacă evenimentul vine de două ori", async () => {
    vi.resetModules();
    sendEmailSpy.mockReset(); sendEmailSpy.mockResolvedValue({ ok: true, id: "x" });
    const { createDb } = await import("@/db");
    const { runMigrations } = await import("@/db/migrate");
    const { user } = await import("@/db/schema");
    const db = createDb();
    await runMigrations(db);
    await db.insert(user).values({ id: "plata-u1", name: "Maria", email: "maria@test.ro", locale: "ro" });
    vi.doMock("@/db", async (orig) => ({ ...(await orig<typeof import("@/db")>()), db }));
    vi.doMock("@/lib/email", async (orig) => ({ ...(await orig<typeof import("@/lib/email")>()), sendEmail: sendEmailSpy }));
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    const { POST } = await import("@/app/api/plata/stripe/route");

    const body = JSON.stringify({
      type: "checkout.session.completed",
      data: { object: { id: "cs_dublu", payment_status: "paid", amount_total: 14900, currency: "ron", metadata: { kind: "an", userId: "plata-u1", tier: "familie" } } },
    });
    const call = () => {
      const t = Math.floor(Date.now() / 1000);
      const sig = `t=${t},v1=${createHmac("sha256", "whsec_test").update(`${t}.${body}`).digest("hex")}`;
      return POST(new Request("https://carteaneamului.ro/api/plata/stripe", { method: "POST", body, headers: { "stripe-signature": sig } }));
    };
    expect((await call()).status).toBe(200);
    expect((await call()).status).toBe(200);
    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    const m = sendEmailSpy.mock.calls[0][0];
    expect(m).toMatchObject({ to: "maria@test.ro", idempotencyKey: "plata/cs_dublu", tag: "plata" });
    expect(m.text).toContain("Familie");
    expect(m.text).toContain("149 lei");
    expect(m.text).toMatch(/\/plata/);
    expect(m.html).toContain("IGNA IOAN DANIEL PFA");
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });
});
