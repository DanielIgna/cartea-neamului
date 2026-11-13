import { describe, expect, it } from "vitest";
import { evaluate, gmailLinks } from "@/lib/email-domeniu";

const empty = { mx: [], txt: [], dmarc: [], resendDkim: [], sendMx: [] };
const ok = (r: Parameters<typeof evaluate>[0]) => Object.fromEntries(evaluate(r).map((c) => [c.key, c.ok]));

describe("adresa de email pe domeniu", () => {
  it("nimic pus: totul lipsește", () => {
    expect(ok(empty)).toEqual({ mx: false, spf: false, dmarc: false, resend: false });
  });
  it("ImprovMX + SPF cu Google + DMARC: gata de primit și trimis", () => {
    const r = ok({ ...empty,
      mx: [{ exchange: "mx1.improvmx.com.", priority: 10 }, { exchange: "MX2.improvmx.com", priority: 20 }],
      txt: ["google-site-verification=abc", "v=spf1 include:spf.improvmx.com include:_spf.google.com ~all"],
      dmarc: ["v=DMARC1; p=none;"] });
    expect(r).toEqual({ mx: true, spf: true, dmarc: true, resend: false });
  });
  it("două SPF-uri sau SPF fără Google nu trec", () => {
    const two = evaluate({ ...empty, txt: ["v=spf1 include:spf.improvmx.com ~all", "v=spf1 include:_spf.google.com ~all"] });
    expect(two.find((c) => c.key === "spf")).toMatchObject({ ok: false, found: "2 înregistrări SPF (trebuie una singură)" });
    expect(ok({ ...empty, txt: ["v=spf1 include:spf.improvmx.com ~all"] }).spf).toBe(false);
  });
  it("Resend: cheia DKIM și MX pe send", () => {
    expect(ok({ ...empty, resendDkim: ["p=MIGf"], sendMx: [{ exchange: "feedback-smtp.eu-west-1.amazonses.com", priority: 10 }] }).resend).toBe(true);
  });
  it("legăturile Gmail deschid contul potrivit", () => {
    const g = gmailLinks("a.b@gmail.com");
    expect(g.inbox).toBe("https://mail.google.com/mail/u/?authuser=a.b%40gmail.com#inbox");
    expect(g.toDomain).toContain("#search/to%3Acontact%40carteaneamului.ro");
  });
});
