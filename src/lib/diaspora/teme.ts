import type { Theme } from "./tipuri";

/**
 * Paginile speciale ale diasporei (Daniel, 15.11.2026): rădăcini evreiești (en + he), moldovenii din Italia și Israel,
 * sașii și șvabii (de), maghiarii din Transilvania (hu). Ton neutru, istoric; registrele bisericești apar doar ca sursă de acte.
 */
export const THEMES: Theme[] = [
  {
    slug: "radacini-evreiesti", langs: ["en", "he", "ro"],
    name: { ro: "Rădăcini evreiești în România", en: "Jewish roots in Romania", he: "שורשים יהודיים ברומניה" },
    description: {
      ro: "Cum îți cauți strămoșii evrei din România: istoria comunităților, registrele de stare civilă, actele comunităților și bazele de date.",
      en: "How to trace Jewish ancestors from Romania: community history, civil registers, community records, Holocaust-era sources and searchable databases.",
      he: "איך מתחקים אחר אבות יהודים מרומניה: תולדות הקהילות, ספרי המרשם האזרחי, רשומות הקהילות, מאגרי מידע ואיך בונים את אילן היוחסין.",
    },
    body: {
      en: [
        { h: "Communities across four regions", p: [
          "Jewish life in the lands that became Romania developed differently in each region. In Moldavia, towns such as Iași, Botoșani, Dorohoi, Bacău and Piatra Neamț had large Jewish communities, often half of the town's population in the 19th century; Bucharest had both Sephardic and Ashkenazi communities; Bukovina, under Austrian rule until 1918, had a German-speaking Jewish middle class in Czernowitz and Suceava; Transylvania and Maramureș, under Hungarian rule until 1918, had Hungarian- and Yiddish-speaking communities such as Sighet and Satu Mare.",
          "Most Jews in the Old Kingdom only obtained Romanian citizenship after the First World War. During the Second World War, Jews from Bukovina and Bessarabia were deported to Transnistria, the Iași pogrom took place in June 1941, and in 1944 the Jews of Northern Transylvania, then under Hungarian administration, were deported to Auschwitz. After 1948 most survivors emigrated, the great majority to Israel.",
        ] },
        { h: "Which records exist", p: [
          "Civil registration began in the Old Kingdom (Wallachia and Moldavia) in 1865, and births, marriages and deaths of Jews are recorded in the same town hall registers as everyone else's, sometimes in separate volumes. In Transylvania, Banat and Maramureș state registration began in October 1895, under Hungary; before that, Jewish communities kept their own registers. Registers older than 100 years are held by the county branches of the Romanian National Archives.",
          "Other useful sources: censuses and lists of taxpayers, school registers, records of community burial societies, gravestones in Jewish cemeteries (many now photographed and indexed), and the Holocaust databases of Yad Vashem and the US Holocaust Memorial Museum.",
        ] },
        { h: "Names and places", p: [
          "Town names often appear in Yiddish, German or Hungarian: Iași is Yas, Sighet is Sighet Marmației or Máramarossziget, Cluj is Klausenburg or Kolozsvár, Cernăuți is Czernowitz. Family names may be written in Romanian, German or Hungarian spelling, and given names in their Hebrew or Yiddish form. On every locality page of Cartea Neamului you will find the town hall and the archive that hold a place's records.",
        ] },
      ],
      he: [
        { h: "קהילות בארבעה אזורים", p: [
          "החיים היהודיים בארצות שהפכו לרומניה התפתחו אחרת בכל אזור. במולדובה היו בערים כמו יאסי, בוטושאן, דורוהוי, באקאו ופיאטרה נאמץ קהילות גדולות, לעיתים מחצית מתושבי העיר במאה ה-19; בבוקרשט היו קהילות ספרדיות ואשכנזיות; בבוקובינה, תחת שלטון אוסטריה עד 1918, היה מעמד ביניים יהודי דובר גרמנית בצ'רנוביץ ובסוצ'אבה; בטרנסילבניה ובמרמורש, תחת שלטון הונגריה עד 1918, היו קהילות דוברות הונגרית ויידיש כמו סיגט וסאטו מארה.",
          "רוב יהודי הממלכה הישנה קיבלו אזרחות רומנית רק אחרי מלחמת העולם הראשונה. במלחמת העולם השנייה גורשו יהודי בוקובינה ובסרביה לטרנסניסטריה, ביוני 1941 התרחש פוגרום יאסי, ובשנת 1944 גורשו יהודי צפון טרנסילבניה, שהייתה אז תחת שלטון הונגרי, לאושוויץ. אחרי 1948 עלו רוב הניצולים, ורובם הגדול לישראל.",
        ] },
        { h: "אילו רשומות קיימות", p: [
          "המרשם האזרחי החל בממלכה הישנה (ולאכיה ומולדובה) בשנת 1865, ולידות, נישואין ופטירות של יהודים נרשמו באותם ספרים של העירייה כמו של כולם, לעיתים בכרכים נפרדים. בטרנסילבניה, בבנאט ובמרמורש החל המרשם הממלכתי באוקטובר 1895, תחת הונגריה; לפני כן ניהלו הקהילות היהודיות ספרים משלהן. ספרים בני יותר ממאה שנה שמורים בסניפים המחוזיים של הארכיון הלאומי של רומניה.",
          "מקורות שימושיים נוספים: מפקדי אוכלוסין ורשימות משלמי מסים, ספרי בתי ספר, רשומות חברות קדישא, מצבות בבתי העלמין היהודיים (רבות מהן צולמו ונכנסו למאגרים), ומאגרי השואה של יד ושם ושל מוזיאון השואה האמריקאי.",
        ] },
        { h: "שמות ומקומות", p: [
          "שמות הערים מופיעים לעיתים קרובות ביידיש, בגרמנית או בהונגרית: יאסי היא יאס, סיגט היא גם סיגטו מרמאציי או מאראמארושסיגט, קלוז' היא קלויזנבורג או קולוז'וואר, צ'רנוביץ היא צ'רנאוץ. שמות משפחה נכתבים בכתיב רומני, גרמני או הונגרי, ושמות פרטיים בצורתם העברית או היידית. בדף של כל יישוב ב-Cartea Neamului מופיעים העירייה והארכיון שבהם שמורות הרשומות של המקום.",
        ] },
      ],
      ro: [
        { h: "Comunități în patru regiuni", p: [
          "Viața evreiască s-a dezvoltat diferit în fiecare regiune. În Moldova, orașe ca Iași, Botoșani, Dorohoi, Bacău și Piatra Neamț aveau comunități mari, uneori jumătate din locuitori în secolul al XIX-lea; Bucureștiul avea comunități sefarde și așkenaze; Bucovina, austriacă până în 1918, avea o clasă de mijloc evreiască vorbitoare de germană la Cernăuți și Suceava; Transilvania și Maramureșul, sub Ungaria până în 1918, aveau comunități vorbitoare de maghiară și idiș, ca la Sighet și Satu Mare.",
          "Cei mai mulți evrei din Vechiul Regat au primit cetățenia română abia după Primul Război Mondial. În al Doilea Război Mondial, evreii din Bucovina și Basarabia au fost deportați în Transnistria, în iunie 1941 a avut loc pogromul de la Iași, iar în 1944 evreii din nordul Transilvaniei, aflat atunci sub administrație maghiară, au fost deportați la Auschwitz. După 1948 cei mai mulți supraviețuitori au emigrat, cei mai mulți în Israel.",
        ] },
        { h: "Ce acte există", p: [
          "Starea civilă a început în Vechiul Regat în 1865, iar nașterile, căsătoriile și decesele evreilor sunt în aceleași registre ale primăriei, uneori în volume separate. În Transilvania, Banat și Maramureș starea civilă de stat a început în octombrie 1895, sub Ungaria; înainte, comunitățile evreiești își țineau registrele lor. Registrele mai vechi de 100 de ani sunt la Arhivele Naționale, pe județe.",
          "Alte surse utile: recensămintele și listele de contribuabili, registrele școlare, actele societăților de înmormântare, pietrele de mormânt din cimitirele evreiești (multe fotografiate și indexate) și bazele de date despre Holocaust ale Yad Vashem și ale Muzeului Memorial al Holocaustului din Statele Unite.",
        ] },
        { h: "Nume și locuri", p: [
          "Numele orașelor apar des în idiș, germană sau maghiară: Iași e Yas, Sighet e Máramarossziget, Cluj e Klausenburg sau Kolozsvár, Cernăuți e Czernowitz. Numele de familie pot fi scrise după ortografia română, germană sau maghiară, iar prenumele în forma lor ebraică sau idiș. Pe pagina fiecărei localități de pe Cartea Neamului găsești primăria și arhiva care țin actele locului.",
        ] },
      ],
    },
    records: [
      { name: "Yad Vashem – Central Database of Shoah Victims' Names", url: "https://yvng.yadvashem.org", note: { ro: "numele victimelor Holocaustului", en: "names of Holocaust victims", he: "מאגר שמות נרצחי השואה" } },
      { name: "United States Holocaust Memorial Museum", url: "https://www.ushmm.org", note: { ro: "colecții de documente și mărturii, inclusiv despre România", en: "documents and testimonies, including on Romania", he: "אוספי מסמכים ועדויות, גם על רומניה" } },
      { name: "JewishGen", url: "https://www.jewishgen.org", note: { ro: "baze de date genealogice evreiești, cu o secțiune pentru România", en: "Jewish genealogy databases, with a Romania section", he: "מאגרי גנאלוגיה יהודית, עם מדור לרומניה" } },
    ],
    related: ["israel", "statele-unite", "canada"],
  },
  {
    slug: "moldoveni-in-italia-si-israel", langs: ["ro", "it", "he", "en"],
    name: { ro: "Moldoveni în Italia și Israel", en: "Moldovans in Italy and Israel", it: "Moldavi in Italia e in Israele", he: "יוצאי מולדובה באיטליה ובישראל" },
    description: {
      ro: "Pentru cei plecați din Republica Moldova: acte de la Chișinău cerute din străinătate, cetățenia română pe baza strămoșilor și arborele familiei.",
      en: "For people from the Republic of Moldova: documents from Chișinău requested from abroad, Romanian citizenship through ancestors, and the family tree.",
      it: "Per chi viene dalla Repubblica di Moldova: documenti da Chișinău richiesti dall'estero, cittadinanza romena tramite gli antenati e albero di famiglia.",
      he: "ליוצאי הרפובליקה של מולדובה: מסמכים מקישינב מחו\"ל, אזרחות רומנית דרך אבות המשפחה, ארכיונים ואיך בונים יחד את אילן היוחסין.",
    },
    body: {
      ro: [
        { h: "Două comunități, aceeași țară de plecare", p: [
          "Italia are una dintre cele mai mari comunități de cetățeni ai Republicii Moldova din Europa, formată după anul 2000, cu multe femei venite la muncă în îngrijirea bătrânilor și cu familii reunite mai târziu, mai ales în Veneto, Emilia-Romagna, Lombardia și Lazio. Mulți au și cetățenie română.",
          "În Israel, legătura e mai veche: evreii din Basarabia, din Chișinău, Bălți, Soroca sau Orhei, au emigrat în valuri, de la începutul secolului XX până după 1990, iar după 1990 au venit și muncitori din Moldova, mai ales în construcții și îngrijire.",
        ] },
        { h: "Acte din Moldova, cerute din străinătate", p: [
          "Actele de stare civilă din Republica Moldova (nașteri, căsătorii, decese) se eliberează de Agenția Servicii Publice; din străinătate se pot cere la ambasada sau consulatul Moldovei sau printr-o rudă cu procură. Registrele vechi, de dinainte de 1944, se păstrează la Agenția Națională a Arhivelor din Chișinău.",
          "Pentru Basarabia de dinainte de 1940, multe acte sunt în română (perioada 1918–1940) sau în rusă (înainte de 1918), iar numele de familie pot apărea cu ortografie rusă.",
        ] },
        { h: "Cetățenia română și arborele familiei", p: [
          "Cine are părinți, bunici sau străbunici care au fost cetățeni români (de exemplu, născuți în Basarabia între 1918 și 1940) poate cere redobândirea cetățeniei române. Dosarul cere acte care dovedesc legătura cu strămoșul: exact ce se strânge și într-un arbore genealogic, cu nașterile și căsătoriile din fiecare generație.",
        ] },
      ],
      it: [
        { h: "Due comunità, lo stesso paese di partenza", p: [
          "L'Italia ha una delle più grandi comunità di cittadini della Repubblica di Moldova in Europa, formata dopo il 2000, con molte donne arrivate per lavorare nell'assistenza agli anziani e famiglie ricongiunte più tardi, soprattutto in Veneto, Emilia-Romagna, Lombardia e Lazio. Molti hanno anche la cittadinanza romena.",
          "In Israele il legame è più antico: gli ebrei della Bessarabia, di Chișinău, Bălți, Soroca o Orhei, sono emigrati a ondate dall'inizio del Novecento fino a dopo il 1990, e dopo il 1990 sono arrivati anche lavoratori moldavi, soprattutto nell'edilizia e nell'assistenza.",
        ] },
        { h: "Documenti moldavi, richiesti dall'estero", p: [
          "Gli atti di stato civile della Repubblica di Moldova (nascite, matrimoni, morti) li rilascia l'Agenzia dei Servizi Pubblici; dall'estero si possono chiedere all'ambasciata o al consolato della Moldova oppure tramite un parente con procura. I registri antichi, precedenti al 1944, sono all'Agenzia Nazionale degli Archivi di Chișinău.",
          "Per la Bessarabia prima del 1940 molti atti sono in romeno (periodo 1918–1940) o in russo (prima del 1918), e i cognomi possono comparire con la grafia russa.",
        ] },
        { h: "La cittadinanza romena e l'albero di famiglia", p: [
          "Chi ha genitori, nonni o bisnonni che sono stati cittadini romeni (per esempio nati in Bessarabia tra il 1918 e il 1940) può chiedere il riacquisto della cittadinanza romena. La pratica richiede atti che provino il legame con l'antenato: proprio quello che si raccoglie in un albero genealogico, con nascite e matrimoni di ogni generazione.",
        ] },
      ],
      he: [
        { h: "שתי קהילות, אותה ארץ מוצא", p: [
          "בישראל הקשר ותיק: יהודי בסרביה, מקישינב, בלץ, סורוקה או אורהיי, עלו בגלים מתחילת המאה העשרים ועד אחרי 1990, ואחרי 1990 הגיעו גם עובדים ממולדובה, בעיקר בבניין ובסיעוד.",
          "באיטליה יש אחת הקהילות הגדולות באירופה של אזרחי הרפובליקה של מולדובה, שנוצרה אחרי שנת 2000, עם נשים רבות שהגיעו לעבוד בטיפול בקשישים ומשפחות שהתאחדו מאוחר יותר.",
        ] },
        { h: "מסמכים ממולדובה, מבוקשים מחו\"ל", p: [
          "תעודות מעמד אישי של הרפובליקה של מולדובה (לידה, נישואין, פטירה) מנפיקה סוכנות השירותים הציבוריים; מחו\"ל אפשר לבקש אותן בשגרירות או בקונסוליה של מולדובה או דרך קרוב משפחה עם ייפוי כוח. ספרי רישום ישנים, מלפני 1944, שמורים בסוכנות הלאומית לארכיונים בקישינב.",
          "לגבי בסרביה שלפני 1940, מסמכים רבים כתובים ברומנית (1918–1940) או ברוסית (לפני 1918), ושמות המשפחה עשויים להופיע בכתיב רוסי.",
        ] },
        { h: "אזרחות רומנית ואילן היוחסין", p: [
          "מי שהוריו, סביו או הורי סביו היו אזרחים רומנים (למשל נולדו בבסרביה בין 1918 ל-1940) יכול לבקש את השבת האזרחות הרומנית. התיק דורש מסמכים שמוכיחים את הקשר לאב המשפחה: בדיוק מה שאוספים באילן יוחסין, עם הלידות והנישואין של כל דור.",
        ] },
      ],
      en: [
        { h: "Two communities, one country of origin", p: [
          "Italy has one of the largest communities of Moldovan citizens in Europe, formed after 2000, with many women who came to work in elderly care and families reunited later, mostly in Veneto, Emilia-Romagna, Lombardy and Lazio. Many also hold Romanian citizenship.",
          "In Israel the link is older: Jews from Bessarabia, from Chișinău, Bălți, Soroca or Orhei, emigrated in waves from the early 20th century until after 1990, and after 1990 Moldovan workers also came, mostly in construction and care.",
        ] },
        { h: "Moldovan documents, requested from abroad", p: [
          "Civil status records of the Republic of Moldova (births, marriages, deaths) are issued by the Public Services Agency; from abroad they can be requested at a Moldovan embassy or consulate or through a relative with a power of attorney. Old registers from before 1944 are kept by the National Archives Agency in Chișinău.",
          "For Bessarabia before 1940, many records are in Romanian (1918–1940) or Russian (before 1918), and family names may appear in Russian spelling.",
        ] },
        { h: "Romanian citizenship and the family tree", p: [
          "Anyone whose parents, grandparents or great-grandparents were Romanian citizens (for example, born in Bessarabia between 1918 and 1940) can apply to regain Romanian citizenship. The file requires records proving the link to that ancestor: exactly what you gather in a family tree, with the births and marriages of each generation.",
        ] },
      ],
    },
    records: [
      { name: "Agenția Servicii Publice (Republica Moldova)", url: "https://www.asp.gov.md", note: { ro: "actele de stare civilă din Republica Moldova", en: "civil status records of the Republic of Moldova", it: "atti di stato civile della Repubblica di Moldova", he: "תעודות מעמד אישי של הרפובליקה של מולדובה" } },
    ],
    related: ["italia", "israel"],
  },
  {
    slug: "sasi-si-svabi", langs: ["de", "ro", "en"],
    name: { ro: "Sași și șvabi din România", en: "Saxons and Swabians from Romania", de: "Siebenbürger Sachsen und Banater Schwaben" },
    description: {
      ro: "Genealogia sașilor transilvăneni și a șvabilor bănățeni și sătmăreni: istorie, registrele parohiale în germană și latină, arhive și asociații.",
      en: "Genealogy of the Transylvanian Saxons and the Banat and Satu Mare Swabians: history, German and Latin parish registers, archives and associations.",
      de: "Familienforschung für Siebenbürger Sachsen, Banater und Sathmarer Schwaben: Geschichte, Kirchenbücher auf Deutsch und Latein, Archive und Verbände.",
    },
    body: {
      de: [
        { h: "Acht Jahrhunderte in Siebenbürgen, drei im Banat", p: [
          "Die Siebenbürger Sachsen kamen ab der Mitte des 12. Jahrhunderts auf Einladung der ungarischen Könige nach Siebenbürgen und gründeten Städte wie Hermannstadt (Sibiu), Kronstadt (Brașov), Schäßburg (Sighișoara) und Bistritz (Bistrița) sowie Hunderte Dörfer mit Kirchenburgen. Die Banater Schwaben wurden im 18. Jahrhundert von den Habsburgern angesiedelt, nach der Rückeroberung des Banats, die Sathmarer Schwaben etwa zur gleichen Zeit im Nordwesten.",
          "Im Januar 1945 wurden Zehntausende Deutsche aus Rumänien zur Zwangsarbeit in die Sowjetunion deportiert, 1951 viele Banater in den Bărăgan. In den 1970er- und 1980er-Jahren reisten viele gegen Zahlungen der Bundesrepublik aus, 1990 fast alle übrigen. Heute leben die meisten in Deutschland und Österreich, die Kirchenburgen und Dörfer stehen aber noch.",
        ] },
        { h: "Welche Quellen es gibt", p: [
          "Die evangelischen Kirchenbücher der Sachsen beginnen in vielen Gemeinden im 17. oder 18. Jahrhundert und sind auf Deutsch, ältere Einträge zum Teil auf Latein; viele liegen im Zentralarchiv der Evangelischen Kirche A.B. in Rumänien in Hermannstadt. Die katholischen Matriken der Banater und Sathmarer Schwaben sind meist auf Latein oder Deutsch. Die staatlichen Standesämter gibt es seit Oktober 1895, als die Gebiete zu Ungarn gehörten; die Register sind dann auf Ungarisch.",
          "Viele Heimatortsgemeinschaften (HOG) haben Ortssippenbücher, Familienbücher und Fotos gesammelt. Dazu kommen die Bestände des Siebenbürgen-Instituts in Gundelsheim und die Kreisdirektionen des Rumänischen Nationalarchivs.",
        ] },
        { h: "Ein Dorf, drei Namen", p: [
          "Jedes Dorf hat einen deutschen, einen rumänischen und einen ungarischen Namen: Hermannstadt, Sibiu, Nagyszeben; Großsanktnikolaus, Sânnicolau Mare, Nagyszentmiklós. Auf Cartea Neamului steht jedes Dorf unter seinem heutigen rumänischen Namen, mit Gemeinde, Rathaus und Archiv. Wenn du den deutschen Namen kennst, findest du den rumänischen meist über die HOG oder eine historische Karte.",
        ] },
      ],
      ro: [
        { h: "Opt secole în Transilvania, trei în Banat", p: [
          "Sașii au venit în Transilvania de la mijlocul secolului al XII-lea, chemați de regii Ungariei, și au întemeiat orașe ca Sibiu, Brașov, Sighișoara și Bistrița și sute de sate cu biserici fortificate. Șvabii bănățeni au fost colonizați de Habsburgi în secolul al XVIII-lea, după recucerirea Banatului, iar șvabii sătmăreni cam în aceeași vreme, în nord-vest.",
          "În ianuarie 1945, zeci de mii de germani din România au fost deportați la muncă forțată în Uniunea Sovietică, iar în 1951 mulți bănățeni au fost deportați în Bărăgan. În anii '70 și '80 mulți au plecat în schimbul unor plăți ale Germaniei Federale, iar în 1990 aproape toți ceilalți. Azi cei mai mulți trăiesc în Germania și Austria, dar satele și bisericile fortificate sunt încă acolo.",
        ] },
        { h: "Ce surse există", p: [
          "Registrele evanghelice ale sașilor încep în multe parohii în secolul al XVII-lea sau al XVIII-lea și sunt în germană, cele mai vechi uneori în latină; multe sunt la Arhiva Centrală a Bisericii Evanghelice C.A. din România, la Sibiu. Registrele catolice ale șvabilor sunt de obicei în latină sau germană. Starea civilă de stat există din octombrie 1895, când regiunile erau sub Ungaria, iar registrele de atunci sunt în maghiară.",
          "Multe comunități de foști săteni (HOG) au strâns cărți ale familiilor din sat, genealogii și fotografii. Pe lângă ele, sunt colecțiile Institutului Transilvania de la Gundelsheim și serviciile județene ale Arhivelor Naționale.",
        ] },
        { h: "Un sat, trei nume", p: [
          "Fiecare sat are un nume german, unul românesc și unul maghiar: Hermannstadt, Sibiu, Nagyszeben; Großsanktnikolaus, Sânnicolau Mare, Nagyszentmiklós. Pe Cartea Neamului fiecare sat apare cu numele lui românesc de azi, cu comuna, primăria și arhiva de care ține.",
        ] },
      ],
      en: [
        { h: "Eight centuries in Transylvania, three in Banat", p: [
          "The Saxons came to Transylvania from the mid-12th century, invited by the kings of Hungary, and founded towns such as Sibiu (Hermannstadt), Brașov (Kronstadt), Sighișoara (Schäßburg) and Bistrița (Bistritz), as well as hundreds of villages with fortified churches. The Banat Swabians were settled by the Habsburgs in the 18th century, after the reconquest of Banat, and the Satu Mare Swabians at about the same time in the north-west.",
          "In January 1945 tens of thousands of Germans from Romania were deported to forced labour in the Soviet Union, and in 1951 many Banat families were deported to the Bărăgan plain. In the 1970s and 1980s many left in exchange for payments by West Germany, and in 1990 almost all the rest. Today most live in Germany and Austria, but the villages and fortified churches are still there.",
        ] },
        { h: "Which sources exist", p: [
          "The Saxons' Lutheran parish registers start in many parishes in the 17th or 18th century and are in German, the oldest sometimes in Latin; many are in the Central Archive of the Evangelical Church A.B. in Romania, in Sibiu. The Swabians' Catholic registers are usually in Latin or German. State civil registration has existed since October 1895, when the regions were part of Hungary, and those registers are in Hungarian.",
          "Many home-village associations (HOG) have collected village family books, genealogies and photographs. There are also the collections of the Transylvanian Institute in Gundelsheim and the county branches of the Romanian National Archives.",
        ] },
        { h: "One village, three names", p: [
          "Every village has a German, a Romanian and a Hungarian name: Hermannstadt, Sibiu, Nagyszeben; Großsanktnikolaus, Sânnicolau Mare, Nagyszentmiklós. On Cartea Neamului each village appears under its current Romanian name, with the commune, town hall and archive it belongs to.",
        ] },
      ],
    },
    records: [
      { name: "Verband der Siebenbürger Sachsen in Deutschland", url: "https://www.siebenbuerger.de", note: { ro: "asociația sașilor și comunitățile pe sate (HOG)", en: "the Saxons' association and home-village communities (HOG)", de: "Verband und Heimatortsgemeinschaften (HOG)" } },
      { name: "Landsmannschaft der Banater Schwaben", url: "https://www.banater-schwaben.org", note: { ro: "asociația șvabilor bănățeni", en: "the Banat Swabians' association", de: "Verband der Banater Schwaben" } },
      { name: "Matricula", url: "https://data.matricula-online.eu", note: { ro: "registre bisericești digitizate din Europa Centrală", en: "digitised church books from Central Europe", de: "digitalisierte Kirchenbücher aus Mitteleuropa" } },
    ],
    related: ["germania", "austria"],
  },
  {
    slug: "maghiari-din-transilvania", langs: ["hu", "ro", "en"],
    name: { ro: "Maghiari din Transilvania: genealogie", en: "Hungarians from Transylvania: genealogy", hu: "Erdélyi magyar családfakutatás" },
    description: {
      ro: "Pentru familiile maghiare din Transilvania, Partium și Banat: registrele în maghiară și latină, numele de localități, arhivele din România și Ungaria.",
      en: "For Hungarian families from Transylvania, Partium and Banat: Hungarian and Latin registers, place names, archives in Romania and Hungary.",
      hu: "Erdélyi, partiumi és bánsági magyar családoknak: magyar és latin nyelvű anyakönyvek, helységnevek, romániai és magyarországi levéltárak.",
    },
    body: {
      hu: [
        { h: "Az erdélyi magyar családok forrásai", p: [
          "Erdélyben, a Partiumban és a Bánságban a magyar családok anyakönyvei felekezet szerint maradtak fenn: római katolikus, református, unitárius és evangélikus anyakönyvek, a régebbiek gyakran latinul. Az állami anyakönyvezés 1895. október 1-jén kezdődött, amikor a terület Magyarországhoz tartozott, ezért a bejegyzések 1918-ig magyarul vannak.",
          "A 100 évnél régebbi anyakönyvek a Román Nemzeti Levéltár megyei igazgatóságain vannak (Kolozsvár, Marosvásárhely, Csíkszereda, Sepsiszentgyörgy, Nagyvárad…), az újabbak a polgármesteri hivatalok anyakönyvi hivatalainál. Sok anyakönyvről másodpéldány vagy mikrofilm is készült.",
        ] },
        { h: "Nevek és helységek", p: [
          "Minden településnek van román és magyar neve, sokszor német is: Kolozsvár – Cluj-Napoca, Marosvásárhely – Târgu Mureș, Nagyvárad – Oradea, Csíkszereda – Miercurea Ciuc. A Cartea Neamului a falvakat mai román nevükön mutatja, a községgel, hivatallal és levéltárral együtt; sok oldal a magyar nevet is feltünteti. A régi iratokban a családnév áll elöl, és a keresztnév magyar formában szerepel (János, nem Ioan).",
        ] },
        { h: "Kivándorlás és a család ma", p: [
          "1918 után és 1989 után is sok erdélyi magyar család költözött Magyarországra, később Nyugat-Európába és Amerikába. Így egy család ágai ma három-négy országban élnek: egy közös családfa segít összerakni, ki honnan indult, és megőrizni a nagyszülők történeteit.",
        ] },
      ],
      ro: [
        { h: "Sursele familiilor maghiare din Transilvania", p: [
          "În Transilvania, Partium și Banat, registrele familiilor maghiare s-au păstrat pe confesiuni: romano-catolice, reformate, unitariene și evanghelice, cele vechi adesea în latină. Starea civilă de stat a început la 1 octombrie 1895, când regiunea era parte a Ungariei, așa că înregistrările până în 1918 sunt în maghiară.",
          "Registrele mai vechi de 100 de ani sunt la serviciile județene ale Arhivelor Naționale (Cluj, Mureș, Harghita, Covasna, Bihor…), iar cele mai noi la starea civilă a primăriilor.",
        ] },
        { h: "Nume și localități", p: [
          "Fiecare localitate are nume românesc și maghiar, des și german: Kolozsvár – Cluj-Napoca, Marosvásárhely – Târgu Mureș, Nagyvárad – Oradea, Csíkszereda – Miercurea Ciuc. În actele vechi numele de familie stă înaintea prenumelui, iar prenumele e în forma maghiară (János, nu Ioan). Pe Cartea Neamului multe pagini de localitate arată și numele maghiar.",
        ] },
        { h: "Plecările și familia de azi", p: [
          "După 1918 și după 1989, multe familii maghiare din Transilvania s-au mutat în Ungaria, apoi în Europa de Vest și America. Ramurile unei familii trăiesc azi în trei sau patru țări, iar un arbore comun ajută la păstrarea poveștilor bunicilor.",
        ] },
      ],
      en: [
        { h: "Sources for Hungarian families from Transylvania", p: [
          "In Transylvania, Partium and Banat, the registers of Hungarian families survive by denomination: Roman Catholic, Reformed, Unitarian and Lutheran, the older ones often in Latin. State civil registration began on 1 October 1895, when the region was part of Hungary, so entries until 1918 are in Hungarian.",
          "Registers older than 100 years are held by the county branches of the Romanian National Archives (Cluj, Mureș, Harghita, Covasna, Bihor…), newer ones by the civil registry offices of the town halls.",
        ] },
        { h: "Names and places", p: [
          "Every locality has a Romanian and a Hungarian name, often a German one too: Kolozsvár – Cluj-Napoca, Marosvásárhely – Târgu Mureș, Nagyvárad – Oradea, Csíkszereda – Miercurea Ciuc. In old records the family name comes before the given name, and given names are in Hungarian form (János, not Ioan). On Cartea Neamului many locality pages also show the Hungarian name.",
        ] },
        { h: "Emigration and the family today", p: [
          "After 1918 and after 1989 many Hungarian families from Transylvania moved to Hungary, and later to Western Europe and America. Branches of one family now live in three or four countries, and a shared tree helps keep the grandparents' stories together.",
        ] },
      ],
    },
    records: [
      { name: "Hungaricana", url: "https://hungaricana.hu", note: { ro: "colecții digitizate din arhive și biblioteci maghiare", en: "digitised collections from Hungarian archives and libraries", hu: "magyar levéltárak és könyvtárak digitalizált gyűjteményei" } },
      { name: "Magyar Nemzeti Levéltár", url: "https://mnl.gov.hu", note: { ro: "Arhivele Naționale ale Ungariei", en: "the Hungarian National Archives", hu: "a Magyar Nemzeti Levéltár" } },
    ],
    related: ["germania", "austria"],
  },
  {
    // Pagina de aterizare pentru românii din SUA și Canada (Daniel, 18.11.2026): în română pentru diaspora, în engleză pentru
    // generațiile născute acolo. Fapte din Encyclopedia of Cleveland History, The Canadian Encyclopedia, Gale (Romanian
    // Americans), Statistics Canada 2021 și ACS 2023; detaliile și sursele sunt în ghidul despre valurile de emigrare.
    slug: "america-de-nord", langs: ["ro", "en"],
    name: { ro: "Românii din SUA și Canada: arborele familiei", en: "Romanian Heritage Family Tree: US & Canada" },
    description: {
      ro: "Pentru românii din SUA și Canada: arborele familiei făcut cu rudele de acasă, glasul bunicilor păstrat și actele strămoșilor plecați peste ocean.",
      en: "For Romanian Americans and Canadians: build your family tree with relatives back home, keep your grandparents' voices and find your immigrant ancestors.",
    },
    body: {
      ro: [
        { h: "O familie, două continente", p: [
          "Bunica e la Bistrița, o mătușă la București, un frate la Chicago, o verișoară la Toronto, iar copiii născuți acolo vorbesc româna doar la telefon cu bunicii. Fiecare știe o bucată din poveste. Pe Cartea Neamului o strângeți la un loc: faci arborele, trimiți un link rudelor și fiecare completează ramura lui, în limba în care folosește site-ul.",
          "Arborele e privat: îl văd doar rudele invitate. Poveștile scurte înregistrate cu telefonul stau la profilul omului, iar din arbore se poate face cartea neamului în PDF, cu coduri QR care pornesc vocea bunicilor.",
        ] },
        { h: "Când au plecat românii în America", p: [
          "Primul val mare a venit între 1895 și 1920: aproximativ 145.000 de români, mai ales țărani din Transilvania și Banat, au intrat în SUA să lucreze în oțelăriile și fabricile din Ohio, Pennsylvania, Michigan, Illinois și Indiana. Mulți s-au întors acasă. În Canada, familii din Bucovina au primit loturi în prerii din 1896; în 1898 primele familii din satul Boian au întemeiat Boian, Alberta.",
          "După 1945 au venit refugiații politici, cam 30.000 în SUA, iar în Canada mai ales la Montréal, Toronto, Hamilton, London și Windsor. În comunism s-a plecat greu, prin reîntregirea familiei sau prin fugă peste graniță. După 1989, românii au ajuns în număr mare la New York, Chicago, Los Angeles, Atlanta, Phoenix și Montréal.",
        ] },
        { h: "Unde cauți actele strămoșilor", p: [
          "Pentru cei plecați înainte de 1920: listele de sosire de la New York (Ellis Island) și din porturile canadiene Halifax, Québec și Montréal, recensămintele americane din 1910–1940 și actele de naturalizare. Ele notează adesea satul de origine, scris uneori în maghiară sau germană.",
          "Acasă, actele sunt în registrele parohiale și de stare civilă ale satului: cele mai vechi de 100 de ani la Arhivele Naționale, pe județe, cele mai noi la primărie. Pe pagina fiecărei localități din site găsești primăria și arhiva care le țin.",
        ] },
        { h: "Pentru copiii născuți acolo", p: [
          "Copiii și nepoții născuți în SUA sau Canada pot folosi site-ul în engleză sau franceză și văd același arbore ca bunicii. Scrie în arbore numele în ambele forme, de pildă „Gheorghe (George) Moldovan”, ca să-l recunoască și bunicii, și nepoții.",
        ] },
      ],
      en: [
        { h: "One family, two continents", p: [
          "Grandma lives in Bistrița, an aunt in Bucharest, an uncle in Chicago and a cousin in Toronto, while the children born in North America speak Romanian only on the phone with their grandparents. Everyone holds a piece of the story. On The Family Book you bring it together: start the tree, send your relatives a link and let each branch fill in its part, with the site in their own language.",
          "Your tree is private: only the relatives you invite can see it. Short stories recorded on a phone stay on each person's profile, and your tree can become a PDF family book with QR codes that play your grandparents' voices.",
        ] },
        { h: "When Romanians came to North America", p: [
          "The first large wave came between 1895 and 1920, when about 145,000 Romanians, mostly peasants from Transylvania and Banat, entered the United States to work in the mills and factories of Ohio, Pennsylvania, Michigan, Illinois and Indiana. Many later went home. In Canada, families from Bukovina took up prairie homesteads from 1896; in 1898 the first families from the village of Boian founded Boian, Alberta.",
          "After 1945 came political refugees, about 30,000 in the United States, and in Canada mostly in Montreal, Toronto, Hamilton, London and Windsor. Under communism, leaving was hard: some left through family reunification, others escaped across the border. After 1989, many Romanians settled in New York, Chicago, Los Angeles, Atlanta, Phoenix and Montreal.",
        ] },
        { h: "Where to find your ancestors' records", p: [
          "For ancestors who came before 1920: arrival lists at New York (Ellis Island) and at the Canadian ports of Halifax, Quebec City and Montreal, the 1910–1940 US censuses and naturalization papers. They often name the home village, sometimes in its Hungarian or German form.",
          "In Romania, records are kept in the parish and civil registers of the village: those older than 100 years in the county branches of the National Archives, newer ones at the town hall. Every locality page on the site names the town hall and the archive that hold its records.",
        ] },
        { h: "For children born in the US and Canada", p: [
          "Children and grandchildren born in North America can use the site in English or French and see the same tree as their grandparents. Write names in both forms, for example \"Gheorghe (George) Moldovan\", so both the grandparents and the grandchildren recognize them.",
        ] },
      ],
    },
    records: [
      { name: "Statue of Liberty – Ellis Island Foundation, passenger search", url: "https://www.statueofliberty.org/discover/passenger-ship-search/", note: { ro: "listele de sosire la New York, 1892–1957", en: "New York arrival lists, 1892–1957" } },
      { name: "Library and Archives Canada", url: "https://www.bac-lac.gc.ca", note: { ro: "liste de pasageri, recensăminte și dosare de loturi din Canada", en: "Canadian passenger lists, censuses and homestead records" } },
      { name: "U.S. National Archives – Immigration Records", url: "https://www.archives.gov/research/immigration", note: { ro: "liste de pasageri și acte de naturalizare din SUA", en: "US passenger lists and naturalization records" } },
      { name: "FamilySearch", url: "https://www.familysearch.org", note: { ro: "registre din România și din America de Nord, gratuit cu cont", en: "Romanian and North American records, free with an account" } },
      { name: "Arhivele Naționale ale României", url: "https://arhivelenationale.ro", note: { ro: "registrele parohiale și de stare civilă mai vechi de 100 de ani", en: "parish and civil registers older than 100 years" } },
    ],
    related: ["statele-unite", "canada"],
  },
];

export const getTheme = (slug: string) => THEMES.find((t) => t.slug === slug) ?? null;
