"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Butonul „Intră în cont” din antet, pentru cine nu e intrat. Pe pagina de intrare nu-l mai arătăm: omul e deja acolo. */
export default function SignInLink({ label, short }: { label: string; short: string }) {
  const path = usePathname();
  if (path?.startsWith("/intrare")) return null;
  // Pe telefon încape doar varianta scurtă („Intră”), ca numele site-ului să rămână întreg pe același rând.
  return <Link className="signin-btn" href="/intrare" aria-label={label}><span className="si-long">{label}</span><span className="si-short" aria-hidden="true">{short}</span></Link>;
}
