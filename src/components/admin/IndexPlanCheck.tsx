"use client";
import { useState, useTransition } from "react";
import { togglePlanIndexare } from "@/app/admin-actions";

/** Bifa unei adrese din planul de indexare: se salvează imediat; dacă salvarea nu merge, bifa revine. */
export function IndexPlanCheck({ path, done }: { path: string; done: boolean }) {
  const [on, setOn] = useState(done);
  const [pending, start] = useTransition();
  return (
    <input type="checkbox" checked={on} disabled={pending} aria-label="Am cerut indexarea" style={{ width: "auto" }}
      onChange={(e) => {
        const next = e.target.checked;
        setOn(next);
        start(async () => { const r = await togglePlanIndexare(path, next); if (r?.error) setOn(!next); });
      }} />
  );
}
