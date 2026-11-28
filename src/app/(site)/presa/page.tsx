import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/continut/Breadcrumbs";
import { publicPageMetadata, canonicalUrl } from "@/lib/page-metadata";
import { PRESS_ANGLES, PRESS_PAGE as page } from "@/lib/autoritate";
import { loadCollection } from "@/lib/continut/colectii";
import { loadNames } from "@/lib/continut/nume";
import { loadCounties } from "@/lib/continut/localitati";
import { GEN_REGIONS } from "@/lib/genealogie-regiuni";
import { SITE_URL } from "@/lib/site-url";
import { limbiRo } from "@/i18n/locales";

export const metadata: Metadata = publicPageMetadata({ path: page.path, title: page.title, description: page.description });

const PRESS_EMAIL = "contact@carteaneamului.ro";
const n = (v: number) => v.toLocaleString("ro-RO");

/** /presa: kitul de presă (src/lib/autoritate.ts). Cifrele vin din conținutul site-ului, nu sunt scrise de mână. */
export default function PressPage() {
  const guides = loadCollection("ghid").length;
  const terms = loadCollection("glosar").length;
  const names = loadNames().length;
  const counties = loadCounties().length;
  const short = "Cartea Neamului este o platformă românească pentru arborele genealogic al familiei: rudele construiesc împreună arborele, adaugă poze, acte și amintiri spuse cu vocea lor, iar din el își pot face cartea neamului în PDF.";
  return (
    <section className="stack content-page" lang="ro">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "AboutPage", name: page.h1, description: page.description, url: canonicalUrl(page.path), inLanguage: "ro",
        about: { "@type": "Organization", name: "Cartea Neamului", url: SITE_URL, logo: `${SITE_URL}/sigla/cartea-neamului-logo.png`, email: PRESS_EMAIL, foundingDate: "2026", foundingLocation: "Cluj-Napoca" } }} />
      <Breadcrumbs items={[{ name: "Presă", path: page.path }]} />
      <article className="card prose">
        <h1>{page.h1}</h1>
        <p className="lead">Tot ce vă trebuie pentru un articol despre Cartea Neamului: o descriere scurtă, cifre la zi, câteva subiecte posibile, sigla și o adresă la care vă răspundem repede.</p>

        <h2>Pe scurt</h2>
        <p>{short}</p>
        <p>Platforma a pornit în 2026, la Cluj-Napoca, și se adresează familiilor din România și românilor din toată lumea. Pe lângă unealta de arbore, site-ul are ghiduri gratuite despre registrele vechi, arhive și acte, un glosar al termenilor de genealogie, pagini despre originea numelor de familie și despre fiecare județ, plus fișe gratuite pentru proiectul școlar despre arborele familiei.</p>

        <h2>Cifre la zi</h2>
        <ul>
          <li><b>{n(guides)}</b> ghiduri gratuite de genealogie, de la primii pași până la registrele în latină și chirilică;</li>
          <li><b>{n(terms)}</b> termeni explicați în glosar;</li>
          <li><b>{n(names)}</b> nume de familie românești cu originea și variantele lor;</li>
          <li>pagini pentru toate cele <b>{n(counties)}</b> de județe și pentru <b>{GEN_REGIONS.length}</b> regiuni istorice;</li>
          <li>platforma e disponibilă în <b>{limbiRo()}</b>, pentru familiile împrăștiate prin lume.</li>
        </ul>

        <h2>Ce face, concret</h2>
        <ul>
          <li><b>Arborele familiei</b>, completat de mai multe rude deodată, fiecare pe ramura lui.</li>
          <li><b>Spițele neamului</b>: linia fiecărei familii din tată în fiu, așa cum se țineau odinioară.</li>
          <li><b>Lada cu amintiri</b>: poze, acte și povești înregistrate cu vocea bunicilor.</li>
          <li><b>Harta neamului</b>: satele și orașele prin care a trecut familia.</li>
          <li><b>Cartea neamului</b> în PDF, cu arborele, fotografiile și poveștile.</li>
        </ul>
        <p>Datele celor în viață nu apar pe paginile publice; arborele îl văd doar rudele invitate. Primele 7 zile sunt gratuite, apoi există abonamente anuale (prețurile la zi sunt pe <Link href="/#preturi">prima pagină</Link>).</p>

        <h2>Comunicate</h2>
        <ul>
          <li><Link href="/presa/1-decembrie-2026">27.11.2026: De 1 Decembrie, află dacă străbunicul tău a fost la Alba Iulia</Link></li>
        </ul>

        <h2>Subiecte pentru un articol</h2>
        {PRESS_ANGLES.map((a) => (
          <div key={a.title}>
            <h3>{a.title}</h3>
            <p>{a.text}</p>
          </div>
        ))}

        <h2>Sigla și imagini</h2>
        <p>Puteți folosi sigla și numele Cartea Neamului în articole despre platformă, fără să le modificați.</p>
        <figure style={{ margin: "12px 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- imaginea exactă a siglei, ca Google să o indexeze cu numele */}
          <img src="/sigla/cartea-neamului-logo.png" alt="Sigla Cartea Neamului" width={160} height={160} loading="lazy" style={{ borderRadius: 24 }} />
          <figcaption>Sigla Cartea Neamului: o carte deschisă din care cresc generațiile, spița tatălui în albastru și a mamei în ocru.</figcaption>
        </figure>
        <p style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="btn" href="/logo.svg" download>Sigla (SVG)</a>
          <a className="btn" href="/sigla/cartea-neamului-logo.png" download>Sigla pătrată (PNG, 512 px)</a>
        </p>

        <h2>Contact pentru presă</h2>
        <p>Scrieți-ne la <a href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a> sau prin <Link href="/contact">pagina de contact</Link>. Putem pune la dispoziție conturi de probă, capturi de ecran și, cu acordul lor, legătura cu familii care și-au făcut arborele.</p>

        <h2>Pentru bloguri și site-uri de familie</h2>
        <p>Familiile care au un blog pot pune pe el fișa neamului lor, cu widgetul gratuit <Link href="/arborele-meu">„Arborele meu”</Link>. Profesorii găsesc fișe gratuite pe <Link href="/scoala">pagina pentru școli</Link>, iar ghidurile de genealogie sunt la <Link href="/ghid">/ghid</Link>. Textul și codul gata de pus pe alt site sunt pe pagina <Link href="/link-spre-noi">„Link spre noi”</Link>.</p>
      </article>
    </section>
  );
}
