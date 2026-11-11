import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PageIntl from "@/i18n/PageIntl";
import { getT } from "@/i18n/server";
import { whatsappUrl } from "@/lib/contact";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT("ContactPage");
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "/contact" } };
}

/**
 * Pagina de contact, deschisă tuturor: butonul de WhatsApp și formularul care trimite pe email. Nici numărul, nici adresa de
 * email nu sunt scrise ca text pe pagină (cererea lui Daniel); numărul e doar în legătura de WhatsApp.
 */
export default async function ContactPage() {
  const t = await getT("ContactPage");
  return (
    <section className="stack contact" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="card">
        <div className="section-label" style={{ marginTop: 0 }}>{t("label")}</div>
        <h2>{t("title")}</h2>
        <p>{t("lead")}</p>
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
    </section>
  );
}
