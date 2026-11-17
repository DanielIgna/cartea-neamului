import type { ActivareCatalog } from "./ro";

export const nlActivare: ActivareCatalog = {
  QuickStart: {
    title: "Voeg jezelf toe, dan je ouders en grootouders",
    lead: "Het duurt een minuut. Laat leeg wat je niet weet: voeg het later toe, of laat je familie helpen.",
    progress: "Stap {n} van {total}",
    fatherSide: "Grootouders van vaderskant",
    motherSide: "Grootouders van moederskant",
    grandfatherGiven: "Voornaam van opa",
    grandmotherGiven: "Voornaam van oma",
    grandmotherMaiden: "Meisjesnaam van oma",
    dontKnow: "Weet ik niet, verder",
    finish: "Klaar, maak de stamboom",
    later: "Precieze data, foto’s en plaatsen voeg je daarna toe, vanuit de stamboom.",
    otherWays: "Een link van familie gekregen of al een GEDCOM-bestand? De opties staan hieronder.",
  },
  BranchInvite: {
    titleM: "Nodig {name} uit om zijn tak aan te vullen",
    titleF: "Nodig {name} uit om haar tak aan te vullen",
    text: "Je stamboom heeft al {count} personen. {name} kent namen en verhalen die niemand anders kent: stuur de link via WhatsApp, per e-mail of kopieer hem.",
    later: "Later",
    viewOnly: "Tijdens de gratis dagen laat de link de stamboom zien; om {name} ook te laten schrijven, is een betaald jaar nodig.",
  },
  ActivationMail: {
    subject: "Je stamboom wacht op je bij {app}",
    body: "Hoi {name}!\n\nJe hebt een account gemaakt bij {app}, maar je stamboom is nog niet begonnen. De eerste stap is kort: wie je bent, dan je ouders en grootouders, drie regels per scherm. Laat leeg wat je niet weet.\n\nDaarna kun je je familie uitnodigen om elk hun eigen tak aan te vullen.",
    button: "Begin de stamboom",
    why: "Je krijgt deze e-mail één keer, omdat je een account hebt gemaakt bij {app}.",
    unsubscribe: "Geen e-mails meer over mijn account",
  },
};
