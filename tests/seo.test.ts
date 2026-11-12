import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { matchWatched, mergeKeywords, parseServiceAccount, parseVerification, parseWatch, periods, pickSite, sealCredentials, activeServiceAccount } from "@/lib/seo";

describe("Admin → SEO", () => {
  it("scoate codul din meta tag-ul Google sau îl ia așa cum e", () => {
    expect(parseVerification('<meta name="google-site-verification" content="AbC_123-xyz987654" />')).toBe("AbC_123-xyz987654");
    expect(parseVerification("  AbC_123-xyz987654 ")).toBe("AbC_123-xyz987654");
    expect(parseVerification("<script>")).toBeNull();
    expect(parseVerification("")).toBeNull();
  });

  it("cuvintele urmărite: pe rânduri sau cu virgulă, fără dubluri, cu litere mici", () => {
    expect(parseWatch("Arbore genealogic\narbore  genealogic, Cartea Neamului;\n\n")).toEqual(["arbore genealogic", "cartea neamului"]);
  });

  it("cheia contului de serviciu: JSON sau base64, păstrată criptată și citită înapoi", () => {
    const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 1024 });
    const json = JSON.stringify({ type: "service_account", client_email: "seo@p.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) });
    expect(parseServiceAccount(json)?.client_email).toBe("seo@p.iam.gserviceaccount.com");
    expect(parseServiceAccount(Buffer.from(json).toString("base64"))?.client_email).toBe("seo@p.iam.gserviceaccount.com");
    expect(parseServiceAccount('{"client_email":"x"}')).toBeNull();
    const sealed = sealCredentials(json);
    expect(sealed).not.toContain("PRIVATE");
    const got = activeServiceAccount({ verification: null, siteUrl: null, credentials: sealed, watch: [] });
    expect(got?.source).toBe("panou");
    expect(got?.account.client_email).toBe("seo@p.iam.gserviceaccount.com");
  });

  it("alege proprietatea domeniului, apoi pe cea cu https", () => {
    const sites = [{ siteUrl: "https://altceva.ro/", permissionLevel: "siteOwner" }, { siteUrl: "https://carteaneamului.ro/", permissionLevel: "siteFullUser" }];
    expect(pickSite(sites, null, "https://carteaneamului.ro")).toBe("https://carteaneamului.ro/");
    expect(pickSite([...sites, { siteUrl: "sc-domain:carteaneamului.ro", permissionLevel: "siteOwner" }], null, "https://carteaneamului.ro")).toBe("sc-domain:carteaneamului.ro");
    expect(pickSite(sites, "https://altceva.ro/", "https://carteaneamului.ro")).toBe("https://altceva.ro/");
    expect(pickSite([{ siteUrl: "https://carteaneamului.ro/", permissionLevel: "siteUnverifiedUser" }], null, "https://carteaneamului.ro")).toBeNull();
  });

  it("perioadele se termină ieri și cea de dinainte are aceeași lungime", () => {
    expect(periods(7, new Date("2026-11-12T10:00:00Z"))).toEqual({ cur: { start: "2026-11-05", end: "2026-11-11" }, prev: { start: "2026-10-29", end: "2026-11-04" } });
  });

  it("cuvintele: locul de înainte, cele noi și cele urmărite", () => {
    const row = (q: string, impressions: number, position: number) => ({ keys: [q], clicks: 0, impressions, ctr: 0, position });
    const k = mergeKeywords([row("arbore genealogic", 50, 12), row("arbore genealogic online", 5, 30)], [row("arbore genealogic", 40, 18)]);
    expect(k[0]).toMatchObject({ query: "arbore genealogic", prevPosition: 18, isNew: false });
    expect(k[1].isNew).toBe(true);
    const w = matchWatched(["arbore genealogic", "cartea neamului"], k);
    expect(w[0].exact?.position).toBe(12);
    expect(w[0].relatedCount).toBe(1);
    expect(w[1].exact).toBeNull();
  });
});
