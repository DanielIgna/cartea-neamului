/**
 * Regiunile istorice, folosite de paginile de nume (unde e frecvent un nume) și de cele de localități (ce registre există).
 * Faptele de aici sunt cele din ghidul „Registrele de stare civilă” (content/ghid/registrele-de-stare-civila.md).
 */
export type RegionKey = "transilvania" | "banat" | "crisana" | "maramures" | "moldova" | "bucovina" | "muntenia" | "oltenia" | "dobrogea";

type Region = { name: string; in: string; group: "vest" | "regat" | "bucovina" | "dobrogea"; };

export const REGIONS: Record<RegionKey, Region> = {
  transilvania: { name: "Transilvania", in: "în Transilvania", group: "vest" },
  banat: { name: "Banat", in: "în Banat", group: "vest" },
  crisana: { name: "Crișana", in: "în Crișana", group: "vest" },
  maramures: { name: "Maramureș", in: "în Maramureș", group: "vest" },
  moldova: { name: "Moldova", in: "în Moldova", group: "regat" },
  bucovina: { name: "Bucovina", in: "în Bucovina", group: "bucovina" },
  muntenia: { name: "Muntenia", in: "în Muntenia", group: "regat" },
  oltenia: { name: "Oltenia", in: "în Oltenia", group: "regat" },
  dobrogea: { name: "Dobrogea", in: "în Dobrogea", group: "dobrogea" },
};

export const isRegion = (k: string): k is RegionKey => k in REGIONS;

/** Ce surse găsești, pe scurt, după istoria administrativă a regiunii. */
export const REGION_SOURCES: Record<Region["group"], { civil: string; tips: string[]; guides: string[] }> = {
  vest: {
    civil: "Starea civilă de stat a început aici la 1 octombrie 1895; registrele dintre 1895 și 1918 sunt de obicei în limba maghiară. Pentru anii de dinainte, sursa principală sunt registrele parohiale (matricolele) fiecărei confesiuni.",
    tips: [
      "Caută numele și în forma maghiară sau germană: registrele de stare civilă dintre 1895 și 1918 sunt în maghiară, iar unele registre parohiale în latină.",
      "Află confesiunea familiei (ortodoxă, greco-catolică sau alta): fiecare își ținea registrele separat.",
      "Pentru secolele XVIII–XIX, conscripțiile și urbariile pot arăta capul familiei înainte de primele registre.",
    ],
    guides: ["registrele-greco-catolice", "documente-in-maghiara-si-germana", "conscriptiile-din-transilvania"],
  },
  regat: {
    civil: "Aici există registre de stare civilă din anii 1830, ținute de preoți după Regulamentele Organice, iar din decembrie 1865 de primării. Înainte de 1919, datele sunt de obicei după calendarul vechi (iulian).",
    tips: [
      "Registrele din anii 1830–1860 pot fi scrise cu alfabetul chirilic sau cu alfabetul de tranziție.",
      "Pentru perioada de dinainte de registre, caută familia în catagrafii.",
      "Ține cont de stilul vechi al datelor: 12 zile diferență în secolul al XIX-lea, 13 după 1900.",
    ],
    guides: ["registrele-de-stare-civila", "scrierea-chirilica-romaneasca", "catagrafiile-din-moldova-si-tara-romaneasca"],
  },
  bucovina: {
    civil: "Bucovina a fost sub administrație austriacă din 1775 până în 1918, iar registrele bisericești au ținut mult timp locul stării civile. Ce s-a păstrat diferă de la loc la loc.",
    tips: [
      "Registrele pot fi în română, germană, latină sau ucraineană, după epocă și comunitate.",
      "Întreabă serviciul județean al Arhivelor Naționale ce registre are pentru satul tău.",
      "Numele pot apărea în ortografie germană (de pildă *sch* pentru *ș*).",
    ],
    guides: ["registrele-de-stare-civila", "documente-in-maghiara-si-germana", "cum-ceri-copii-de-la-arhive"],
  },
  dobrogea: {
    civil: "Dobrogea face parte din România din 1878; din acel moment se aplică registrele de stare civilă românești. Pentru perioada otomană, sursele sunt puține.",
    tips: [
      "Multe familii din Dobrogea au venit după 1878 din alte regiuni: caută și satul de origine.",
      "Comunitățile de alte etnii și confesiuni își țineau și registrele lor.",
      "Întreabă serviciul județean al Arhivelor Naționale de unde încep seriile păstrate.",
    ],
    guides: ["registrele-de-stare-civila", "cum-ceri-copii-de-la-arhive", "cum-sunt-organizate-arhivele"],
  },
};
