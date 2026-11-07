import IntlClient from "./IntlClient";
import { clientMessages, type PageNamespace } from "./messages";
import { getLocale, getMessages } from "./server";

/**
 * Textele pentru componentele din browser ale unei pagini: cele de pe toate paginile (antetul, contul…) plus părțile `ns`
 * ale paginii (arborele, fișa…). tests/i18n.test.ts verifică să fie cerute aici toate părțile folosite de componentele paginii.
 */
export default async function PageIntl({ ns, children }: { ns: readonly PageNamespace[]; children: React.ReactNode }) {
  const locale = await getLocale();
  return <IntlClient locale={locale} messages={clientMessages(await getMessages(locale), ns)}>{children}</IntlClient>;
}
