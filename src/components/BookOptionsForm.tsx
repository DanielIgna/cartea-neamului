"use client";
import type { BookOptions } from "@/lib/book";

/**
 * Alegerile cărții: de la cine pornește, cum apar cei în viață, cu sau fără poze, A4 sau A5. Fiecare schimbare reîncarcă pagina
 * cu alegerea nouă în adresă (cartea se așază mereu într-o pagină proaspătă), iar adresa se poate păstra sau trimite.
 */
export default function BookOptionsForm({ treeId, center, options, people }: {
  treeId: string; center: string | null; options: BookOptions; people: { id: string; label: string }[];
}) {
  const go = (change: Partial<Record<"p" | "vii" | "poze" | "format", string>>) => {
    const now = { p: center ?? "", vii: options.living, poze: options.photos ? "da" : "nu", format: options.format, ...change };
    const q = new URLSearchParams();
    if (now.p) q.set("p", now.p);
    if (now.vii !== "nume") q.set("vii", now.vii);
    if (now.poze === "nu") q.set("poze", "nu");
    if (now.format !== "A4") q.set("format", now.format);
    window.location.assign(`/arbore/${treeId}/carte${q.size ? `?${q}` : ""}`);
  };
  return (
    <div className="book-options">
      <label>Pornește de la
        <select value={center ?? ""} onChange={(e) => go({ p: e.target.value })}>
          {people.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </label>
      <fieldset>
        <legend>Cei în viață apar</legend>
        {([["nume", "doar cu numele"], ["tot", "cu toate datele"], ["ascunsi", "deloc"]] as const).map(([v, l]) => (
          <label key={v} className="inline"><input type="radio" name="vii" checked={options.living === v} onChange={() => go({ vii: v })} />{l}</label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Pagina</legend>
        {(["A4", "A5"] as const).map((f) => (
          <label key={f} className="inline"><input type="radio" name="format" checked={options.format === f} onChange={() => go({ format: f })} />{f}</label>
        ))}
        <label className="inline"><input type="checkbox" checked={options.photos} onChange={(e) => go({ poze: e.target.checked ? "da" : "nu" })} />cu poze</label>
      </fieldset>
    </div>
  );
}
