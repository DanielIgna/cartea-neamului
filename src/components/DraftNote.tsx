"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "use-intl";
import { readDraft, type StartDraft } from "@/lib/incepe-draft";

/**
 * Pe pagina de cont nou, pentru cine a început arborele pe prima pagină (src/components/TryTree.tsx): îi amintește ce a scris,
 * ca să știe că nu se pierde nimic și că mai are un singur pas. Fără ciornă nu arată nimic.
 */
export default function DraftNote() {
  const t = useTranslations("TryTree");
  const [d, setD] = useState<StartDraft | null>(null);
  useEffect(() => setD(readDraft()), []);
  if (!d) return null;
  const parts = [[d.given, d.surname].filter(Boolean).join(" "), d.father && t("dadIs", { name: d.father }), d.mother && t("momIs", { name: d.mother })].filter(Boolean);
  return (
    <div className="ok-box draft-note" role="status">
      <b>{t("saved", { summary: parts.join(", ") })}</b> {t("savedCta")}
    </div>
  );
}
