/**
 * Paginile legale: Politica de confidențialitate (/confidentialitate) și Termenii (/termeni). Textul în română e cel oficial;
 * celelalte limbi sunt traduceri ca oamenii să înțeleagă (nota de sus, `LegalNote`, spune asta).
 *
 * Fiecare secțiune are `h` (titlul) și, în ordine: `p…` (paragrafe), `l…` (rânduri de listă, adunate într-o listă) și `beta`
 * (doar cât site-ul e în probă). Etichetele din texte: <b>, <mail> (adresa de contact), <terms>, <privacy>, <data>,
 * <dataPartners>, <partners>, <pm> (propmanage.ro), <anspdcp>, <code>. Valorile: {name}, {address}, {cui}, {regCom} și {euid} ale firmei care
 * răspunde de date, {email}, {minAge}, {consent} (textul bifei pentru parteneri, din `Partners.checkbox`).
 * Când se schimbă ceva important, se schimbă și data din src/lib/legal.ts.
 */
import type { Widen } from "../types";

export const roLegal = {
  Legal: {
    updated: "Ultima schimbare: {date}",
    contactTitle: "Contact",
    contactLine: "{name}, cu sediul în {address} (CUI {cui}, Nr. Reg. Com. {regCom}, EUID {euid}). Email: <mail>{email}</mail>.",
    Privacy: {
      metaTitle: "Politica de confidențialitate",
      metaDescription: "Ce date păstrăm în arborele familiei, de ce, cine le vede și cum le descarci sau le ștergi.",
      label: "Politica de confidențialitate",
      title: "Cum avem grijă de datele familiei tale",
      sections: {
        intro: {
          p1: "Cartea Neamului e un loc în care familiile își construiesc împreună arborele, își păstrează amintirile și își tipăresc cartea neamului. Aici scrie, pe scurt și fără cuvinte grele, ce date păstrăm, de ce, cine le vede și cum le descarci sau le ștergi. Pe scurt: arborii sunt privați, tu alegi cine îți vede amintirile, nu vindem nimic și nu facem reclame. Partenerului nostru, PropManage, îi dăm doar adresa ta de email și doar dacă bifezi asta.",
        },
        controller: {
          h: "Cine răspunde de date",
          p1: "De datele din Cartea Neamului răspunde, ca operator după Regulamentul general privind protecția datelor (Regulamentul UE 2016/679, „GDPR”), <b>{name}</b>, cu sediul în {address} (CUI {cui}, Nr. Reg. Com. {regCom}, EUID {euid}). Pentru orice întrebare sau cerere despre datele tale ne scrii la <mail>{email}</mail>.",
          beta: "Acum, Cartea Neamului e în probă: o folosesc doar familia și prietenii apropiați, ca să ne spună ce merge și ce nu. Și în probă, datele voastre sunt păstrate și păzite cum scrie aici.",
        },
        data: {
          h: "Ce date păstrăm",
          l1: "<b>Contul:</b> numele, adresa de email și parola (păstrată doar ca amprentă criptată, pe care nici noi n-o putem citi). Dacă intri cu Google, identificatorul contului Google și poza lui de profil. Pentru siguranța contului, sesiunile în care ești conectat, cu adresa IP și felul browserului.",
          l2: "<b>Arborii:</b> ce scrii tu și rudele tale despre oameni: nume, date și locuri de naștere și de deces, unde locuiesc cei în viață, ocupația, biografia, notele, pozele, actele scanate și legăturile de rudenie. Ținem minte și cine a făcut fiecare schimbare, ca greșelile să se poată îndrepta.",
          l3: "<b>Lada cu amintiri și autobiografia:</b> amintirile scrise sau spuse cu glasul (înregistrări audio), pozele lor, întrebările lăsate de rude și răspunsurile. Când o rudă înregistrează „la bunici” poveștile cuiva fără cont, păstrăm și acordul lui, uneori cu glasul lui.",
          l4: "<b>Credința:</b> ce scrii în capitolul „Credința” arată convingerile tale religioase. Legea le socotește date dintr-o categorie specială (art. 9 GDPR), așa că le păstrăm doar cu acordul tău explicit, pe care ți-l cerem chiar acolo, înainte de primul răspuns.",
          l5: "<b>Mesajele</b> pe care și le scriu rudele între ele.",
          l6: "<b>„Ești deja într-un arbore?”:</b> numele și data nașterii pe care le scrii ca să-ți găsești fișa. După căutare păstrăm doar numele de familie căutat și dacă s-a găsit ceva, ca să limităm căutările (așa nimeni nu poate ghici data nașterii cuiva încercând zi după zi).",
          l7: "<b>„Din aceleași locuri”:</b> doar dacă proprietarul arborelui o pornește, satele strămoșilor decedați, numele lor de familie și anii, ca să-și găsească neamurile alte familii cu rădăcini în aceleași sate. Păstrăm și cererile de legătură și răspunsurile la ele.",
          l8: "<b>Cât folosești site-ul</b>, doar dacă spui „Bine” la întrebarea pe care ți-o punem o singură dată: pe zile, cât timp ai stat în fiecare parte a site-ului (de pildă „Arborele · Copac” sau „Harta neamului”), de câte ori ai deschis-o și cât din timp a fost pe telefon sau în aplicația de pe telefon. Numărăm doar timpul în care pagina e în față și faci ceva în ea. Nu păstrăm adresa paginii, ce scrii sau pe ce apeși.",
          l9: "<b>Beneficii de la parteneri</b>, doar dacă bifezi asta (la crearea contului sau în „Datele mele”): fiecare „da” și fiecare „nu”, cu data, versiunea textului bifat, limba și locul de unde ai ales.",
          l10: "<b>Casa bătrânească:</b> ce scrii despre casa familiei pe pagina unei persoane (adresa sau satul, cine a construit-o, anul, poze și povestea ei). O vede doar cine alegi tu, ca la amintiri.",
          l13: "<b>Pozele propuse pentru prima pagină</b>, doar dacă alegi tu să propui una din albumul familiei: o copie a pozei, rândul scris sub ea, cine a propus-o, când, în ce limbă și versiunea acordului bifat. Cât timp nu e aprobată, o vedem doar noi.",
          l14: "<b>Când ne scrii</b> din pagina Contact: numele, adresa de email (ca să-ți putem răspunde) și mesajul. Nu le păstrăm în site: pleacă direct în căsuța noastră de email. Dacă ne scrii pe WhatsApp, vedem numărul tău de telefon, numele tău din WhatsApp și ce ne scrii.",
          l11: "<b>În browserul tău</b>, pe lângă cookie-urile de la capătul paginii, câteva alegeri ținute doar pe telefonul sau calculatorul tău, ca să nu le faci de fiecare dată: spițele pe care ai ales să le vezi, ce ai ales ultima dată în „Istoria umanității”, „Genealogii vechi” și „Libertatea de a crede”, fișele pe care le-ai marcat că nu sunt dubluri, dacă ai ascuns cardul de instalare a aplicației și dacă ai văzut deja cardul partenerului de după descărcarea cărții. Dacă ai spus „Bine” la măsurarea timpului, și ultimul minut numărat, cel mult o oră, ca să ajungă la noi și când închizi pagina în grabă.",
          l12: "<b>Jurnalele tehnice</b> ale serverului (adresa IP, pagina cerută, ora), păstrate pentru scurt timp, ca să putem repara erorile.",
        },
        why: {
          h: "De ce și pe ce temei",
          l1: "Ca să meargă ce ne ceri: contul, arborii, lada cu amintiri, mesajele și cartea. Temeiul e contractul dintre noi, adică acești <terms>Termeni</terms> (art. 6 alin. 1 lit. b GDPR).",
          l2: "Ca să păzim conturile și arborii: sesiunile, jurnalul schimbărilor și limitarea căutărilor. Temeiul e interesul nostru legitim de a ține site-ul în siguranță (art. 6 alin. 1 lit. f).",
          l3: "Ca să vedem ce folosesc oamenii și ce trebuie îmbunătățit: cifrele despre conturi și arbori din panoul de administrare, fără ce scrieți. Temeiul e interesul nostru legitim de a face site-ul mai bun (art. 6 alin. 1 lit. f).",
          l4: "Pentru rudele în viață pe care le treci în arbore, temeiul e interesul legitim al familiei de a-și păstra istoria, cu grijă: arborii sunt privați, iar cei în viață se văd doar în arborele lor, niciodată la alte familii. Oricine e trecut într-un arbore poate cere să-i îndreptăm sau să-i ștergem datele.",
          l5: "Pe baza acordului tău, pe care îl poți retrage oricând: capitolul „Credința” (art. 9 alin. 2 lit. a), poveștile înregistrate „la bunici”, „Din aceleași locuri”, cât folosești site-ul, beneficiile de la parteneri și pozele propuse pentru prima pagină (art. 6 alin. 1 lit. a). Retragerea nu schimbă ce s-a făcut înainte cu acordul dat.",
          l6: "Ca să-ți răspundem când ne scrii (din pagina Contact, pe email sau pe WhatsApp). Temeiul e interesul nostru legitim de a răspunde celor care ne caută (art. 6 alin. 1 lit. f) sau, când ne scrii despre contul tău, contractul dintre noi (lit. b).",
        },
        who: {
          h: "Cine vede datele",
          l1: "<b>Arborii sunt privați.</b> Îi văd doar membrii pe care îi invită proprietarul sau pe care îi primește după o cerere. Fiecare are un rol: vizitatorul doar vede, contributorul adaugă, editorul îndreaptă, proprietarul hotărăște cine intră.",
          l2: "<b>Cei în viață</b> se văd doar în arborele lor. Nu apar la „Din aceleași locuri” și nici la alte familii. Singurul care își poate găsi fișa din afara arborelui e chiar omul, cu numele și data nașterii lui întreagă; atunci proprietarul arborelui hotărăște dacă îl primește, iar până atunci cel care caută nu află nici măcar ce arbore e.",
          l3: "<b>Amintirile</b> le vede doar cine alege cel care le scrie: doar el (ciornă), cel care a întrebat, familia apropiată până la un grad de rudenie sau tot arborele. În Cartea neamului intră doar cele bifate pentru carte.",
          l4: "<b>Mesajele</b> le văd doar cei doi care și le scriu.",
          l7: "<b>Pozele de pe prima pagină</b> le vede oricine deschide site-ul: sunt pozele alese de noi și cele propuse de voi, după ce le aprobăm. Pe cele propuse de tine le poți retrage oricând, din „Filmul vieții” de pe pagina ta din arbore; atunci ies de pe prima pagină și copia lor se șterge.",
          l5: "<b>Noi</b> vedem în panoul de administrare doar ce ne trebuie ca să ținem site-ul în picioare: liste și cifre despre conturi (nume, email, când și de pe ce fel de dispozitiv au intrat), despre arbori (nume, câte persoane și fișiere au), la fiecare cont cât a adăugat (câte persoane, amintiri, poze, invitații și mesaje) și, la cei care au spus „Bine”, cât timp stau în fiecare parte a site-ului. Mai vedem istoricul schimbărilor din fișele arborilor (cine a schimbat, ce nume, date sau locuri și când), ca să putem anula o ștergere sau o greșeală și să oprim pe cineva care strică un arbore, și pozele propuse pentru prima pagină, ca să le aprobăm. Tot acolo putem ține o notă scurtă despre cont, de pildă că rămâne gratuit. Amintirile și mesajele nu le citim, iar din capitolul „Credința” nu numărăm nimic; ne uităm la ele doar dacă ne ceri tu ajutorul sau dacă ne obligă legea.",
          l6: "Nu vindem date, nu facem reclame și nu le dăm nimănui altcuiva în afară de furnizorii de mai jos, de partenerul PropManage (doar emailul celor care au bifat, cum scrie mai jos) și de autorități, când legea ne obligă.",
        },
        vendors: {
          h: "Furnizorii care ne ajută",
          p1: "Lucrăm cu câțiva furnizori, care prelucrează datele doar ca să meargă site-ul, după contracte care îi obligă să le păzească:",
          l1: "<b>Vercel Inc.</b> (SUA) găzduiește site-ul. Aplicația rulează pe serverele lor din Frankfurt (Germania, UE), lângă baza de date; paginile ajung la tine prin rețeaua lor, care poate trece și prin alte țări, ca să se încarce repede.",
          l2: "<b>Neon</b> (Databricks Inc., SUA) păstrează baza de date, pozele, actele și înregistrările, într-un centru de date din Frankfurt (Germania, UE).",
          l3: "<b>Google</b>, doar dacă alegi „Continuă cu Google”, îți confirmă identitatea la intrare.",
          l4: "<b>OpenStreetMap</b> (Fundația OpenStreetMap, Marea Britanie) dă bucățile de hartă din „Harta neamului”. Browserul tău le cere direct de la ei, așa că ei văd adresa IP de la care le ceri.",
          l5: "<b>FormSubmit</b> (formsubmit.co, SUA) ne aduce pe email mesajele trimise din pagina Contact. <b>WhatsApp</b> (WhatsApp Ireland Ltd., din grupul Meta), doar dacă alegi să ne scrii acolo, după propriile lor reguli de confidențialitate. <b>Stripe</b> (Stripe Payments Europe Ltd., Irlanda), doar dacă plătești ceva, primește plata cu cardul pe pagina lui; noi nu vedem datele cardului, ci doar ce s-a plătit, cât și când (păstrate pentru contabilitate cât cere legea).",
          p2: "Pentru transferurile în afara Uniunii Europene, acești furnizori folosesc clauzele contractuale standard aprobate de Comisia Europeană sau cadrul UE–SUA privind protecția datelor. Despre cei în viață nu trimitem nimic către servicii de inteligență artificială.",
        },
        partner: {
          h: "Partenerul nostru, PropManage",
          p1: "PropManage (<pm>propmanage.ro</pm>) e o platformă pentru proprietarii de locuințe și e partenerul Cartea Neamului. Îl găsești doar în pagina <partners>Parteneri</partners>; în arbore, în amintiri, în cronologie, pe hartă și în carte nu sunt reclame.",
          l1: "<b>Ce primește:</b> doar adresa ta de email, și doar dacă ai bifat „{consent}”. Bifa e separată, nu e bifată de la sine și nimic din site nu depinde de ea. PropManage nu primește niciodată nimic despre arborele tău, despre oamenii din el, despre rudele pe care le-ai invitat, despre sate, amintiri, poze sau glas. Rudele invitate și oamenii din arbore nu primesc niciodată mesaje de la PropManage.",
          l2: "<b>Temeiul:</b> acordul tău (art. 6 alin. 1 lit. a GDPR). Din momentul în care primește adresa, PropManage răspunde de ea ca operator separat, după propria lui politică de confidențialitate, și o folosește doar ca să-ți trimită din când în când beneficii pentru casa ta.",
          l3: "<b>Cât timp:</b> cât timp acordul tău e dat. Lista pe care o primește PropManage o facem din nou de fiecare dată din acordurile de acum, așa că, după ce îl retragi, adresa ta nu mai ajunge la el. Îi cerem să-ți șteargă adresa când află că ți-ai retras acordul.",
          l4: "<b>Cum îl retragi:</b> dintr-un clic, din <dataPartners>Datele mele</dataPartners> (comutatorul „Beneficii de la parteneri”), sau din legătura de dezabonare din orice email primit, fără să intri în cont. Retragerea nu schimbă nimic în contul sau în arborele tău.",
          l5: "Linkurile spre PropManage din site (din pagina Parteneri, de lângă casa bătrânească și de după descărcarea cărții) sunt simple legături: arată doar că vii de la Cartea Neamului, fără vreo dată despre tine.",
        },
        keep: {
          h: "Cât timp păstrăm datele",
          p1: "Cât timp ai cont. Ce ștergi tu dispare imediat din site, iar copiile de siguranță ale bazei de date se rescriu singure în cel mult 30 de zile. Când îți ștergi contul, pleacă tot ce e al tău: contul, amintirile din lada ta, mesajele, ce ai scris altora și acordurile. Arborii rămân ai familiei: un arbore cu alți membri trece la unul dintre ei, iar unul în care ești singur se șterge cu totul. Fișa ta din arbori rămâne, ca să nu se rupă arborele, fără legătura cu contul; dacă vrei, se golește și de datele tale. Cât folosești site-ul păstrăm cel mult 13 luni; dacă spui „Nu mai vreau”, se șterge imediat.",
          p2: "Pozele propuse pentru prima pagină le păstrăm până le retragi sau până îți ștergi contul; una pe care n-o alegem rămâne doar la noi și nu se vede public. Mesajele primite din pagina Contact sau pe WhatsApp le păstrăm cât e nevoie ca să lămurim ce ne-ai scris; dacă vrei să le ștergem mai devreme, spune-ne.",
        },
        rights: {
          h: "Drepturile tale",
          p1: "Poți afla ce date avem despre tine, le poți îndrepta, le poți șterge, le poți lua cu tine, poți cere să nu le mai folosim într-un anume fel și îți poți retrage oricând acordul dat. Multe le faci singur, din pagina <data>Datele mele</data>: descarci tot ce ține de contul tău, îți retragi acordul pentru „Credința” sau pentru beneficiile de la parteneri, oprești măsurarea timpului petrecut în site sau îți ștergi contul. Pentru restul ne scrii la <mail>{email}</mail>; îți răspundem în cel mult o lună.",
          p2: "Dacă socotești că nu ți-am respectat drepturile, poți face plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral. Gheorghe Magheru nr. 28-30, sector 1, București, <anspdcp>www.dataprotection.ro</anspdcp>.",
        },
        kids: {
          h: "Copiii, cei în viață și cei care nu mai sunt",
          l1: "Contul e pentru cei care au cel puțin {minAge} ani. Copiii pot fi trecuți în arbore de părinții lor.",
          l2: "Oricine e trecut în viață într-un arbore poate cere proprietarului arborelui sau nouă să-i îndreptăm, să-i ascundem sau să-i ștergem datele.",
          l3: "Legea datelor personale nu se aplică celor care nu mai sunt, dar amintirea lor o păstrăm cu același respect.",
        },
        cookies: {
          h: "Cookie-uri",
          p1: "Folosim doar cookie-urile fără de care site-ul n-ar merge, așa că nu-ți cerem acordul pentru ele:",
          l1: "<code>better-auth.session_token</code> (pe conexiunea criptată, cu <code>__Secure-</code> în față), care te ține conectat în cont, cel mult 7 zile de când ai folosit ultima dată site-ul, și <code>better-auth.session_data</code>, o copie semnată a lui, ținută 5 minute, ca paginile să se deschidă mai repede. Amândouă dispar când ieși din cont;",
          l2: "<code>limba</code>, cu limba în care ai ales să citești site-ul pe acest telefon sau calculator (de pildă „ro” sau „de”), păstrat un an;",
          l5: "<code>limba_intrebare</code>, doar dacă închizi cu ✕ întrebarea despre limba site-ului, ca să nu te mai întrebăm, păstrat un an;",
          l3: "<code>tema</code>, cu tema aleasă (luminoasă, întunecată sau automată), păstrat un an;",
          l6: "<code>cn-cookie-uri</code>, după ce apeși „Am înțeles” pe anunțul despre cookie-uri, ca să nu-l mai vezi, păstrat un an;",
          l4: "<code>cn-parteneri</code>, doar dacă bifezi beneficiile de la parteneri când îți faci contul: ține minte bifa cel mult 30 de minute, cât să ajungă alegerea ta la contul nou (și când îl faci cu Google), apoi dispare.",
          p2: "Nu folosim cookie-uri de reclamă, de statistici sau de rețele sociale, iar site-ul nu încarcă scripturi de la alte firme. Singurele lucruri pe care browserul tău le cere direct de la alții sunt bucățile de hartă de la OpenStreetMap și, dacă ai intrat cu Google, poza contului tău Google.",
        },
        safety: {
          h: "Siguranța",
          p1: "Legătura cu site-ul e criptată, parolele le păstrăm doar ca amprentă, iar pozele, actele și înregistrările stau într-un loc privat: se deschid doar prin legături care expiră după câteva minute, după ce verificăm că ai voie să le vezi.",
        },
        changes: {
          h: "Schimbări",
          p1: "Dacă schimbăm ceva important în ce păstrăm sau cui arătăm, te anunțăm în site înainte ca schimbarea să intre în vigoare.",
        },
      },
    },
    Terms: {
      metaTitle: "Termeni de utilizare",
      metaDescription: "Ce înseamnă un cont în Cartea Neamului: ce poți adăuga în arbore, al cui este și ce promitem.",
      label: "Termeni de utilizare",
      title: "Ce înseamnă să ai cont în Cartea Neamului",
      sections: {
        intro: {
          p1: "Cartea Neamului e un loc în care familiile își construiesc împreună arborele, își păstrează amintirile și își tipăresc cartea neamului. Când îți faci cont, ești de acord cu acești termeni și cu <privacy>Politica de confidențialitate</privacy>.",
          beta: "Acum, Cartea Neamului e în probă: e deschisă doar familiei și prietenilor apropiați, ca să ne spună ce merge și ce nu. Se poate schimba des și uneori poate greși, așa că păstrează-ți și tu o copie a ce contează: o descarci oricând din „Datele mele”.",
        },
        account: {
          h: "1. Contul",
          l1: "Contul e pentru cei care au cel puțin {minAge} ani. Copiii pot fi trecuți în arbore de părinții lor.",
          l2: "Un cont e al unui singur om. Parola o păstrezi doar pentru tine; ce se face din contul tău e în grija ta.",
          l3: "Contul de probă are o parolă publică, deci e al tuturor: nu pune în el nimic din familia ta.",
        },
        content: {
          h: "2. Ce pui în site",
          l1: "Pui doar ce ai dreptul să pui: poze și acte ale familiei, texte scrise de tine, înregistrări făcute cu acordul celui care vorbește.",
          l2: "Despre rudele în viață scrii cu grijă și cu bun-simț. Dacă cineva îți cere să-i scoți datele din arbore, i le scoți sau ne scrii nouă.",
          l3: "Nu pui nimic ilegal, jignitor sau care îndeamnă la ură, nici datele altora fără drept.",
          l4: "Putem ascunde sau șterge ce încalcă acești termeni sau legea și îți spunem de ce.",
          l5: "Când propui o poză pentru prima pagină, ne asiguri că ești în ea sau că ai acordul tuturor celor din ea (pentru copii, al părinților lor) și ne dai voie s-o arătăm public pe prima pagină cât timp nu o retragi. Putem alege să n-o punem sau s-o scoatem oricând.",
        },
        owner: {
          h: "3. Al cui e ce pui",
          p1: "Ce pui rămâne al tău și al familiei tale. Nouă ne dai doar voie să-l păstrăm, să-l arătăm celor pe care i-ai ales și să-l punem în cartea pe care o ceri, ca să meargă site-ul. Nu-l folosim în alt scop și nu-l vindem.",
        },
        trees: {
          h: "4. Arborii și amintirile",
          l1: "Proprietarul arborelui hotărăște cine intră și ce drepturi are: vizitatorul doar vede, contributorul adaugă, editorul îndreaptă fișele.",
          l2: "O amintire e a celui care o scrie: doar el alege cine o vede și doar el o schimbă sau o șterge.",
          l3: "Capitolul „Credința” al autobiografiei e doar pentru cei în viață, care răspund ei înșiși, cu acordul lor.",
        },
        // DE VERIFICAT DE AVOCAT: prețurile, renunțarea la dreptul de retragere (art. 16 lit. m și c din OUG 34/2014) și ANPC/SAL.
        price: {
          h: "5. Prețul",
          p1: "Când îți faci cont ai {trialDays} zile gratuite, cu tot ce oferă site-ul. După ele, ca să adaugi și să schimbi în continuare, plătești un an: {priceLei} lei (în celelalte limbi ale site-ului, {priceEur} €). O rudă invitată în arborele altcuiva are aceleași zile gratuite, apoi plătește {invitePriceLei} lei ({invitePriceEur} €) pe an. Cine avea cont înainte să pornim plățile primește primul an gratuit. În zilele gratuite, un arbore pe care nu l-a plătit nimeni poate avea până la {trialPersons} de persoane, ai un singur arbore al tău, iar rudele le poți invita doar să vadă arborele. Cu anul plătit, aceste limite dispar.",
          l1: "Dacă nu plătești, nu se șterge nimic: arborii tăi rămân, îi vezi și îi poți descărca oricând (GEDCOM și <data>Datele mele</data>), doar că nu mai poți adăuga sau schimba nimic până plătești.",
          l2: "Anul nu se reînnoiește singur și nu îți luăm bani automat de pe card.",
          l3: "<b>Cartea neamului în PDF</b> costă {bookLei} lei ({bookEur} €) pentru un arbore. Previzualizarea e gratuită; după plată o poți reface și descărca de câte ori vrei timp de 12 luni.",
          l4: "<b>Cartea tipărită</b> se face la comandă: ne ceri o ofertă din pagina cărții, iar prețul depinde de numărul de pagini, de format, de copertă și de numărul de exemplare.",
          p2: "Prețul arătat la plată e prețul final. Plătești cu cardul, prin Stripe; noi nu vedem datele cardului. Vânzătorul e {name}, CUI {cui}, Nr. ORC {regCom}, cu sediul în {address}.",
        },
        withdrawal: {
          h: "6. Dreptul de retragere",
          p1: "Ca și consumator, ai de obicei 14 zile în care poți renunța la o cumpărare fără să spui de ce (OUG nr. 34/2014).",
          l1: "<b>Anul în Cartea Neamului și cartea PDF</b> sunt conținut digital pe care îl primești imediat după plată. Înainte să plătești, bifezi că vrei să începi imediat și că știi că astfel pierzi dreptul de retragere (art. 16 lit. m din OUG nr. 34/2014). Fără bifă nu se poate plăti. Păstrăm acordul tău, cu data, iar confirmarea plății o primești pe email.",
          l2: "<b>Cartea tipărită</b> se face după datele tale, special pentru tine, așa că nici la ea nu există drept de retragere (art. 16 lit. c din OUG nr. 34/2014). Dacă ajunge stricată sau greșită din vina noastră, o refacem sau îți dăm banii înapoi.",
          l3: "Dacă ceva plătit nu merge cum am promis, ne scrii la <mail>{email}</mail> și îndreptăm lucrurile sau îți dăm banii înapoi. Drepturile pe care ți le dă legea ca și consumator rămân.",
          p2: "Cu o reclamație ne poți scrie oricând. Dacă nu ne înțelegem, te poți adresa Autorității Naționale pentru Protecția Consumatorilor (<anpc>ANPC</anpc>) sau unei entități de soluționare alternativă a litigiilor (<sal>SAL</sal>).",
        },
        reliability: {
          h: "7. Cât de sigur merge site-ul",
          p1: "Ne străduim ca site-ul să meargă bine și să nu se piardă nimic, dar nu putem promite că nu va avea niciodată întreruperi sau greșeli. Păstrează și tu o copie: arborele ca GEDCOM, cartea ca PDF și datele tale din <data>Datele mele</data>.",
        },
        end: {
          h: "8. Încheierea",
          p1: "Îți poți șterge contul oricând, din <data>Datele mele</data>. Putem suspenda un cont care încalcă grav acești termeni, după ce îi scriem omului și îi spunem de ce.",
        },
        liability: {
          h: "9. Răspunderea",
          p1: "În limitele legii, nu răspundem pentru pagube indirecte din folosirea site-ului. Nimic din acești termeni nu-ți ia drepturile pe care ți le dă legea ca consumator.",
        },
        law: {
          h: "10. Legea",
          p1: "Acestor termeni li se aplică legea română. O neînțelegere încercăm întâi s-o lămurim prin bună înțelegere; dacă nu se poate, o judecă instanțele din România.",
        },
        changes: {
          h: "11. Schimbări",
          p1: "Dacă schimbăm ceva important în acești termeni, te anunțăm în site înainte ca schimbarea să intre în vigoare.",
        },
      },
    },
  },
};

export type LegalCatalog = Widen<typeof roLegal>;
