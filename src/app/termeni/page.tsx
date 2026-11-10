import Link from "next/link";
import LegalLangNote from "@/components/LegalLangNote";
import type { Metadata } from "next";
import { BETA, LEGAL_UPDATED, MIN_AGE, operator } from "@/lib/legal";

export const metadata: Metadata = { title: "Termeni de utilizare · Cartea Neamului", description: "Ce înseamnă să ai cont în Cartea Neamului: ce poți pune, al cui e și ce promitem." };

/** Termenii de utilizare, scriși pe înțelesul oricui. */
export default function TermsPage() {
  const op = operator();
  return (
    <article className="card legal" lang="ro">
      <LegalLangNote />
      <div className="section-label" style={{ marginTop: 0 }}>Termeni de utilizare</div>
      <h2>Ce înseamnă să ai cont în Cartea Neamului</h2>
      <p className="legal-date">Ultima schimbare: {LEGAL_UPDATED}</p>
      <p>Cartea Neamului e un loc în care familiile își construiesc împreună arborele, își păstrează amintirile și își tipăresc cartea neamului.
        Când îți faci cont, ești de acord cu acești termeni și cu <Link href="/confidentialitate">Politica de confidențialitate</Link>.</p>
      {BETA && <p className="confirm">Acum, Cartea Neamului e în probă: e deschisă doar familiei și prietenilor apropiați, ca să ne spună ce merge și ce nu.
        Se poate schimba des și uneori poate greși, așa că păstrează-ți și tu o copie a ce contează: o descarci oricând din „Datele mele”.</p>}

      <h3>1. Contul</h3>
      <ul>
        <li>Contul e pentru cei care au cel puțin {MIN_AGE} ani. Copiii pot fi trecuți în arbore de părinții lor.</li>
        <li>Un cont e al unui singur om. Parola o păstrezi doar pentru tine; ce se face din contul tău e în grija ta.</li>
        <li>Contul de probă are o parolă publică, deci e al tuturor: nu pune în el nimic din familia ta.</li>
      </ul>

      <h3>2. Ce pui în site</h3>
      <ul>
        <li>Pui doar ce ai dreptul să pui: poze și acte ale familiei, texte scrise de tine, înregistrări făcute cu acordul celui care vorbește.</li>
        <li>Despre rudele în viață scrii cu grijă și cu bun-simț. Dacă cineva îți cere să-i scoți datele din arbore, i le scoți sau ne scrii nouă.</li>
        <li>Nu pui nimic ilegal, jignitor sau care îndeamnă la ură, nici datele altora fără drept.</li>
        <li>Putem ascunde sau șterge ce încalcă acești termeni sau legea și îți spunem de ce.</li>
      </ul>

      <h3>3. Al cui e ce pui</h3>
      <p>Ce pui rămâne al tău și al familiei tale. Nouă ne dai doar voie să-l păstrăm, să-l arătăm celor pe care i-ai ales și să-l punem în cartea pe
        care o ceri, ca să meargă site-ul. Nu-l folosim în alt scop și nu-l vindem.</p>

      <h3>4. Arborii și amintirile</h3>
      <ul>
        <li>Proprietarul arborelui hotărăște cine intră și ce drepturi are: vizitatorul doar vede, contributorul adaugă, editorul îndreaptă fișele.</li>
        <li>O amintire e a celui care o scrie: doar el alege cine o vede și doar el o schimbă sau o șterge.</li>
        <li>Capitolul „Credința” al autobiografiei e doar pentru cei în viață, care răspund ei înșiși, cu acordul lor.</li>
      </ul>

      <h3>5. Prețul</h3>
      <p>Acum totul e gratuit. Dacă vom cere vreodată un abonament, pentru arborii mari sau pentru lucruri noi, te anunțăm din timp. Ce ai pus rămâne
        al tău, iar vederea arborelui, invitațiile și descărcarea lui (GEDCOM) rămân gratuite.</p>

      <h3>6. Cât de sigur merge site-ul</h3>
      <p>Ne străduim ca site-ul să meargă bine și să nu se piardă nimic, dar nu putem promite că nu va avea niciodată întreruperi sau greșeli. Păstrează
        și tu o copie: arborele ca GEDCOM, cartea ca PDF și datele tale din <Link href="/datele-mele">Datele mele</Link>.</p>

      <h3>7. Încheierea</h3>
      <p>Îți poți șterge contul oricând, din <Link href="/datele-mele">Datele mele</Link>. Putem suspenda un cont care încalcă grav acești termeni,
        după ce îi scriem omului și îi spunem de ce.</p>

      <h3>8. Răspunderea</h3>
      <p>În limitele legii, nu răspundem pentru pagube indirecte din folosirea site-ului. Nimic din acești termeni nu-ți ia drepturile pe care ți le dă
        legea ca consumator.</p>

      <h3>9. Legea</h3>
      <p>Acestor termeni li se aplică legea română. O neînțelegere încercăm întâi s-o lămurim prin bună înțelegere; dacă nu se poate, o judecă instanțele
        din România.</p>

      <h3>10. Schimbări</h3>
      <p>Dacă schimbăm ceva important în acești termeni, te anunțăm în site înainte ca schimbarea să intre în vigoare.</p>

      <h3>Contact</h3>
      <p>{op.name}{op.person ? ", persoană fizică" : ""}. Email: <a href={`mailto:${op.email}`}>{op.email}</a>.</p>
    </article>
  );
}
