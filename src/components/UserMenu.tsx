"use client";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function UserMenu({ name }: { name: string }) {
  const router = useRouter();
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <span className="muted">{name}</span>
      <button className="btn" onClick={async () => { await authClient.signOut(); router.push("/"); router.refresh(); }}>Ieși</button>
    </div>
  );
}
