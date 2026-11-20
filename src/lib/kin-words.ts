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

/* ───────────── עברית ───────────── */

/** Numerale ordinale în ebraică, bărbătești și femeiești: „ראשון”, „שנייה”… */
const HE_ORD_M = ["", "ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
const HE_ORD_F = ["", "ראשונה", "שנייה", "שלישית", "רביעית", "חמישית", "שישית"];
const heOrd = (n: number, sex: Sex) => (sex === "F" ? HE_ORD_F : HE_ORD_M)[n] ?? `${n}`;

function heBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["אב", "אם", "הורה"], ["סבא", "סבתא", "סבא או סבתא"], ["סבא רבא", "סבתא רבתא", "סבא רבא או סבתא רבתא"], ["אבי סבא רבא", "אם סבתא רבתא", "הורה של סבא רבא"]];
    if (up < names.length) return pick(sex, names[up]);
    return `${pick(sex, ["אב קדמון", "אם קדמונית", "אב קדמון"])} (דור ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["בן", "בת", "ילד"], ["נכד", "נכדה", "נכד או נכדה"], ["נין", "נינה", "נין או נינה"], ["חימש", "חימשה", "חימש או חימשה"]];
    if (down < names.length) return pick(sex, names[down]);
    return `${pick(sex, ["צאצא", "צאצאית", "צאצא"])} (דור ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["אח", "אחות", "אח או אחות"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["אחיין", "אחיינית", "אחיין או אחיינית"]);
    return down === 3 ? pick(sex, ["נכד של אח או אחות", "נכדה של אח או אחות", "נכד של אח או אחות"]) : "צאצא של אח או אחות";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["דוד", "דודה", "דוד או דודה"]);
    if (up === 3) return pick(sex, ["אח של סבא או סבתא", "אחות של סבא או סבתא", "אח או אחות של סבא או סבתא"]);
    return pick(sex, ["אח של אב קדמון", "אחות של אב קדמון", "אח או אחות של אב קדמון"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n === 1 ? pick(sex, ["בן דוד", "בת דודה", "בן או בת דודים"]) : `${pick(sex, ["בן דוד", "בת דודה", "בן או בת דודים"])} ${heOrd(n, sex === "F" ? "F" : "M")}`;
  return up === down ? base : `${base}, מדור ${up > down ? "מבוגר" : "צעיר"} יותר`;
}

const he: Words = (k, sex) => {
  const partner = (s: Sex) => pick(s, ["בן הזוג", "בת הזוג", "בן או בת הזוג"]);
  switch (k.t) {
    case "self": return "האדם שבמרכז";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["אח למחצה", "אחות למחצה", "אח או אחות למחצה"])}${pick(k.half, [" מצד האב", " מצד האם", ""])}`;
      return heBlood(k.up, k.down, sex);
    case "spouse": return pick(sex, ["בעל", "אישה", "בן או בת זוג"]);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["אב חורג", "אם חורגת", "הורה חורג"]);
      const of = pick(k.parent, ["האב", "האם", "ההורה"]);
      return k.when === "before" ? `${partner(sex)} ה${heOrd(k.order, sex === "F" ? "F" : "M")} של ${of}` : `${partner(sex)} של ${of}`;
    }
    case "childSpouse": return pick(sex, ["חתן", "כלה", "בן או בת הזוג של הילד"]);
    case "siblingInLaw": return pick(sex, ["גיס", "גיסה", "גיס או גיסה"]);
    case "stepGrandparent": return pick(sex, ["סבא חורג", "סבתא חורגת", "סבא או סבתא חורגים"]);
    case "piblingByMarriage": return `${pick(sex, ["דוד", "דודה", "דוד או דודה"])} מנישואין`;
    case "kinSpouse": return `${partner(sex)} של קרוב משפחה (${he(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["חותן או חם", "חותנת או חמות", "הורה של בן או בת הזוג"]);
    case "stepChild": return pick(sex, ["בן חורג", "בת חורגת", "ילד חורג"]);
    case "stepGrandchild": return pick(sex, ["נכד חורג", "נכדה חורגת", "נכד חורג"]);
    case "spouseKin": return `קרבה מנישואין: ${he(k.kin, sex)}, מצד ${pick(k.spouse, ["הבעל", "האישה", "בן או בת הזוג"])}`;
  }
};

/* ───────────── Português (Portugal) ───────────── */

const PT_ORD: Three[] = [["", "", ""], ["primeiro", "primeira", "primeiro"], ["segundo", "segunda", "segundo"], ["terceiro", "terceira", "terceiro"], ["quarto", "quarta", "quarto"], ["quinto", "quinta", "quinto"]];

function ptBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["pai", "mãe", "progenitor"], ["avô", "avó", "avô ou avó"], ["bisavô", "bisavó", "bisavô ou bisavó"], ["trisavô", "trisavó", "trisavô ou trisavó"]];
    if (up < names.length) return pick(sex, names[up]);
    return `antepassado (geração ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["filho", "filha", "filho ou filha"], ["neto", "neta", "neto ou neta"], ["bisneto", "bisneta", "bisneto ou bisneta"], ["trineto", "trineta", "trineto ou trineta"]];
    if (down < names.length) return pick(sex, names[down]);
    return `descendente (geração ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["irmão", "irmã", "irmão ou irmã"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["sobrinho", "sobrinha", "sobrinho ou sobrinha"]);
    if (down === 3) return pick(sex, ["sobrinho-neto", "sobrinha-neta", "sobrinho-neto ou sobrinha-neta"]);
    return "descendente de um irmão ou irmã";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["tio", "tia", "tio ou tia"]);
    if (up === 3) return pick(sex, ["tio-avô", "tia-avó", "tio-avô ou tia-avó"]);
    return pick(sex, ["irmão de um antepassado", "irmã de um antepassado", "irmão ou irmã de um antepassado"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n === 1 ? pick(sex, ["primo direito", "prima direita", "primo ou prima direitos"])
    : n < PT_ORD.length ? `${pick(sex, ["primo", "prima", "primo ou prima"])} em ${PT_ORD[n][0]} grau` : pick(sex, ["primo afastado", "prima afastada", "primo ou prima afastados"]);
  return up === down ? base : `${base}, de uma geração ${up > down ? "anterior" : "seguinte"}`;
}

const pt: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["marido", "mulher", "cônjuge"]);
  switch (k.t) {
    case "self": return "a pessoa ao centro";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["meio-irmão", "meia-irmã", "meio-irmão ou meia-irmã"])} ${pick(k.half, ["por parte do pai", "por parte da mãe", "por parte de um dos pais"])}`;
      return ptBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["padrasto", "madrasta", "padrasto ou madrasta"]);
      const of = pick(k.parent, ["do pai", "da mãe", "de um dos pais"]);
      if (k.when === "unknown") return `${spouse(sex)} ${of}`;
      const ord = k.order < PT_ORD.length ? pick(sex, PT_ORD[k.order]) : `${k.order}.${sex === "F" ? "ª" : "º"}`;
      return `${ord} ${spouse(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["genro", "nora", "cônjuge do filho ou da filha"]);
    case "siblingInLaw": return pick(sex, ["cunhado", "cunhada", "cunhado ou cunhada"]);
    case "stepGrandparent": return pick(sex, ["avô por afinidade", "avó por afinidade", "avô ou avó por afinidade"]);
    case "piblingByMarriage": return pick(sex, ["tio por afinidade", "tia por afinidade", "tio ou tia por afinidade"]);
    case "kinSpouse": return `${spouse(sex)} de um familiar (${pt(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["sogro", "sogra", "sogro ou sogra"]);
    case "stepChild": return pick(sex, ["enteado", "enteada", "enteado ou enteada"]);
    case "stepGrandchild": return pick(sex, ["neto por afinidade", "neta por afinidade", "neto ou neta por afinidade"]);
    case "spouseKin": return `familiar por afinidade: ${pt(k.kin, sex)}, do lado ${pick(k.spouse, ["do marido", "da mulher", "do cônjuge"])}`;
  }
};

/* ───────────── Ελληνικά ───────────── */

const EL_ORD: Three[] = [["", "", ""], ["πρώτος", "πρώτη", "πρώτος"], ["δεύτερος", "δεύτερη", "δεύτερος"], ["τρίτος", "τρίτη", "τρίτος"], ["τέταρτος", "τέταρτη", "τέταρτος"], ["πέμπτος", "πέμπτη", "πέμπτος"]];

function elBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["πατέρας", "μητέρα", "γονέας"], ["παππούς", "γιαγιά", "παππούς ή γιαγιά"], ["προπάππους", "προγιαγιά", "προπάππους ή προγιαγιά"], ["προπροπάππους", "προπρογιαγιά", "προπροπάππους ή προπρογιαγιά"]];
    if (up < names.length) return pick(sex, names[up]);
    return `πρόγονος (γενιά ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["γιος", "κόρη", "παιδί"], ["εγγονός", "εγγονή", "εγγόνι"], ["δισέγγονος", "δισέγγονη", "δισέγγονο"], ["τρισέγγονος", "τρισέγγονη", "τρισέγγονο"]];
    if (down < names.length) return pick(sex, names[down]);
    return `απόγονος (γενιά ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["αδελφός", "αδελφή", "αδελφός ή αδελφή"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["ανιψιός", "ανιψιά", "ανιψιός ή ανιψιά"]);
    if (down === 3) return pick(sex, ["εγγονός αδελφού ή αδελφής", "εγγονή αδελφού ή αδελφής", "εγγόνι αδελφού ή αδελφής"]);
    return "απόγονος αδελφού ή αδελφής";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["θείος", "θεία", "θείος ή θεία"]);
    if (up === 3) return pick(sex, ["αδελφός του παππού ή της γιαγιάς", "αδελφή του παππού ή της γιαγιάς", "αδελφός ή αδελφή του παππού ή της γιαγιάς"]);
    return pick(sex, ["αδελφός ενός προγόνου", "αδελφή ενός προγόνου", "αδελφός ή αδελφή ενός προγόνου"]);
  }
  const n = Math.min(up, down) - 1;
  const cousin = pick(sex, ["ξάδελφος", "ξαδέλφη", "ξάδελφος ή ξαδέλφη"]);
  const base = n === 1 ? cousin : n < EL_ORD.length ? `${pick(sex, EL_ORD[n])} ${cousin}` : pick(sex, ["μακρινός ξάδελφος", "μακρινή ξαδέλφη", "μακρινός ξάδελφος ή ξαδέλφη"]);
  return up === down ? base : `${base}, από ${up > down ? "παλαιότερη" : "νεότερη"} γενιά`;
}

const el: Words = (k, sex) => {
  switch (k.t) {
    case "self": return "το πρόσωπο στο κέντρο";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["ετεροθαλής αδελφός", "ετεροθαλής αδελφή", "ετεροθαλής αδελφός ή αδελφή"])} ${pick(k.half, ["από τον πατέρα", "από τη μητέρα", "από έναν γονέα"])}`;
      return elBlood(k.up, k.down, sex);
    case "spouse": return "σύζυγος";
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["πατριός", "μητριά", "πατριός ή μητριά"]);
      const of = pick(k.parent, ["του πατέρα", "της μητέρας", "του γονέα"]);
      if (k.when === "unknown") return `σύζυγος ${of}`;
      const ord = k.order < EL_ORD.length ? pick(sex, EL_ORD[k.order]) : `${k.order}${sex === "F" ? "η" : "ος"}`;
      return `${ord} σύζυγος ${of}`;
    }
    case "childSpouse": return pick(sex, ["γαμπρός", "νύφη", "σύζυγος του παιδιού"]);
    case "siblingInLaw": return pick(sex, ["κουνιάδος", "κουνιάδα", "κουνιάδος ή κουνιάδα"]);
    case "stepGrandparent": return pick(sex, ["παππούς εξ αγχιστείας", "γιαγιά εξ αγχιστείας", "παππούς ή γιαγιά εξ αγχιστείας"]);
    case "piblingByMarriage": return pick(sex, ["θείος εξ αγχιστείας", "θεία εξ αγχιστείας", "θείος ή θεία εξ αγχιστείας"]);
    case "kinSpouse": return `σύζυγος συγγενούς (${el(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["πεθερός", "πεθερά", "πεθερός ή πεθερά"]);
    case "stepChild": return pick(sex, ["προγονός", "προγονή", "προγονός ή προγονή"]);
    case "stepGrandchild": return pick(sex, ["εγγονός εξ αγχιστείας", "εγγονή εξ αγχιστείας", "εγγόνι εξ αγχιστείας"]);
    case "spouseKin": return `συγγενής εξ αγχιστείας: ${el(k.kin, sex)}, από την πλευρά ${pick(k.spouse, ["του συζύγου", "της συζύγου", "του ή της συζύγου"])}`;
  }
};

/* ───────────── Svenska ───────────── */

const SV_ORD = ["", "första", "andra", "tredje", "fjärde", "femte", "sjätte"];
const SV_COUSIN = ["", "kusin", "tremänning", "fyrmänning", "femmänning"];

function svBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["far", "mor", "förälder"], ["farfar eller morfar", "farmor eller mormor", "mor- eller farförälder"], ["gammelfarfar eller gammelmorfar", "gammelfarmor eller gammelmormor", "gammelmor- eller gammelfarförälder"]];
    if (up < names.length) return pick(sex, names[up]);
    return `ana (generation ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["son", "dotter", "barn"], ["barnbarn", "barnbarn", "barnbarn"], ["barnbarnsbarn", "barnbarnsbarn", "barnbarnsbarn"], ["barnbarnsbarnsbarn", "barnbarnsbarnsbarn", "barnbarnsbarnsbarn"]];
    if (down < names.length) return pick(sex, names[down]);
    return `ättling (generation ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["bror", "syster", "syskon"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["brorson eller systerson", "brorsdotter eller systerdotter", "syskonbarn"]);
    if (down === 3) return "syskonbarnbarn";
    return "ättling till ett syskon";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["farbror eller morbror", "faster eller moster", "föräldrasyskon"]);
    if (up === 3) return pick(sex, ["mor- eller farförälders bror", "mor- eller farförälders syster", "mor- eller farförälders syskon"]);
    return pick(sex, ["bror till en ana", "syster till en ana", "syskon till en ana"]);
  }
  const n = Math.min(up, down) - 1;
  const base = SV_COUSIN[n] ?? "avlägsen kusin";
  return up === down ? base : `${base}, från en ${up > down ? "äldre" : "yngre"} generation`;
}

const sv: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["make", "maka", "make eller maka"]);
  switch (k.t) {
    case "self": return "personen i mitten";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["halvbror", "halvsyster", "halvsyskon"])} ${pick(k.half, ["på faderns sida", "på moderns sida", "genom en förälder"])}`;
      return svBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["styvfar", "styvmor", "styvförälder"]);
      const of = pick(k.parent, ["faderns", "moderns", "förälderns"]);
      return k.when === "before" ? `${of} ${SV_ORD[k.order] ?? `${k.order}:e`} ${spouse(sex)}` : `${of} ${spouse(sex)}`;
    }
    case "childSpouse": return pick(sex, ["svärson", "svärdotter", "barnets make eller maka"]);
    case "siblingInLaw": return pick(sex, ["svåger", "svägerska", "svåger eller svägerska"]);
    case "stepGrandparent": return pick(sex, ["styvfarfar eller styvmorfar", "styvfarmor eller styvmormor", "styvmor- eller styvfarförälder"]);
    case "piblingByMarriage": return pick(sex, ["ingift farbror eller morbror", "ingift faster eller moster", "ingift föräldrasyskon"]);
    case "kinSpouse": return `${spouse(sex)} till en släkting (${sv(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["svärfar", "svärmor", "svärförälder"]);
    case "stepChild": return pick(sex, ["styvson", "styvdotter", "styvbarn"]);
    case "stepGrandchild": return "styvbarnbarn";
    case "spouseKin": return `ingift släkt: ${sv(k.kin, sex)}, på ${pick(k.spouse, ["makens", "makans", "makens eller makans"])} sida`;
  }
};

/* ───────────── Dansk ───────────── */

const DA_ORD = ["", "første", "anden", "tredje", "fjerde", "femte", "sjette"];

function daBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["far", "mor", "forælder"], ["bedstefar", "bedstemor", "bedsteforælder"], ["oldefar", "oldemor", "oldeforælder"], ["tipoldefar", "tipoldemor", "tipoldeforælder"]];
    if (up < names.length) return pick(sex, names[up]);
    return `ane (generation ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["søn", "datter", "barn"], ["barnebarn", "barnebarn", "barnebarn"], ["oldebarn", "oldebarn", "oldebarn"], ["tipoldebarn", "tipoldebarn", "tipoldebarn"]];
    if (down < names.length) return pick(sex, names[down]);
    return `efterkommer (generation ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["bror", "søster", "søskende"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["nevø", "niece", "nevø eller niece"]);
    if (down === 3) return pick(sex, ["grandnevø", "grandniece", "grandnevø eller grandniece"]);
    return "efterkommer af en søskende";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["onkel", "tante", "onkel eller tante"]);
    if (up === 3) return pick(sex, ["grandonkel", "grandtante", "grandonkel eller grandtante"]);
    return pick(sex, ["bror til en ane", "søster til en ane", "søskende til en ane"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n === 1 ? pick(sex, ["fætter", "kusine", "fætter eller kusine"]) : n === 2 ? "næstsøskendebarn" : pick(sex, ["fjern fætter", "fjern kusine", "fjern fætter eller kusine"]);
  return up === down ? base : `${base}, fra en ${up > down ? "ældre" : "yngre"} generation`;
}

const da: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["ægtemand", "hustru", "ægtefælle"]);
  switch (k.t) {
    case "self": return "personen i midten";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["halvbror", "halvsøster", "halvsøskende"])} ${pick(k.half, ["på farens side", "på morens side", "gennem en forælder"])}`;
      return daBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["stedfar", "stedmor", "stedforælder"]);
      const of = pick(k.parent, ["farens", "morens", "forælderens"]);
      return k.when === "before" ? `${of} ${DA_ORD[k.order] ?? `${k.order}.`} ${spouse(sex)}` : `${of} ${spouse(sex)}`;
    }
    case "childSpouse": return pick(sex, ["svigersøn", "svigerdatter", "barnets ægtefælle"]);
    case "siblingInLaw": return pick(sex, ["svoger", "svigerinde", "svoger eller svigerinde"]);
    case "stepGrandparent": return pick(sex, ["stedbedstefar", "stedbedstemor", "stedbedsteforælder"]);
    case "piblingByMarriage": return pick(sex, ["indgiftet onkel", "indgiftet tante", "indgiftet onkel eller tante"]);
    case "kinSpouse": return `${spouse(sex)} til en slægtning (${da(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["svigerfar", "svigermor", "svigerforælder"]);
    case "stepChild": return pick(sex, ["stedsøn", "steddatter", "stedbarn"]);
    case "stepGrandchild": return "stedbarnebarn";
    case "spouseKin": return `indgiftet familie: ${da(k.kin, sex)}, på ${pick(k.spouse, ["mandens", "hustruens", "ægtefællens"])} side`;
  }
};

/* ───────────── Norsk (bokmål) ───────────── */

const NB_ORD = ["", "første", "andre", "tredje", "fjerde", "femte", "sjette"];
const NB_COUSIN = ["", "", "tremenning", "firmenning", "femmenning"];

function nbBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["far", "mor", "forelder"], ["bestefar", "bestemor", "besteforelder"], ["oldefar", "oldemor", "oldeforelder"], ["tippoldefar", "tippoldemor", "tippoldeforelder"]];
    if (up < names.length) return pick(sex, names[up]);
    return `ane (generasjon ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["sønn", "datter", "barn"], ["barnebarn", "barnebarn", "barnebarn"], ["oldebarn", "oldebarn", "oldebarn"], ["tippoldebarn", "tippoldebarn", "tippoldebarn"]];
    if (down < names.length) return pick(sex, names[down]);
    return `etterkommer (generasjon ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["bror", "søster", "søsken"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["nevø", "niese", "nevø eller niese"]);
    if (down === 3) return pick(sex, ["grandnevø", "grandniese", "grandnevø eller grandniese"]);
    return "etterkommer av et søsken";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["onkel", "tante", "onkel eller tante"]);
    if (up === 3) return pick(sex, ["grandonkel", "grandtante", "grandonkel eller grandtante"]);
    return pick(sex, ["bror til en ane", "søster til en ane", "søsken til en ane"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n === 1 ? pick(sex, ["fetter", "kusine", "fetter eller kusine"]) : NB_COUSIN[n] || "fjern slektning";
  return up === down ? base : `${base}, fra en ${up > down ? "eldre" : "yngre"} generasjon`;
}

const nb: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["ektemann", "kone", "ektefelle"]);
  switch (k.t) {
    case "self": return "personen i midten";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["halvbror", "halvsøster", "halvsøsken"])} ${pick(k.half, ["på farssiden", "på morssiden", "gjennom en forelder"])}`;
      return nbBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["stefar", "stemor", "steforelder"]);
      const of = pick(k.parent, ["farens", "morens", "forelderens"]);
      return k.when === "before" ? `${of} ${NB_ORD[k.order] ?? `${k.order}.`} ${spouse(sex)}` : `${of} ${spouse(sex)}`;
    }
    case "childSpouse": return pick(sex, ["svigersønn", "svigerdatter", "barnets ektefelle"]);
    case "siblingInLaw": return pick(sex, ["svoger", "svigerinne", "svoger eller svigerinne"]);
    case "stepGrandparent": return pick(sex, ["stebestefar", "stebestemor", "stebesteforelder"]);
    case "piblingByMarriage": return pick(sex, ["inngiftet onkel", "inngiftet tante", "inngiftet onkel eller tante"]);
    case "kinSpouse": return `${spouse(sex)} til en slektning (${nb(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["svigerfar", "svigermor", "svigerforelder"]);
    case "stepChild": return pick(sex, ["stesønn", "stedatter", "stebarn"]);
    case "stepGrandchild": return "stebarnebarn";
    case "spouseKin": return `inngiftet slekt: ${nb(k.kin, sex)}, på ${pick(k.spouse, ["mannens", "konas", "ektefellens"])} side`;
  }
};

/* ───────────── Українська ───────────── */

const UK_ORD: Three[] = [["", "", ""], ["перший", "перша", "перший"], ["другий", "друга", "другий"], ["третій", "третя", "третій"], ["четвертий", "четверта", "четвертий"], ["п’ятий", "п’ята", "п’ятий"]];
const UK_COUSIN: Three[] = [["", "", ""], ["двоюрідний брат", "двоюрідна сестра", "двоюрідний брат або сестра"], ["троюрідний брат", "троюрідна сестра", "троюрідний брат або сестра"], ["четвероюрідний брат", "четвероюрідна сестра", "четвероюрідний брат або сестра"]];

function ukBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["батько", "мати", "один із батьків"], ["дідусь", "бабуся", "дідусь або бабуся"], ["прадід", "прабаба", "прадід або прабаба"], ["прапрадід", "прапрабаба", "прапрадід або прапрабаба"]];
    if (up < names.length) return pick(sex, names[up]);
    return `предок (покоління ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["син", "донька", "дитина"], ["онук", "онука", "онук або онука"], ["правнук", "правнучка", "правнук або правнучка"], ["праправнук", "праправнучка", "праправнук або праправнучка"]];
    if (down < names.length) return pick(sex, names[down]);
    return `нащадок (покоління ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["брат", "сестра", "брат або сестра"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["племінник", "племінниця", "племінник або племінниця"]);
    if (down === 3) return pick(sex, ["внучатий племінник", "внучата племінниця", "внучатий племінник або племінниця"]);
    return "нащадок брата або сестри";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["дядько", "тітка", "дядько або тітка"]);
    if (up === 3) return pick(sex, ["двоюрідний дід", "двоюрідна баба", "двоюрідний дід або баба"]);
    return pick(sex, ["брат одного з предків", "сестра одного з предків", "брат або сестра одного з предків"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n < UK_COUSIN.length ? pick(sex, UK_COUSIN[n]) : pick(sex, ["далекий родич", "далека родичка", "далекий родич"]);
  return up === down ? base : `${base}, зі ${up > down ? "старшого" : "молодшого"} покоління`;
}

const uk: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["чоловік", "дружина", "чоловік або дружина"]);
  switch (k.t) {
    case "self": return "людина в центрі";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) {
        if (k.half === "U") return `${pick(sex, ["брат", "сестра", "брат або сестра"])} по одному з батьків`;
        const word = k.half === "M" ? "єдинокровн" : "єдиноутробн";
        return pick(sex, [`${word}ий брат`, `${word}а сестра`, `${word}ий брат або сестра`]);
      }
      return ukBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["вітчим", "мачуха", "вітчим або мачуха"]);
      const of = pick(k.parent, ["батька", "матері", "одного з батьків"]);
      if (k.when === "unknown") return `${spouse(sex)} ${of}`;
      const ord = k.order < UK_ORD.length ? pick(sex, UK_ORD[k.order]) : `${k.order}-${sex === "F" ? "а" : "й"}`;
      return `${ord} ${spouse(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["зять", "невістка", "чоловік або дружина дитини"]);
    case "siblingInLaw": return pick(sex, ["свояк", "своячка", "свояк або своячка"]);
    case "stepGrandparent": return pick(sex, ["нерідний дідусь", "нерідна бабуся", "нерідний дідусь або бабуся"]);
    case "piblingByMarriage": return pick(sex, ["дядько за шлюбом", "тітка за шлюбом", "дядько або тітка за шлюбом"]);
    case "kinSpouse": return `${spouse(sex)} родича (${uk(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["свекор або тесть", "свекруха або теща", "батько або мати чоловіка чи дружини"]);
    case "stepChild": return pick(sex, ["пасинок", "падчерка", "пасинок або падчерка"]);
    case "stepGrandchild": return pick(sex, ["нерідний онук", "нерідна онука", "нерідний онук або онука"]);
    case "spouseKin": return `${pick(sex, ["родич", "родичка", "родич"])} за шлюбом: ${uk(k.kin, sex)}, з боку ${pick(k.spouse, ["чоловіка", "дружини", "чоловіка або дружини"])}`;
  }
};

/* ───────────── Srpski (latinica) ───────────── */

const SR_ORD: Three[] = [["", "", ""], ["prvi", "prva", "prvi"], ["drugi", "druga", "drugi"], ["treći", "treća", "treći"], ["četvrti", "četvrta", "četvrti"], ["peti", "peta", "peti"]];

function srBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["otac", "majka", "roditelj"], ["deda", "baba", "deda ili baba"], ["pradeda", "prababa", "pradeda ili prababa"], ["čukundeda", "čukunbaba", "čukundeda ili čukunbaba"]];
    if (up < names.length) return pick(sex, names[up]);
    return `predak (${up}. kolena)`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["sin", "ćerka", "dete"], ["unuk", "unuka", "unuk ili unuka"], ["praunuk", "praunuka", "praunuk ili praunuka"], ["čukununuk", "čukununuka", "čukununuk ili čukununuka"]];
    if (down < names.length) return pick(sex, names[down]);
    return `potomak (${down}. kolena)`;
  }
  if (up === 1 && down === 1) return pick(sex, ["brat", "sestra", "brat ili sestra"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["sestrić ili bratanac", "sestričina ili bratanica", "dete brata ili sestre"]);
    if (down === 3) return pick(sex, ["unuk brata ili sestre", "unuka brata ili sestre", "unuče brata ili sestre"]);
    return "potomak brata ili sestre";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["stric, ujak ili teča", "tetka ili strina", "brat ili sestra roditelja"]);
    if (up === 3) return pick(sex, ["brat dede ili babe", "sestra dede ili babe", "brat ili sestra dede ili babe"]);
    return pick(sex, ["brat jednog pretka", "sestra jednog pretka", "brat ili sestra jednog pretka"]);
  }
  const n = Math.min(up, down) - 1;
  const base = n === 1 ? pick(sex, ["brat od strica ili tetke", "sestra od strica ili tetke", "brat ili sestra od strica ili tetke"])
    : n < SR_ORD.length ? `${pick(sex, ["rođak", "rođaka", "rođak"])} u ${n + 1}. kolenu` : pick(sex, ["daljni rođak", "daljna rođaka", "daljni rođak"]);
  return up === down ? base : `${base}, iz ${up > down ? "starije" : "mlađe"} generacije`;
}

const sr: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["muž", "žena", "supružnik"]);
  switch (k.t) {
    case "self": return "osoba u sredini";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["polubrat", "polusestra", "polubrat ili polusestra"])} ${pick(k.half, ["po ocu", "po majci", "po jednom roditelju"])}`;
      return srBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["očuh", "maćeha", "očuh ili maćeha"]);
      const of = pick(k.parent, ["oca", "majke", "roditelja"]);
      if (k.when === "unknown") return `${spouse(sex)} ${of}`;
      const ord = k.order < SR_ORD.length ? pick(sex, SR_ORD[k.order]) : `${k.order}.`;
      return `${ord} ${spouse(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["zet", "snaja", "supružnik deteta"]);
    case "siblingInLaw": return pick(sex, ["dever, šurak ili zet", "zaova, svastika ili snaja", "srodnik po braku"]);
    case "stepGrandparent": return pick(sex, ["deda po braku", "baba po braku", "deda ili baba po braku"]);
    case "piblingByMarriage": return pick(sex, ["teča ili tetak", "strina ili ujna", "tetak ili strina po braku"]);
    case "kinSpouse": return `${spouse(sex)} rođaka (${sr(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["svekar ili tast", "svekrva ili tašta", "roditelj supružnika"]);
    case "stepChild": return pick(sex, ["pastorak", "pastorka", "pastorak ili pastorka"]);
    case "stepGrandchild": return pick(sex, ["unuk po braku", "unuka po braku", "unuče po braku"]);
    case "spouseKin": return `${pick(sex, ["srodnik", "srodnica", "srodnik"])} po braku: ${sr(k.kin, sex)}, sa strane ${pick(k.spouse, ["muža", "žene", "supružnika"])}`;
  }
};

/* ───────────── Български ───────────── */

const BG_ORD: Three[] = [["", "", ""], ["първи", "първа", "първи"], ["втори", "втора", "втори"], ["трети", "трета", "трети"], ["четвърти", "четвърта", "четвърти"], ["пети", "пета", "пети"]];

function bgBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["баща", "майка", "родител"], ["дядо", "баба", "дядо или баба"], ["прадядо", "прабаба", "прадядо или прабаба"], ["прапрадядо", "прапрабаба", "прапрадядо или прапрабаба"]];
    if (up < names.length) return pick(sex, names[up]);
    return `прародител (поколение ${up})`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["син", "дъщеря", "дете"], ["внук", "внучка", "внук или внучка"], ["правнук", "правнучка", "правнук или правнучка"], ["праправнук", "праправнучка", "праправнук или праправнучка"]];
    if (down < names.length) return pick(sex, names[down]);
    return `потомък (поколение ${down})`;
  }
  if (up === 1 && down === 1) return pick(sex, ["брат", "сестра", "брат или сестра"]);
  if (up === 1) {
    if (down === 2) return pick(sex, ["племенник", "племенница", "племенник или племенница"]);
    if (down === 3) return pick(sex, ["внук на брат или сестра", "внучка на брат или сестра", "внук или внучка на брат или сестра"]);
    return "потомък на брат или сестра";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["чичо или вуйчо", "леля", "чичо, вуйчо или леля"]);
    if (up === 3) return pick(sex, ["брат на дядо или баба", "сестра на дядо или баба", "брат или сестра на дядо или баба"]);
    return pick(sex, ["брат на прародител", "сестра на прародител", "брат или сестра на прародител"]);
  }
  const n = Math.min(up, down) - 1;
  const cousin = (k: "първ" | "втор" | "трет") => pick(sex, [`${k}и братовчед`, `${k}а братовчедка`, `${k}и братовчед или братовчедка`]);
  const base = n === 1 ? cousin("първ") : n === 2 ? cousin("втор") : n === 3 ? cousin("трет") : pick(sex, ["далечен братовчед", "далечна братовчедка", "далечен роднина"]);
  return up === down ? base : `${base}, от ${up > down ? "по-старо" : "по-младо"} поколение`;
}

const bg: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["съпруг", "съпруга", "съпруг или съпруга"]);
  switch (k.t) {
    case "self": return "човекът в центъра";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(sex, ["полубрат", "полусестра", "полубрат или полусестра"])} ${pick(k.half, ["по бащина линия", "по майчина линия", "по един от родителите"])}`;
      return bgBlood(k.up, k.down, sex);
    case "spouse": return spouse(sex);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["пастрок", "мащеха", "пастрок или мащеха"]);
      const of = pick(k.parent, ["на бащата", "на майката", "на родителя"]);
      if (k.when === "unknown") return `${spouse(sex)} ${of}`;
      const ord = k.order < BG_ORD.length ? pick(sex, BG_ORD[k.order]) : `${k.order}.`;
      return `${ord} ${spouse(sex)} ${of}`;
    }
    case "childSpouse": return pick(sex, ["зет", "снаха", "съпруг или съпруга на детето"]);
    case "siblingInLaw": return pick(sex, ["зет или девер", "снаха или балдъза", "роднина по сватовство"]);
    case "stepGrandparent": return pick(sex, ["дядо по сватовство", "баба по сватовство", "дядо или баба по сватовство"]);
    case "piblingByMarriage": return pick(sex, ["чичо по сватовство", "леля по сватовство", "чичо или леля по сватовство"]);
    case "kinSpouse": return `${spouse(sex)} на роднина (${bg(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["свекър или тъст", "свекърва или тъща", "родител на съпруга"]);
    case "stepChild": return pick(sex, ["доведен син", "доведена дъщеря", "доведено дете"]);
    case "stepGrandchild": return pick(sex, ["доведен внук", "доведена внучка", "доведено внуче"]);
    case "spouseKin": return `${pick(sex, ["роднина", "роднина", "роднина"])} по сватовство: ${bg(k.kin, sex)}, от страната на ${pick(k.spouse, ["съпруга", "съпругата", "съпруга или съпругата"])}`;
  }
};

/* ───────────── Türkçe ───────────── */

/** Türkçe akrabalık: babaanne/anneanne, amca/dayı/hala/teyze ayrımları; taraf bilinmediğinde ikisi birden yazılır. */
const TR_ORD = ["", "birinci", "ikinci", "üçüncü", "dördüncü", "beşinci", "altıncı"];

function trBlood(up: number, down: number, sex: Sex): string {
  if (down === 0) {
    const names: Three[] = [["", "", ""], ["baba", "anne", "ebeveyn"], ["dede", "babaanne veya anneanne", "büyükanne veya büyükbaba"], ["büyük dede", "büyük nine", "büyük dede veya nine"], ["dedenin dedesi", "ninenin ninesi", "büyük dedenin ebeveyni"]];
    if (up < names.length) return pick(sex, names[up]);
    return `ata (${up}. kuşak)`;
  }
  if (up === 0) {
    const names: Three[] = [["", "", ""], ["oğul", "kız", "çocuk"], ["torun", "torun", "torun"], ["torun çocuğu", "torun çocuğu", "torun çocuğu"], ["torun torunu", "torun torunu", "torun torunu"]];
    if (down < names.length) return pick(sex, names[down]);
    return `torun (${down}. kuşak)`;
  }
  if (up === 1 && down === 1) return pick(sex, ["erkek kardeş", "kız kardeş", "kardeş"]);
  if (up === 1) {
    if (down === 2) return "yeğen";
    if (down === 3) return "kardeş torunu";
    return "bir kardeşin torunu";
  }
  if (down === 1) {
    if (up === 2) return pick(sex, ["amca veya dayı", "hala veya teyze", "amca, dayı, hala veya teyze"]);
    if (up === 3) return pick(sex, ["dedenin veya ninenin erkek kardeşi", "dedenin veya ninenin kız kardeşi", "dedenin veya ninenin kardeşi"]);
    return "bir atanın kardeşi";
  }
  const n = Math.min(up, down) - 1;
  const base = n === 1 ? "kuzen" : TR_ORD[n] ? `${TR_ORD[n]} dereceden kuzen` : "uzak kuzen";
  return up === down ? base : `${base}, ${up > down ? "daha eski" : "daha yeni"} bir kuşaktan`;
}

const tr: Words = (k, sex) => {
  const spouse = (s: Sex) => pick(s, ["koca", "eş", "eş"]);
  switch (k.t) {
    case "self": return "ortadaki kişi";
    case "blood":
      if (k.half && k.up === 1 && k.down === 1) return `${pick(k.half, ["baba bir ", "anne bir ", "yarım "])}${pick(sex, ["erkek kardeş", "kız kardeş", "kardeş"])}`;
      return trBlood(k.up, k.down, sex);
    case "spouse": return pick(sex, ["koca", "karı", "eş"]);
    case "parentSpouse": {
      if (k.when === "after") return pick(sex, ["üvey baba", "üvey anne", "üvey ebeveyn"]);
      const of = pick(k.parent, ["babanın", "annenin", "ebeveynin"]);
      return k.when === "before" ? `${of} ${TR_ORD[k.order] ?? `${k.order}.`} eşi` : `${of} eşi`;
    }
    case "childSpouse": return pick(sex, ["damat", "gelin", "çocuğun eşi"]);
    case "siblingInLaw": return pick(sex, ["kayınbirader veya enişte", "görümce, baldız veya yenge", "evlilik yoluyla kardeş"]);
    case "stepGrandparent": return pick(sex, ["üvey dede", "üvey nine", "üvey dede veya nine"]);
    case "piblingByMarriage": return pick(sex, ["enişte", "yenge", "enişte veya yenge"]);
    case "kinSpouse": return `bir akrabanın eşi (${tr(k.kin, k.kinSex)})`;
    case "parentInLaw": return pick(sex, ["kayınpeder", "kayınvalide", "kayınpeder veya kayınvalide"]);
    case "stepChild": return pick(sex, ["üvey oğul", "üvey kız", "üvey çocuk"]);
    case "stepGrandchild": return "üvey torun";
    case "spouseKin": return `evlilik yoluyla akraba: ${tr(k.kin, sex)}, ${pick(k.spouse, ["kocanın", "karının", "eşin"])} tarafından`;
  }
};

/** Gradul în cifre romane, ca în actele de succesiune: 4 → „IV”. */
export function romanDegree(n: number) {
  const r: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of r) while (n >= v) { out += s; n -= v; }
  return out;
}

const WORDS: Record<Locale, Words> = { ro, "en-GB": en("centre"), "en-US": en("center"), fr, es, nl, de, it, hu, he, pt, el, sv, da, nb, uk, sr, bg, tr };

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
    case "he": case "el": case "uk": return `${n}`;
    case "pt": return `${n}.º`;
    case "sv": return `${n}:${n % 10 === 1 || n % 10 === 2 ? "a" : "e"}`;
    case "da": case "nb": case "sr": case "tr": return `${n}.`;
    case "bg": return `${n}`;
  }
}
