import IntlClient from "./IntlClient";
import type { Locale } from "./locales";
import { clientMessages, type PageNamespace } from "./messages";
import { getLocale, getMessages } from "./server";

/**
 * Textele pentru componentele din browser ale unei pagini: cele de pe toate paginile (antetul, contul…) plus părțile `ns`
 * ale paginii (arborele, fișa…). tests/i18n.test.ts verifică să fie cerute aici toate părțile folosite de componentele paginii.
 * Cu `locale`, textele sunt în limba dată, nu în a cititorului: desenele din cartea de tipărit sunt în limba cărții (`?limba=`).
 */
export default async function PageIntl({ ns, locale: fixed, children }: { ns: readonly PageNamespace[]; locale?: Locale; children: React.ReactNode }) {
  const locale = fixed ?? (await getLocale());
  return <IntlClient locale={locale} messages={clientMessages(await getMessages(locale), ns)}>{children}</IntlClient>;
}
