import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import { publicPageMetadata, canonicalUrl } from "@/lib/page-metadata";
import { UNIRE_RELEASE as page } from "@/lib/autoritate";
import { UNIRE_BANNER } from "@/lib/sezon-unire";
import { SITE_URL } from "@/lib/site-url";

export const metadata: Metadata = publicPageMetadata({
  path: page.path, title: page.title, description: page.description,
  image: { url: UNIRE_BANNER[0], alt: "Mulțimea cu drapele la Alba Iulia, 1 Decembrie 1918 (desen Cartea Neamului)" },
});

const PRESS_EMAIL = "contact@carteaneamului.ro";
const DATE = "2026-11-27";

/** Ghidurile seriei, cu titlul scurt pentru jurnaliști (textele lungi sunt în content/ghid/). */
const SERIES: { slug: string; t: string }[] = [
  { slug: "delegati-alba-iulia-1918", t: "Ce era un delegat la Marea Adunare și cum afli dacă un strămoș de-al tău a fost acolo" },
  { slug: "alba-iulia-1-decembrie-1918-oamenii", t: "Cum au ajuns oamenii la Alba Iulia: trenuri, drapele și sate întregi plecate împreună" },
  { slug: "arad-1918-drumul-spre-alba-iulia", t: "Drumul spre Alba Iulia a început la Arad" },
  { slug: "basarabia-bucovina-1918", t: "Basarabia și Bucovina în 1918: Unirea în trei pași" },
  { slug: "cum-sarbatoreau-bunicii-1-decembrie", t: "Cum sărbătoreau bunicii 1 Decembrie: întrebări de pus acasă" },
  { slug: "radacini-din-1918-ghid", t: "Ghid scurt: cum îți cauți rădăcinile din 1918" },
];

/** /presa/1-decembrie-2026: comunicatul de presă pentru Ziua Națională (src/lib/autoritate.ts, UNIRE_RELEASE). Liber de preluat. */
export default function UnireReleasePage() {
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "NewsArticle", headline: page.h1, description: page.description, url: canonicalUrl(page.path), inLanguage: "ro",
        datePublished: DATE, image: [`${SITE_URL}${UNIRE_BANNER[0]}`], author: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL },
        publisher: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/icons/icon-512.png` } } }} />
      <Breadcrumbs items={[{ name: "Presă", path: "/presa" }, { name: "1 Decembrie 2026", path: page.path }]} />
      <article className="card prose">
        <p className="muted">Comunicat de presă · Cluj-Napoca, 27 noiembrie 2026 · liber de preluat</p>
        <h1>{page.h1}</h1>
        <p className="lead">În casele din Transilvania, Banat, Crișana și Maramureș se spune adesea că „bunicul bunicului a fost la Alba Iulia”. Acum familiile pot verifica: Cartea Neamului publică gratuit un ghid care arată, pas cu pas, cum cauți un strămoș printre delegații Marii Adunări de la 1 Decembrie 1918.</p>

        <h2>1.228 de oameni cu nume și sat</h2>
        <p>La Alba Iulia au venit aproximativ 100.000 de oameni. Dintre ei, 1.228 au fost delegați cu drept de vot: 600 aleși câte cinci în fiecare cerc electoral și 628 trimiși de biserici, școli, reuniuni de femei, societăți de studenți și alte organizații. Printre ei au fost avocați, preoți, învățători, studenți, femei din reuniunile de la Sibiu și din alte orașe și săteni aleși în adunările comunelor.</p>
        <p>Fiecare delegat a primit un <b>credențional</b>, actul care arăta cine l-a ales. Pe el apar numele celor cinci delegați ai cercului, localitatea fiecăruia și semnăturile președintelui, notarului și ale oamenilor de încredere din comune. Așa că și cine nu a fost delegat poate apărea în acte, ca semnatar.</p>

        <h2>Unde se găsesc actele</h2>
        <p>Originalele sunt păstrate la Muzeul Național al Unirii din Alba Iulia, în colecția „Documentele Unirii”. O mare parte au fost fotografiate și transcrise și pot fi citite online în Biblioteca Digitală a Bibliotecii Centrale Universitare „Lucian Blaga” din Cluj, în colecția „Transilvania 100+”.</p>

        <h2>Cum cauți un strămoș, pe scurt</h2>
        <ol>
          <li>Află în ce sat trăia strămoșul în noiembrie 1918 și ce vârstă avea.</li>
          <li>Află cercul electoral: mai multe comune formau un cerc, cu numele orașului din apropiere.</li>
          <li>Caută după comitatul de atunci, care avea alte granițe decât județul de azi.</li>
          <li>Citește credenționalul și procesul verbal: delegații, dar și cei care au semnat.</li>
          <li>Dacă strămoșul era preot, învățător sau student, caută și printre delegații organizațiilor.</li>
          <li>Verifică: un nume la fel nu înseamnă aceeași persoană. Compară satul, vârsta și meseria cu registrele parohiale.</li>
        </ol>
        <p>Cei mai mulți dintre cei 100.000 de oameni nu au fost delegați și nu apar pe nicio listă. Pentru ei, cea mai bună sursă rămâne familia: fotografiile, scrisorile și ce își amintesc cei mai în vârstă. De aceea seria include și un ghid cu întrebări despre 1 Decembrie de pus bunicilor, la masa de sărbătoare.</p>

        <blockquote>
          <p>„Unirea nu au făcut-o doar oamenii din manuale. Au făcut-o și preotul satului, învățătoarea și țăranul care a plecat cu trenul spre Alba Iulia. Mulți dintre noi suntem nepoții lor și merită să le aflăm numele.”</p>
          <p>Daniel Igna, fondatorul Cartea Neamului</p>
        </blockquote>

        <h2>Seria „Marea Unire 1918”, gratuită și fără cont</h2>
        <ul>
          {SERIES.map((g) => <li key={g.slug}><Link href={`/ghid/${g.slug}`}>{g.t}</Link></li>)}
        </ul>

        <h2>Imagini pentru articole</h2>
        <p>Desenele de mai jos sunt făcute de Cartea Neamului și pot fi folosite gratuit în articole despre 1 Decembrie, cu mențiunea „Desen: Cartea Neamului”.</p>
        {UNIRE_BANNER.map((src) => (
          <p key={src}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Desen Cartea Neamului despre Marea Unire din 1918" style={{ width: "100%", height: "auto", borderRadius: 8 }} loading="lazy" />
            <a className="btn" href={src} download>Descarcă imaginea</a>
          </p>
        ))}

        <h2>Despre Cartea Neamului</h2>
        <p>Cartea Neamului este o platformă românească pentru arborele genealogic al familiei, pornită în 2026 la Cluj-Napoca. Rudele construiesc împreună arborele, adaugă poze, acte și amintiri spuse cu vocea lor, iar site-ul are ghiduri gratuite despre registrele vechi, arhive, numele de familie și fiecare județ. Platforma e disponibilă în 18 limbi, pentru românii din toată lumea. Mai multe date, sigla și alte subiecte sunt pe <Link href="/presa">pagina de presă</Link>.</p>

        <h2>Contact</h2>
        <p>Daniel Igna, <a href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a>. Putem trimite oricând detalii, capturi de ecran sau un interviu.</p>
        <p className="muted">Surse: Muzeul Național al Unirii Alba Iulia; Biblioteca Digitală BCU Cluj, „Transilvania 100+”; Agerpres; Digi24; G. Fodor, Acta Marisiensis. Seria Historia, 2019. Lista completă e la finalul <Link href="/ghid/delegati-alba-iulia-1918">ghidului despre delegați</Link>.</p>
      </article>
    </section>
  );
}
