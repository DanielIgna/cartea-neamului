"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function UserMenu({ name, unread = 0 }: { name: string; unread?: number }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <Link className="btn" href="/mesaje">Mesaje{unread ? <span className="badge">{unread}</span> : null}</Link>
      <span className="muted">{name}</span>
      <button className="btn" onClick={async () => { await authClient.signOut(); router.push("/"); router.refresh(); }}>Ieși</button>
    </div>
  );
}
