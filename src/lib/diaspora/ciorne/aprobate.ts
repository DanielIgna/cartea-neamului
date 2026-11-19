/**
 * Ciornele de diaspora aprobate de Daniel. O ciornă apare pe site (pagină, sitemap, legături, hreflang) doar după ce cheia ei
 * e aici: „tara:<slug>”, „regiune:<țară>/<slug>” sau „tema:<slug>”. Până atunci se citește doar în Admin → SEO → Ciorne.
 */
export const APROBATE = new Set<string>([]);
