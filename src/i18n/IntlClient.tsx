"use client";
import { IntlProvider, type Messages } from "use-intl";
import { TIME_ZONE, type Locale } from "./locales";

/** Textele pentru componentele din browser, în limba aleasă (doar părțile de care au nevoie, vezi CLIENT_NAMESPACES). */
export default function IntlClient({ locale, messages, children }: { locale: Locale; messages: Partial<Messages>; children: React.ReactNode }) {
  return <IntlProvider locale={locale} messages={messages} timeZone={TIME_ZONE}>{children}</IntlProvider>;
}
