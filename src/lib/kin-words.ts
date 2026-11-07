/**
 * Numele rudeniilor în fiecare limbă a site-ului: „văr primar”, “first cousin”, « cousin germain »…
 * Legătura vine din kinship() (src/lib/kinship.ts), fără cuvinte; aici se scrie, după sexul rudei.
 * Româna păstrează exact formele de dinainte; celelalte limbi folosesc numele obișnuite din genealogie.
 */
import type { KinTerm, Sex } from "./kinship";
import type { Locale } from "@/i18n/locales";

type Words = (term: KinTerm, sex: Sex) => string;
/** Bărbat, femeie, nespecificat. */
type Three = readonly [string, string, string];
const pick = (sex: Sex, [m, f, u]: Three) => (sex === "M" ? m : sex === "F" ? f : u);
/** Câte generații „mai departe” de un nume: 0 pentru nume, 1 pentru „stră-”, … (folosit la limbile care repetă un prefix). */
const times = (s: string, n: number) => s.repeat(Math.max(0, n));

/* ───────────── Română ───────────── */

/** „văr primar”, „vară primară”, „văr de-al doilea”, „vară de-a doua”… */
const roOrd = (n: number, sex: Sex) => sex === "F"
  ? (n === 1 ? "primară" : `de-a ${["", "", "doua", "treia", "patra", "cincea", "șasea"][n] ?? `${n}-a`}`)
  : (n === 1 ? "primar" : `de-al ${["", "", "doilea", "treilea", "patrulea", "cincilea", "șaselea"][n] ?? `${n}-lea`}`);
const roNth = (n: number, sex: Sex) => {
  const f = ["", "prima", "a doua", "a treia", "a patra", "a cincea"], m = ["", "primul", "al doilea", "al treilea", "al patrulea", "al cincilea"];
  return sex === "M" ? m[n] ?? `al ${n}-lea` : f[n] ?? `a ${n}-a`;
};

function roBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["tată", "mamă", "părinte"], ["bunic", "bunică", "bunic(ă)"], ["străbunic", "străbunică", "străbunic(ă)"], ["răstrăbunic", "răstrăbunică", "răstrăbunic(ă)"]];
    if (up < names.length) return pick(sex, names[up]);
    return `${pick(sex, ["strămoș", "strămoașă", "strămoș"])} (generația ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["fiu", "fiică", "copil"], ["nepot", "nepoată", "nepot(oată)"], ["strănepot", "strănepoată", "strănepot(oată)"], ["răstrănepot", "răstrănepoată", "răstrănepot(oată)"]];
    if (down < names.length) return pick(sex, names[down]);
    return `urmaș (generația ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["frate", "soră", "frate/soră"]);
  if (up === 1) return down === 2 ? pick(sex, ["nepot de frate", "nepoată de frate", "nepot(oată) de frate"]) : `${pick(sex, ["strănepot", "strănepoată", "strănepot(oată)"])} de frate`;
  if (down === 1) {
    if (up === 2) return pick(sex, ["unchi", "mătușă", "unchi/mătușă"]);
    if (up === 3) return pick(sex, ["frate al bunicului/bunicii", "soră a bunicului/bunicii", "frate/soră a bunicilor"]);
    return pick(sex, ["frate al unui strămoș", "soră a unui strămoș", "frate/soră al unui strămoș"]);
  }
  const cousin = pick(sex, ["văr", "vară", "văr/vară"]);
  if (up === down) return `${cousin} ${roOrd(up - 1, sex)}`;
  return `${cousin} ${roOrd(Math.min(up, down) - 1, sex)}, ${up > down ? "dintr-o generație mai veche" : "dintr-o generație mai nouă"}`;
}

const ro: Words = (k, sex) => {
  switch (k.t) {
    case "self": return "persoana din centru";
    case "blood": {
      const base = roBlood(k.up, k.down, sex);
      return k.half && k.up === 1 && k.down === 1 ? `${base} ${pick(k.half, ["după tată", "după mamă", "după un părinte"])}` : base;
    }
    case "spouse": return pick(sex, ["soț", "soție", "partener(ă)"]);
    case "parentSpouse": {
      const of = pick(k.parent, ["tatălui", "mamei", "părintelui"]);
      if (k.when === "after") return pick(sex, ["tată vitreg", "mamă vitregă", "părinte vitreg"]);
      if (k.when === "before") { const nth = roNth(k.order, sex); return pick(sex, [`${nth} soț al ${of}`, `${nth} soție a ${of}`, `${nth} partener al ${of}`]); }
      return pick(sex, [`soțul ${of}`, `soția ${of}`, `partenerul ${of}`]);
    }
    case "childSpouse": return pick(sex, ["ginere", "noră", "soțul/soția copilului"]);
    case "siblingInLaw": return pick(sex, ["cumnat", "cumnată", "cumnat(ă)"]);
    case "stepGrandparent": return pick(sex, ["bunic vitreg", "bunică vitregă", "bunic(ă) vitreg(ă)"]);
    case "piblingByMarriage": return pick(sex, ["unchi prin alianță", "mătușă prin alianță", "unchi/mătușă prin alianță"]);
    case "kinSpouse": return `${pick(sex, ["soțul", "soția", "partenerul"])} unei rude (${ro(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["socru", "soacră", "socru/soacră"]);
    case "stepChild": return pick(sex, ["fiu vitreg", "fiică vitregă", "copil vitreg"]);
    case "stepGrandchild": return pick(sex, ["nepot vitreg", "nepoată vitregă", "nepot(oată) vitreg(ă)"]);
    case "spouseKin": return `rudă prin alianță: ${ro(k.kin, sex)}, din neamul ${pick(k.spouse, ["soțului", "soției", "soțului/soției"])}`;
  }
};

/* ───────────── English ───────────── */

const EN_ORD = ["", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
const enOrd = (n: number) => EN_ORD[n] ?? `${n}th`;
const enRemoved = (n: number) => (n === 1 ? "once" : n === 2 ? "twice" : `${n} times`);

function enBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    if (up === 1) return pick(sex, ["father", "mother", "parent"]);
    if (up <= 4) return `${times("great-", up - 2)}${pick(sex, ["grandfather", "grandmother", "grandparent"])}`;
    return `ancestor (generation ${up})`;
  }
  if (up === 0) {
    if (down === 1) return pick(sex, ["son", "daughter", "child"]);
    if (down <= 4) return `${times("great-", down - 2)}${pick(sex, ["grandson", "granddaughter", "grandchild"])}`;
    return `descendant (generation ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["brother", "sister", "sibling"]);
  if (up === 1) return down <= 4 ? `${times("great-", down - 2)}${pick(sex, ["nephew", "niece", "nephew or niece"])}` : "descendant of a sibling";
  if (down === 1) return up <= 4 ? `${times("great-", up - 2)}${pick(sex, ["uncle", "aunt", "uncle or aunt"])}` : pick(sex, ["brother of an ancestor", "sister of an ancestor", "sibling of an ancestor"]);
  const removed = Math.abs(up - down);
  return `${enOrd(Math.min(up, down) - 1)} cousin${removed ? ` ${enRemoved(removed)} removed` : ""}`;
}

const en = (centre: string): Words => {
  const words: Words = (k, sex) => {
    const spouse = (s: Sex) => pick(s, ["husband", "wife", "spouse"]);
    switch (k.t) {
      case "self": return `the person in the ${centre}`;
      case "blood": {
        if (k.half && k.up === 1 && k.down === 1) return `${pick(k.half, ["paternal ", "maternal ", ""])}half-${pick(sex, ["brother", "sister", "sibling"])}`;
        return enBlood(k.up, k.down, sex);
      }
      case "spouse": return spouse(sex);
      case "parentSpouse": {
        if (k.when === "after") return pick(sex, ["stepfather", "stepmother", "step-parent"]);
        const of = pick(k.parent, ["father’s", "mother’s", "parent’s"]);
        return k.when === "before" ? `${of} ${enOrd(k.order)} ${spouse(sex)}` : `${of} ${spouse(sex)}`;
      }
      case "childSpouse": return pick(sex, ["son-in-law", "daughter-in-law", "child’s spouse"]);
      case "siblingInLaw": return pick(sex, ["brother-in-law", "sister-in-law", "sibling-in-law"]);
      case "stepGrandparent": return pick(sex, ["step-grandfather", "step-grandmother", "step-grandparent"]);
      case "piblingByMarriage": return `${pick(sex, ["uncle", "aunt", "uncle or aunt"])} by marriage`;
      case "kinSpouse": return `${spouse(sex)} of a relative (${words(k.kin, k.kinSex)})`;
      case "parentInLaw": return pick(sex, ["father-in-law", "mother-in-law", "parent-in-law"]);
      case "stepChild": return pick(sex, ["stepson", "stepdaughter", "stepchild"]);
      case "stepGrandchild": return pick(sex, ["step-grandson", "step-granddaughter", "step-grandchild"]);
      case "spouseKin": return `relative by marriage: ${words(k.kin, sex)}, on the ${pick(k.spouse, ["husband’s", "wife’s", "spouse’s"])} side`;
    }
  };
  return words;
};

/* ───────────── Français ───────────── */

const frNth = (n: number, sex: Sex) => (n === 1 ? (sex === "F" ? "première" : "premier") : ["", "", "deuxième", "troisième", "quatrième", "cinquième"][n] ?? `${n}e`);

function frBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    if (up === 1) return pick(sex, ["père", "mère", "parent"]);
    if (up <= 4) return `${times("arrière-", up - 2)}${pick(sex, ["grand-père", "grand-mère", "grand-parent"])}`;
    return `${pick(sex, ["ancêtre", "ancêtre", "ancêtre"])} (génération ${up})`;
  }
  if (up === 0) {
    if (down === 1) return pick(sex, ["fils", "fille", "enfant"]);
    if (down <= 4) return `${times("arrière-", down - 2)}${pick(sex, ["petit-fils", "petite-fille", "petit-enfant"])}`;
    return `${pick(sex, ["descendant", "descendante", "descendant"])} (génération ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["frère", "sœur", "frère ou sœur"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["neveu", "nièce", "neveu ou nièce"]);
    return `${times("arrière-", down - 3)}${pick(sex, ["petit-neveu", "petite-nièce", "petit-neveu ou petite-nièce"])}`;
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["oncle", "tante", "oncle ou tante"]);
    if (up <= 4) return `${times("arrière-", up - 3)}${pick(sex, ["grand-oncle", "grand-tante", "grand-oncle ou grand-tante"])}`;
    return pick(sex, ["frère d’un ancêtre", "sœur d’un ancêtre", "frère ou sœur d’un ancêtre"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n === 1 ? pick(sex, ["cousin germain", "cousine germaine", "cousin germain ou cousine germaine"])
    : n === 2 ? pick(sex, ["cousin issu de germain", "cousine issue de germain", "cousin ou cousine issu(e) de germain"])
    : pick(sex, ["cousin éloigné", "cousine éloignée", "cousin ou cousine éloigné(e)"]);
  return up === down ? base : `${base}, d’une génération plus ${up > down ? "ancienne" : "récente"}`;
}

const fr: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["mari", "épouse", "conjoint"]);
  switch (k.t) {
    case "self": return "la personne au centre";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["demi-frère", "demi-sœur", "demi-frère ou demi-sœur"])}${pick(k.half, [" par le père", " par la mère", ""])}`;
      return frBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["beau-père", "belle-mère", "beau-parent"]);
      const of = pick(k.parent, ["du père", "de la mère", "du parent"]);
      return k.when === "before" ? `${frNth(k.order, sex)} ${spouse(sex)} ${of}` : `${spouse(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["gendre", "belle-fille", "conjoint de l’enfant"]);
    case "siblingInLaw": return pick(sex, ["beau-frère", "belle-sœur", "beau-frère ou belle-sœur"]);
    case "stepGrandparent": return `${pick(sex, ["grand-père", "grand-mère", "grand-parent"])} par alliance`;
    case "piblingByMarriage": return `${pick(sex, ["oncle", "tante", "oncle ou tante"])} par alliance`;
    case "kinSpouse": return `${spouse(sex)} d’un membre de la famille (${fr(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["beau-père", "belle-mère", "beau-parent"]);
    case "stepChild": return pick(sex, ["beau-fils", "belle-fille", "enfant du conjoint"]);
    case "stepGrandchild": return `${pick(sex, ["petit-fils", "petite-fille", "petit-enfant"])} par alliance`;
    case "spouseKin": return `${pick(sex, ["parent", "parente", "parent"])} par alliance : ${fr(k.kin, sex)}, du côté ${pick(k.spouse, ["du mari", "de l’épouse", "du conjoint"])}`;
  }
};

/* ───────────── Español ───────────── */

const ES_ORD: Three[] = [["", "", ""], ["primer", "primera", "primer"], ["segundo", "segunda", "segundo"], ["tercer", "tercera", "tercer"], ["cuarto", "cuarta", "cuarto"], ["quinto", "quinta", "quinto"]];
const ES_COUSIN: Three[] = [["", "", ""], ["primo hermano", "prima hermana", "primo hermano o prima hermana"], ["primo segundo", "prima segunda", "primo segundo o prima segunda"],
  ["primo tercero", "prima tercera", "primo tercero o prima tercera"], ["primo cuarto", "prima cuarta", "primo cuarto o prima cuarta"], ["primo quinto", "prima quinta", "primo quinto o prima quinta"]];

function esBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["padre", "madre", "padre o madre"], ["abuelo", "abuela", "abuelo o abuela"], ["bisabuelo", "bisabuela", "bisabuelo o bisabuela"], ["tatarabuelo", "tatarabuela", "tatarabuelo o tatarabuela"]];
    if (up < names.length) return pick(sex, names[up]);
    return `${pick(sex, ["antepasado", "antepasada", "antepasado"])} (generación ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["hijo", "hija", "hijo o hija"], ["nieto", "nieta", "nieto o nieta"], ["bisnieto", "bisnieta", "bisnieto o bisnieta"], ["tataranieto", "tataranieta", "tataranieto o tataranieta"]];
    if (down < names.length) return pick(sex, names[down]);
    return `descendiente (generación ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["hermano", "hermana", "hermano o hermana"]);
  if (up === 1) {
    const names: Three[] = [["", "", ""], ["", "", ""], ["sobrino", "sobrina", "sobrino o sobrina"], ["sobrino nieto", "sobrina nieta", "sobrino nieto o sobrina nieta"], ["sobrino bisnieto", "sobrina bisnieta", "sobrino bisnieto o sobrina bisnieta"]];
    return down < names.length ? pick(sex, names[down]) : "descendiente de un hermano";
  }
  if (down === 1) {
    const names: Three[] = [["", "", ""], ["", "", ""], ["tío", "tía", "tío o tía"], ["tío abuelo", "tía abuela", "tío abuelo o tía abuela"], ["tío bisabuelo", "tía bisabuela", "tío bisabuelo o tía bisabuela"]];
    return up < names.length ? pick(sex, names[up]) : pick(sex, ["hermano de un antepasado", "hermana de un antepasado", "hermano o hermana de un antepasado"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n < ES_COUSIN.length ? pick(sex, ES_COUSIN[n]) : pick(sex, ["primo lejano", "prima lejana", "primo o prima lejanos"]);
  return up === down ? base : `${base}, de una generación ${up > down ? "anterior" : "posterior"}`;
}

const es: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["esposo", "esposa", "cónyuge"]);
  switch (k.t) {
    case "self": return "la persona del centro";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["medio hermano", "media hermana", "medio hermano o media hermana"])}${pick(k.half, [" por parte de padre", " por parte de madre", ""])}`;
      return esBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["padrastro", "madrastra", "padrastro o madrastra"]);
      const of = pick(k.parent, ["del padre", "de la madre", "del progenitor"]);
      if (k.when === "unknown") return `${spouse(sex)} ${of}`;
      const ord = k.order < ES_ORD.length ? pick(sex, ES_ORD[k.order]) : `${k.order}.${sex === "F" ? "ª" : "º"}`;
      return `${ord} ${spouse(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["yerno", "nuera", "cónyuge del hijo o la hija"]);
    case "siblingInLaw": return pick(sex, ["cuñado", "cuñada", "cuñado o cuñada"]);
    case "stepGrandparent": return pick(sex, ["abuelastro", "abuelastra", "abuelastro o abuelastra"]);
    case "piblingByMarriage": return pick(sex, ["tío político", "tía política", "tío o tía político"]);
    case "kinSpouse": return `${spouse(sex)} de un familiar (${es(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["suegro", "suegra", "suegro o suegra"]);
    case "stepChild": return pick(sex, ["hijastro", "hijastra", "hijastro o hijastra"]);
    case "stepGrandchild": return pick(sex, ["nietastro", "nietastra", "nietastro o nietastra"]);
    case "spouseKin": return `${pick(sex, ["pariente político", "pariente política", "pariente político"])}: ${es(k.kin, sex)}, por parte ${pick(k.spouse, ["del esposo", "de la esposa", "del cónyuge"])}`;
  }
};

/* ───────────── Nederlands ───────────── */

const NL_ORD = ["", "eerste", "tweede", "derde", "vierde", "vijfde"];

function nlBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["vader", "moeder", "ouder"], ["grootvader", "grootmoeder", "grootouder"], ["overgrootvader", "overgrootmoeder", "overgrootouder"], ["betovergrootvader", "betovergrootmoeder", "betovergrootouder"]];
    if (up < names.length) return pick(sex, names[up]);
    return `voorouder (generatie ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["zoon", "dochter", "kind"], ["kleinzoon", "kleindochter", "kleinkind"], ["achterkleinzoon", "achterkleindochter", "achterkleinkind"], ["achterachterkleinzoon", "achterachterkleindochter", "achterachterkleinkind"]];
    if (down < names.length) return pick(sex, names[down]);
    return `nakomeling (generatie ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["broer", "zus", "broer of zus"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["neef", "nicht", "neef of nicht"]);
    if (down === 3) return pick(sex, ["achterneef", "achternicht", "achterneef of achternicht"]);
    return "nakomeling van een broer of zus";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["oom", "tante", "oom of tante"]);
    if (up === 3) return pick(sex, ["oudoom", "oudtante", "oudoom of oudtante"]);
    return pick(sex, ["broer van een voorouder", "zus van een voorouder", "broer of zus van een voorouder"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n === 1 ? pick(sex, ["volle neef", "volle nicht", "volle neef of nicht"]) : pick(sex, ["verre neef", "verre nicht", "verre neef of nicht"]);
  return up === down ? base : `${base}, uit een ${up > down ? "oudere" : "jongere"} generatie`;
}

const nl: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["echtgenoot", "echtgenote", "partner"]);
  const partner = (s: Sex) => pick(s, ["man", "vrouw", "partner"]);
  switch (k.t) {
    case "self": return "de persoon in het midden";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["halfbroer", "halfzus", "halfbroer of halfzus"])}${pick(k.half, [" van vaderskant", " van moederskant", ""])}`;
      return nlBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["stiefvader", "stiefmoeder", "stiefouder"]);
      const of = pick(k.parent, ["van de vader", "van de moeder", "van de ouder"]);
      return k.when === "before" ? `${NL_ORD[k.order] ?? `${k.order}e`} ${partner(sex)} ${of}` : `${partner(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["schoonzoon", "schoondochter", "schoonkind"]);
    case "siblingInLaw": return pick(sex, ["zwager", "schoonzus", "zwager of schoonzus"]);
    case "stepGrandparent": return pick(sex, ["stiefgrootvader", "stiefgrootmoeder", "stiefgrootouder"]);
    case "piblingByMarriage": return pick(sex, ["aangetrouwde oom", "aangetrouwde tante", "aangetrouwde oom of tante"]);
    case "kinSpouse": return `${partner(sex)} van een familielid (${nl(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["schoonvader", "schoonmoeder", "schoonouder"]);
    case "stepChild": return pick(sex, ["stiefzoon", "stiefdochter", "stiefkind"]);
    case "stepGrandchild": return pick(sex, ["stiefkleinzoon", "stiefkleindochter", "stiefkleinkind"]);
    case "spouseKin": return `aangetrouwde familie: ${nl(k.kin, sex)}, van de kant van ${pick(k.spouse, ["de man", "de vrouw", "de partner"])}`;
  }
};

/* ───────────── Deutsch ───────────── */

/** „Großvater”, „Urgroßvater”, „Ururgroßvater”: `n` de „ur” în față, cu majusculă doar la început. */
const ur = (n: number, word: string) => {
  const w = `${"ur".repeat(Math.max(0, n))}${word}`;
  return w[0].toUpperCase() + w.slice(1);
};

const DE_ORD: Three[] = [["", "", ""], ["erster", "erste", "erster"], ["zweiter", "zweite", "zweiter"], ["dritter", "dritte", "dritter"], ["vierter", "vierte", "vierter"], ["fünfter", "fünfte", "fünfter"]];

function deBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    if (up === 1) return pick(sex, ["Vater", "Mutter", "Elternteil"]);
    if (up <= 4) return ur(up - 2, pick(sex, ["großvater", "großmutter", "großelternteil"]));
    return `${pick(sex, ["Vorfahr", "Vorfahrin", "Vorfahr"])} (Generation ${up})`;
  }
  if (up === 0) {
    if (down === 1) return pick(sex, ["Sohn", "Tochter", "Kind"]);
    if (down <= 4) return ur(down - 2, pick(sex, ["enkel", "enkelin", "enkelkind"]));
    return `Nachkomme (Generation ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["Bruder", "Schwester", "Geschwister"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["Neffe", "Nichte", "Neffe oder Nichte"]);
    if (down <= 4) return ur(down - 3, pick(sex, ["großneffe", "großnichte", "großneffe oder -nichte"]));
    return "Nachkomme eines Geschwisters";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["Onkel", "Tante", "Onkel oder Tante"]);
    if (up <= 4) return ur(up - 3, pick(sex, ["großonkel", "großtante", "großonkel oder -tante"]));
    return pick(sex, ["Bruder eines Vorfahren", "Schwester eines Vorfahren", "Geschwister eines Vorfahren"]);
  }
  const n = Math.min(up, down) - 1;
  const who = pick(sex, ["Cousin", "Cousine", "Cousin oder Cousine"]);
  const base = n === 1 ? who : `${who} ${n}. Grades`;
  return up === down ? base : `${base}, aus einer ${up > down ? "älteren" : "jüngeren"} Generation`;
}

const de: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["Ehemann", "Ehefrau", "Ehepartner"]);
  switch (k.t) {
    case "self": return "die Person in der Mitte";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["Halbbruder", "Halbschwester", "Halbgeschwister"])}${pick(k.half, [" väterlicherseits", " mütterlicherseits", ""])}`;
      return deBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["Stiefvater", "Stiefmutter", "Stiefelternteil"]);
      const of = pick(k.parent, ["des Vaters", "der Mutter", "des Elternteils"]);
      if (k.when === "unknown") return `${spouse(sex)} ${of}`;
      const ord = k.order < DE_ORD.length ? pick(sex, DE_ORD[k.order]) : `${k.order}.`;
      return `${ord} ${spouse(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["Schwiegersohn", "Schwiegertochter", "Schwiegerkind"]);
    case "siblingInLaw": return pick(sex, ["Schwager", "Schwägerin", "Schwager oder Schwägerin"]);
    case "stepGrandparent": return pick(sex, ["Stiefgroßvater", "Stiefgroßmutter", "Stiefgroßelternteil"]);
    case "piblingByMarriage": return pick(sex, ["angeheirateter Onkel", "angeheiratete Tante", "angeheirateter Onkel oder angeheiratete Tante"]);
    case "kinSpouse": return `${spouse(sex)} eines Familienmitglieds (${de(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["Schwiegervater", "Schwiegermutter", "Schwiegerelternteil"]);
    case "stepChild": return pick(sex, ["Stiefsohn", "Stieftochter", "Stiefkind"]);
    case "stepGrandchild": return pick(sex, ["Stiefenkel", "Stiefenkelin", "Stiefenkelkind"]);
    case "spouseKin": return `angeheiratet: ${de(k.kin, sex)}, aus der Familie ${pick(k.spouse, ["des Ehemanns", "der Ehefrau", "des Ehepartners"])}`;
  }
};

/* ───────────── Italiano ───────────── */

const IT_ORD: Three[] = [["", "", ""], ["primo", "prima", "primo"], ["secondo", "seconda", "secondo"], ["terzo", "terza", "terzo"], ["quarto", "quarta", "quarto"], ["quinto", "quinta", "quinto"]];
const IT_GRADE = ["", "", "secondo", "terzo", "quarto", "quinto"];

function itBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["padre", "madre", "genitore"], ["nonno", "nonna", "nonno o nonna"], ["bisnonno", "bisnonna", "bisnonno o bisnonna"], ["trisnonno", "trisnonna", "trisnonno o trisnonna"]];
    if (up < names.length) return pick(sex, names[up]);
    return `${pick(sex, ["antenato", "antenata", "antenato"])} (generazione ${up})`;
  }
  if (up === 0) {
    if (down === 1) return pick(sex, ["figlio", "figlia", "figlio o figlia"]);
    if (down === 2) return "nipote";
    if (down === 3) return "pronipote";
    return `discendente (generazione ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["fratello", "sorella", "fratello o sorella"]);
  if (up === 1) {
    if (down === 2) return `nipote (${pick(sex, ["figlio", "figlia", "figlio o figlia"])} di fratello o sorella)`;
    if (down === 3) return "pronipote (da fratello o sorella)";
    return "discendente di fratello o sorella";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["zio", "zia", "zio o zia"]);
    if (up === 3) return pick(sex, ["prozio", "prozia", "prozio o prozia"]);
    return pick(sex, ["fratello di un antenato", "sorella di un antenato", "fratello o sorella di un antenato"]);
  }
  const n = Math.min(up, down) - 1;
  const who = pick(sex, ["cugino", "cugina", "cugino o cugina"]);
  const base = n === 1 ? who : IT_GRADE[n] ? `${who} di ${IT_GRADE[n]} grado` : pick(sex, ["cugino lontano", "cugina lontana", "cugino o cugina lontani"]);
  return up === down ? base : `${base}, di una generazione ${up > down ? "precedente" : "successiva"}`;
}

const it: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["marito", "moglie", "coniuge"]);
  switch (k.t) {
    case "self": return "la persona al centro";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["fratello", "sorella", "fratello o sorella"])} ${pick(k.half, ["per parte di padre", "per parte di madre", "per parte di un genitore"])}`;
      return itBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["patrigno", "matrigna", "patrigno o matrigna"]);
      const of = pick(k.parent, ["del padre", "della madre", "del genitore"]);
      if (k.when === "unknown") return `${spouse(sex)} ${of}`;
      const ord = k.order < IT_ORD.length ? pick(sex, IT_ORD[k.order]) : `${k.order}${sex === "F" ? "ª" : "°"}`;
      return `${ord} ${spouse(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["genero", "nuora", "coniuge del figlio o della figlia"]);
    case "siblingInLaw": return pick(sex, ["cognato", "cognata", "cognato o cognata"]);
    case "stepGrandparent": return pick(sex, ["nonno acquisito", "nonna acquisita", "nonno o nonna acquisiti"]);
    case "piblingByMarriage": return pick(sex, ["zio acquisito", "zia acquisita", "zio o zia acquisiti"]);
    case "kinSpouse": return `${spouse(sex)} di un familiare (${it(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["suocero", "suocera", "suocero o suocera"]);
    case "stepChild": return pick(sex, ["figliastro", "figliastra", "figliastro o figliastra"]);
    case "stepGrandchild": return pick(sex, ["nipote acquisito", "nipote acquisita", "nipote acquisito"]);
    case "spouseKin": return `${pick(sex, ["parente acquisito", "parente acquisita", "parente acquisito"])}: ${it(k.kin, sex)}, dalla parte ${pick(k.spouse, ["del marito", "della moglie", "del coniuge"])}`;
  }
};

/* ───────────── Magyar ───────────── */

const HU_ORD = ["", "első", "második", "harmadik", "negyedik", "ötödik"];
const HU_COUSIN = ["", "unokatestvér", "másodunokatestvér", "harmadunokatestvér", "negyedunokatestvér"];

function huBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["apa", "anya", "szülő"], ["nagyapa", "nagyanya", "nagyszülő"], ["dédapa", "dédanya", "dédszülő"], ["ükapa", "ükanya", "ükszülő"]];
    if (up < names.length) return pick(sex, names[up]);
    return `ős (${up}. nemzedék)`;
  }
  if (up === 0) {
    if (down === 1) return pick(sex, ["fiú", "lány", "gyermek"]);
    const names = ["", "", "unoka", "dédunoka", "ükunoka"];
    return down < names.length ? names[down] : `leszármazott (${down}. nemzedék)`;
  }
  if (up === 1 && down === 1) return pick(sex, ["fiútestvér", "lánytestvér", "testvér"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["unokaöcs", "unokahúg", "unokaöcs vagy unokahúg"]);
    return down === 3 ? "testvér unokája" : "testvér leszármazottja";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["nagybácsi", "nagynéni", "nagybácsi vagy nagynéni"]);
    return up === 3 ? "nagyszülő testvére" : "egy ős testvére";
  }
  const n = Math.min(up, down) - 1;
  const base = HU_COUSIN[n] ?? "távoli unokatestvér";
  return up === down ? base : `${base}, egy ${up > down ? "idősebb" : "fiatalabb"} nemzedékből`;
}

const hu: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["férj", "feleség", "házastárs"]);
  const spouseOf = (s: Sex) => pick(s, ["férje", "felesége", "házastársa"]);
  switch (k.t) {
    case "self": return "a középen álló személy";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(k.half, ["apai ", "anyai ", ""])}féltestvér`;
      return huBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["mostohaapa", "mostohaanya", "mostohaszülő"]);
      const of = pick(k.parent, ["az apa", "az anya", "a szülő"]);
      return k.when === "before" ? `${of} ${HU_ORD[k.order] ?? `${k.order}.`} ${spouseOf(sex)}` : `${of} ${spouseOf(sex)}`;
    }
    case "childSpouse": return pick(sex, ["vő", "meny", "a gyermek házastársa"]);
    case "siblingInLaw": return pick(sex, ["sógor", "sógornő", "sógor vagy sógornő"]);
    case "stepGrandparent": return pick(sex, ["mostohanagyapa", "mostohanagyanya", "mostohanagyszülő"]);
    case "piblingByMarriage": return `${pick(sex, ["nagybácsi", "nagynéni", "nagybácsi vagy nagynéni"])} (házasság révén)`;
    case "kinSpouse": return `egy rokon ${spouseOf(sex)} (${hu(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["após", "anyós", "após vagy anyós"]);
    case "stepChild": return pick(sex, ["mostohafiú", "mostohalány", "mostohagyermek"]);
    case "stepGrandchild": return "mostohaunoka";
    case "spouseKin": return `házasság révén rokon: ${hu(k.kin, sex)}, ${pick(k.spouse, ["a férj", "a feleség", "a házastárs"])} családjából`;
  }
};

/** Gradul în cifre romane, ca în actele de succesiune: 4 → „IV”. */
export function romanDegree(n: number) {
  const r: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of r) while (n >= v) { out += s; n -= v; }
  return out;
}

const WORDS: Record<Locale, Words> = { ro, "en-GB": en("centre"), "en-US": en("center"), fr, es, nl, de, it, hu };

/** Numele rudeniei în limba cerută: kinLabel(k.term, k.sex, "de") → „Cousine”. */
export function kinLabel(term: KinTerm, sex: Sex, locale: Locale): string {
  return WORDS[locale](term, sex);
}

/**
 * Gradul de rudenie scris cum se spune în fiecare limbă: „IV” (gradul IV, ca în actele românești și italiene), “4th”,
 * « 4e », „4.º”, „4.”. Se pune în texte ca {degree}: „rudă de gradul IV”, “4th-degree relative”.
 */
export function degreeWord(n: number, locale: Locale): string {
  switch (locale) {
    case "ro": case "it": return romanDegree(n);
    case "en-GB": case "en-US": {
      const tens = n % 100;
      return `${n}${tens >= 11 && tens <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
    }
    case "fr": return n === 1 ? "1er" : `${n}e`;
    case "es": return `${n}.º`;
    case "nl": return `${n}e`;
    case "de": case "hu": return `${n}.`;
  }
}
