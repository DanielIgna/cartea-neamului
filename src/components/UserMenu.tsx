"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function UserMenu({ name, unread = 0, image, admin = false }: { name: string; unread?: number; image?: string | null; admin?: boolean }) {
  const router = useRouter();
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {admin && <Link className="btn" href="/admin">Admin</Link>}
      <Link className="btn" href="/mesaje">Mesaje{unread ? <span className="badge">{unread}</span> : null}</Link>
      <Link className="user-chip" href="/datele-mele" title="Contul tău și datele tale">
        {image
          ? <img src={image} alt="" className="avatar" style={{ width: 30, height: 30 }} referrerPolicy="no-referrer" />
          : <span className="avatar avatar-empty" style={{ width: 30, height: 30, fontSize: 12 }} aria-hidden>{initials}</span>}
        <span className="muted">{name}</span>
      </Link>
      <button className="btn" onClick={async () => { await authClient.signOut(); router.push("/"); router.refresh(); }}>Ieși</button>
    </div>
  );
}
