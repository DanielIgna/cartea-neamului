import type { ActivareCatalog } from "./ro";

export const huActivare: ActivareCatalog = {
  QuickStart: {
    title: "Add meg magadat, aztán a szüleidet és nagyszüleidet",
    lead: "Egy perc az egész. Amit nem tudsz, hagyd üresen: később kiegészíted, vagy segítenek a rokonok.",
    progress: "{n}. lépés / {total}",
    fatherSide: "Apai nagyszülők",
    motherSide: "Anyai nagyszülők",
    grandfatherGiven: "A nagyapa keresztneve",
    grandmotherGiven: "A nagymama keresztneve",
    grandmotherMaiden: "A nagymama leánykori neve",
    dontKnow: "Nem tudom, tovább",
    finish: "Kész, jöhet a családfa",
    later: "A pontos dátumokat, fotókat és helyeket utána adod hozzá, a családfából.",
    otherWays: "Rokontól kaptál linket, vagy már van GEDCOM-fájlod? A lehetőségeket lent találod.",
  },
  BranchInvite: {
    titleM: "Hívd meg {name} rokonodat, hogy kiegészítse az ágát",
    titleF: "Hívd meg {name} rokonodat, hogy kiegészítse az ágát",
    text: "A családfádban már {count} ember van. {name} olyan neveket és történeteket ismer, amelyeket senki más: küldd el a linket WhatsAppon, e-mailben, vagy másold ki.",
    later: "Később",
    viewOnly: "Az ingyenes napokban a link a családfa megtekintését engedi; ahhoz, hogy {name} írni is tudjon, fizetett év kell.",
  },
  ActivationMail: {
    subject: "A családfád vár rád: {app}",
    body: "Szia, {name}!\n\nFiókot nyitottál itt: {app}, de a családfád még nem indult el. Az első lépés rövid: ki vagy, aztán a szüleid és nagyszüleid, képernyőnként három sor. Amit nem tudsz, hagyd üresen.\n\nUtána meghívhatod a rokonaidat, hogy mindenki kiegészítse a saját ágát.",
    button: "Kezdd el a családfát",
    why: "Ezt az e-mailt egyszer kapod meg, mert fiókot nyitottál itt: {app}.",
    unsubscribe: "Nem kérek több e-mailt a fiókomról",
  },
};
