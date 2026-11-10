import type { Messages } from "use-intl/core";
import type { Locale } from "../locales";
import type { Catalog, DeepPartial } from "./ro";

/** Engleza americană e cea britanică, cu cuvintele care diferă (Mom, color…) puse peste ea. */
function merge<T extends object>(base: T, over: DeepPartial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] = v && typeof v === "object" && b && typeof b === "object" ? merge(b as object, v as DeepPartial<object>) : v;
  }
  return out as T;
}

const LOADERS: Record<Locale, () => Promise<Catalog>> = {
  ro: async () => (await import("./ro")).ro,
  "en-GB": async () => (await import("./en-GB")).enGB,
  "en-US": async () => merge((await import("./en-GB")).enGB, (await import("./en-US")).enUS),
  fr: async () => (await import("./fr")).fr,
  es: async () => (await import("./es")).es,
  nl: async () => (await import("./nl")).nl,
  de: async () => (await import("./de")).de,
  it: async () => (await import("./it")).it,
  hu: async () => (await import("./hu")).hu,
};

/** Textele unei limbi, întregi (toate limbile au aceleași chei ca româna). */
export async function loadMessages(locale: Locale): Promise<Messages> {
  return (await LOADERS[locale]()) as Messages;
}

/**
 * Părțile din texte pe care le folosesc componentele din browser ("use client"); doar ele pleacă spre telefon, nu tot.
 * tests/i18n.test.ts verifică să fie aici toate cele cerute cu useTranslations(...) în componente.
 */
export const CLIENT_NAMESPACES = [
  "ThemeSwitch", "LanguagePicker", "UserMenu", "UsageNotice", "AuthForm", "InvitePanel", "FamilyStart", "JoinTree", "GedcomImport", "InstallApp", "Partners",
] as const satisfies readonly (keyof Messages)[];

/**
 * Părți folosite în browser doar pe unele pagini (arborele, fișa, harta, mesajele): pleacă spre telefon doar pe paginile
 * care le cer, cu <PageIntl ns={[…]}> (src/i18n/PageIntl.tsx), nu pe fiecare pagină.
 */
export const PAGE_NAMESPACES = [
  "Tree", "Person", "Charts", "Times", "Vremuri", "Duplicates", "PersonForm", "Media", "Relations", "Chat", "Map", "Nearby",
  "Lada", "MemoryForm", "Voice", "Story", "Grand", "Auto", "Relatives", "BookUi", "Journey", "OldHouse",
] as const satisfies readonly (keyof Messages)[];
export type PageNamespace = (typeof PAGE_NAMESPACES)[number];

export function clientMessages(messages: Messages, extra: readonly PageNamespace[] = []): Partial<Messages> {
  return Object.fromEntries([...CLIENT_NAMESPACES, ...extra].map((n) => [n, messages[n]]));
}
