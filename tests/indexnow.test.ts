import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { currentVersions, indexNowBody, indexNowKey, pendingPaths, runIndexNow } from "@/lib/seo/indexnow";
import { GET } from "@/app/api/indexnow/cheie/route";

/** IndexNow (planul SEO, secțiunea 8): cheia din mediu, fișierul cheii, ce se trimite și de câte ori. */
describe("IndexNow", () => {
  it("primește doar o cheie curată din INDEXNOW_KEY", () => {
    expect(indexNowKey({})).toBeNull();
    expect(indexNowKey({ INDEXNOW_KEY: "scurt" })).toBeNull();
    expect(indexNowKey({ INDEXNOW_KEY: "abc def 1234" })).toBeNull();
    expect(indexNowKey({ INDEXNOW_KEY: " a1b2c3d4e5f6a7b8 " })).toBe("a1b2c3d4e5f6a7b8");
  });

  it("trimite o pagină doar când i s-a schimbat versiunea și cel mult o dată pe zi", () => {
    const v = new Map([["/a", "h1"], ["/b", "h2"], ["/c", "h3"], ["/d", "h4"]]);
    const sent = { "/a": "h1 2026-11-10", "/b": "vechi 2026-11-10", "/c": "vechi 2026-11-18" };
    expect(pendingPaths(v, sent, "2026-11-18")).toEqual(["/b", "/d"]);
  });

  it("are versiuni pentru toate paginile din sitemap și cererea are forma cerută de IndexNow", () => {
    const v = currentVersions();
    expect(v.size).toBeGreaterThan(500);
    expect(v.get("/")).toBeTruthy();
    const b = indexNowBody("a1b2c3d4e5f6a7b8", ["/", "/cadouri"], "https://carteaneamului.ro");
    expect(b).toEqual({ host: "carteaneamului.ro", key: "a1b2c3d4e5f6a7b8", keyLocation: "https://carteaneamului.ro/a1b2c3d4e5f6a7b8.txt", urlList: ["https://carteaneamului.ro/", "https://carteaneamului.ro/cadouri"] });
  });

  it("fără cheie nu trimite nimic și nu atinge baza de date", async () => {
    const old = process.env.INDEXNOW_KEY;
    delete process.env.INDEXNOW_KEY;
    const db = { select: () => { throw new Error("nu"); }, insert: () => { throw new Error("nu"); } } as never;
    expect(await runIndexNow(db, { by: "test", fetcher: () => { throw new Error("nu"); } })).toEqual({ state: "fara-cheie", count: 0 });
    if (old) process.env.INDEXNOW_KEY = old;
  });

  it("cu cheie: trimite paginile, ține minte ce a trimis și a doua oară în aceeași zi nu mai trimite", async () => {
    const old = process.env.INDEXNOW_KEY;
    process.env.INDEXNOW_KEY = "a1b2c3d4e5f6a7b8";
    let stored: unknown = null;
    const db = {
      select: () => ({ from: () => ({ where: () => Promise.resolve(stored ? [{ value: stored }] : []) }) }),
      insert: () => ({ values: (v: { value: unknown }) => ({ onConflictDoUpdate: () => { stored = v.value; return Promise.resolve(); } }) }),
    } as never;
    const bodies: { urlList: string[] }[] = [];
    const fetcher = (async (_u: string, init: { body: string }) => { bodies.push(JSON.parse(init.body)); return new Response(null, { status: 202 }); }) as never;
    const now = new Date("2026-11-18T10:00:00Z");
    const first = await runIndexNow(db, { by: "test", fetcher, now });
    expect(first.state).toBe("trimis");
    expect(bodies[0].urlList.length).toBe(first.count);
    expect(bodies[0].urlList.every((u) => u.startsWith("https://carteaneamului.ro/"))).toBe(true);
    expect(await runIndexNow(db, { by: "test", fetcher, now })).toEqual({ state: "nimic-nou", count: 0 });
    expect(bodies).toHaveLength(1);
    expect((stored as { log: { status: number }[] }).log[0].status).toBe(202);
    if (old) process.env.INDEXNOW_KEY = old; else delete process.env.INDEXNOW_KEY;
  });

  it("fișierul cheii răspunde doar la cheia corectă, iar rewrite-ul e în next.config.ts", async () => {
    process.env.INDEXNOW_KEY = "a1b2c3d4e5f6a7b8";
    expect((await GET(new Request("https://carteaneamului.ro/api/indexnow/cheie?k=a1b2c3d4e5f6a7b8"))).status).toBe(200);
    expect(await (await GET(new Request("https://carteaneamului.ro/api/indexnow/cheie?k=a1b2c3d4e5f6a7b8"))).text()).toBe("a1b2c3d4e5f6a7b8");
    expect((await GET(new Request("https://carteaneamului.ro/api/indexnow/cheie?k=altceva1234"))).status).toBe(404);
    // După rewrite, adresa rămâne /<cheie>.txt.
    expect(await (await GET(new Request("https://carteaneamului.ro/a1b2c3d4e5f6a7b8.txt"))).text()).toBe("a1b2c3d4e5f6a7b8");
    expect((await GET(new Request("https://carteaneamului.ro/altceva1234.txt"))).status).toBe(404);
    delete process.env.INDEXNOW_KEY;
    expect((await GET(new Request("https://carteaneamului.ro/api/indexnow/cheie?k=a1b2c3d4e5f6a7b8"))).status).toBe(404);
    expect(readFileSync("next.config.ts", "utf8")).toContain('destination: "/api/indexnow/cheie?k=:key"');
    expect(readFileSync("src/app/api/cron/autonomie/route.ts", "utf8")).toContain("runIndexNow");
  });
});
