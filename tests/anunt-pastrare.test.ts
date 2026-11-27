import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createDb } from "@/db";
import { runMigrations } from "@/db/migrate";
import { user } from "@/db/schema";
import { dismissKeepNotice, keepNoticeState, showKeepNotice } from "@/lib/anunt-pastrare";

const D = 86_400_000;
const now = new Date("2026-12-10T10:00:00Z");
const old = new Date("2026-11-01T00:00:00Z"), fresh = new Date("2026-12-01T00:00:00Z");

describe("banda „Nou: Păstrarea”", () => {
  it("conturile vechi o văd o dată; după „Am înțeles” nu mai apare în afara ultimei luni", () => {
    expect(showKeepNotice({ createdAt: old, paidUntil: null, dismissed: null, now })).toBe(true);
    expect(showKeepNotice({ createdAt: fresh, paidUntil: null, dismissed: null, now })).toBe(false);
    const far = new Date(now.getTime() + 200 * D);
    expect(showKeepNotice({ createdAt: old, paidUntil: far, dismissed: { at: new Date(now.getTime() - 60 * D), times: 1 }, now })).toBe(false);
  });
  it("în ultimele 30 de zile ale anului plătit reapare rar: o dată pe săptămână, de cel mult câteva ori", () => {
    const end = new Date(now.getTime() + 20 * D);
    expect(showKeepNotice({ createdAt: fresh, paidUntil: end, dismissed: null, now })).toBe(true);
    // închisă înainte de fereastră: apare o dată când începe ultima lună
    expect(showKeepNotice({ createdAt: old, paidUntil: end, dismissed: { at: new Date(now.getTime() - 40 * D), times: 1 }, now })).toBe(true);
    expect(showKeepNotice({ createdAt: old, paidUntil: end, dismissed: { at: new Date(now.getTime() - 2 * D), times: 2 }, now })).toBe(false);
    expect(showKeepNotice({ createdAt: old, paidUntil: end, dismissed: { at: new Date(now.getTime() - 8 * D), times: 2 }, now })).toBe(true);
    expect(showKeepNotice({ createdAt: old, paidUntil: end, dismissed: { at: new Date(now.getTime() - 8 * D), times: 5 }, now })).toBe(false);
    // anul a expirat: nu mai apare
    expect(showKeepNotice({ createdAt: old, paidUntil: new Date(now.getTime() - D), dismissed: { at: new Date(now.getTime() - 9 * D), times: 1 }, now })).toBe(false);
  });
  it("„Am înțeles” se ține pe cont și numără închiderile", async () => {
    const db = createDb(); await runMigrations(db);
    await db.insert(user).values({ id: "u1", name: "Ana", email: "ana@exemplu.ro" });
    expect((await keepNoticeState(db, "u1")).dismissed).toBeNull();
    await dismissKeepNotice(db, "u1", now);
    await dismissKeepNotice(db, "u1", new Date(now.getTime() + D));
    const st = await keepNoticeState(db, "u1");
    expect(st.dismissed?.times).toBe(2);
    expect(st.dismissed?.at.getTime()).toBe(now.getTime() + D);
  });
  it("layout-ul nu ia constante din componenta „use client”", () => {
    const src = readFileSync("src/app/(site)/layout.tsx", "utf8");
    expect(src).not.toMatch(/import KeepNotice, \{/);
  });
});
