import { describe, expect, it } from "vitest";
import { cookieValue, deviceHash, deviceLabel, lockMinutes, normEmail, stripeAlert } from "@/lib/securitate";

const now = new Date("2026-11-13T12:00:00Z");
const ago = (min: number) => new Date(now.getTime() - min * 60_000);

describe("blocarea după prea multe greșeli", () => {
  it("nu blochează sub limită", () => {
    expect(lockMinutes([ago(1), ago(2), ago(3), ago(4)], 5, now)).toBe(0);
  });
  it("blochează la limită, până iese din fereastră a cincea greșeală", () => {
    expect(lockMinutes([ago(1), ago(2), ago(3), ago(4), ago(5)], 5, now)).toBe(10);
  });
  it("greșelile mai vechi de 15 minute nu se mai numără", () => {
    expect(lockMinutes([ago(1), ago(2), ago(16), ago(17), ago(18)], 5, now)).toBe(0);
  });
  it("cel puțin un minut, cât e blocat", () => {
    expect(lockMinutes([ago(0.1), ago(1), ago(2), ago(3), ago(14.9)], 5, now)).toBe(1);
  });
});

describe("dispozitivul și cookie-urile", () => {
  it("numește browserul și telefonul pe scurt", () => {
    expect(deviceLabel("Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36")).toBe("Chrome · Android");
    expect(deviceLabel("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1")).toBe("Safari · iPhone");
    expect(deviceLabel("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0")).toBe("Edge · Windows");
    expect(deviceLabel(null)).toBe("?");
  });
  it("citește un cookie din antet", () => {
    expect(cookieValue("a=1; cn_dispozitiv=abc-123; b=2", "cn_dispozitiv")).toBe("abc-123");
    expect(cookieValue("a=1", "cn_dispozitiv")).toBeNull();
  });
  it("amprenta nu e numărul din cookie", () => {
    expect(deviceHash("abc")).not.toContain("abc");
    expect(deviceHash("abc")).toBe(deviceHash("abc"));
  });
  it("emailul scris oricum e același", () => {
    expect(normEmail("  Ion@Exemplu.RO ")).toBe("ion@exemplu.ro");
    expect(normEmail(undefined)).toBe("");
  });
});

describe("evenimentele Stripe", () => {
  it("o plată contestată și un avertisment de fraudă ajung în jurnal", () => {
    expect(stripeAlert({ type: "charge.dispute.created", data: { object: { amount: 5000, currency: "ron", reason: "fraudulent", charge: "ch_1" } } }))
      .toEqual({ kind: "plata_disputa", detail: "50.00 RON · fraudulent · ch_1" });
    expect(stripeAlert({ type: "radar.early_fraud_warning.created", data: { object: { fraud_type: "card_stolen", charge: "ch_2" } } }))
      .toEqual({ kind: "plata_frauda", detail: "card_stolen · ch_2" });
  });
  it("plățile obișnuite nu", () => {
    expect(stripeAlert({ type: "checkout.session.completed", data: { object: {} } })).toBeNull();
  });
});
