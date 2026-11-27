/** Starea unui model de invitație în Admin: publicat / ciornă / arhivat. */
export default function StatusPill({ status }: { status: string }) {
  return status === "published" ? <span className="pill ok">publicat</span> : status === "archived" ? <span className="pill bad">arhivat</span> : <span className="pill warn">ciornă</span>;
}
