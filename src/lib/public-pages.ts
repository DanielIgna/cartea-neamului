/**
 * Paginile publice pe care le vrem în Google: din ele se fac sitemap.xml, robots.txt și lista din Admin → SEO.
 * (Fără importuri de pe server, ca să poată fi folosit oriunde.)
 */
export const PUBLIC_PAGES: { path: string; label: string; priority: number; changeFrequency: "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", label: "Prima pagină", priority: 1, changeFrequency: "weekly" },
  { path: "/istoria-umanitatii", label: "Istoria umanității", priority: 0.7, changeFrequency: "monthly" },
  { path: "/genealogii-vechi", label: "Genealogii vechi", priority: 0.6, changeFrequency: "monthly" },
  { path: "/libertatea-de-a-crede", label: "Libertatea de a crede", priority: 0.6, changeFrequency: "monthly" },
  { path: "/cadou-de-sarbatori", label: "Cadou de sărbători", priority: 0.7, changeFrequency: "monthly" },
  { path: "/resurse-genealogie", label: "Resurse gratuite pentru genealogie", priority: 0.6, changeFrequency: "monthly" },
  { path: "/contact", label: "Contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/parteneri", label: "Parteneri", priority: 0.3, changeFrequency: "yearly" },
  { path: "/confidentialitate", label: "Confidențialitate", priority: 0.3, changeFrequency: "yearly" },
  { path: "/termeni", label: "Termeni", priority: 0.3, changeFrequency: "yearly" },
];

/** Părțile private: arborii, invitațiile, mesajele, datele cuiva, intrarea în cont, plata și panoul de admin nu au ce căuta în Google. */
export const PRIVATE_PREFIXES = ["/admin", "/api/", "/invitatie/", "/arbore/", "/arbore-nou", "/datele-mele", "/mesaje", "/a/", "/intrare", "/intrare/eroare", "/plata", "/parteneri/dezabonare", "/dezabonare", "/cadou/"];
