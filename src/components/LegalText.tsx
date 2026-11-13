import Link from "next/link";
import type { ReactNode } from "react";
import LegalLangNote from "@/components/LegalLangNote";
import { getFormat, getLocale, getAppName, getT } from "@/i18n/server";
import { roLegal } from "@/i18n/messages/legal/ro";
import { BETA, MIN_AGE, operator } from "@/lib/legal";
import { db } from "@/db";
import { DEFAULT_SETTINGS, TIERS, planSettings } from "@/lib/plans";

type Page = "Privacy" | "Terms";
type Section = Record<string, string>;

/** Ancore cerute din alte pagini („Datele mele” trimite la #folosire și #parteneri; anunțul și subsolul, la #cookie-uri). */
const ANCHORS: Record<string, string> = { "Privacy.data.l8": "folosire", "Privacy.partner": "parteneri", "Privacy.cookies": "cookie-uri" };

const ext = (href: string) => (c: ReactNode) => <a href={href} rel="noopener noreferrer" target="_blank">{c}</a>;

/**
 * O pagină legală (Politica de confidențialitate sau Termenii) în limba cititorului. Așezarea (secțiunile și ordinea
 * paragrafelor și a listelor) vine din catalogul românesc, textul din limba activă. Deasupra, nota că româna e oficială.
 */
export default async function LegalText({ page, date }: { page: Page; date: Date }) {
  const locale = await getLocale();
  const [t, tp, format] = await Promise.all([getT("Legal", locale), getT("Partners", locale), getFormat(locale)]);
  const op = operator();
  const tags = {
    b: (c: ReactNode) => <b>{c}</b>,
    code: (c: ReactNode) => <code>{c}</code>,
    mail: (c: ReactNode) => <a href={`mailto:${op.email}`}>{c}</a>,
    terms: (c: ReactNode) => <Link href="/termeni">{c}</Link>,
    privacy: (c: ReactNode) => <Link href="/confidentialitate">{c}</Link>,
    data: (c: ReactNode) => <Link href="/datele-mele">{c}</Link>,
    dataPartners: (c: ReactNode) => <Link href="/datele-mele#parteneri">{c}</Link>,
    partners: (c: ReactNode) => <Link href="/parteneri">{c}</Link>,
    pm: ext("https://propmanage.ro"),
    anspdcp: ext("https://www.dataprotection.ro"),
    anpc: ext("https://anpc.ro"),
    sal: ext("https://anpc.ro/ce-este-sal/"),
  };
  // Prețurile din Termeni vin din Admin → Manager control, ca textul să spună mereu ce se cere la plată.
  const ps = await planSettings(db).catch(() => DEFAULT_SETTINGS);
  // Plafonul 0 înseamnă „fără limită”: îl scriem cu cuvântul din limba cititorului.
  const unlimited = (await getT("Plata", locale))("unlimited");
  const caps = Object.fromEntries((["trialPhotos", "trialAudio", "trialDocs", ...TIERS.flatMap((x) => (["Persons", "Photos", "Audio", "Docs", "Writers", "Trees"] as const).map((k) => `${x}${k}` as const))] as const)
    .map((k) => [k, ps[k] > 0 ? format.number(ps[k]) : unlimited]));
  const prices = {
    trialDays: ps.trialDays, trialPersons: ps.trialPersons, priceLei: ps.priceLei, priceEur: ps.priceEur, invitePriceLei: ps.invitePriceLei, invitePriceEur: ps.invitePriceEur,
    bookLei: ps.bookLei, bookEur: ps.bookEur, familieLei: ps.familieLei, familieEur: ps.familieEur, premiumLei: ps.premiumLei, premiumEur: ps.premiumEur,
    premiumPrint: ps.premiumPrint, ...caps,
  };
  const values = { name: op.name, address: op.address, cui: op.cui, regCom: op.regCom, euid: op.euid, email: op.email, minAge: MIN_AGE, consent: tp("checkbox"), ...prices, ...tags };
  const rich = (key: string) => (t.rich as unknown as (k: string, v: typeof values) => ReactNode)(key, values);
  const sections = roLegal.Legal[page].sections as Record<string, Section>;

  return (
    <article className="card legal" lang={locale}>
      <LegalLangNote />
      <div className="section-label" style={{ marginTop: 0 }}>{t(`${page}.label`)}</div>
      <h2>{t(`${page}.title`)}</h2>
      <p className="legal-date">{t("updated", { date: format.dateTime(date, { day: "numeric", month: "long", year: "numeric" }) })}</p>
      {Object.entries(sections).map(([id, s]) => {
        const base = `${page}.sections.${id}`;
        const blocks: ReactNode[] = [];
        let list: ReactNode[] = [];
        const flush = () => { if (list.length) blocks.push(<ul key={`ul${blocks.length}`}>{list}</ul>); list = []; };
        for (const k of Object.keys(s)) {
          if (k === "h") continue;
          if (k.startsWith("l")) { list.push(<li key={k} id={ANCHORS[`${page}.${id}.${k}`]}>{rich(`${base}.${k}`)}</li>); continue; }
          flush();
          if (k === "beta") { if (BETA) blocks.push(<p key={k} className={page === "Terms" ? "confirm" : undefined}>{rich(`${base}.${k}`)}</p>); continue; }
          blocks.push(<p key={k}>{rich(`${base}.${k}`)}</p>);
        }
        flush();
        return (
          <div key={id}>
            {"h" in s && <h3 id={ANCHORS[`${page}.${id}`]}>{rich(`${base}.h`)}</h3>}
            {blocks}
          </div>
        );
      })}
      <h3>{t("contactTitle")}</h3>
      <p>{rich("contactLine")}</p>
    </article>
  );
}

/** Titlul și descrierea paginii, în limba cititorului. */
export async function legalMetadata(page: Page) {
  const t = await getT("Legal");
  return { title: `${t(`${page}.metaTitle`)} · ${await getAppName()}`, description: t(`${page}.metaDescription`), alternates: { canonical: page === "Privacy" ? "/confidentialitate" : "/termeni" } };
}
