import Link from "next/link";
import { getT } from "@/i18n/server";

/** Linkul de invitație nu există sau a expirat: status 404 (Next adaugă singur „noindex”), cu același mesaj prietenos ca înainte. */
export default async function InvitationNotFound() {
  const [t, tn] = await Promise.all([getT("Invitation"), getT("NotFound")]);
  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem" }}>{t("invalid")}</h1>
      <p className="muted">{t("askNew")}</p>
      <div className="actions"><Link className="btn" href="/">{tn("home")}</Link></div>
    </div>
  );
}
