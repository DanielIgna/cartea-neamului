import { getLocale, getT } from "@/i18n/server";

/** Deasupra paginilor legale, pentru cine citește site-ul în altă limbă: textul e în română și versiunea în română e cea oficială. */
export default async function LegalLangNote() {
  const locale = await getLocale();
  if (locale === "ro") return null;
  const t = await getT("LegalNote", locale);
  return <p className="notice" role="note" lang={locale}>{t("text")}</p>;
}
