import { describe, expect, it } from "vitest";
import { isPlaceholder, placeholderLabel } from "@/lib/family";
import { LOCALES } from "@/i18n/locales";

describe("„Tată necunoscut” în limba celui care citește", () => {
  it("în fiecare limbă e tot un părinte fără nume (nu dublură, nu fișă în carte)", () => {
    for (const l of LOCALES) {
      expect(isPlaceholder(placeholderLabel("Tată necunoscut", "M", l)), l).toBe(true);
      expect(isPlaceholder(placeholderLabel("Mamă necunoscută", "F", l)), l).toBe(true);
    }
  });

  it("se scrie în limba omului, iar numele adevărate rămân neatinse", () => {
    expect(placeholderLabel("Tată necunoscut", "M", "de")).toBe("Unbekannter Vater");
    expect(placeholderLabel("Mamă necunoscută", "F", "hu")).toBe("Ismeretlen anya");
    expect(placeholderLabel("Unknown mother", "F", "ro")).toBe("Mamă necunoscută");
    expect(placeholderLabel("Tată necunoscut", "M")).toBe("Tată necunoscut");
    expect(placeholderLabel("Avram", "M", "fr")).toBe("Avram");
    expect(placeholderLabel("Necunoscut", "M", "en-GB")).toBe("Necunoscut");
  });
});

describe("nota pusă singură pe un părinte fără nume", () => {
  it("e recunoscută în fiecare limbă, ca la unire să nu treacă în fișa omului adevărat", async () => {
    const { AUTO_NOTE } = await import("@/lib/merge");
    const { createTranslator } = await import("use-intl/core");
    const { loadMessages } = await import("@/i18n/messages");
    for (const l of LOCALES) {
      const t = createTranslator({ locale: l, messages: await loadMessages(l), namespace: "TreeErrors" });
      expect(t("autoNoteSiblings", { name: "Ion" }), l).toMatch(AUTO_NOTE);
    }
  });
});
