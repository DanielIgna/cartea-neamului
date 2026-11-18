import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { sampleFamily } from "@/lib/carte-model";
import { buildBook } from "@/lib/book";

const W = { occ1: "plugar", occ2: "învățător", occ3: "croitoreasă", occ4: "inginer", bio1: "Povestea lui Ion.", bio2: "Povestea Anei.", memTitle: "Iarna", memQuestion: "Ce-ți amintești?", memBody: "Zăpada." };

describe("modelul cărții (oferta din 18.11.2026)", () => {
  it("e o familie închipuită: patru generații, poze desenate, o poveste, arborele și o amintire cu glas (pentru codul QR)", () => {
    const f = sampleFamily(W);
    const people = Object.values(f.people);
    expect(people.length).toBe(12);
    expect(people.every((p) => p.id.startsWith("m-") && p.photoId === null && p.documents.length === 0)).toBe(true);
    // Pozele sunt desene făcute aici, nu fișiere din arborele cuiva.
    expect(people.every((p) => p.accountImage?.startsWith("data:image/svg+xml"))).toBe(true);
    expect(f.memory).toMatchObject({ personId: "m-ana", audio: true, photoId: null });
    const model = buildBook({ people: f.people, rels: f.rels, raised: f.raised, centerId: f.centerId, slots: f.slots, options: { living: "tot", photos: true, format: "A4" } });
    expect(model.stats.people).toBe(12);
    expect(model.stats.generations).toBeGreaterThanOrEqual(4);
    expect(model.fanGenerations).toBeGreaterThanOrEqual(3);
    expect(model.tree).toBeTruthy();
    expect(model.generations.flatMap((g) => g.entries).find((e) => e.id === "m-ion")?.biography).toBe("Povestea lui Ion.");
  });

  it("pagina cărții nu citește arborele înainte să știe că omul are cartea: întâi bookAccess, apoi modelul sau datele", () => {
    const src = readFileSync("src/app/(site)/arbore/[id]/carte/page.tsx", "utf8");
    const page = src.slice(src.indexOf("export default async function BookPage"));
    const gate = page.indexOf("await bookAccess(");
    const sample = page.indexOf("if (!why) return <SampleBook");
    expect(gate).toBeGreaterThan(0);
    expect(sample).toBeGreaterThan(gate);
    for (const read of ["loadTreeView(", "bookMemories(", "from(bookExport)", "from(person)", "audioLeftOut("]) expect(page.indexOf(read), read).toBeGreaterThan(sample);
    // Modelul nu primește nimic din arbore, doar adresa lui (pentru butonul de plată).
    const fn = src.slice(src.indexOf("async function SampleBook"));
    for (const read of ["loadTreeView", "bookMemories", "db.select", "data."]) expect(fn.includes(read), read).toBe(false);
  });

  it("nu mai e nicio previzualizare a cărții reale și niciun buton pentru cartea tipărită", () => {
    const view = readFileSync("src/components/BookView.tsx", "utf8");
    expect(view).not.toMatch(/tipar=|printFrom|locked/);
    expect(view).toContain("bk-sample-mark");
  });
});
