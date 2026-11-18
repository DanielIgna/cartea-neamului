import { publicPageMetadata, webPageJsonLd } from "@/lib/page-metadata";
import JsonLd from "@/components/JsonLd";
import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/ContactForm";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PageIntl from "@/i18n/PageIntl";
import { getAppName, getT, getLocale } from "@/i18n/server";
import { FACEBOOK_URL, whatsappUrl } from "@/lib/contact";
import { operator } from "@/lib/legal";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("ContactPage");
  return publicPageMetadata({ path: "/contact", title: `${t("metaTitle")} | ${await getAppName()}`, description: t("metaDescription"), locale: await getLocale() });
}

/**
 * Pagina de contact, deschisă tuturor: butonul de WhatsApp și formularul care trimite pe email. Nici numărul, nici adresa de
 * email nu sunt scrise ca text pe pagină (cererea lui Daniel); numărul e doar în legătura de WhatsApp.
 */
export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const t = await getT("ContactPage");
  const op = operator();
  // Site-ul nu mai vinde și nu mai promite carte tipărită (oferta din 18.11.2026): vechiul ?tipar=… nu mai scrie nimic în mesaj.
  await searchParams;
  return (
    <section className="stack contact" style={{ maxWidth: 760, margin: "0 auto" }}>
      <JsonLd data={webPageJsonLd({ path: "/contact", title: t("metaTitle"), description: t("metaDescription"), locale: await getLocale() })} />
      <div className="card">
        <h1 className="section-label" style={{ marginTop: 0 }}>{t("label")}</h1>
        <h2>{t("title")}</h2>
        <p>{t("lead")}</p>
        <p className="muted" style={{ margin: 0 }}>{t.rich("facebook", { link: (c) => <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer">{c}</a> })}</p>
      </div>
      <div className="contact-ways">
        <div className="card stack">
          <h3 style={{ margin: 0 }}>{t("waTitle")}</h3>
          <p className="muted" style={{ margin: 0 }}>{t("waText")}</p>
          <div>
            <a className="btn wa-btn" href={whatsappUrl(t("waGreeting"))} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon /> {t("waCta")}
            </a>
          </div>
        </div>
        <div className="card stack">
          <h3 style={{ margin: 0 }}>{t("mailTitle")}</h3>
          <p className="muted" style={{ margin: 0 }}>{t("mailText")}</p>
          <PageIntl ns={["Contact"]}><ContactForm /></PageIntl>
        </div>
      </div>
      <p className="muted" style={{ fontSize: 14, margin: 0 }}><Link href="/resurse-genealogie">{(await getT("Resources"))("contactLink")}</Link></p>
      <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t("seller", { name: op.name, cui: op.cui, regCom: op.regCom, address: op.address })}</p>
    </section>
  );
}
