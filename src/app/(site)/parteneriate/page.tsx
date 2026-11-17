import type { Metadata } from "next";
import Link from "next/link";
import { publicPageMetadata } from "@/lib/page-metadata";
import { FORM_KINDS, PARTNERSHIP_CONSENT, isFormKind } from "@/lib/crm-admin";
import PartnershipForm from "@/components/PartnershipForm";

export const metadata: Metadata = publicPageMetadata({
  path: "/parteneriate",
  title: "Coduri pentru școli, clase și firme | Cartea Neamului",
  description: "Arborele familiei pentru o clasă, o școală sau colegii de la firmă: cere coduri cu reducere pentru elevi și angajați. Îți răspundem pe email.",
});

/**
 * Pagina de parteneriate (CRM, Etapa 2): școli, clase, firme, asociații din diaspora, biblioteci, muzee, primării. Un singur
 * formular, care ajunge în Admin → CRM ca organizație + deal + sarcină în „Azi”. Nimic nu pleacă automat de aici.
 */
export default async function Partnerships({ searchParams }: { searchParams: Promise<{ pentru?: string }> }) {
  const q = await searchParams;
  return (
    <section className="stack" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div className="card stack">
        <h1 style={{ margin: 0 }}>Cartea Neamului pentru școli, clase și firme</h1>
        <p style={{ margin: 0 }}>
          Fiecare copil sau coleg își face arborele familiei, adună poveștile bunicilor și poate tipări arborele. Pentru o clasă, o școală întreagă sau
          echipa unei firme dăm coduri cu reducere, valabile un an.
        </p>
        <ul style={{ margin: 0 }}>
          <li><b>Școli și clase:</b> coduri pe clasă sau pe școală, după acordul conducerii școlii. Fișele pentru proiectul de la clasă sunt gratuite.</li>
          <li><b>Firme:</b> abonamente pentru angajați, cu reducere de volum (de la 10 conturi −10%, de la 30 −15%, de la 90 −20%, de la 150 −25%, peste 500 ofertă separată).</li>
          <li><b>Asociații din diaspora, biblioteci, muzee, primării:</b> scrie-ne ce ați vrea să faceți împreună.</li>
        </ul>
      </div>
      <div className="card stack">
        <h2 style={{ margin: 0 }}>Vreau coduri pentru clasa, școala sau firma mea</h2>
        <PartnershipForm kinds={Object.entries(FORM_KINDS)} consent={PARTNERSHIP_CONSENT} defaultKind={isFormKind(q.pentru) ? q.pentru : undefined} />
        <p className="muted" style={{ margin: 0 }}>
          Folosim datele doar ca să-ți răspundem; nu le dăm nimănui. Poți cere oricând ștergerea lor din <Link href="/contact">Contact</Link>. Detalii în{" "}
          <Link href="/confidentialitate">Politica de confidențialitate</Link>.
        </p>
      </div>
    </section>
  );
}
