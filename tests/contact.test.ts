import { describe, expect, it } from "vitest";
import { checkContact, contactRateOk, whatsappUrl } from "@/lib/contact";

describe("contact", () => {
  it("face legătura de WhatsApp fără „+” sau „00”, cu salutul codat", () => {
    expect(whatsappUrl()).toBe("https://wa.me/40790541342");
    expect(whatsappUrl("Bună ziua!")).toBe("https://wa.me/40790541342?text=Bun%C4%83%20ziua!");
  });
  it("cere nume, un email bun și un mesaj", () => {
    expect(checkContact({ name: " ", email: "a@b.ro", message: "salut" })).toEqual({ problem: "name" });
    expect(checkContact({ name: "Ana", email: "nu-e-email", message: "salut" })).toEqual({ problem: "email" });
    expect(checkContact({ name: "Ana", email: "a@b.ro", message: "hm" })).toEqual({ problem: "message" });
    expect(checkContact({ name: " Ana ", email: "a@b.ro", message: " Salut! " })).toEqual({ ok: { name: "Ana", email: "a@b.ro", message: "Salut!" } });
  });
  it("oprește după 5 mesaje pe oră de la aceeași adresă", () => {
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(contactRateOk("ip-test", t + i)).toBe(true);
    expect(contactRateOk("ip-test", t + 10)).toBe(false);
    expect(contactRateOk("ip-test", t + 3_600_001)).toBe(true);
  });
});
