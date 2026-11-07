import type { Locale } from "./locales";
import type { ro } from "./messages/ro";

// Cheile și locurile de completat se verifică la compilare, după textele în română.
declare module "use-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof ro;
  }
}
