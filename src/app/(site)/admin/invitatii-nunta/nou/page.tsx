import Link from "next/link";
import { requireAdmin } from "@/lib/admin-access";
import { AdminNav } from "@/components/admin/ui";
import InvitatieForm from "@/components/admin/InvitatieForm";
import { TEXT_LOCALES } from "@/lib/invitatii-nunta-produse";
import { localeNames } from "@/lib/invitatii-nunta-admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Model nou · Invitații de nuntă · Admin" };

/** Admin → Invitații de nuntă → Adaugă un model: textele și prețul; ZIP-ul și pozele se pun după salvare, pe pagina modelului. */
export default async function AdminInvitatieNoua() {
  await requireAdmin("/admin/invitatii-nunta/nou");
  return (
    <section className="stack">
      <AdminNav active="invitatii-nunta" />
      <p><Link href="/admin/invitatii-nunta">← Înapoi la modele</Link></p>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Model nou de invitație</h1>
        <p className="muted" style={{ marginBottom: 0 }}>Pasul 1: scrie numele, prețul și textele, apoi apasă „Creează modelul”. Pasul 2, pe pagina care se deschide: urci ZIP-ul și pozele, apoi apeși „Publică”.</p>
      </div>
      <InvitatieForm locales={localeNames(TEXT_LOCALES)} />
    </section>
  );
}
