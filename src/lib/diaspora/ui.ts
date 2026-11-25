import type { Lang } from "./tipuri";
import { NEW_UI, NEW_XUI } from "./limbi-noi";

/**
 * Textele comune ale paginilor de diaspora, în fiecare limbă: titlurile secțiunilor, pașii pentru acte și pentru arbore,
 * îndemnul de la final. Ce e propriu fiecărei țări (istoria, orașele, arhivele) stă în tari.ts și america.ts.
 */
/** `where`: locul cu prepoziția potrivită limbii („în Italia”, „au Canada”, „in der Schweiz”, „בישראל”). */
export type Ctx = { where: string; eu: boolean; icr: string | null };
export type Ui = {
  hubTitle: string; hubLead: string; hubDescription: string; diaspora: string; home: string;
  countries: string; america: string; canada: string; themes: string; states: string; provinces: string; cities: string;
  /** Regiunile, landurile sau comunitățile autonome (Europa). */
  regions: string;
  history: string; where: string; docs: string; records: string; community: string; steps: string; related: string; otherLangs: string;
  titleCountry: (where: string) => string; descCountry: (where: string) => string;
  titleRegion: (where: string) => string; descRegion: (where: string, c: string) => string;
  /** Titlul scurt, când cel obișnuit nu încape în 60 de caractere (orașe cu nume lung). */
  titleRegionShort?: (where: string) => string;
  citiesLine: (list: string) => string;
  docsSteps: (x: Ctx) => string[];
  communityText: (x: Ctx) => string[];
  genealogySteps: string[];
  ctaTitle: string; ctaText: string; ctaButton: string;
  fallback: string; sources: string; localities: string; names: string; guides: string;
  regionThin: string;
};

const ro: Ui = {
  hubTitle: "Români de pretutindeni: arborele familiei, de oriunde", diaspora: "Diaspora", home: "Acasă",
  hubLead: "Pentru românii care trăiesc în afara țării: istoria comunității din țara ta, cum obții acte din România fără să vii acasă, ce arhive există acolo și cum faci arborele familiei împreună cu rudele rămase în România.",
  hubDescription: "Istoria emigrației, acte din România cerute din străinătate și arhive: ghid pentru românii din Italia, Spania, Germania, Marea Britanie, SUA și Canada.",
  countries: "Europa și Israel", america: "Statele Unite", canada: "Canada", themes: "Pagini speciale", states: "Statele", provinces: "Provinciile și teritoriile", cities: "Orașele mari", regions: "Regiunile",
  history: "Cum au ajuns românii aici", where: "Unde trăiesc", docs: "Acte din România, cerute de aici", records: "Arhivele și registrele de aici",
  community: "Comunități și asociații", steps: "Pas cu pas: arborele familiei, de departe", related: "Vezi și", otherLangs: "Pagina în alte limbi",
  titleCountry: (w) => `Români ${w} – află-ți rădăcinile din România | Cartea Neamului`,
  descCountry: (w) => `Cum au ajuns românii ${w}, cum ceri acte din România de acolo, ce arhive există și cum faci arborele familiei cu rudele de acasă.`,
  titleRegion: (w) => `Români ${w} – află-ți rădăcinile din România | Cartea Neamului`,
  titleRegionShort: (w) => `Români ${w} – rădăcini și acte | Cartea Neamului`,
  descRegion: (w, c) => `Românii ${w} (${c}): comunitatea, consulatul României, unde ceri actele de acolo și din România și cum faci arborele familiei.`,
  citiesLine: (l) => `Cele mai multe familii de români sunt în ${l}.`,
  docsSteps: ({ where, eu }) => [
    "Află întâi ce act îți trebuie și unde e: certificatele de naștere, căsătorie sau deces se eliberează de starea civilă a primăriei unde au fost înregistrate; registrele mai vechi de 100 de ani sunt de obicei la Arhivele Naționale, la serviciul județean.",
    `Dacă locuiești ${where}, ai trei căi: la consulatul României de care aparții (programarea se face pe econsulat.ro), printr-o rudă din România căreia îi dai procură (o faci la consulat), sau direct la Arhivele Naționale, prin e-mail, pentru registrele vechi.`,
    eu
      ? `Ca să folosești un act românesc ${where}, de obicei nu mai ai nevoie de apostilă: în Uniunea Europeană actele de stare civilă circulă fără ea (Regulamentul UE 2016/1191), iar la cerere primești și un formular multilingv care le însoțește.`
      : `Ca să folosești un act românesc ${where}, îți trebuie de obicei apostila de la Haga, pusă în România de prefectură, și o traducere autorizată.`,
    "Când ceri un act vechi, scrie tot ce știi: numele (și forma lui veche sau în altă limbă), anul aproximativ, satul și comuna de atunci. Pagina fiecărei localități de pe Cartea Neamului îți arată de ce primărie și de ce arhivă ține satul.",
    "Dacă ai cetățenie română, actele de stare civilă făcute în străinătate (nașterea unui copil, căsătoria) se transcriu în registrele românești tot prin consulat sau la starea civilă din România.",
  ],
  communityText: ({ where, icr }) => [
    `Românii care trăiesc ${where} se întâlnesc mai ales prin asociațiile culturale, școlile de weekend și cursurile de limba română pentru copii. Asociațiile înregistrate sunt pe site-ul Departamentului pentru Românii de Pretutindeni (dprp.gov.ro), iar consulatul le știe de obicei pe cele din orașul tău.`,
    ...(icr ? [`Institutul Cultural Român are o filială la ${icr}, cu expoziții, concerte și o bibliotecă.`] : []),
    "Cele mai bune surse pentru istoria familiei sunt însă oamenii: bătrânii comunității își amintesc din ce sate au venit primele familii și cine cu cine e rudă.",
  ],
  genealogySteps: [
    "Scrie ce știi deja: numele, datele și locurile părinților și ale bunicilor.",
    "Întreabă rudele mai în vârstă, și pe cele rămase acasă: un apel video cu pozele vechi pe ecran aduce multe nume.",
    "Află satul de unde vine familia și caută-l pe Cartea Neamului: vezi primăria, arhiva și numele de familie de acolo.",
    "Cere actele de care ai nevoie, din România și din țara în care trăiești (vezi mai sus).",
    "Pune totul într-un arbore pe care îl completează toată familia, de oriunde ar fi.",
  ],
  ctaTitle: "Începe arborele familiei", ctaText: "Primele 7 zile sunt gratuite, fără card. Îi inviți pe cei de acasă și pe cei plecați, iar fiecare completează ce știe.", ctaButton: "Începe arborele familiei →",
  fallback: "Pagina nu e încă în limba ta, așa că o vezi în engleză.", sources: "Surse", localities: "Localitățile din România", names: "Nume de familie", guides: "Ghiduri de genealogie",
  regionThin: "Încă strângem informații despre românii de aici. Până atunci, pașii de mai jos sunt valabili oriunde în țară.",
};

const en: Ui = {
  hubTitle: "Romanians abroad: your family tree, from anywhere", diaspora: "Diaspora", home: "Home",
  hubLead: "For Romanians living outside Romania and for anyone with Romanian roots: the history of the community where you live, how to get Romanian documents without travelling, which archives exist there, and how to build the family tree together with relatives back home.",
  hubDescription: "Emigration history, Romanian documents from abroad and archives: a guide for families with Romanian roots in the UK, US, Canada, Italy and Spain.",
  countries: "Europe and Israel", america: "United States", canada: "Canada", themes: "Special pages", states: "States", provinces: "Provinces and territories", cities: "Major cities", regions: "Regions",
  history: "How Romanians came here", where: "Where they live", docs: "Romanian documents, requested from here", records: "Local archives and records",
  community: "Communities and associations", steps: "Step by step: your family tree, from far away", related: "See also", otherLangs: "This page in other languages",
  titleCountry: (w) => `Romanians ${w}: history and family roots | Cartea Neamului`,
  descCountry: (w) => `How Romanians settled ${w}, how to request Romanian documents from there, which archives to use and how to build your family tree.`,
  titleRegion: (w) => `Romanian roots ${w}: records and genealogy | Cartea Neamului`,
  titleRegionShort: (w) => `Romanian roots ${w}: records | Cartea Neamului`,
  descRegion: (w, c) => `Romanians ${w} (${c}): community history, Romanian documents requested from abroad, local archives and building your family tree.`,
  citiesLine: (l) => `Most Romanian families live in ${l}.`,
  docsSteps: ({ where, eu }) => [
    "First find out which document you need and where it is kept: birth, marriage and death certificates are issued by the civil registry office of the town hall where they were registered; registers older than 100 years are usually held by the county branch of the Romanian National Archives.",
    `If you live ${where}, there are three ways: through the Romanian consulate for your area (book an appointment on econsulat.ro), through a relative in Romania to whom you give a power of attorney (signed at the consulate), or by writing directly to the National Archives for old registers.`,
    eu
      ? `To use a Romanian certificate ${where}, you usually no longer need an apostille: within the European Union civil status documents circulate without one (EU Regulation 2016/1191), and you can ask for a multilingual standard form to go with them.`
      : `To use a Romanian certificate ${where}, you will usually need a Hague apostille, issued in Romania by the prefecture, and a certified translation.`,
    "When you ask for an old record, give everything you know: the name (and its old or foreign spelling), the approximate year, and the village and commune at the time. Each locality page on Cartea Neamului shows which town hall and which archive a village belongs to.",
    "If you hold Romanian citizenship, records made abroad (a child's birth, a marriage) are transcribed into the Romanian registers through the consulate or at a civil registry office in Romania.",
  ],
  communityText: ({ where, icr }) => [
    `Romanians ${where} meet mostly through cultural associations, weekend schools and Romanian language classes for children. Registered associations are listed by the Romanian Department for Romanians Abroad (dprp.gov.ro), and the consulate usually knows the ones in your city.`,
    ...(icr ? [`The Romanian Cultural Institute has a branch in ${icr}, with exhibitions, concerts and a library.`] : []),
    "The best sources for family history are still people: the community's elders remember which villages the first families came from and who is related to whom.",
  ],
  genealogySteps: [
    "Write down what you already know: the names, dates and places of your parents and grandparents.",
    "Ask older relatives, including those still in Romania: a video call with old photos on screen brings back many names.",
    "Find the village your family comes from and look it up on Cartea Neamului: the town hall, the archive and the family names found there.",
    "Request the records you need, from Romania and from the country where you live (see above).",
    "Put everything in one tree that the whole family can add to, wherever they live.",
  ],
  ctaTitle: "Start your family tree", ctaText: "The first 7 days are free, no card needed. Invite relatives in Romania and abroad, and each adds what they know.", ctaButton: "Start your family tree →",
  fallback: "This page is not yet available in your language, so it is shown in English.", sources: "Sources", localities: "Localities in Romania", names: "Romanian family names", guides: "Genealogy guides",
  regionThin: "We are still gathering information about Romanians here. Meanwhile, the steps below work anywhere in the country.",
};

const it: Ui = {
  hubTitle: "Romeni nel mondo: l'albero di famiglia, da ovunque", diaspora: "Diaspora", home: "Home",
  hubLead: "Per i romeni che vivono all'estero e per chi ha radici romene: la storia della comunità nel tuo paese, come ottenere documenti romeni senza tornare, quali archivi esistono e come costruire l'albero di famiglia con i parenti rimasti in Romania.",
  hubDescription: "Storia dell'emigrazione, documenti romeni richiesti dall'estero, archivi e comunità: guida per i romeni in Italia e nel mondo.",
  countries: "Europa e Israele", america: "Stati Uniti", canada: "Canada", themes: "Pagine speciali", states: "Stati", provinces: "Province e territori", cities: "Grandi città", regions: "Regioni",
  history: "Come sono arrivati i romeni", where: "Dove vivono", docs: "Documenti romeni, richiesti da qui", records: "Archivi e registri locali",
  community: "Comunità e associazioni", steps: "Passo dopo passo: l'albero di famiglia, da lontano", related: "Vedi anche", otherLangs: "Questa pagina in altre lingue",
  titleCountry: (w) => `Romeni ${w}: storia, documenti, albero genealogico | Cartea Neamului`,
  descCountry: (w) => `Come sono arrivati i romeni ${w}, come richiedere documenti romeni da qui, quali archivi usare e come fare l'albero di famiglia.`,
  titleRegion: (w) => `Romeni ${w}: comunità, documenti, genealogia | Cartea Neamului`,
  titleRegionShort: (w) => `Romeni ${w}: radici e documenti | Cartea Neamului`,
  descRegion: (w, c) => `I romeni ${w} (${c}): storia della comunità, consolato, documenti romeni richiesti dall'Italia, archivi locali e albero di famiglia.`,
  citiesLine: (l) => `La maggior parte delle famiglie romene vive a ${l}.`,
  docsSteps: ({ where, eu }) => [
    "Per prima cosa scopri quale atto ti serve e dove si trova: gli atti di nascita, matrimonio e morte li rilascia l'ufficio di stato civile del comune romeno dove sono stati registrati; i registri con più di 100 anni sono di solito agli Archivi Nazionali, nella sede provinciale (județ).",
    `Se vivi ${where}, hai tre strade: il consolato di Romania competente per la tua zona (appuntamento su econsulat.ro), un parente in Romania a cui dai una procura (firmata in consolato), oppure una richiesta diretta agli Archivi Nazionali per i registri antichi.`,
    eu
      ? `Per usare un atto romeno ${where} di solito non serve più l'apostille: nell'Unione europea gli atti di stato civile circolano senza (Regolamento UE 2016/1191) e puoi chiedere un modulo multilingue da allegare.`
      : `Per usare un atto romeno ${where} serve di solito l'apostille dell'Aia, rilasciata in Romania dalla prefettura, e una traduzione giurata.`,
    "Quando chiedi un atto antico, scrivi tutto ciò che sai: il nome (anche nella forma antica o straniera), l'anno approssimativo, il villaggio e il comune di allora. La pagina di ogni località su Cartea Neamului indica il comune e l'archivio competenti.",
    "Se hai la cittadinanza romena, gli atti fatti all'estero (nascita di un figlio, matrimonio) si trascrivono nei registri romeni tramite il consolato o presso lo stato civile in Romania.",
  ],
  communityText: ({ where, icr }) => [
    `I romeni ${where} si incontrano soprattutto nelle associazioni culturali, nelle scuole del fine settimana e nei corsi di lingua romena per bambini. Le associazioni registrate sono elencate dal Dipartimento per i Romeni nel Mondo (dprp.gov.ro) e il consolato conosce di solito quelle della tua città.`,
    ...(icr ? [`L'Istituto Culturale Romeno ha una sede a ${icr}, con mostre, concerti e una biblioteca.`] : []),
    "Le fonti migliori per la storia di famiglia restano le persone: gli anziani della comunità ricordano da quali villaggi sono partite le prime famiglie e chi è parente di chi.",
  ],
  genealogySteps: [
    "Scrivi ciò che sai già: nomi, date e luoghi dei genitori e dei nonni.",
    "Chiedi ai parenti più anziani, anche a quelli rimasti in Romania: una videochiamata con le foto vecchie sullo schermo fa tornare in mente molti nomi.",
    "Scopri il villaggio da cui viene la famiglia e cercalo su Cartea Neamului: comune, archivio e cognomi del luogo.",
    "Richiedi gli atti che ti servono, in Romania e nel paese in cui vivi (vedi sopra).",
    "Metti tutto in un unico albero che tutta la famiglia può completare, ovunque si trovi.",
  ],
  ctaTitle: "Inizia l'albero di famiglia", ctaText: "I primi 7 giorni sono gratuiti, senza carta. Inviti i parenti in Romania e all'estero e ognuno aggiunge ciò che sa.", ctaButton: "Inizia l'albero di famiglia →",
  fallback: "Questa pagina non è ancora nella tua lingua: la vedi in inglese.", sources: "Fonti", localities: "Località della Romania", names: "Cognomi romeni", guides: "Guide di genealogia",
  regionThin: "Stiamo ancora raccogliendo informazioni sui romeni di qui. Intanto, i passi qui sotto valgono ovunque.",
};

const es: Ui = {
  hubTitle: "Rumanos por el mundo: el árbol familiar, desde donde estés", diaspora: "Diáspora", home: "Inicio",
  hubLead: "Para los rumanos que viven fuera de Rumanía y para quien tiene raíces rumanas: la historia de la comunidad en tu país, cómo conseguir documentos rumanos sin viajar, qué archivos hay y cómo hacer el árbol familiar con los parientes que siguen en Rumanía.",
  hubDescription: "Historia de la emigración, documentos rumanos pedidos desde el extranjero, archivos y comunidades: guía para los rumanos en España y en el mundo.",
  countries: "Europa e Israel", america: "Estados Unidos", canada: "Canadá", themes: "Páginas especiales", states: "Estados", provinces: "Provincias y territorios", cities: "Grandes ciudades", regions: "Regiones",
  history: "Cómo llegaron los rumanos", where: "Dónde viven", docs: "Documentos rumanos, pedidos desde aquí", records: "Archivos y registros locales",
  community: "Comunidades y asociaciones", steps: "Paso a paso: el árbol familiar, desde lejos", related: "Ver también", otherLangs: "Esta página en otros idiomas",
  titleCountry: (w) => `Rumanos ${w}: historia, documentos, árbol familiar | Cartea Neamului`,
  descCountry: (w) => `Cómo se asentaron los rumanos ${w}, cómo pedir documentos rumanos desde aquí, qué archivos consultar y cómo hacer el árbol familiar.`,
  titleRegion: (w) => `Rumanos ${w}: comunidad, documentos, genealogía | Cartea Neamului`,
  titleRegionShort: (w) => `Rumanos ${w}: raíces y documentos | Cartea Neamului`,
  descRegion: (w, c) => `Los rumanos ${w} (${c}): historia de la comunidad, consulado, documentos rumanos pedidos desde aquí, archivos y árbol familiar.`,
  citiesLine: (l) => `La mayoría de las familias rumanas vive en ${l}.`,
  docsSteps: ({ where, eu }) => [
    "Primero averigua qué acta necesitas y dónde está: las actas de nacimiento, matrimonio y defunción las expide el registro civil del ayuntamiento rumano donde se inscribieron; los libros de más de 100 años suelen estar en los Archivos Nacionales, en la delegación del distrito (județ).",
    `Si vives ${where}, tienes tres caminos: el consulado de Rumanía que te corresponde (cita en econsulat.ro), un familiar en Rumanía al que das un poder (firmado en el consulado) o una solicitud directa a los Archivos Nacionales para los libros antiguos.`,
    eu
      ? `Para usar un acta rumana ${where} normalmente ya no hace falta la apostilla: en la Unión Europea los documentos de estado civil circulan sin ella (Reglamento UE 2016/1191) y puedes pedir un formulario multilingüe que los acompañe.`
      : `Para usar un acta rumana ${where} suele hacer falta la apostilla de La Haya, expedida en Rumanía por la prefectura, y una traducción jurada.`,
    "Cuando pidas un acta antigua, da todo lo que sepas: el nombre (también en su forma antigua o extranjera), el año aproximado, el pueblo y el municipio de entonces. La página de cada localidad en Cartea Neamului indica el ayuntamiento y el archivo que le corresponden.",
    "Si tienes la nacionalidad rumana, las actas hechas en el extranjero (el nacimiento de un hijo, un matrimonio) se transcriben en los registros rumanos a través del consulado o en un registro civil de Rumanía.",
  ],
  communityText: ({ where, icr }) => [
    `Los rumanos ${where} se reúnen sobre todo en asociaciones culturales, escuelas de fin de semana y clases de rumano para niños. Las asociaciones registradas figuran en la web del Departamento para los Rumanos de Todo el Mundo (dprp.gov.ro) y el consulado suele conocer las de tu ciudad.`,
    ...(icr ? [`El Instituto Cultural Rumano tiene sede en ${icr}, con exposiciones, conciertos y una biblioteca.`] : []),
    "Las mejores fuentes para la historia familiar siguen siendo las personas: los mayores de la comunidad recuerdan de qué pueblos vinieron las primeras familias y quién es pariente de quién.",
  ],
  genealogySteps: [
    "Escribe lo que ya sabes: nombres, fechas y lugares de tus padres y abuelos.",
    "Pregunta a los parientes mayores, también a los que siguen en Rumanía: una videollamada con fotos antiguas en pantalla trae muchos nombres.",
    "Averigua el pueblo de origen de la familia y búscalo en Cartea Neamului: ayuntamiento, archivo y apellidos del lugar.",
    "Pide las actas que necesitas, en Rumanía y en el país donde vives (ver arriba).",
    "Pon todo en un solo árbol que toda la familia pueda completar, esté donde esté.",
  ],
  ctaTitle: "Empieza tu árbol familiar", ctaText: "Los primeros 7 días son gratis, sin tarjeta. Invitas a los parientes en Rumanía y fuera, y cada uno añade lo que sabe.", ctaButton: "Empieza tu árbol familiar →",
  fallback: "Esta página aún no está en tu idioma, así que la ves en inglés.", sources: "Fuentes", localities: "Localidades de Rumanía", names: "Apellidos rumanos", guides: "Guías de genealogía",
  regionThin: "Todavía estamos reuniendo información sobre los rumanos de aquí. Mientras tanto, los pasos de abajo sirven en todo el país.",
};

const de: Ui = {
  hubTitle: "Rumänen in aller Welt: der Familienstammbaum, von überall", diaspora: "Diaspora", home: "Startseite",
  hubLead: "Für Rumänen im Ausland und alle mit Wurzeln in Rumänien: die Geschichte der Gemeinschaft in deinem Land, wie du rumänische Urkunden ohne Reise bekommst, welche Archive es gibt und wie du den Stammbaum mit den Verwandten in Rumänien aufbaust.",
  hubDescription: "Auswanderung, rumänische Urkunden aus dem Ausland und Archive: ein Leitfaden für Rumänen, Sachsen und Schwaben in Deutschland und Österreich.",
  countries: "Europa und Israel", america: "Vereinigte Staaten", canada: "Kanada", themes: "Sonderseiten", states: "Bundesstaaten", provinces: "Provinzen und Territorien", cities: "Großstädte", regions: "Regionen und Bundesländer",
  history: "Wie die Rumänen hierherkamen", where: "Wo sie leben", docs: "Rumänische Urkunden, von hier beantragt", records: "Archive und Register vor Ort",
  community: "Gemeinschaften und Vereine", steps: "Schritt für Schritt: der Stammbaum aus der Ferne", related: "Siehe auch", otherLangs: "Diese Seite in anderen Sprachen",
  titleCountry: (w) => `Rumänen ${w}: Geschichte, Urkunden, Stammbaum | Cartea Neamului`,
  descCountry: (w) => `Rumänen ${w}: wie sie kamen, wie du von hier rumänische Urkunden beantragst, welche Archive helfen und wie du den Stammbaum aufbaust.`,
  titleRegion: (w) => `Rumänen ${w}: Gemeinschaft, Urkunden, Ahnenforschung | Cartea Neamului`,
  titleRegionShort: (w) => `Rumänen ${w}: Wurzeln und Urkunden | Cartea Neamului`,
  descRegion: (w, c) => `Rumänen ${w} (${c}): Geschichte der Gemeinschaft, rumänische Urkunden von hier beantragen, Archive und der Familienstammbaum.`,
  citiesLine: (l) => `Die meisten rumänischen Familien leben in ${l}.`,
  docsSteps: ({ where, eu }) => [
    "Kläre zuerst, welche Urkunde du brauchst und wo sie liegt: Geburts-, Heirats- und Sterbeurkunden stellt das Standesamt des rumänischen Rathauses aus, in dem sie eingetragen wurden; Register, die älter als 100 Jahre sind, liegen meist im Kreisarchiv des Rumänischen Nationalarchivs.",
    `Wenn du ${where} lebst, gibt es drei Wege: das zuständige rumänische Konsulat (Termin über econsulat.ro), einen Verwandten in Rumänien mit Vollmacht (im Konsulat unterschrieben) oder eine direkte Anfrage beim Nationalarchiv für alte Register.`,
    eu
      ? `Um eine rumänische Urkunde ${where} zu verwenden, brauchst du meist keine Apostille mehr: In der EU gelten Personenstandsurkunden ohne sie (EU-Verordnung 2016/1191), und du kannst ein mehrsprachiges Formular dazu beantragen.`
      : `Um eine rumänische Urkunde ${where} zu verwenden, brauchst du meist eine Haager Apostille, die in Rumänien die Präfektur ausstellt, und eine beglaubigte Übersetzung.`,
    "Wenn du eine alte Urkunde anfragst, gib alles an, was du weißt: den Namen (auch in alter, deutscher oder ungarischer Schreibweise), das ungefähre Jahr, Dorf und Gemeinde von damals. Die Seite jedes Ortes auf Cartea Neamului zeigt, zu welchem Rathaus und welchem Archiv ein Dorf gehört.",
    "Wer die rumänische Staatsbürgerschaft hat, lässt im Ausland ausgestellte Urkunden (Geburt eines Kindes, Heirat) über das Konsulat oder ein Standesamt in Rumänien in die rumänischen Register eintragen.",
  ],
  communityText: ({ where, icr }) => [
    `Rumänen ${where} treffen sich vor allem in Kulturvereinen, Wochenendschulen und Rumänischkursen für Kinder. Eingetragene Vereine listet das rumänische Departement für Rumänen im Ausland (dprp.gov.ro), und das Konsulat kennt meist die in deiner Stadt.`,
    ...(icr ? [`Das Rumänische Kulturinstitut hat eine Niederlassung in ${icr}, mit Ausstellungen, Konzerten und einer Bibliothek.`] : []),
    "Die besten Quellen für die Familiengeschichte sind aber Menschen: Die Älteren der Gemeinschaft wissen noch, aus welchen Dörfern die ersten Familien kamen und wer mit wem verwandt ist.",
  ],
  genealogySteps: [
    "Schreib auf, was du schon weißt: Namen, Daten und Orte deiner Eltern und Großeltern.",
    "Frag ältere Verwandte, auch die in Rumänien: Ein Videoanruf mit alten Fotos auf dem Bildschirm bringt viele Namen zurück.",
    "Finde das Dorf, aus dem die Familie stammt, und such es auf Cartea Neamului: Rathaus, Archiv und Familiennamen des Ortes.",
    "Beantrage die Urkunden, die du brauchst, in Rumänien und in deinem Land (siehe oben).",
    "Trag alles in einen Stammbaum ein, den die ganze Familie ergänzen kann, wo immer sie lebt.",
  ],
  ctaTitle: "Stammbaum beginnen", ctaText: "Die ersten 7 Tage sind kostenlos, ohne Karte. Lade Verwandte in Rumänien und im Ausland ein, und jeder ergänzt, was er weiß.", ctaButton: "Stammbaum beginnen →",
  fallback: "Diese Seite gibt es noch nicht in deiner Sprache, deshalb siehst du sie auf Englisch.", sources: "Quellen", localities: "Orte in Rumänien", names: "Rumänische Familiennamen", guides: "Leitfäden zur Ahnenforschung",
  regionThin: "Wir sammeln noch Informationen über die Rumänen hier. Bis dahin gelten die Schritte unten überall im Land.",
};

const fr: Ui = {
  hubTitle: "Roumains du monde : l'arbre familial, d'où que vous soyez", diaspora: "Diaspora", home: "Accueil",
  hubLead: "Pour les Roumains de l'étranger et tous ceux qui ont des racines roumaines : l'histoire de la communauté dans votre pays, comment obtenir des actes roumains sans voyager, quelles archives existent et comment construire l'arbre familial avec les proches restés en Roumanie.",
  hubDescription: "Histoire de l'émigration, actes roumains demandés depuis l'étranger et archives : un guide pour les Roumains de France, Belgique, Suisse et Québec.",
  countries: "Europe et Israël", america: "États-Unis", canada: "Canada", themes: "Pages spéciales", states: "États", provinces: "Provinces et territoires", cities: "Grandes villes", regions: "Régions",
  history: "Comment les Roumains sont arrivés", where: "Où ils vivent", docs: "Actes roumains, demandés d'ici", records: "Archives et registres locaux",
  community: "Communautés et associations", steps: "Pas à pas : l'arbre familial, de loin", related: "Voir aussi", otherLangs: "Cette page dans d'autres langues",
  titleCountry: (w) => `Roumains ${w} : histoire, actes, arbre généalogique | Cartea Neamului`,
  descCountry: (w) => `Comment les Roumains se sont installés ${w}, comment demander des actes roumains d'ici, quelles archives consulter et comment faire l'arbre.`,
  titleRegion: (w) => `Roumains ${w} : communauté, actes, généalogie | Cartea Neamului`,
  titleRegionShort: (w) => `Roumains ${w} : racines et actes | Cartea Neamului`,
  descRegion: (w, c) => `Les Roumains ${w} (${c}) : histoire de la communauté, actes roumains demandés d'ici, archives locales et arbre familial avec vos proches.`,
  citiesLine: (l) => `La plupart des familles roumaines vivent à ${l}.`,
  docsSteps: ({ where, eu }) => [
    "Commencez par savoir quel acte il vous faut et où il se trouve : les actes de naissance, de mariage et de décès sont délivrés par l'état civil de la mairie roumaine où ils ont été enregistrés ; les registres de plus de 100 ans sont en général aux Archives nationales, au service du département (județ).",
    `Si vous vivez ${where}, trois voies : le consulat de Roumanie compétent (rendez-vous sur econsulat.ro), un proche en Roumanie à qui vous donnez une procuration (signée au consulat), ou une demande directe aux Archives nationales pour les registres anciens.`,
    eu
      ? `Pour utiliser un acte roumain ${where}, l'apostille n'est en général plus nécessaire : dans l'Union européenne, les actes d'état civil circulent sans elle (règlement UE 2016/1191), et vous pouvez demander un formulaire multilingue qui les accompagne.`
      : `Pour utiliser un acte roumain ${where}, il faut en général l'apostille de La Haye, délivrée en Roumanie par la préfecture, et une traduction certifiée.`,
    "Pour un acte ancien, donnez tout ce que vous savez : le nom (et sa forme ancienne ou étrangère), l'année approximative, le village et la commune de l'époque. La page de chaque localité sur Cartea Neamului indique la mairie et l'archive dont dépend le village.",
    "Si vous avez la nationalité roumaine, les actes établis à l'étranger (naissance d'un enfant, mariage) sont transcrits dans les registres roumains par le consulat ou par un état civil en Roumanie.",
  ],
  communityText: ({ where, icr }) => [
    `Les Roumains ${where} se retrouvent surtout dans les associations culturelles, les écoles du week-end et les cours de roumain pour enfants. Les associations enregistrées figurent sur le site du Département pour les Roumains de partout (dprp.gov.ro), et le consulat connaît en général celles de votre ville.`,
    ...(icr ? [`L'Institut culturel roumain a une antenne à ${icr}, avec expositions, concerts et bibliothèque.`] : []),
    "Les meilleures sources pour l'histoire familiale restent les personnes : les aînés de la communauté se souviennent des villages d'où venaient les premières familles et de qui est parent de qui.",
  ],
  genealogySteps: [
    "Notez ce que vous savez déjà : noms, dates et lieux de vos parents et grands-parents.",
    "Interrogez les proches plus âgés, y compris ceux restés en Roumanie : un appel vidéo avec les vieilles photos à l'écran fait revenir beaucoup de noms.",
    "Trouvez le village d'origine de la famille et cherchez-le sur Cartea Neamului : mairie, archive et noms de famille du lieu.",
    "Demandez les actes dont vous avez besoin, en Roumanie et dans votre pays (voir plus haut).",
    "Réunissez tout dans un seul arbre que toute la famille peut compléter, où qu'elle vive.",
  ],
  ctaTitle: "Commencez votre arbre familial", ctaText: "Les 7 premiers jours sont gratuits, sans carte. Invitez les proches en Roumanie et à l'étranger, chacun ajoute ce qu'il sait.", ctaButton: "Commencez votre arbre familial →",
  fallback: "Cette page n'existe pas encore dans votre langue : elle s'affiche en anglais.", sources: "Sources", localities: "Localités de Roumanie", names: "Noms de famille roumains", guides: "Guides de généalogie",
  regionThin: "Nous rassemblons encore des informations sur les Roumains d'ici. En attendant, les étapes ci-dessous valent partout.",
};

const he: Ui = {
  hubTitle: "שורשים ברומניה: אילן היוחסין של המשפחה, מכל מקום", diaspora: "תפוצות", home: "דף הבית",
  hubLead: "למי שנולד ברומניה או שמשפחתו הגיעה משם: תולדות הקהילה בארץ שבה אתם חיים, איך משיגים מסמכים מרומניה בלי לנסוע, אילו ארכיונים קיימים ואיך בונים את אילן היוחסין יחד עם הקרובים.",
  hubDescription: "תולדות העלייה וההגירה מרומניה, מסמכים רומניים מחו\"ל, ארכיונים וקהילות: מדריך לבעלי שורשים רומניים בישראל ובעולם, וכיצד בונים יחד את אילן היוחסין.",
  countries: "אירופה וישראל", america: "ארצות הברית", canada: "קנדה", themes: "דפים מיוחדים", states: "מדינות", provinces: "פרובינציות וטריטוריות", cities: "ערים גדולות", regions: "אזורים",
  history: "איך הגיעו לכאן", where: "היכן הם חיים", docs: "מסמכים מרומניה, מבוקשים מכאן", records: "ארכיונים ורשומות מקומיים",
  community: "קהילות ועמותות", steps: "צעד אחר צעד: אילן היוחסין, מרחוק", related: "ראו גם", otherLangs: "הדף בשפות אחרות",
  titleCountry: (w) => `יוצאי רומניה ${w}: היסטוריה, מסמכים, אילן יוחסין | Cartea Neamului`,
  descCountry: (w) => `יוצאי רומניה ${w}: איך הגיעו, איך מבקשים מסמכים מרומניה, אילו ארכיונים יעזרו ואיך בונים יחד עם המשפחה את אילן היוחסין.`,
  titleRegion: (w) => `יוצאי רומניה ${w}: קהילה, מסמכים, גנאלוגיה | Cartea Neamului`,
  descRegion: (w, c) => `יוצאי רומניה ${w} (${c}): תולדות הקהילה, מסמכים מרומניה ואילן היוחסין.`,
  citiesLine: (l) => `רוב המשפחות חיות ב${l}.`,
  docsSteps: ({ where, eu }) => [
    "קודם כול בררו איזה מסמך צריך והיכן הוא שמור: תעודות לידה, נישואין ופטירה מנפיק משרד מרשם האוכלוסין (Starea civilă) של העירייה ברומניה שבה נרשמו; ספרי רישום בני יותר ממאה שנה שמורים בדרך כלל בסניף המחוזי של הארכיון הלאומי של רומניה.",
    `אם אתם גרים ${where}, יש שלוש דרכים: הקונסוליה של רומניה האחראית על אזורכם (תור דרך econsulat.ro), קרוב משפחה ברומניה שמקבל מכם ייפוי כוח (נחתם בקונסוליה), או פנייה ישירה לארכיון הלאומי בעניין ספרי רישום ישנים.`,
    eu
      ? `כדי להשתמש במסמך רומני ${where} בדרך כלל אין צורך באפוסטיל: באיחוד האירופי מסמכי מעמד אישי תקפים בלעדיו (תקנה 2016/1191).`
      : `כדי להשתמש במסמך רומני ${where} צריך בדרך כלל אפוסטיל לפי אמנת האג, שמנפיקה ברומניה הפרפקטורה, ותרגום נוטריוני.`,
    "כשמבקשים רשומה ישנה, כדאי למסור כל מה שידוע: השם (גם בכתיב הישן, ביידיש, בהונגרית או בגרמנית), השנה המשוערת, הכפר או העיירה של אז. בדף של כל יישוב ב-Cartea Neamului מופיעים העירייה והארכיון שאליהם הוא שייך.",
    "מי שיש לו אזרחות רומנית רושם מסמכים שהונפקו בחו\"ל (לידת ילד, נישואין) בספרי הרישום הרומניים דרך הקונסוליה או במשרד מרשם ברומניה.",
  ],
  communityText: ({ where, icr }) => [
    `יוצאי רומניה ${where} נפגשים בעיקר דרך ארגוני יוצאי רומניה, עמותות תרבות ומפגשי יוצאי עיירות. רשימת העמותות הרשומות מתפרסמת באתר המחלקה לרומנים בכל מקום (dprp.gov.ro), והקונסוליה מכירה בדרך כלל את אלה שבעירכם.`,
    ...(icr ? [`למכון התרבות הרומני יש סניף ב${icr}, עם תערוכות, קונצרטים וספרייה.`] : []),
    "המקור הטוב ביותר לתולדות המשפחה הוא עדיין אנשים: הוותיקים זוכרים מאילו עיירות באו המשפחות הראשונות ומי קרוב של מי.",
  ],
  genealogySteps: [
    "רשמו את מה שאתם כבר יודעים: שמות, תאריכים ומקומות של ההורים ושל הסבים.",
    "שאלו את הקרובים המבוגרים: שיחת וידאו עם תמונות ישנות על המסך מעלה הרבה שמות.",
    "מצאו את העיירה או הכפר שממנו באה המשפחה וחפשו אותם ב-Cartea Neamului: העירייה, הארכיון ושמות המשפחה של המקום.",
    "בקשו את המסמכים הדרושים, ברומניה ובארץ שבה אתם חיים (ראו למעלה).",
    "הכניסו הכול לאילן אחד שכל המשפחה יכולה להשלים, מכל מקום.",
  ],
  ctaTitle: "התחילו את אילן היוחסין", ctaText: "שבעת הימים הראשונים בחינם, בלי כרטיס אשראי. מזמינים את בני המשפחה בארץ ובחו\"ל, וכל אחד מוסיף את מה שהוא יודע.", ctaButton: "התחילו את אילן היוחסין ←",
  fallback: "הדף עדיין לא זמין בשפה שלכם, ולכן הוא מוצג באנגלית.", sources: "מקורות", localities: "יישובים ברומניה", names: "שמות משפחה", guides: "מדריכי גנאלוגיה",
  regionThin: "אנחנו עדיין אוספים מידע על יוצאי רומניה כאן. בינתיים, הצעדים שלמטה מתאימים לכל מקום.",
};

const hu: Ui = {
  hubTitle: "Erdélyi és romániai gyökerek: a családfa, bárhonnan", diaspora: "Diaszpóra", home: "Kezdőlap",
  hubLead: "Azoknak, akik Romániából származnak vagy ott élő rokonaik vannak: a közösség története, romániai iratok beszerzése utazás nélkül, levéltárak és a családfa közös építése.",
  hubDescription: "Kivándorlástörténet, romániai iratok külföldről, levéltárak és közösségek: útmutató a romániai gyökerű családoknak itthon és a nagyvilágban.",
  countries: "Európa és Izrael", america: "Egyesült Államok", canada: "Kanada", themes: "Különleges oldalak", states: "Államok", provinces: "Tartományok és területek", cities: "Nagyvárosok", regions: "Régiók",
  history: "Hogyan érkeztek ide", where: "Hol élnek", docs: "Romániai iratok, innen kérve", records: "Helyi levéltárak és anyakönyvek",
  community: "Közösségek és egyesületek", steps: "Lépésről lépésre: a családfa, messziről", related: "Lásd még", otherLangs: "Az oldal más nyelveken",
  titleCountry: (w) => `Romániai gyökerek – ${w}: történet, iratok, családfa | Cartea Neamului`,
  descCountry: (w) => `Hogyan érkeztek a romániai családok ide (${w}), hogyan kérhetsz romániai iratokat, milyen levéltárak segítenek.`,
  titleRegion: (w) => `Romániai gyökerek – ${w}: közösség, iratok, családfa | Cartea Neamului`,
  descRegion: (w, c) => `Romániai gyökerű családok – ${w} (${c}): a közösség története, iratok és családfa.`,
  citiesLine: (l) => `A legtöbb család itt él: ${l}.`,
  docsSteps: ({ eu }) => [
    "Először derítsd ki, melyik iratra van szükséged és hol őrzik: a születési, házassági és halotti anyakönyvi kivonatot annak a romániai polgármesteri hivatalnak az anyakönyvi hivatala adja ki, ahol bejegyezték; a 100 évnél régebbi anyakönyvek általában a Román Nemzeti Levéltár megyei igazgatóságán vannak.",
    "Külföldről három út van: az illetékes román konzulátus (időpont az econsulat.ro oldalon), egy romániai rokon, akinek a konzulátuson meghatalmazást adsz, vagy közvetlen kérés a Nemzeti Levéltárhoz a régi anyakönyvekért.",
    eu
      ? "Az Európai Unión belül az anyakönyvi iratokhoz általában már nem kell apostille (2016/1191/EU rendelet), és többnyelvű formanyomtatványt is kérhetsz hozzájuk."
      : "Az EU-n kívül általában hágai apostille kell, amelyet Romániában a prefektúra ad ki, valamint hiteles fordítás.",
    "Régi irat kérésekor írj meg mindent: a nevet (magyar, német vagy régi írásmóddal is), a hozzávetőleges évet, a falut és a községet. A Cartea Neamului minden településoldala megmutatja, melyik hivatalhoz és levéltárhoz tartozik a falu.",
    "Román állampolgárként a külföldön kiállított iratokat (gyermek születése, házasság) a konzulátuson vagy egy romániai anyakönyvi hivatalban lehet átíratni a román anyakönyvekbe.",
  ],
  communityText: ({ icr }) => [
    "A romániai gyökerű családok elsősorban kulturális egyesületekben, hétvégi iskolákban és szülőfalu-találkozókon tartják a kapcsolatot. A bejegyzett egyesületek listája a dprp.gov.ro oldalon található.",
    ...(icr ? [`A Román Kulturális Intézetnek fiókja van itt: ${icr}.`] : []),
    "A családtörténet legjobb forrásai mégis az emberek: az idősek emlékeznek, melyik faluból jöttek az első családok és ki kinek a rokona.",
  ],
  genealogySteps: [
    "Írd le, amit már tudsz: a szüleid és nagyszüleid nevét, dátumait és helyeit.",
    "Kérdezd meg az idősebb rokonokat, az otthon maradottakat is: egy videohívás a régi fényképekkel sok nevet előhoz.",
    "Keresd meg a falut, ahonnan a család származik, a Cartea Neamului oldalán: hivatal, levéltár és családnevek.",
    "Kérd ki a szükséges iratokat Romániából és onnan, ahol élsz (lásd fent).",
    "Tegyél mindent egyetlen családfába, amelyet az egész család kiegészíthet, bárhol él.",
  ],
  ctaTitle: "Kezdd el a családfát", ctaText: "Az első 7 nap ingyenes, bankkártya nélkül. Meghívod a rokonokat itthonról és külföldről, mindenki hozzáteszi, amit tud.", ctaButton: "Kezdd el a családfát →",
  fallback: "Ez az oldal még nem érhető el a nyelveden, ezért angolul látod.", sources: "Források", localities: "Romániai települések", names: "Családnevek", guides: "Családfakutatási útmutatók",
  regionThin: "Még gyűjtjük az információkat. Addig az alábbi lépések mindenhol érvényesek.",
};

const nl: Ui = {
  hubTitle: "Roemenen in het buitenland: je stamboom, waar je ook woont", diaspora: "Diaspora", home: "Home",
  hubLead: "Voor Roemenen die buiten Roemenië wonen en voor iedereen met Roemeense wortels: de geschiedenis van de gemeenschap waar je woont, hoe je Roemeense akten krijgt zonder te reizen, welke archieven er zijn en hoe je samen met familie in Roemenië je stamboom maakt.",
  hubDescription: "Emigratiegeschiedenis, Roemeense akten aanvragen vanuit het buitenland en archieven: een gids voor families met Roemeense wortels in Europa en Noord-Amerika.",
  countries: "Europa en Israël", america: "Verenigde Staten", canada: "Canada", themes: "Speciale pagina's", states: "Staten", provinces: "Provincies en territoria", cities: "Grote steden", regions: "Regio's en provincies",
  history: "Hoe Roemenen hier kwamen", where: "Waar ze wonen", docs: "Roemeense akten, aangevraagd vanuit hier", records: "Archieven en registers hier",
  community: "Gemeenschappen en verenigingen", steps: "Stap voor stap: je stamboom, van ver weg", related: "Zie ook", otherLangs: "Deze pagina in andere talen",
  titleCountry: (w) => `Roemeense wortels ${w}: akten en stamboom | Cartea Neamului`,
  descCountry: (w) => `Hoe Roemenen ${w} terechtkwamen, hoe je vanuit daar Roemeense akten aanvraagt, welke archieven je gebruikt en hoe je je stamboom maakt.`,
  titleRegion: (w) => `Roemeense wortels ${w}: akten en stamboom | Cartea Neamului`,
  titleRegionShort: (w) => `Roemenen ${w}: wortels en akten | Cartea Neamului`,
  descRegion: (w, c) => `Roemenen ${w} (${c}): geschiedenis van de gemeenschap, Roemeense akten aanvragen vanuit het buitenland, archieven en je stamboom.`,
  citiesLine: (l) => `De meeste Roemeense families wonen in ${l}.`,
  docsSteps: ({ where, eu }) => [
    "Zoek eerst uit welke akte je nodig hebt en waar die ligt: geboorte-, huwelijks- en overlijdensakten worden afgegeven door de burgerlijke stand van het gemeentehuis waar ze zijn ingeschreven; registers ouder dan 100 jaar liggen meestal bij de provinciale afdeling van het Roemeense Nationaal Archief.",
    `Woon je ${where}, dan zijn er drie wegen: via het Roemeense consulaat voor jouw regio (afspraak via econsulat.ro), via een familielid in Roemenië aan wie je een volmacht geeft (getekend op het consulaat), of rechtstreeks per e-mail bij het Nationaal Archief voor oude registers.`,
    eu
      ? `Om een Roemeense akte ${where} te gebruiken heb je meestal geen apostille meer nodig: binnen de Europese Unie gelden akten van de burgerlijke stand zonder apostille (EU-verordening 2016/1191), en je kunt er een meertalig modelformulier bij vragen.`
      : `Om een Roemeense akte ${where} te gebruiken heb je meestal een apostille nodig, in Roemenië afgegeven door de prefectuur, en een beëdigde vertaling.`,
    "Geef bij het aanvragen van een oude akte alles wat je weet: de naam (en de oude of buitenlandse schrijfwijze), het jaar bij benadering, en het dorp en de gemeente van toen. Op elke plaatspagina van Cartea Neamului zie je bij welk gemeentehuis en welk archief een dorp hoort.",
    "Heb je de Roemeense nationaliteit, dan worden akten die in het buitenland zijn opgemaakt (de geboorte van een kind, een huwelijk) via het consulaat of bij de burgerlijke stand in Roemenië overgeschreven in de Roemeense registers.",
  ],
  communityText: ({ where, icr }) => [
    `Roemenen ${where} ontmoeten elkaar vooral via culturele verenigingen, weekendscholen en Roemeense lessen voor kinderen. Geregistreerde verenigingen staan op de site van het Roemeense Departement voor Roemenen in het Buitenland (dprp.gov.ro), en het consulaat kent meestal die in jouw stad.`,
    ...(icr ? [`Het Roemeens Cultureel Instituut heeft een vestiging in ${icr}, met tentoonstellingen, concerten en een bibliotheek.`] : []),
    "De beste bronnen voor familiegeschiedenis blijven mensen: de ouderen van de gemeenschap weten uit welke dorpen de eerste families kwamen en wie familie is van wie.",
  ],
  genealogySteps: [
    "Schrijf op wat je al weet: de namen, data en plaatsen van je ouders en grootouders.",
    "Vraag het oudere familieleden, ook die in Roemenië: een videogesprek met oude foto's op het scherm brengt veel namen terug.",
    "Zoek het dorp waar je familie vandaan komt op Cartea Neamului: het gemeentehuis, het archief en de familienamen van daar.",
    "Vraag de akten aan die je nodig hebt, in Roemenië en in het land waar je woont (zie hierboven).",
    "Zet alles in één stamboom die de hele familie kan aanvullen, waar ze ook wonen.",
  ],
  ctaTitle: "Begin je stamboom", ctaText: "De eerste 7 dagen zijn gratis, zonder creditcard. Nodig familie in Roemenië en in het buitenland uit; iedereen vult aan wat hij weet.", ctaButton: "Begin je stamboom →",
  fallback: "Deze pagina is nog niet in jouw taal beschikbaar en wordt in het Engels getoond.", sources: "Bronnen", localities: "Plaatsen in Roemenië", names: "Roemeense familienamen", guides: "Genealogiegidsen",
  regionThin: "We verzamelen nog informatie over de Roemenen hier. De stappen hieronder werken intussen overal in het land.",
};

export const UI: Record<Lang, Ui> = { ro, en, it, es, de, fr, he, hu, nl, ...NEW_UI };

/** Titlurile secțiunilor noi (ambasade, ghid, particularități, întrebări) și îndemnul cu prețul și WhatsApp, pe limbi. */
export type XUi = {
  guide: (where: string) => string; specifics: string; missions: string; faq: string;
  kind: Record<"embassy" | "consular" | "cg" | "consulate", string>;
  missionsNote: (date: string) => string; statsNote: string;
  price: (lei: string, local: string | null) => string;
  whatsapp: string; whatsappText: (url: string) => string;
};
const xro: XUi = {
  guide: (w) => `Cum îți găsești strămoșii din România când locuiești ${w}`, specifics: "De știut", missions: "Ambasada și consulatele României", faq: "Întrebări frecvente",
  kind: { embassy: "Ambasada", consular: "Secția consulară", cg: "Consulatul general", consulate: "Consulatul" },
  missionsNote: (d) => `Verificate în surse oficiale la ${d}. Zona de care răspunde fiecare consulat și programul sunt pe pagina oficială:`,
  statsNote: "Cifrele despre comunitate sunt rotunjite; datele exacte sunt la",
  price: (lei, local) => `După cele 7 zile gratuite, planul Basic costă ${lei} pe an${local ? ` (cam ${local})` : ""}.`,
  whatsapp: "Trimite-l bunicilor din România pe WhatsApp",
  whatsappText: (u) => `Fac arborele familiei noastre și am nevoie de voi: cum îi chema pe părinții și pe bunicii voștri și din ce sat erau? Îl completăm împreună aici: ${u}`,
};
const xen: XUi = {
  guide: (w) => `How to trace your Romanian ancestors when you live ${w}`, specifics: "Good to know", missions: "Romanian embassy and consulates", faq: "Frequently asked questions",
  kind: { embassy: "Embassy", consular: "Consular section", cg: "Consulate General", consulate: "Consulate" },
  missionsNote: (d) => `Checked against official sources on ${d}. The area each consulate covers and its opening hours are on the official page:`,
  statsNote: "Community figures are rounded; exact data is published by",
  price: (lei, local) => `After the 7 free days, the Basic plan costs ${local ?? lei} a year${local ? ` (${lei})` : ""}.`,
  whatsapp: "Send it to your grandparents in Romania on WhatsApp",
  whatsappText: (u) => `I'm building our family tree and need your help: what were your parents' and grandparents' names, and which village were they from? Let's fill it in together here: ${u}`,
};
export const XUI: Partial<Record<Lang, XUi>> = { ro: xro, en: xen, ...NEW_XUI };
