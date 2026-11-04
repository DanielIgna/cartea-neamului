import { db } from "@/db";
import { auditLog } from "@/db/schema";

const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** O eroare de pe server, scrisă în audit_log. Adresa fără parametri (pot conține date personale). */
export async function recordError(err: unknown, at: { path: string; method: string; route: string; kind: string }) {
  const e = err as { message?: string; digest?: string; stack?: string };
  await db.insert(auditLog).values({
    entity: "eroare",
    entityId: clip(at.path.split("?")[0] || "/", 200),
    action: at.kind,
    diff: {
      message: clip(String(e?.message ?? err), 500),
      digest: e?.digest ?? null,
      method: at.method,
      route: at.route,
      stack: e?.stack ? clip(e.stack.split("\n").slice(1, 6).join("\n"), 1200) : null,
    },
  });
}
