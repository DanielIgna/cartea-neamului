import { FACEBOOK_URL } from "@/lib/contact";
import { SITE_URL } from "@/lib/site-url";

const DESCRIPTION = "Fă online arborele genealogic al familiei, împreună cu rudele. Păstrezi poze, povești și glasul bunicilor, apoi tipărești cartea neamului.";
/** Datele pentru motoarele de căutare: site-ul, cine îl face și ce este (o aplicație web). Fără note sau recenzii. */
export const HOME_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Cartea Neamului", url: SITE_URL, inLanguage: "ro", description: DESCRIPTION, publisher: { "@id": `${SITE_URL}/#organization` } },
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Cartea Neamului", url: SITE_URL, logo: `${SITE_URL}/apple-icon.png`, sameAs: [FACEBOOK_URL] },
    {
      "@type": "SoftwareApplication", "@id": `${SITE_URL}/#app`, name: "Cartea Neamului", url: SITE_URL, description: DESCRIPTION,
      applicationCategory: "LifestyleApplication", operatingSystem: "Web", inLanguage: "ro", publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};
