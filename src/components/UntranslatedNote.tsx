import { dirOf } from "@/i18n/locales";
import { getLocale, getT } from "@/i18n/server";

/**
 * Paginile încă netraduse (ghiduri, glosar, nume de familie, localități), deschise în altă limbă decât româna: se arată în
 * română, cu o notă în limba omului, în loc să-l trimitem la o pagină goală (Daniel, 2026-11-14). Textul paginii e marcat
 * lang="ro" și de la stânga la dreapta, ca să se citească bine și într-o pagină în ebraică.
 */
export default async function UntranslatedSection({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  if (locale === "ro") return children;
  const t = await getT("Layout", locale);
  return (
    <>
      <p className="untranslated-note" role="note" lang={locale} dir={dirOf(locale)}>{t("untranslated")}</p>
      <div lang="ro" dir="ltr">{children}</div>
    </>
  );
}
