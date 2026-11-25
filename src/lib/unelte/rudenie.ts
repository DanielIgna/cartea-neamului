/**
 * Calculatorul de rudenie (/unelte/calculator-grad-de-rudenie, planul SEO, 18.11.2026). Alegi drumul de la tine la rudă,
 * pas cu pas („eu → tata → fratele lui → fiul lui”), iar calculul spune cum se numește ruda și gradul ei.
 *
 * Gradul se numără ca în Codul civil (art. 406): în linie dreaptă, după numărul nașterilor (părinte–copil: gradul I);
 * în linie colaterală, după numărul nașterilor urcând de la o rudă până la ascendentul comun și coborând apoi la cealaltă.
 * Afinitatea (art. 407): rudele unui soț sunt afinii celuilalt, în linia și gradul în care sunt rude cu soțul.
 * Fișier fără importuri de pe server: îl folosește și pagina din browser.
 */
export type Step = "tata" | "mama" | "fiu" | "fiica" | "frate" | "sora" | "sot" | "sotie";
export type Sex = "m" | "f";

export const STEP_LABEL: Record<Step, string> = {
  tata: "tatăl", mama: "mama", fiu: "fiul", fiica: "fiica", frate: "fratele", sora: "sora", sot: "soțul", sotie: "soția",
};
const SEX: Record<Step, Sex> = { tata: "m", mama: "f", fiu: "m", fiica: "f", frate: "m", sora: "f", sot: "m", sotie: "f" };
const isUp = (s: Step) => s === "tata" || s === "mama";
const isDown = (s: Step) => s === "fiu" || s === "fiica";
const isSide = (s: Step) => s === "frate" || s === "sora";
const isSpouse = (s: Step) => s === "sot" || s === "sotie";

export type Kinship = {
  /** Numele rudei („văr primar”, „cumnată”, „rudă colaterală de gradul 5”). */
  name: string;
  /** Gradul (I, II…) sau null pentru soț/soție (soții nu sunt rude între ei). */
  degree: number | null;
  line: "dreaptă" | "colaterală" | "căsătorie";
  /** true la afini (rude prin căsătorie). */
  affine: boolean;
  /** Explicația numărătorii, pe înțeles. */
  explain: string;
  /** Pagina statică a relației (/unelte/rudenie/<slug>), unde există. */
  page: string | null;
};

const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
export const roman = (n: number) => ROMAN[n] ?? String(n);

/** Numele rudei de sânge după câte generații urci (up) și cobori (down), plus sexul ei. */
function bloodName(up: number, down: number, sex: Sex): { name: string; page: string | null } {
  const m = sex === "m";
  const pick = (a: string, b: string, page: string | null = null) => ({ name: m ? a : b, page });
  if (down === 0) {
    if (up === 1) return pick("tată", "mamă");
    if (up === 2) return pick("bunic", "bunică", "bunic");
    if (up === 3) return pick("străbunic", "străbunică", "strabunic");
    if (up === 4) return pick("răsstrăbunic", "răsstrăbunică", "rasstrabunic");
    return pick(`strămoș (cu ${up} generații în urmă)`, `strămoașă (cu ${up} generații în urmă)`);
  }
  if (up === 0) {
    if (down === 1) return pick("fiu", "fiică");
    if (down === 2) return pick("nepot (de bunic)", "nepoată (de bunic)", "nepot");
    if (down === 3) return pick("strănepot", "strănepoată", "stranepot");
    return pick(`urmaș (după ${down} generații)`, `urmașă (după ${down} generații)`);
  }
  if (up === 1 && down === 1) return pick("frate", "soră", "frate-vitreg");
  if (up === 2 && down === 1) return pick("unchi", "mătușă", "unchi");
  if (up === 1 && down === 2) return pick("nepot de frate sau de soră", "nepoată de frate sau de soră", "nepot");
  if (up === 2 && down === 2) return pick("văr primar", "vară primară", "var-primar");
  if (up === 3 && down === 1) return pick("unchi mare (fratele bunicului sau al bunicii)", "mătușă mare (sora bunicului sau a bunicii)", "unchi-mare");
  if (up === 1 && down === 3) return pick("strănepot de frate", "strănepoată de frate");
  if (up === 3 && down === 2) return pick("văr al părintelui tău", "vară a părintelui tău", "var-al-parintelui");
  if (up === 2 && down === 3) return pick("nepot de văr (copilul vărului primar)", "nepoată de văr (copilul vărului primar)", "nepot-de-var");
  if (up === 3 && down === 3) return pick("văr de-al doilea", "vară de-a doua", "var-de-al-doilea");
  if (up === 4 && down === 4) return pick("văr de-al treilea", "vară de-a treia", "var-de-al-treilea");
  return pick("rudă colaterală", "rudă colaterală");
}

/** Numele afinului (ruda soțului sau soțul rudei), unde limba are un cuvânt anume. */
function affineName(kind: "of-spouse" | "spouse-of", up: number, down: number, sex: Sex): { name: string; page: string | null } | null {
  const m = sex === "m";
  if (kind === "of-spouse") {
    if (up === 1 && down === 0) return { name: m ? "socru" : "soacră", page: "socru" };
    if (up === 1 && down === 1) return { name: m ? "cumnat (fratele soțului sau al soției)" : "cumnată (sora soțului sau a soției)", page: m ? "cumnat" : "cumnata" };
    if (up === 0 && down === 1) return { name: m ? "fiu vitreg (dacă nu e și fiul tău)" : "fiică vitregă (dacă nu e și fiica ta)", page: "fiu-vitreg" };
    return null;
  }
  if (up === 1 && down === 1) return { name: m ? "cumnat (soțul surorii)" : "cumnată (soția fratelui)", page: m ? "cumnat" : "cumnata" };
  if (up === 0 && down === 1) return { name: m ? "ginere" : "noră", page: "ginere-si-nora" };
  if (up === 1 && down === 0) return { name: m ? "tată vitreg (dacă nu e și tatăl tău)" : "mamă vitregă (dacă nu e și mama ta)", page: "tata-vitreg" };
  if (up === 2 && down === 1) return { name: m ? "unchi prin alianță (soțul mătușii)" : "mătușă prin alianță (soția unchiului)", page: "unchi" };
  return null;
}

export type CalcResult = Kinship | { error: string };

/** Calculează rudenia pentru un drum de pași, pornind de la „eu”. */
export function kinship(path: Step[]): CalcResult {
  if (!path.length) return { error: "Alege cel puțin un pas." };
  const spouses = path.map((s, i) => (isSpouse(s) ? i : -1)).filter((i) => i >= 0);
  // Cuscrii: părinții soțului sau ai soției copilului tău (fiul → soția → mama).
  if (path.length === 3 && isDown(path[0]) && isSpouse(path[1]) && isUp(path[2])) {
    const m = SEX[path[2]] === "m";
    return { name: m ? "cuscru" : "cuscră", degree: null, line: "căsătorie", affine: true, page: "cuscru",
      explain: "Cuscrii sunt părinții celor doi soți, unii față de ceilalți. Nu sunt rude între ei, nici de sânge, nici prin afinitate, iar legea nu le dă un grad." };
  }
  if (spouses.length > 1 || (spouses.length === 1 && spouses[0] !== 0 && spouses[0] !== path.length - 1)) {
    return { error: "Calculatorul primește soțul sau soția doar ca prim pas (rudele soțului) sau ca ultim pas (soțul unei rude)." };
  }
  if (path.length === 1 && isSpouse(path[0])) {
    return { name: path[0] === "sot" ? "soț" : "soție", degree: null, line: "căsătorie", affine: false, page: null,
      explain: "Soții nu sunt rude între ei: căsătoria îi leagă, dar legea nu le dă un grad de rudenie." };
  }
  const first = isSpouse(path[0]) ? "of-spouse" : isSpouse(path[path.length - 1]) ? "spouse-of" : null;
  const blood = path.filter((s) => !isSpouse(s));
  // Pas cu pas: părintele urcă o generație; fratele (sora) urcă la părintele comun și coboară una (o singură dată pe aceeași
  // treaptă: fratele vărului e tot văr); copilul coboară o generație. Un drum care coboară și apoi urcă se întoarce spre tine.
  let up = 0, down = 0;
  for (const s of blood) {
    if (isUp(s)) {
      if (down > 0) return { error: "Drumul coboară și apoi urcă din nou (de pildă „fiul → tatăl”), deci se întoarce la tine sau la soț. Alege alt drum." };
      up++;
    } else if (isSide(s)) { if (down === 0) { up++; down = 1; } }
    else if (isDown(s)) down++;
  }
  const last = blood[blood.length - 1];
  const sex = first === "spouse-of" ? SEX[path[path.length - 1]] : SEX[last];
  const degree = up + down;
  const line = up === 0 || down === 0 ? "dreaptă" : "colaterală";
  const count = line === "dreaptă"
    ? `În linie dreaptă se numără generațiile: ${degree === 1 ? "una" : degree} ${degree === 1 ? "generație" : "generații"}, deci gradul ${roman(degree)}.`
    : `În linie colaterală urci ${up === 1 ? "o generație" : `${up} generații`} până la strămoșul comun și cobori ${down === 1 ? "una" : down}: ${up} + ${down} = gradul ${roman(degree)}.`;
  if (first) {
    const named = affineName(first, up, down, sex);
    const base = bloodName(up, down, SEX[last]).name;
    const name = named?.name ?? (first === "of-spouse" ? `rudă prin alianță: ${base} al soțului sau al soției` : `rudă prin alianță: ${sex === "m" ? "soțul" : "soția"} unei rude (${base})`);
    return { name, degree, line, affine: true, page: named?.page ?? null,
      explain: `E rudă prin alianță (afin): rudele unui soț sunt afinii celuilalt soț, în aceeași linie și în același grad. ${first === "of-spouse" ? "Numeri deci rudenia dintre soțul tău (sau soția ta) și această persoană." : "Numeri deci rudenia dintre tine și ruda ta căsătorită cu această persoană."} ${count}` };
  }
  const b = bloodName(up, down, sex);
  return { name: b.name === "rudă colaterală" ? `rudă colaterală de gradul ${roman(degree)}` : b.name, degree, line, affine: false, page: b.page, explain: count };
}
