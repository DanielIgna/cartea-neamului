/** Ce despre parteneri merge și în browser (fără baza de date și fără chei): numele cookie-ului și adresele cu UTM. */

/**
 * Cookie-ul pus de formularul de creare a contului când omul bifează beneficiile de la partener (și șters când o debifează).
 * Îl citește doar crearea contului (src/lib/auth.ts), ca acordul să fie scris și când contul se face cu Google. Ține 30 de minute.
 */
export const SIGNUP_PARTNER_COOKIE = "cn-parteneri";

/** Adresa site-ului PropManage, cu UTM: arată doar că vizitatorul vine de la Cartea Neamului, nimic despre el. */
export function partnerUrl(place: "parteneri" | "carte" | "casa-batraneasca") {
  const u = new URL("https://propmanage.ro/");
  u.searchParams.set("utm_source", "cartea-neamului");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", place === "casa-batraneasca" ? "cartea-casei" : "parteneri");
  u.searchParams.set("utm_content", place);
  return u.toString();
}
