/**
 * Bifa „Vreau sfaturi utile pe email, mă pot dezabona oricând” de la înscriere (Daniel, 17.11.2026): nebifată de la sine,
 * separată de Termeni. Formularul o ține 30 de minute într-un cookie scurt, citit doar la crearea contului (src/lib/auth.ts),
 * ca acordul `news` să fie scris și când contul se face cu Google. Debifată, cookie-ul se șterge.
 */
export const SIGNUP_NEWS_COOKIE = "cn-sfaturi";

export function signupNewsFromCookie(header: string | null | undefined): boolean {
  return new RegExp(`(?:^|;\\s*)${SIGNUP_NEWS_COOKIE}=1(?:;|$)`).test(header ?? "");
}
