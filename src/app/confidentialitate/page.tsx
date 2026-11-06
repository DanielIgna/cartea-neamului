import Link from "next/link";
import type { Metadata } from "next";
import { LEGAL_UPDATED, MIN_AGE, operator } from "@/lib/legal";

export const metadata: Metadata = { title: "Politica de confidențialitate · Cartea Neamului", description: "Ce date păstrăm, de ce, cine le vede și cum le descarci sau le ștergi." };

/**
 * Politica de confidențialitate, scrisă pe înțelesul oricui. Cine răspunde de date vine din OPERATOR_NAME și CONTACT_EMAIL.
 * Când se schimbă ceva important în ce păstrăm sau cui arătăm, se schimbă și textul de aici (și LEGAL_UPDATED).
 */
export default function PrivacyPage() {
  const op = operator();
  const contact = op.email ? <a href={`mailto:${op.email}`}>{op.email}</a> : <>adresa de contact de la sfârșitul acestei pagini</>;
  return (
    <article className="card legal">
      <div className="section-label" style={{ marginTop: 0 }}>Politica de confidențialitate</div>
      <h2>Cum avem grijă de datele familiei tale</h2>
      <p className="legal-date">Ultima schimbare: {LEGAL_UPDATED}</p>
      <p>Cartea Neamului e un loc în care familiile își construiesc împreună arborele, își păstrează amintirile și își tipăresc cartea neamului.
        Aici scrie, pe scurt și fără cuvinte grele, ce date păstrăm, de ce, cine le vede și cum le descarci sau le ștergi. Pe scurt: arborii sunt
        privați, tu alegi cine îți vede amintirile, nu vindem nimic și nu facem reclame.</p>

      <h3>Cine răspunde de date</h3>
      <p>De datele din Cartea Neamului răspunde {op.name ? <b>{op.name}</b> : "cel care ține site-ul"}, ca operator, după Regulamentul general privind
        protecția datelor (Regulamentul UE 2016/679, „GDPR”). Pentru orice întrebare sau cerere despre datele tale ne scrii la {contact}.</p>

      <h3>Ce date păstrăm</h3>
      <ul>
        <li><b>Contul:</b> numele, adresa de email și parola (păstrată doar ca amprentă criptată, pe care nici noi n-o putem citi). Dacă intri cu Google,
          identificatorul contului Google și poza lui de profil. Pentru siguranța contului, sesiunile în care ești conectat, cu adresa IP și felul browserului.</li>
        <li><b>Arborii:</b> ce scrii tu și rudele tale despre oameni: nume, date și locuri de naștere și de deces, unde locuiesc cei în viață, ocupația,
          biografia, notele, pozele, actele scanate și legăturile de rudenie. Ținem minte și cine a făcut fiecare schimbare, ca greșelile să se poată îndrepta.</li>
        <li><b>Lada cu amintiri și autobiografia:</b> amintirile scrise sau spuse cu glasul (înregistrări audio), pozele lor, întrebările lăsate de rude și
          răspunsurile. Când o rudă înregistrează „la bunici” poveștile cuiva fără cont, păstrăm și acordul lui, uneori cu glasul lui.</li>
        <li><b>Credința:</b> ce scrii în capitolul „Credința” arată convingerile tale religioase. Legea le socotește date dintr-o categorie specială
          (art. 9 GDPR), așa că le păstrăm doar cu acordul tău explicit, pe care ți-l cerem chiar acolo, înainte de primul răspuns.</li>
        <li><b>Mesajele</b> pe care și le scriu rudele între ele.</li>
        <li><b>„Ești deja într-un arbore?”:</b> numele și data nașterii pe care le scrii ca să-ți găsești fișa. După căutare păstrăm doar numele de familie
          căutat și dacă s-a găsit ceva, ca să limităm căutările (așa nimeni nu poate ghici data nașterii cuiva încercând zi după zi).</li>
        <li><b>„Din aceleași locuri”:</b> doar dacă proprietarul arborelui o pornește, satele strămoșilor decedați, numele lor de familie și anii, ca să-și
          găsească neamurile alte familii cu rădăcini în aceleași sate. Păstrăm și cererile de legătură și răspunsurile la ele.</li>
        <li><b>În browserul tău:</b> tema aleasă (luminoasă sau întunecată) și spițele pe care le-ai ales să le vezi.</li>
        <li><b>Jurnalele tehnice</b> ale serverului (adresa IP, pagina cerută, ora), păstrate pentru scurt timp, ca să putem repara erorile.</li>
      </ul>

      <h3>De ce și pe ce temei</h3>
      <ul>
        <li>Ca să meargă ce ne ceri: contul, arborii, lada cu amintiri, mesajele și cartea. Temeiul e contractul dintre noi, adică acești
          <Link href="/termeni"> Termeni</Link> (art. 6 alin. 1 lit. b GDPR).</li>
        <li>Ca să păzim conturile și arborii: sesiunile, jurnalul schimbărilor și limitarea căutărilor. Temeiul e interesul nostru legitim de a ține
          site-ul în siguranță (art. 6 alin. 1 lit. f).</li>
        <li>Pentru rudele în viață pe care le treci în arbore, temeiul e interesul legitim al familiei de a-și păstra istoria, cu grijă: arborii sunt
          privați, iar cei în viață se văd doar în arborele lor, niciodată la alte familii. Oricine e trecut într-un arbore poate cere să-i îndreptăm
          sau să-i ștergem datele.</li>
        <li>Pe baza acordului tău, pe care îl poți retrage oricând: capitolul „Credința” (art. 9 alin. 2 lit. a), poveștile înregistrate „la bunici”
          și „Din aceleași locuri” (art. 6 alin. 1 lit. a). Retragerea nu schimbă ce s-a făcut înainte cu acordul dat.</li>
      </ul>

      <h3>Cine vede datele</h3>
      <ul>
        <li><b>Arborii sunt privați.</b> Îi văd doar membrii pe care îi invită proprietarul sau pe care îi primește după o cerere. Fiecare are un rol:
          vizitatorul doar vede, contributorul adaugă, editorul îndreaptă, proprietarul hotărăște cine intră.</li>
        <li><b>Cei în viață</b> se văd doar în arborele lor. Nu apar la „Din aceleași locuri” și nici la alte familii. Singurul care își poate găsi fișa
          din afara arborelui e chiar omul, cu numele și data nașterii lui întreagă; atunci proprietarul arborelui hotărăște dacă îl primește, iar până
          atunci cel care caută nu află nici măcar ce arbore e.</li>
        <li><b>Amintirile</b> le vede doar cine alege cel care le scrie: doar el (ciornă), cel care a întrebat, familia apropiată până la un grad de
          rudenie sau tot arborele. În Cartea neamului intră doar cele bifate pentru carte.</li>
        <li><b>Mesajele</b> le văd doar cei doi care și le scriu.</li>
        <li><b>Noi</b> vedem în panoul de administrare doar liste și cifre: conturile (nume, email, când au intrat) și arborii (nume, câte persoane au).
          Amintirile și mesajele nu le citim; ne uităm la ele doar dacă ne ceri tu ajutorul sau dacă ne obligă legea.</li>
        <li>Nu vindem date, nu facem reclame și nu le dăm nimănui altcuiva în afară de furnizorii de mai jos și de autorități, când legea ne obligă.</li>
      </ul>

      <h3>Furnizorii care ne ajută</h3>
      <p>Lucrăm cu câțiva furnizori, care prelucrează datele doar ca să meargă site-ul, după contracte care îi obligă să le păzească:</p>
      <ul>
        <li><b>Vercel Inc.</b> (SUA) găzduiește site-ul și rulează aplicația.</li>
        <li><b>Neon</b> (Databricks Inc., SUA) păstrează baza de date, pozele, actele și înregistrările, într-un centru de date din Frankfurt (Germania, UE).</li>
        <li><b>Google</b>, doar dacă alegi „Continuă cu Google”, îți confirmă identitatea la intrare.</li>
        <li><b>OpenStreetMap</b> (Fundația OpenStreetMap, Marea Britanie) dă bucățile de hartă din „Harta neamului”. Browserul tău le cere direct de la ei,
          așa că ei văd adresa IP de la care le ceri.</li>
      </ul>
      <p>Pentru transferurile în afara Uniunii Europene, acești furnizori folosesc clauzele contractuale standard aprobate de Comisia Europeană sau
        cadrul UE–SUA privind protecția datelor. Despre cei în viață nu trimitem nimic către servicii de inteligență artificială.</p>

      <h3>Cât timp păstrăm datele</h3>
      <p>Cât timp ai cont. Ce ștergi tu dispare imediat din site, iar copiile de siguranță ale bazei de date se rescriu singure în cel mult 30 de zile.
        Când îți ștergi contul, pleacă tot ce e al tău: contul, amintirile din lada ta, mesajele, ce ai scris altora și acordurile. Arborii rămân ai
        familiei: un arbore cu alți membri trece la unul dintre ei, iar unul în care ești singur se șterge cu totul. Fișa ta din arbori rămâne, ca să nu
        se rupă arborele, fără legătura cu contul; dacă vrei, se golește și de datele tale.</p>

      <h3>Drepturile tale</h3>
      <p>Poți afla ce date avem despre tine, le poți îndrepta, le poți șterge, le poți lua cu tine, poți cere să nu le mai folosim într-un anume fel și
        îți poți retrage oricând acordul dat. Multe le faci singur, din pagina <Link href="/datele-mele">Datele mele</Link>: descarci tot ce ține de
        contul tău, îți retragi acordul pentru „Credința” sau îți ștergi contul. Pentru restul ne scrii la {contact}; îți răspundem în cel mult o lună.</p>
      <p>Dacă socotești că nu ți-am respectat drepturile, poți face plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter
        Personal (ANSPDCP), B-dul G-ral. Gheorghe Magheru nr. 28-30, sector 1, București, <a href="https://www.dataprotection.ro" rel="noopener noreferrer" target="_blank">www.dataprotection.ro</a>.</p>

      <h3>Copiii, cei în viață și cei care nu mai sunt</h3>
      <ul>
        <li>Contul e pentru cei care au cel puțin {MIN_AGE} ani. Copiii pot fi trecuți în arbore de părinții lor.</li>
        <li>Oricine e trecut în viață într-un arbore poate cere proprietarului arborelui sau nouă să-i îndreptăm, să-i ascundem sau să-i ștergem datele.</li>
        <li>Legea datelor personale nu se aplică celor care nu mai sunt, dar amintirea lor o păstrăm cu același respect.</li>
      </ul>

      <h3>Cookie-uri</h3>
      <p>Folosim doar cookie-urile fără de care site-ul n-ar merge: cel care te ține conectat și cel cu tema aleasă. Nu folosim cookie-uri de reclamă
        sau de numărat vizitele, așa că nu-ți cerem acordul pentru ele.</p>

      <h3>Siguranța</h3>
      <p>Legătura cu site-ul e criptată, parolele le păstrăm doar ca amprentă, iar pozele, actele și înregistrările stau într-un loc privat: se deschid
        doar prin legături care expiră după câteva minute, după ce verificăm că ai voie să le vezi.</p>

      <h3>Schimbări</h3>
      <p>Dacă schimbăm ceva important în ce păstrăm sau cui arătăm, te anunțăm în site înainte ca schimbarea să intre în vigoare.</p>

      <h3>Contact</h3>
      <p>{op.name ? <>{op.name}. </> : null}{op.email ? <>Email: <a href={`mailto:${op.email}`}>{op.email}</a>.</> : <>Adresa de contact se trece aici înainte de lansare.</>}</p>
    </article>
  );
}
