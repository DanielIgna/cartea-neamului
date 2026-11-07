import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { IntlMessageFormat } from "intl-messageformat";
import { createTranslator } from "use-intl/core";
import { LANGUAGE_NAMES, LOCALES, localeFromAcceptLanguage, localeFromCookieHeader, type Locale } from "@/i18n/locales";
import { CLIENT_NAMESPACES, PAGE_NAMESPACES, loadMessages } from "@/i18n/messages";
import { persoane } from "@/lib/ro-words";

/** Felurile de bucăți dintr-un mesaj ICU, cum le numerotează formatjs (TYPE din icu-messageformat-parser). */
const T = { literal: 0, argument: 1, number: 2, date: 3, time: 4, select: 5, plural: 6, pound: 7, tag: 8 } as const;
type Node = { type: number; value?: string; options?: Record<string, { value: Node[] }>; children?: Node[] };

/** Fiecare text dintr-un catalog, cu drumul lui („Home.persons”). */
function leaves(obj: unknown, path: string[] = []): [string, string][] {
  if (typeof obj === "string") return [[path.join("."), obj]];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) => leaves(v, [...path, k]));
}

type Shape = { args: Map<string, string>; tags: Set<string>; selects: Map<string, Set<string>>; plurals: Map<string, Set<string>> };
const KIND: Record<number, string> = { [T.argument]: "text", [T.number]: "num", [T.plural]: "num", [T.date]: "date", [T.time]: "date", [T.select]: "select" };

/** Ce cere un mesaj de la cine îl folosește: valorile (cu felul lor), etichetele <b>…</b> și ramurile lui select/plural. */
function shape(msg: string, locale: string): Shape {
  const s: Shape = { args: new Map(), tags: new Set(), selects: new Map(), plurals: new Map() };
  const walk = (nodes: Node[]) => {
    for (const n of nodes) {
      if (n.type === T.tag) { s.tags.add(n.value!); walk(n.children ?? []); continue; }
      if (n.value === undefined || !(n.type in KIND)) continue;
      s.args.set(n.value, KIND[n.type]);
      if (n.type === T.select) s.selects.set(n.value, new Set(Object.keys(n.options!)));
      if (n.type === T.plural) s.plurals.set(n.value, new Set(Object.keys(n.options!)));
      for (const o of Object.values(n.options ?? {})) walk(o.value);
    }
  };
  walk(new IntlMessageFormat(msg, locale).getAst() as unknown as Node[]);
  return s;
}

/** Valori de probă pentru un mesaj, ca să-l putem scrie de-a binelea. */
function sample(s: Shape): Record<string, unknown> {
  const v: Record<string, unknown> = {};
  for (const [name, kind] of s.args) v[name] = kind === "num" ? 3 : kind === "date" ? new Date("2026-03-12T12:00:00Z") : kind === "select" ? [...s.selects.get(name)!][0] : "x";
  for (const tag of s.tags) v[tag] = (chunks: string[]) => chunks.join("");
  return v;
}

const catalogs = Object.fromEntries(await Promise.all(LOCALES.map(async (l) => [l, await loadMessages(l)] as const))) as Record<Locale, object>;
const ro = new Map(leaves(catalogs.ro));
const others = LOCALES.filter((l) => l !== "ro");

describe("limba browserului și cookie-ul", () => {
  it("alege prima limbă pe care o avem, în ordinea dată de browser", () => {
    expect(localeFromAcceptLanguage("de-DE,de;q=0.9,ro;q=0.8,en;q=0.7")).toBe("de");
    expect(localeFromAcceptLanguage("ro-RO,ro;q=0.9,en-US;q=0.8")).toBe("ro");
    expect(localeFromAcceptLanguage("pt-BR,pt;q=0.9,fr;q=0.5")).toBe("fr");
    expect(localeFromAcceptLanguage("fr;q=0.5,de;q=0.8")).toBe("de");
    expect(localeFromAcceptLanguage("de;q=0,fr;q=0.1")).toBe("fr");
    expect(localeFromAcceptLanguage("nl-BE")).toBe("nl");
    expect(localeFromAcceptLanguage("hu-HU,hu;q=0.9")).toBe("hu");
    expect(localeFromAcceptLanguage("it-CH")).toBe("it");
    expect(localeFromAcceptLanguage("es-419")).toBe("es");
    expect(localeFromAcceptLanguage("mo")).toBe("ro");
  });

  it("engleza: americană pentru SUA și Canada, britanică altfel (și fără țară)", () => {
    expect(localeFromAcceptLanguage("en-US,en;q=0.9")).toBe("en-US");
    expect(localeFromAcceptLanguage("en-CA")).toBe("en-US");
    expect(localeFromAcceptLanguage("en_us")).toBe("en-US");
    expect(localeFromAcceptLanguage("en-GB")).toBe("en-GB");
    expect(localeFromAcceptLanguage("en-AU")).toBe("en-GB");
    expect(localeFromAcceptLanguage("en-IE")).toBe("en-GB");
    expect(localeFromAcceptLanguage("en")).toBe("en-GB");
  });

  it("nimic când nu avem niciuna dintre limbi", () => {
    expect(localeFromAcceptLanguage("pt-BR,pt;q=0.9")).toBeNull();
    expect(localeFromAcceptLanguage("*")).toBeNull();
    expect(localeFromAcceptLanguage("")).toBeNull();
    expect(localeFromAcceptLanguage(null)).toBeNull();
    expect(localeFromAcceptLanguage(undefined)).toBeNull();
  });

  it("citește limba din cookie doar dacă e una de-a noastră", () => {
    expect(localeFromCookieHeader("tema=dark; limba=de; alt=1")).toBe("de");
    expect(localeFromCookieHeader("limba=en-US")).toBe("en-US");
    expect(localeFromCookieHeader("limba=en-US;tema=auto")).toBe("en-US");
    expect(localeFromCookieHeader("limba=xx")).toBeNull();
    expect(localeFromCookieHeader("altalimba=de")).toBeNull();
    expect(localeFromCookieHeader("")).toBeNull();
    expect(localeFromCookieHeader(null)).toBeNull();
  });

  it("fiecare limbă are un nume în listă, scris în limba ei", () => {
    expect(Object.keys(LANGUAGE_NAMES).sort()).toEqual([...LOCALES].sort());
  });
});

describe("cataloagele de texte", () => {
  it.each(others)("%s are exact cheile din română", (l) => {
    expect(leaves(catalogs[l]).map(([k]) => k).sort()).toEqual([...ro.keys()].sort());
  });

  it.each(LOCALES)("%s: fiecare text e un mesaj ICU bun și se poate scrie cu valori de probă", (l) => {
    const t = createTranslator({ locale: l, messages: catalogs[l] as never, timeZone: "Europe/Bucharest", onError: (e) => { throw e; } });
    for (const [key, msg] of leaves(catalogs[l])) {
      let s: Shape;
      try { s = shape(msg, l); } catch (e) { throw new Error(`${l} ${key}: ${(e as Error).message}`); }
      for (const [name, options] of s.plurals) expect(options.has("other"), `${l} ${key}: {${name}, plural} fără „other”`).toBe(true);
      expect(() => (t.markup as (k: string, v: unknown) => string)(key, sample(s)), `${l} ${key}`).not.toThrow();
    }
  });

  it.each(others)("%s cere aceleași valori și etichete ca româna", (l) => {
    for (const [key, msg] of leaves(catalogs[l])) {
      const want = shape(ro.get(key)!, "ro");
      const got = shape(msg, l);
      // O limbă poate lăsa deoparte un select de care gramatica ei nu are nevoie (engleza n-are „decedat/decedată”); orice altă valoare trebuie să rămână.
      for (const name of got.args.keys()) expect(want.args.has(name), `${l} ${key}: {${name}} nu e în română`).toBe(true);
      for (const [name, kind] of want.args) if (!got.args.has(name)) expect(kind, `${l} ${key}: lipsește {${name}}`).toBe("select");
      expect([...got.tags].sort(), `${l} ${key}: etichete`).toEqual([...want.tags].sort());
      for (const [name, kind] of want.args) {
        if (!got.args.has(name)) continue;
        // Un număr se poate arăta și simplu ({count}), dar textul nu poate deveni număr, select sau dată.
        const ok = got.args.get(name) === kind || (kind === "num" && got.args.get(name) === "text");
        expect(ok, `${l} ${key}: {${name}} e „${got.args.get(name)}”, în română „${kind}”`).toBe(true);
      }
      for (const [name, options] of got.selects) {
        const known = want.selects.get(name)!;
        expect(options.has("other"), `${l} ${key}: {${name}, select} fără „other”`).toBe(true);
        for (const o of options) expect(o === "other" || known.has(o), `${l} ${key}: ramura „${o}” nu e în română`).toBe(true);
      }
    }
  });

  it("niciun apostrof drept ('): în ICU el ascunde ce urmează; se scrie ’", () => {
    for (const l of LOCALES) for (const [key, msg] of leaves(catalogs[l])) expect(msg.includes("'"), `${l} ${key}: ${msg}`).toBe(false);
  });

  it("franceza: spațiu nedespărțit înainte de ; : ! ? » și după «", () => {
    for (const [key, msg] of leaves(catalogs.fr)) {
      expect(/ [;:!?»]|« /.test(msg), `fr ${key}: ${msg}`).toBe(false);
      expect(/\p{L}[;!?»]|«\p{L}/u.test(msg), `fr ${key}: ${msg}`).toBe(false);
    }
  });

  it("nicio literă românească (ă ș ț) rămasă în celelalte limbi, afară de nume", () => {
    // Nume proprii care rămân românești în orice limbă.
    const names = /Cartea Neamului|Lada cu amintiri|Călătoria în timp|Țara|Maramureș|Mărjel/gu;
    for (const l of others) for (const [key, msg] of leaves(catalogs[l])) expect(/[ăĂșȘțȚşŞţŢ]/.test(msg.replace(names, "")), `${l} ${key}: ${msg}`).toBe(false);
  });

  it("româna: „o persoană”, „5 persoane”, „20 de persoane”, ca înainte", () => {
    const t = createTranslator({ locale: "ro", messages: catalogs.ro as never, namespace: "Home" as never });
    for (let n = 0; n <= 250; n++) expect((t as unknown as (k: string, v: object) => string)("persons", { count: n })).toBe(persoane(n));
  });
});

describe("componentele din browser", () => {
  const files = (readdirSync("src", { recursive: true }) as string[]).filter((f) => /\.tsx?$/.test(f)).map((f) => join("src", f));
  const isClient = (code: string) => /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(code);

  const code = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
  /** Părțile din texte cerute cu useTranslations("…") într-un fișier. */
  const asked = (f: string) => [...code.get(f)!.matchAll(/useTranslations\(\s*(?:"([^"]*)"|'([^']*)')?\s*\)/g)].map((m) => (m[1] ?? m[2] ?? "").split(".")[0]);
  /** Fișierele din src pe care le aduce un fișier (import, export … from, import() dinamic), fără importurile doar de tip. */
  const deps = (f: string): string[] => {
    const specs = [...code.get(f)!.matchAll(/^\s*(?:import|export)\s+(?!type\s)[^;]*?\sfrom\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/gm)].map((m) => m[1] ?? m[2]);
    return specs.flatMap((spec) => {
      const base = spec.startsWith("@/") ? join("src", spec.slice(2)) : spec.startsWith(".") ? join(dirname(f), spec) : null;
      const hit = base && ["", ".ts", ".tsx", "/index.ts", "/index.tsx"].map((e) => base + e).find((x) => code.has(x));
      return hit ? [hit] : [];
    });
  };
  const reach = (start: string) => {
    const seen = new Set([start]);
    for (const f of seen) for (const d of deps(f)) seen.add(d);
    return seen;
  };
  /** Ce părți dă mai departe o pagină sau un layout cu <PageIntl ns={[…]}>. */
  const given = (f: string) => [...code.get(f)!.matchAll(/<PageIntl\s+ns=\{\[([^\]]*)\]\}/g)].flatMap((m) => [...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => x[1]));

  it("cer doar părți pe care le avem (CLIENT_NAMESPACES sau PAGE_NAMESPACES)", () => {
    const known = [...CLIENT_NAMESPACES, ...PAGE_NAMESPACES] as readonly string[];
    for (const f of files) if (isClient(code.get(f)!)) for (const ns of asked(f)) {
      expect(ns, `${f}: useTranslations() fără nume`).not.toBe("");
      expect(known, `${f}: „${ns}” lipsește din CLIENT_NAMESPACES și din PAGE_NAMESPACES`).toContain(ns);
    }
  });

  it("fiecare pagină dă componentelor ei părțile de pagină pe care le cer (<PageIntl>)", () => {
    const pages = files.filter((f) => /^src[\\/]app[\\/].*\b(page|layout)\.tsx$/.test(f));
    expect(pages.length).toBeGreaterThan(10);
    for (const page of pages) {
      const need = new Set<string>();
      for (const f of reach(page)) if (isClient(code.get(f)!)) for (const ns of asked(f)) if ((PAGE_NAMESPACES as readonly string[]).includes(ns)) need.add(ns);
      if (!need.size) continue;
      // Ce dă pagina însăși și layout-urile de deasupra ei.
      const have = new Set(given(page));
      for (let dir = dirname(page); dir.startsWith(join("src", "app")); dir = dirname(dir)) {
        const layout = join(dir, "layout.tsx");
        if (layout !== page && code.has(layout)) for (const ns of given(layout)) have.add(ns);
      }
      for (const ns of need) expect([...have], `${page} folosește „${ns}”, dar nu-l dă cu <PageIntl ns={[…]}>`).toContain(ns);
    }
  });

  it("„use-intl” (cu React) doar în fișiere „use client”; pe server se folosește getT", () => {
    for (const f of files) {
      const code = readFileSync(f, "utf8");
      if (/^import\s+(?!type\s)[^;]*from\s+["']use-intl["']/m.test(code)) expect(isClient(code), `${f} importă din „use-intl” fără „use client”`).toBe(true);
      if (/from\s+["']@\/i18n\/server["']/.test(code)) expect(isClient(code), `${f} e „use client”, dar folosește getT`).toBe(false);
    }
  });
});
