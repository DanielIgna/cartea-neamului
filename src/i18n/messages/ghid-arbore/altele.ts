import type { Widen } from "../types";
import type { roGhidArbore } from "./ro";

type G = Widen<typeof roGhidArbore>;

/** Drumul spre arbore (24.11.2026), în celelalte limbi. Engleza americană o ia pe cea britanică. */
export const enGBGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Add a person",
    addRelative: "+ Add a relative",
    addFor: "Who are you adding next to {name}?",
    addHint: "For grandparents: open the father’s or mother’s card and add their parents.",
    helpLabel: "Tree guide, step by step",
    gedcomButton: "Download GEDCOM",
    title: "First steps in your tree",
    stepOf: "Step {n} of {total}",
    back: "Back",
    next: "Next",
    finish: "Got it",
    close: "Close",
    done: "Done",
    reopen: "You can open this guide again at any time with the “?” button above the chart.",
    steps: {
      open: {
        title: "Open your tree",
        text: "This is your tree. At the top you choose how the chart looks. Tap a name to open their <b>card</b>: on a computer it is on the right, on a phone below the chart. From any page you can come back here with <b>My tree</b> in the top menu.",
      },
      parents: {
        title: "Add your parents",
        text: "Start with your mother and father. A name is enough: you can fill in years and places when you find them. The <b>+ Add a person</b> button is always above the chart.",
        action: "Add your parents",
      },
      grandparents: {
        title: "Add your grandparents",
        text: "Your grandparents are your father’s and your mother’s parents. A grandmother’s maiden name often opens a whole new branch.",
        father: "Father’s parents",
        mother: "Mother’s parents",
        needParents: "Add your parents first, then their parents.",
      },
      siblings: {
        title: "Add your brothers and sisters",
        text: "Brothers and sisters are linked to the same parents automatically and appear next to you in the chart.",
        action: "Add a brother or sister",
      },
      photo: {
        title: "A photo and a memory",
        text: "An old photo brings the tree to life. In the <b>memory chest</b> you write down a story or a grandmother’s saying, or record someone’s voice.",
        photo: "Add a photo",
        memory: "Write a memory",
      },
      invite: {
        title: "Invite a relative",
        text: "Send the link to a cousin, an aunt or a brother. They know other branches, and they can see the tree for free.",
        action: "Invite a relative",
      },
    },
  },
};

export const frGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Ajouter une personne",
    addRelative: "+ Ajouter un parent",
    addFor: "Qui ajoutez-vous à côté de {name} ?",
    addHint: "Pour les grands-parents : ouvrez la fiche du père ou de la mère et ajoutez leurs parents.",
    helpLabel: "Guide de l’arbre, pas à pas",
    gedcomButton: "Télécharger GEDCOM",
    title: "Premiers pas dans l’arbre",
    stepOf: "Étape {n} sur {total}",
    back: "Retour",
    next: "Suivant",
    finish: "J’ai compris",
    close: "Fermer",
    done: "Fait",
    reopen: "Vous pouvez rouvrir ce guide à tout moment avec le bouton « ? » au-dessus du dessin.",
    steps: {
      open: {
        title: "Ouvrir l’arbre",
        text: "Vous êtes dans votre arbre. En haut, vous choisissez l’aspect du dessin. Touchez un nom pour ouvrir sa <b>fiche</b> : à droite sur ordinateur, sous le dessin sur téléphone. Depuis n’importe quelle page, vous revenez ici avec <b>Mon arbre</b>, dans le menu du haut.",
      },
      parents: {
        title: "Ajouter les parents",
        text: "Commencez par votre mère et votre père. Le nom suffit : les années et les lieux se complètent quand vous les trouvez. Le bouton <b>+ Ajouter une personne</b> est toujours au-dessus du dessin.",
        action: "Ajouter les parents",
      },
      grandparents: {
        title: "Ajouter les grands-parents",
        text: "Les grands-parents sont les parents de votre père et de votre mère. Le nom de jeune fille d’une grand-mère ouvre souvent toute une branche.",
        father: "Parents du père",
        mother: "Parents de la mère",
        needParents: "Ajoutez d’abord les parents, puis leurs parents.",
      },
      siblings: {
        title: "Ajouter les frères et sœurs",
        text: "Les frères et sœurs sont reliés automatiquement aux mêmes parents et apparaissent à côté de vous dans le dessin.",
        action: "Ajouter un frère ou une sœur",
      },
      photo: {
        title: "Une photo et un souvenir",
        text: "Une vieille photo rend l’arbre vivant. Dans le <b>coffre à souvenirs</b>, vous écrivez une histoire, une parole de grand-mère, ou vous enregistrez la voix de quelqu’un.",
        photo: "Ajouter une photo",
        memory: "Écrire un souvenir",
      },
      invite: {
        title: "Inviter un proche",
        text: "Envoyez le lien à un cousin, une tante ou un frère. Ils connaissent d’autres branches et voient l’arbre gratuitement.",
        action: "Inviter un proche",
      },
    },
  },
};

export const esGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Añadir persona",
    addRelative: "+ Añadir familiar",
    addFor: "¿A quién añades junto a {name}?",
    addHint: "Para los abuelos: abre la ficha del padre o de la madre y añade sus padres.",
    helpLabel: "Guía del árbol, paso a paso",
    gedcomButton: "Descargar GEDCOM",
    title: "Primeros pasos en el árbol",
    stepOf: "Paso {n} de {total}",
    back: "Atrás",
    next: "Siguiente",
    finish: "Entendido",
    close: "Cerrar",
    done: "Hecho",
    reopen: "Puedes volver a abrir esta guía cuando quieras con el botón «?» encima del dibujo.",
    steps: {
      open: {
        title: "Abre el árbol",
        text: "Estás en tu árbol. Arriba eliges cómo se ve el dibujo. Toca un nombre y se abre su <b>ficha</b>: en el ordenador a la derecha, en el móvil debajo del dibujo. Desde cualquier página vuelves aquí con <b>Mi árbol</b>, en el menú de arriba.",
      },
      parents: {
        title: "Añade a tus padres",
        text: "Empieza por tu madre y tu padre. Basta con el nombre: los años y los lugares los completas cuando los sepas. El botón <b>+ Añadir persona</b> está siempre encima del dibujo.",
        action: "Añadir a los padres",
      },
      grandparents: {
        title: "Añade a tus abuelos",
        text: "Los abuelos son los padres de tu padre y de tu madre. El apellido de soltera de una abuela abre a menudo una rama entera.",
        father: "Padres del padre",
        mother: "Padres de la madre",
        needParents: "Añade primero a tus padres y después a los suyos.",
      },
      siblings: {
        title: "Añade a tus hermanos",
        text: "Los hermanos y hermanas se unen solos a los mismos padres y aparecen a tu lado en el dibujo.",
        action: "Añadir un hermano o una hermana",
      },
      photo: {
        title: "Una foto y un recuerdo",
        text: "Una foto antigua da vida al árbol. En el <b>baúl de los recuerdos</b> escribes una historia, un dicho de la abuela o grabas la voz de alguien.",
        photo: "Poner una foto",
        memory: "Escribir un recuerdo",
      },
      invite: {
        title: "Invita a un familiar",
        text: "Envía el enlace a un primo, una tía o un hermano. Conocen otras ramas y ven el árbol gratis.",
        action: "Invitar a un familiar",
      },
    },
  },
};

export const nlGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Persoon toevoegen",
    addRelative: "+ Familielid toevoegen",
    addFor: "Wie voeg je toe naast {name}?",
    addHint: "Voor grootouders: open de kaart van de vader of moeder en voeg hun ouders toe.",
    helpLabel: "Stamboomgids, stap voor stap",
    gedcomButton: "GEDCOM downloaden",
    title: "Eerste stappen in je stamboom",
    stepOf: "Stap {n} van {total}",
    back: "Terug",
    next: "Verder",
    finish: "Begrepen",
    close: "Sluiten",
    done: "Klaar",
    reopen: "Je opent deze gids altijd opnieuw met de knop „?” boven de tekening.",
    steps: {
      open: {
        title: "Open je stamboom",
        text: "Dit is je stamboom. Bovenaan kies je hoe de tekening eruitziet. Tik op een naam en zijn of haar <b>kaart</b> gaat open: op de computer rechts, op de telefoon onder de tekening. Vanaf elke pagina kom je hier terug via <b>Mijn stamboom</b> in het menu bovenaan.",
      },
      parents: {
        title: "Voeg je ouders toe",
        text: "Begin met je moeder en je vader. Een naam is genoeg: jaren en plaatsen vul je later in. De knop <b>+ Persoon toevoegen</b> staat altijd boven de tekening.",
        action: "Ouders toevoegen",
      },
      grandparents: {
        title: "Voeg je grootouders toe",
        text: "Je grootouders zijn de ouders van je vader en je moeder. De meisjesnaam van een oma opent vaak een hele tak.",
        father: "Ouders van vader",
        mother: "Ouders van moeder",
        needParents: "Voeg eerst je ouders toe, daarna hun ouders.",
      },
      siblings: {
        title: "Voeg je broers en zussen toe",
        text: "Broers en zussen worden vanzelf aan dezelfde ouders gekoppeld en staan naast je in de tekening.",
        action: "Broer of zus toevoegen",
      },
      photo: {
        title: "Een foto en een herinnering",
        text: "Een oude foto maakt de stamboom levend. In de <b>herinneringskist</b> schrijf je een verhaal of een gezegde van oma op, of neem je iemands stem op.",
        photo: "Foto toevoegen",
        memory: "Herinnering schrijven",
      },
      invite: {
        title: "Nodig een familielid uit",
        text: "Stuur de link naar een neef, een tante of een broer. Zij kennen andere takken en bekijken de stamboom gratis.",
        action: "Familielid uitnodigen",
      },
    },
  },
};

export const deGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Person hinzufügen",
    addRelative: "+ Verwandte hinzufügen",
    addFor: "Wen fügst du neben {name} hinzu?",
    addHint: "Für die Großeltern: Öffne die Karte des Vaters oder der Mutter und füge deren Eltern hinzu.",
    helpLabel: "Stammbaum-Anleitung, Schritt für Schritt",
    gedcomButton: "GEDCOM herunterladen",
    title: "Erste Schritte im Stammbaum",
    stepOf: "Schritt {n} von {total}",
    back: "Zurück",
    next: "Weiter",
    finish: "Verstanden",
    close: "Schließen",
    done: "Erledigt",
    reopen: "Du kannst diese Anleitung jederzeit mit dem „?“-Knopf über der Zeichnung wieder öffnen.",
    steps: {
      open: {
        title: "Stammbaum öffnen",
        text: "Du bist in deinem Stammbaum. Oben wählst du, wie die Zeichnung aussieht. Tippe auf einen Namen, dann öffnet sich die <b>Karte</b>: am Computer rechts, am Handy unter der Zeichnung. Von jeder Seite kommst du über <b>Mein Stammbaum</b> im oberen Menü hierher zurück.",
      },
      parents: {
        title: "Eltern hinzufügen",
        text: "Beginne mit Mutter und Vater. Der Name reicht: Jahre und Orte ergänzt du, wenn du sie erfährst. Der Knopf <b>+ Person hinzufügen</b> steht immer über der Zeichnung.",
        action: "Eltern hinzufügen",
      },
      grandparents: {
        title: "Großeltern hinzufügen",
        text: "Die Großeltern sind die Eltern deines Vaters und deiner Mutter. Der Mädchenname einer Großmutter öffnet oft einen ganzen Zweig.",
        father: "Eltern des Vaters",
        mother: "Eltern der Mutter",
        needParents: "Füge zuerst deine Eltern hinzu, dann deren Eltern.",
      },
      siblings: {
        title: "Geschwister hinzufügen",
        text: "Brüder und Schwestern werden automatisch mit denselben Eltern verbunden und erscheinen neben dir in der Zeichnung.",
        action: "Bruder oder Schwester hinzufügen",
      },
      photo: {
        title: "Ein Foto und eine Erinnerung",
        text: "Ein altes Foto macht den Stammbaum lebendig. In der <b>Erinnerungstruhe</b> schreibst du eine Geschichte oder einen Spruch der Großmutter auf oder nimmst eine Stimme auf.",
        photo: "Foto hinzufügen",
        memory: "Erinnerung schreiben",
      },
      invite: {
        title: "Verwandte einladen",
        text: "Schicke den Link an einen Cousin, eine Tante oder einen Bruder. Sie kennen andere Zweige und sehen den Stammbaum kostenlos.",
        action: "Verwandte einladen",
      },
    },
  },
};

export const itGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Aggiungi persona",
    addRelative: "+ Aggiungi parente",
    addFor: "Chi aggiungi accanto a {name}?",
    addHint: "Per i nonni: apri la scheda del padre o della madre e aggiungi i loro genitori.",
    helpLabel: "Guida all’albero, passo dopo passo",
    gedcomButton: "Scarica GEDCOM",
    title: "Primi passi nell’albero",
    stepOf: "Passo {n} di {total}",
    back: "Indietro",
    next: "Avanti",
    finish: "Ho capito",
    close: "Chiudi",
    done: "Fatto",
    reopen: "Puoi riaprire questa guida quando vuoi con il pulsante «?» sopra il disegno.",
    steps: {
      open: {
        title: "Apri l’albero",
        text: "Sei nel tuo albero. In alto scegli come appare il disegno. Tocca un nome e si apre la sua <b>scheda</b>: sul computer a destra, sul telefono sotto il disegno. Da qualsiasi pagina torni qui con <b>Il mio albero</b>, nel menu in alto.",
      },
      parents: {
        title: "Aggiungi i genitori",
        text: "Comincia da tua madre e tuo padre. Basta il nome: anni e luoghi li completi quando li scopri. Il pulsante <b>+ Aggiungi persona</b> è sempre sopra il disegno.",
        action: "Aggiungi i genitori",
      },
      grandparents: {
        title: "Aggiungi i nonni",
        text: "I nonni sono i genitori di tuo padre e di tua madre. Il cognome da nubile di una nonna apre spesso un ramo intero.",
        father: "Genitori del padre",
        mother: "Genitori della madre",
        needParents: "Aggiungi prima i genitori, poi i loro genitori.",
      },
      siblings: {
        title: "Aggiungi fratelli e sorelle",
        text: "Fratelli e sorelle si collegano da soli agli stessi genitori e compaiono accanto a te nel disegno.",
        action: "Aggiungi un fratello o una sorella",
      },
      photo: {
        title: "Una foto e un ricordo",
        text: "Una vecchia foto rende vivo l’albero. Nel <b>baule dei ricordi</b> scrivi una storia, un detto della nonna o registri la voce di qualcuno.",
        photo: "Metti una foto",
        memory: "Scrivi un ricordo",
      },
      invite: {
        title: "Invita un parente",
        text: "Manda il link a un cugino, una zia o un fratello. Conoscono altri rami e vedono l’albero gratis.",
        action: "Invita un parente",
      },
    },
  },
};

export const huGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Személy hozzáadása",
    addRelative: "+ Rokon hozzáadása",
    addFor: "Kit adsz hozzá {name} mellé?",
    addHint: "A nagyszülőkhöz: nyisd meg az apa vagy az anya lapját, és add hozzá a szüleiket.",
    helpLabel: "Útmutató a családfához, lépésről lépésre",
    gedcomButton: "GEDCOM letöltése",
    title: "Első lépések a családfában",
    stepOf: "{n}. lépés / {total}",
    back: "Vissza",
    next: "Tovább",
    finish: "Értem",
    close: "Bezárás",
    done: "Kész",
    reopen: "Az útmutatót bármikor újra megnyithatod a rajz feletti „?” gombbal.",
    steps: {
      open: {
        title: "Nyisd meg a családfát",
        text: "A saját családfádban vagy. Fent választod ki, hogyan nézzen ki a rajz. Koppints egy névre, és megnyílik a <b>lapja</b>: számítógépen jobbra, telefonon a rajz alatt. Bármelyik oldalról visszajutsz ide a felső menü <b>Családfám</b> pontjával.",
      },
      parents: {
        title: "Add hozzá a szüleidet",
        text: "Kezdd az anyáddal és az apáddal. A név elég: az éveket és a helyeket később is kitöltheted. A <b>+ Személy hozzáadása</b> gomb mindig a rajz felett van.",
        action: "Szülők hozzáadása",
      },
      grandparents: {
        title: "Add hozzá a nagyszüleidet",
        text: "A nagyszülők az apád és az anyád szülei. Egy nagymama lánykori neve gyakran egy egész ágat nyit meg.",
        father: "Az apa szülei",
        mother: "Az anya szülei",
        needParents: "Először a szüleidet add hozzá, aztán az ő szüleiket.",
      },
      siblings: {
        title: "Add hozzá a testvéreidet",
        text: "A testvérek maguktól ugyanazokhoz a szülőkhöz kapcsolódnak, és melletted jelennek meg a rajzon.",
        action: "Testvér hozzáadása",
      },
      photo: {
        title: "Egy fénykép és egy emlék",
        text: "Egy régi fénykép életre kelti a családfát. Az <b>emlékládában</b> leírhatsz egy történetet, a nagymama egy mondását, vagy felveheted valakinek a hangját.",
        photo: "Fénykép feltöltése",
        memory: "Emlék írása",
      },
      invite: {
        title: "Hívj meg egy rokont",
        text: "Küldd el a linket egy unokatestvérnek, egy nagynéninek vagy egy testvérnek. Ők más ágakat ismernek, és ingyen látják a családfát.",
        action: "Rokon meghívása",
      },
    },
  },
};

export const heGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ הוספת אדם",
    addRelative: "+ הוספת קרוב משפחה",
    addFor: "את מי מוסיפים ליד {name}?",
    addHint: "לסבים ולסבתות: פתחו את הכרטיס של האב או של האם והוסיפו את ההורים שלהם.",
    helpLabel: "מדריך לעץ, צעד אחר צעד",
    gedcomButton: "הורדת GEDCOM",
    title: "צעדים ראשונים בעץ",
    stepOf: "שלב {n} מתוך {total}",
    back: "חזרה",
    next: "הלאה",
    finish: "הבנתי",
    close: "סגירה",
    done: "בוצע",
    reopen: "אפשר לפתוח את המדריך שוב בכל רגע בכפתור „?” שמעל השרטוט.",
    steps: {
      open: {
        title: "פתחו את העץ",
        text: "אתם בעץ שלכם. למעלה בוחרים איך השרטוט נראה. הקישו על שם ונפתח ה<b>כרטיס</b> שלו: במחשב בצד, בטלפון מתחת לשרטוט. מכל עמוד חוזרים לכאן דרך <b>העץ שלי</b> בתפריט העליון.",
      },
      parents: {
        title: "הוסיפו את ההורים",
        text: "התחילו מאמא ומאבא. השם מספיק: שנים ומקומות אפשר להשלים כשמגלים אותם. הכפתור <b>+ הוספת אדם</b> נמצא תמיד מעל השרטוט.",
        action: "הוספת ההורים",
      },
      grandparents: {
        title: "הוסיפו את הסבים והסבתות",
        text: "הסבים והסבתות הם ההורים של אבא ושל אמא. שם הנעורים של סבתא פותח לעיתים קרובות ענף שלם.",
        father: "ההורים של אבא",
        mother: "ההורים של אמא",
        needParents: "הוסיפו קודם את ההורים, ואחר כך את ההורים שלהם.",
      },
      siblings: {
        title: "הוסיפו אחים ואחיות",
        text: "אחים ואחיות מתחברים מעצמם לאותם הורים ומופיעים לצדכם בשרטוט.",
        action: "הוספת אח או אחות",
      },
      photo: {
        title: "תמונה וזיכרון",
        text: "תמונה ישנה מחיה את העץ. ב<b>תיבת הזיכרונות</b> כותבים סיפור או אמרה של סבתא, או מקליטים קול של מישהו.",
        photo: "הוספת תמונה",
        memory: "כתיבת זיכרון",
      },
      invite: {
        title: "הזמינו קרוב משפחה",
        text: "שלחו את הקישור לבן דוד, לדודה או לאח. הם מכירים ענפים אחרים ורואים את העץ בחינם.",
        action: "הזמנת קרוב משפחה",
      },
    },
  },
};

export const ptGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Adicionar pessoa",
    addRelative: "+ Adicionar familiar",
    addFor: "Quem adicionas ao lado de {name}?",
    addHint: "Para os avós: abre a ficha do pai ou da mãe e adiciona os pais deles.",
    helpLabel: "Guia da árvore, passo a passo",
    gedcomButton: "Descarregar GEDCOM",
    title: "Primeiros passos na árvore",
    stepOf: "Passo {n} de {total}",
    back: "Voltar",
    next: "Seguinte",
    finish: "Percebi",
    close: "Fechar",
    done: "Feito",
    reopen: "Podes reabrir este guia a qualquer momento com o botão «?» por cima do desenho.",
    steps: {
      open: {
        title: "Abre a árvore",
        text: "Estás na tua árvore. Em cima escolhes como fica o desenho. Toca num nome e abre-se a <b>ficha</b> dessa pessoa: no computador à direita, no telemóvel por baixo do desenho. De qualquer página voltas aqui com <b>A minha árvore</b>, no menu de cima.",
      },
      parents: {
        title: "Adiciona os pais",
        text: "Começa pela mãe e pelo pai. Basta o nome: os anos e os lugares completas quando os souberes. O botão <b>+ Adicionar pessoa</b> está sempre por cima do desenho.",
        action: "Adicionar os pais",
      },
      grandparents: {
        title: "Adiciona os avós",
        text: "Os avós são os pais do teu pai e da tua mãe. O apelido de solteira de uma avó abre muitas vezes um ramo inteiro.",
        father: "Pais do pai",
        mother: "Pais da mãe",
        needParents: "Adiciona primeiro os pais e depois os pais deles.",
      },
      siblings: {
        title: "Adiciona os irmãos",
        text: "Os irmãos e irmãs ligam-se sozinhos aos mesmos pais e aparecem ao teu lado no desenho.",
        action: "Adicionar um irmão ou uma irmã",
      },
      photo: {
        title: "Uma fotografia e uma memória",
        text: "Uma fotografia antiga dá vida à árvore. Na <b>arca das memórias</b> escreves uma história, um ditado da avó ou gravas a voz de alguém.",
        photo: "Pôr uma fotografia",
        memory: "Escrever uma memória",
      },
      invite: {
        title: "Convida um familiar",
        text: "Envia a ligação a um primo, uma tia ou um irmão. Eles conhecem outros ramos e veem a árvore gratuitamente.",
        action: "Convidar um familiar",
      },
    },
  },
};

export const elGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Προσθήκη προσώπου",
    addRelative: "+ Προσθήκη συγγενή",
    addFor: "Ποιον προσθέτεις δίπλα στο πρόσωπο {name};",
    addHint: "Για τους παππούδες: άνοιξε την καρτέλα του πατέρα ή της μητέρας και πρόσθεσε τους γονείς τους.",
    helpLabel: "Οδηγός του δέντρου, βήμα βήμα",
    gedcomButton: "Λήψη GEDCOM",
    title: "Πρώτα βήματα στο δέντρο",
    stepOf: "Βήμα {n} από {total}",
    back: "Πίσω",
    next: "Επόμενο",
    finish: "Κατάλαβα",
    close: "Κλείσιμο",
    done: "Έγινε",
    reopen: "Μπορείς να ανοίξεις ξανά τον οδηγό όποτε θέλεις με το κουμπί «?» πάνω από το σχέδιο.",
    steps: {
      open: {
        title: "Άνοιξε το δέντρο",
        text: "Είσαι στο δέντρο σου. Πάνω διαλέγεις πώς φαίνεται το σχέδιο. Πάτησε ένα όνομα και ανοίγει η <b>καρτέλα</b> του: στον υπολογιστή δεξιά, στο κινητό κάτω από το σχέδιο. Από οποιαδήποτε σελίδα επιστρέφεις εδώ με το <b>Το δέντρο μου</b> στο πάνω μενού.",
      },
      parents: {
        title: "Πρόσθεσε τους γονείς",
        text: "Ξεκίνα από τη μητέρα και τον πατέρα. Αρκεί το όνομα: χρονιές και τόπους τα συμπληρώνεις όταν τα μάθεις. Το κουμπί <b>+ Προσθήκη προσώπου</b> είναι πάντα πάνω από το σχέδιο.",
        action: "Προσθήκη γονιών",
      },
      grandparents: {
        title: "Πρόσθεσε τους παππούδες",
        text: "Οι παππούδες είναι οι γονείς του πατέρα και της μητέρας σου. Το πατρικό επώνυμο μιας γιαγιάς ανοίγει συχνά ολόκληρο κλάδο.",
        father: "Γονείς του πατέρα",
        mother: "Γονείς της μητέρας",
        needParents: "Πρόσθεσε πρώτα τους γονείς και μετά τους δικούς τους γονείς.",
      },
      siblings: {
        title: "Πρόσθεσε τα αδέλφια",
        text: "Τα αδέλφια συνδέονται αυτόματα με τους ίδιους γονείς και εμφανίζονται δίπλα σου στο σχέδιο.",
        action: "Προσθήκη αδελφού ή αδελφής",
      },
      photo: {
        title: "Μια φωτογραφία και μια ανάμνηση",
        text: "Μια παλιά φωτογραφία ζωντανεύει το δέντρο. Στο <b>σεντούκι των αναμνήσεων</b> γράφεις μια ιστορία, μια φράση της γιαγιάς ή ηχογραφείς τη φωνή κάποιου.",
        photo: "Βάλε φωτογραφία",
        memory: "Γράψε μια ανάμνηση",
      },
      invite: {
        title: "Προσκάλεσε έναν συγγενή",
        text: "Στείλε τον σύνδεσμο σε έναν ξάδελφο, μια θεία ή έναν αδελφό. Ξέρουν άλλους κλάδους και βλέπουν το δέντρο δωρεάν.",
        action: "Πρόσκληση συγγενή",
      },
    },
  },
};

export const svGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Lägg till person",
    addRelative: "+ Lägg till släkting",
    addFor: "Vem lägger du till bredvid {name}?",
    addHint: "För far- och morföräldrar: öppna pappans eller mammans kort och lägg till deras föräldrar.",
    helpLabel: "Guide till trädet, steg för steg",
    gedcomButton: "Ladda ner GEDCOM",
    title: "Första stegen i trädet",
    stepOf: "Steg {n} av {total}",
    back: "Tillbaka",
    next: "Nästa",
    finish: "Jag förstår",
    close: "Stäng",
    done: "Klart",
    reopen: "Du kan öppna guiden igen när som helst med knappen ”?” ovanför teckningen.",
    steps: {
      open: {
        title: "Öppna trädet",
        text: "Du är i ditt släktträd. Överst väljer du hur teckningen ser ut. Tryck på ett namn så öppnas personens <b>kort</b>: på datorn till höger, på mobilen under teckningen. Från vilken sida som helst kommer du tillbaka hit via <b>Mitt träd</b> i menyn överst.",
      },
      parents: {
        title: "Lägg till dina föräldrar",
        text: "Börja med mamma och pappa. Namnet räcker: år och platser fyller du i när du får veta dem. Knappen <b>+ Lägg till person</b> finns alltid ovanför teckningen.",
        action: "Lägg till föräldrarna",
      },
      grandparents: {
        title: "Lägg till far- och morföräldrar",
        text: "Far- och morföräldrarna är din pappas och din mammas föräldrar. En mormors flicknamn öppnar ofta en hel gren.",
        father: "Pappans föräldrar",
        mother: "Mammans föräldrar",
        needParents: "Lägg först till dina föräldrar och sedan deras föräldrar.",
      },
      siblings: {
        title: "Lägg till syskon",
        text: "Bröder och systrar kopplas automatiskt till samma föräldrar och visas bredvid dig i teckningen.",
        action: "Lägg till en bror eller syster",
      },
      photo: {
        title: "Ett foto och ett minne",
        text: "Ett gammalt foto gör trädet levande. I <b>minneskistan</b> skriver du en händelse eller ett talesätt från mormor, eller spelar in någons röst.",
        photo: "Lägg till ett foto",
        memory: "Skriv ett minne",
      },
      invite: {
        title: "Bjud in en släkting",
        text: "Skicka länken till en kusin, en faster eller en bror. De känner till andra grenar och ser trädet gratis.",
        action: "Bjud in en släkting",
      },
    },
  },
};

export const daGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Tilføj person",
    addRelative: "+ Tilføj slægtning",
    addFor: "Hvem tilføjer du ved siden af {name}?",
    addHint: "For bedsteforældre: åbn farens eller morens kort og tilføj deres forældre.",
    helpLabel: "Guide til træet, trin for trin",
    gedcomButton: "Download GEDCOM",
    title: "Første skridt i træet",
    stepOf: "Trin {n} af {total}",
    back: "Tilbage",
    next: "Næste",
    finish: "Forstået",
    close: "Luk",
    done: "Færdig",
    reopen: "Du kan altid åbne guiden igen med knappen »?« over tegningen.",
    steps: {
      open: {
        title: "Åbn træet",
        text: "Du er i dit stamtræ. Øverst vælger du, hvordan tegningen ser ud. Tryk på et navn, så åbnes personens <b>kort</b>: på computeren til højre, på telefonen under tegningen. Fra enhver side kommer du tilbage hertil med <b>Mit træ</b> i menuen øverst.",
      },
      parents: {
        title: "Tilføj dine forældre",
        text: "Begynd med din mor og far. Navnet er nok: år og steder udfylder du, når du finder dem. Knappen <b>+ Tilføj person</b> står altid over tegningen.",
        action: "Tilføj forældrene",
      },
      grandparents: {
        title: "Tilføj dine bedsteforældre",
        text: "Bedsteforældrene er din fars og din mors forældre. En bedstemors pigenavn åbner ofte en hel gren.",
        father: "Farens forældre",
        mother: "Morens forældre",
        needParents: "Tilføj først dine forældre og derefter deres forældre.",
      },
      siblings: {
        title: "Tilføj dine søskende",
        text: "Brødre og søstre knyttes automatisk til de samme forældre og vises ved siden af dig i tegningen.",
        action: "Tilføj en bror eller søster",
      },
      photo: {
        title: "Et foto og et minde",
        text: "Et gammelt foto gør træet levende. I <b>mindekisten</b> skriver du en historie eller et ordsprog fra bedstemor, eller optager en persons stemme.",
        photo: "Tilføj et foto",
        memory: "Skriv et minde",
      },
      invite: {
        title: "Inviter en slægtning",
        text: "Send linket til en fætter, en tante eller en bror. De kender andre grene og ser træet gratis.",
        action: "Inviter en slægtning",
      },
    },
  },
};

export const nbGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Legg til person",
    addRelative: "+ Legg til slektning",
    addFor: "Hvem legger du til ved siden av {name}?",
    addHint: "For besteforeldre: åpne farens eller morens kort og legg til foreldrene deres.",
    helpLabel: "Guide til treet, steg for steg",
    gedcomButton: "Last ned GEDCOM",
    title: "Første steg i treet",
    stepOf: "Steg {n} av {total}",
    back: "Tilbake",
    next: "Neste",
    finish: "Skjønner",
    close: "Lukk",
    done: "Ferdig",
    reopen: "Du kan alltid åpne guiden igjen med «?»-knappen over tegningen.",
    steps: {
      open: {
        title: "Åpne treet",
        text: "Du er i slektstreet ditt. Øverst velger du hvordan tegningen ser ut. Trykk på et navn, så åpnes <b>kortet</b>: på datamaskinen til høyre, på mobilen under tegningen. Fra hvilken som helst side kommer du tilbake hit med <b>Treet mitt</b> i menyen øverst.",
      },
      parents: {
        title: "Legg til foreldrene dine",
        text: "Begynn med mor og far. Navnet er nok: år og steder fyller du inn når du finner dem. Knappen <b>+ Legg til person</b> står alltid over tegningen.",
        action: "Legg til foreldrene",
      },
      grandparents: {
        title: "Legg til besteforeldrene",
        text: "Besteforeldrene er foreldrene til faren og moren din. En bestemors pikenavn åpner ofte en hel gren.",
        father: "Farens foreldre",
        mother: "Morens foreldre",
        needParents: "Legg først til foreldrene dine, deretter foreldrene deres.",
      },
      siblings: {
        title: "Legg til søsken",
        text: "Brødre og søstre knyttes automatisk til de samme foreldrene og vises ved siden av deg i tegningen.",
        action: "Legg til en bror eller søster",
      },
      photo: {
        title: "Et bilde og et minne",
        text: "Et gammelt bilde gjør treet levende. I <b>minnekisten</b> skriver du en historie eller et ordtak fra bestemor, eller tar opp noens stemme.",
        photo: "Legg til et bilde",
        memory: "Skriv et minne",
      },
      invite: {
        title: "Inviter en slektning",
        text: "Send lenken til en fetter, en tante eller en bror. De kjenner andre greiner og ser treet gratis.",
        action: "Inviter en slektning",
      },
    },
  },
};

export const ukGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Додати людину",
    addRelative: "+ Додати родича",
    addFor: "Кого додаєш поруч із {name}?",
    addHint: "Для бабусь і дідусів: відкрий картку батька або матері й додай їхніх батьків.",
    helpLabel: "Посібник до дерева, крок за кроком",
    gedcomButton: "Завантажити GEDCOM",
    title: "Перші кроки в дереві",
    stepOf: "Крок {n} з {total}",
    back: "Назад",
    next: "Далі",
    finish: "Зрозуміло",
    close: "Закрити",
    done: "Готово",
    reopen: "Посібник можна будь-коли відкрити знову кнопкою «?» над малюнком.",
    steps: {
      open: {
        title: "Відкрий дерево",
        text: "Ти у своєму дереві. Угорі обираєш, який вигляд має малюнок. Торкнися імені, і відкриється <b>картка</b>: на комп’ютері праворуч, на телефоні під малюнком. З будь-якої сторінки повертаєшся сюди через <b>Моє дерево</b> у верхньому меню.",
      },
      parents: {
        title: "Додай батьків",
        text: "Почни з мами й тата. Достатньо імені: роки й місця доповниш, коли дізнаєшся. Кнопка <b>+ Додати людину</b> завжди над малюнком.",
        action: "Додати батьків",
      },
      grandparents: {
        title: "Додай бабусь і дідусів",
        text: "Бабусі й дідусі — це батьки твого тата й твоєї мами. Дівоче прізвище бабусі часто відкриває цілу гілку.",
        father: "Батьки тата",
        mother: "Батьки мами",
        needParents: "Спершу додай батьків, а потім їхніх батьків.",
      },
      siblings: {
        title: "Додай братів і сестер",
        text: "Брати й сестри самі пов’язуються з тими самими батьками й з’являються поруч із тобою на малюнку.",
        action: "Додати брата чи сестру",
      },
      photo: {
        title: "Фото і спогад",
        text: "Старе фото оживляє дерево. У <b>скрині спогадів</b> записуєш історію чи бабусину приказку або голос когось із рідних.",
        photo: "Додати фото",
        memory: "Написати спогад",
      },
      invite: {
        title: "Запроси родича",
        text: "Надішли посилання двоюрідному братові, тітці чи братові. Вони знають інші гілки й бачать дерево безкоштовно.",
        action: "Запросити родича",
      },
    },
  },
};

export const srGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Dodaj osobu",
    addRelative: "+ Dodaj rođaka",
    addFor: "Koga dodaješ pored osobe {name}?",
    addHint: "Za babe i dede: otvori karticu oca ili majke i dodaj njihove roditelje.",
    helpLabel: "Vodič kroz stablo, korak po korak",
    gedcomButton: "Preuzmi GEDCOM",
    title: "Prvi koraci u stablu",
    stepOf: "Korak {n} od {total}",
    back: "Nazad",
    next: "Dalje",
    finish: "Razumem",
    close: "Zatvori",
    done: "Urađeno",
    reopen: "Vodič možeš uvek ponovo otvoriti dugmetom „?” iznad crteža.",
    steps: {
      open: {
        title: "Otvori stablo",
        text: "Nalaziš se u svom stablu. Gore biraš kako crtež izgleda. Dodirni ime i otvoriće se njegova <b>kartica</b>: na računaru desno, na telefonu ispod crteža. Sa bilo koje stranice vraćaš se ovde preko <b>Moje stablo</b> u gornjem meniju.",
      },
      parents: {
        title: "Dodaj roditelje",
        text: "Počni od majke i oca. Dovoljno je ime: godine i mesta dopunjuješ kad ih saznaš. Dugme <b>+ Dodaj osobu</b> je uvek iznad crteža.",
        action: "Dodaj roditelje",
      },
      grandparents: {
        title: "Dodaj babe i dede",
        text: "Babe i dede su roditelji tvog oca i tvoje majke. Devojačko prezime bake često otvara celu granu.",
        father: "Roditelji oca",
        mother: "Roditelji majke",
        needParents: "Prvo dodaj roditelje, pa onda njihove roditelje.",
      },
      siblings: {
        title: "Dodaj braću i sestre",
        text: "Braća i sestre se sami povezuju sa istim roditeljima i pojavljuju se pored tebe na crtežu.",
        action: "Dodaj brata ili sestru",
      },
      photo: {
        title: "Fotografija i uspomena",
        text: "Stara fotografija oživljava stablo. U <b>škrinji uspomena</b> zapisuješ priču ili bakinu izreku, ili snimaš nečiji glas.",
        photo: "Dodaj fotografiju",
        memory: "Napiši uspomenu",
      },
      invite: {
        title: "Pozovi rođaka",
        text: "Pošalji link bratu od strica, tetki ili bratu. Oni znaju druge grane i stablo vide besplatno.",
        action: "Pozovi rođaka",
      },
    },
  },
};

export const bgGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Добави човек",
    addRelative: "+ Добави роднина",
    addFor: "Кого добавяш до {name}?",
    addHint: "За бабите и дядовците: отвори картата на бащата или майката и добави техните родители.",
    helpLabel: "Наръчник за дървото, стъпка по стъпка",
    gedcomButton: "Изтегли GEDCOM",
    title: "Първи стъпки в дървото",
    stepOf: "Стъпка {n} от {total}",
    back: "Назад",
    next: "Напред",
    finish: "Разбрах",
    close: "Затвори",
    done: "Готово",
    reopen: "Наръчникът може да се отвори отново по всяко време с бутона „?“ над рисунката.",
    steps: {
      open: {
        title: "Отвори дървото",
        text: "Ти си в своето дърво. Горе избираш как да изглежда рисунката. Докосни име и се отваря неговата <b>карта</b>: на компютъра вдясно, на телефона под рисунката. От всяка страница се връщаш тук с <b>Моето дърво</b> в горното меню.",
      },
      parents: {
        title: "Добави родителите",
        text: "Започни с майка си и баща си. Името е достатъчно: години и места попълваш, когато ги научиш. Бутонът <b>+ Добави човек</b> е винаги над рисунката.",
        action: "Добави родителите",
      },
      grandparents: {
        title: "Добави бабите и дядовците",
        text: "Бабите и дядовците са родителите на баща ти и на майка ти. Моминското име на една баба често отваря цял клон.",
        father: "Родителите на бащата",
        mother: "Родителите на майката",
        needParents: "Първо добави родителите, после техните родители.",
      },
      siblings: {
        title: "Добави братята и сестрите",
        text: "Братята и сестрите се свързват сами със същите родители и се появяват до теб в рисунката.",
        action: "Добави брат или сестра",
      },
      photo: {
        title: "Снимка и спомен",
        text: "Една стара снимка съживява дървото. В <b>сандъка със спомени</b> записваш история или поговорка на баба, или записваш нечий глас.",
        photo: "Сложи снимка",
        memory: "Напиши спомен",
      },
      invite: {
        title: "Покани роднина",
        text: "Изпрати връзката на братовчед, леля или брат. Те познават други клонове и виждат дървото безплатно.",
        action: "Покани роднина",
      },
    },
  },
};

export const trGhidArbore: G = {
  TreeGuide: {
    addPerson: "+ Kişi ekle",
    addRelative: "+ Akraba ekle",
    addFor: "{name} yanına kimi ekliyorsun?",
    addHint: "Büyükanne ve büyükbabalar için: babanın ya da annenin kartını aç ve onların anne babasını ekle.",
    helpLabel: "Ağaç rehberi, adım adım",
    gedcomButton: "GEDCOM indir",
    title: "Ağaçta ilk adımlar",
    stepOf: "Adım {n} / {total}",
    back: "Geri",
    next: "İleri",
    finish: "Anladım",
    close: "Kapat",
    done: "Tamam",
    reopen: "Bu rehberi istediğin zaman çizimin üstündeki “?” düğmesiyle yeniden açabilirsin.",
    steps: {
      open: {
        title: "Ağacı aç",
        text: "Kendi ağacındasın. Üstte çizimin nasıl görüneceğini seçersin. Bir isme dokun, o kişinin <b>kartı</b> açılır: bilgisayarda sağda, telefonda çizimin altında. Her sayfadan üst menüdeki <b>Ağacım</b> ile buraya dönersin.",
      },
      parents: {
        title: "Anne babanı ekle",
        text: "Annen ve babanla başla. İsim yeterli: yılları ve yerleri öğrendikçe doldurursun. <b>+ Kişi ekle</b> düğmesi her zaman çizimin üstündedir.",
        action: "Anne babayı ekle",
      },
      grandparents: {
        title: "Büyükanne ve büyükbabaları ekle",
        text: "Büyükanne ve büyükbabalar, babanın ve annenin anne babasıdır. Bir büyükannenin kızlık soyadı çoğu zaman koca bir dal açar.",
        father: "Babanın anne babası",
        mother: "Annenin anne babası",
        needParents: "Önce anne babanı, sonra onların anne babasını ekle.",
      },
      siblings: {
        title: "Kardeşlerini ekle",
        text: "Erkek ve kız kardeşler aynı anne babaya kendiliğinden bağlanır ve çizimde yanında görünür.",
        action: "Kardeş ekle",
      },
      photo: {
        title: "Bir fotoğraf ve bir anı",
        text: "Eski bir fotoğraf ağaca hayat verir. <b>Anı sandığına</b> bir olay, büyükannenin bir sözünü yazar ya da birinin sesini kaydedersin.",
        photo: "Fotoğraf ekle",
        memory: "Bir anı yaz",
      },
      invite: {
        title: "Bir akrabanı davet et",
        text: "Bağlantıyı bir kuzene, bir teyzeye ya da bir kardeşe gönder. Onlar başka dalları bilir ve ağacı ücretsiz görür.",
        action: "Akraba davet et",
      },
    },
  },
};
