import { loadCounties } from "./localitati";
import { KIND_LABEL, fold, loadNames, relatedNames, type Surname } from "./nume";
import { REGIONS } from "./regiuni";

/**
 * „Ce spun datele despre numele X” (Etapa 3, Daniel, 17.11.2026): un text propriu fiecărei pagini de nume, compus doar din ce
 * știm sigur despre nume: terminația și ce înseamnă ea în limba română, cum se scrie fără diacritice, ce variante are și în ce
 * ortografie sunt, numele din aceeași familie de cuvinte, județele regiunilor unde e frecvent și locul lui în lista noastră.
 * Nu inventăm cifre despre purtători; regulile de mai jos sunt cele ale onomasticii românești, spuse cu prudență.
 */

const SUFFIXES: { re: RegExp; text: (n: string) => string }[] = [
  { re: /escu$/i, text: (n) => `Terminația -escu din ${n} e cea mai cunoscută terminație de nume românesc și înseamnă „al lui”, „din neamul lui”. E specifică mai ales Munteniei și Olteniei, de unde s-a răspândit în toată țara, mai ales odată cu actele din secolul al XIX-lea.` },
  { re: /(eanu|ean)$/i, text: (n) => `Terminația -eanu din ${n} arată de obicei locul de unde venea familia: „cel din” sau „cel de la” un sat, un râu sau un ținut. Numele de acest fel păstrează adesea amintirea unei mutări.` },
  { re: /(ovici|evici|ici)$/i, text: (n) => `Terminația -ovici / -ici din ${n} e o terminație slavă de patronimic, cu sensul „fiul lui”. E frecventă în Banat, Bucovina și Moldova, la familii românești, dar și la cele de origine sârbă, ucraineană sau polonă.` },
  { re: /(iuc|uc|ciuc)$/i, text: (n) => `Terminația -uc / -iuc din ${n} e de origine ucraineană și apare mai des în Bucovina, în Maramureș și în nordul Moldovei.` },
  { re: /ache$/i, text: (n) => `Terminația -ache din ${n} e de origine grecească și a dat multe prenume și nume de familie în Muntenia și Moldova (de pildă Iordache sau Manolache).` },
  { re: /(aș|as)$/i, text: (n) => `Terminația -aș din ${n} e un sufix românesc de diminutiv sau de apartenență, folosit des la prenume și porecle.` },
  { re: /(aru|ariu|ar)$/i, text: (n) => `Terminația -ar(u) din ${n} e un sufix românesc care arată ce face sau ce e un om, ca în morar sau fierar; în nume de familie arată adesea ocupația sau felul de viață al unui strămoș.` },
  { re: /(oiu|oi)$/i, text: (n) => `Terminația -oi(u) din ${n} e un sufix românesc augmentativ, folosit des la porecle și la nume formate din prenume.` },
  { re: /(ilă|ila)$/i, text: (n) => `Terminația -ilă din ${n} e un sufix românesc vechi, des întâlnit la nume formate din prenume (ca Chirilă sau Danilă).` },
];

type Spelling = "maghiară" | "germană" | "slavă" | "franceză" | "străină" | "fără diacritice" | "românească";
function spellingOf(v: string, base: string): Spelling {
  if (fold(v) === fold(base) && v !== base) return "fără diacritice";
  if (/[áéíóöőúüű]|sz|cs|gy|ny|zs|ly/i.test(v)) return "maghiară";
  if (/sch|tz|ck|w|ph/i.test(v)) return "germană";
  if (/(ski|sky|ov|ev|enko|uk|yk)$/i.test(v) || /[čšžćя]/i.test(v)) return "slavă";
  if (/esco$/i.test(v)) return "franceză";
  if (/[kwyqx]/i.test(v)) return "străină";
  return "românească";
}

const listRo = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} și ${xs[xs.length - 1]}`);
const plural = (n: number, one: string, many: string) => (n === 1 ? `1 ${one}` : `${n}${n >= 20 ? " de" : ""} ${many}`);

/** Paragrafele „ce spun datele”, fiecare cu fapte despre acest nume. */
export function nameProfile(n: Surname): string[] {
  const out: string[] = [];
  const suf = SUFFIXES.find((s) => s.re.test(n.name));
  if (suf) out.push(suf.text(n.name));

  const plain = n.name.normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (plain !== n.name) {
    out.push(`Numele ${n.name} are diacritice, așa că în bazele de date internaționale, în pașapoartele vechi și în actele din străinătate apare adesea ca ${plain}. Caută ambele forme: un motor de căutare sau o arhivă străină poate să nu le socotească la fel.`);
  }

  if (n.variants.length) {
    const by = new Map<Spelling, string[]>();
    for (const v of n.variants) by.set(spellingOf(v, n.name), [...(by.get(spellingOf(v, n.name)) ?? []), v]);
    const parts = [...by.entries()].map(([k, vs]) => k === "românească" ? `${listRo(vs)} ${vs.length > 1 ? "sunt forme românești înrudite" : "e o formă românească înrudită"}`
      : k === "fără diacritice" ? `${listRo(vs)} ${vs.length > 1 ? "sunt scrieri" : "e scrierea"} fără diacritice`
      : k === "străină" ? `${listRo(vs)} ${vs.length > 1 ? "sunt scrieri" : "e o scriere"} cu litere străine (k, w, y), din actele altor limbi`
      : `${listRo(vs)} ${vs.length > 1 ? "sunt scrieri" : "e o scriere"} după ortografia ${k}`);
    out.push(`În lista noastră, numele ${n.name} are ${plural(n.variants.length, "variantă", "variante")}: ${parts.join("; ")}. În registrele vechi, preotul sau funcționarul scria numele cum îl auzea și în limba actului, așa că aceeași familie poate apărea sub mai multe forme în același sat.`);
  }

  const family = relatedNames(n, 12).filter((x) => x.variants.some((v) => fold(v) === fold(n.name)) || n.variants.some((v) => fold(v) === fold(x.name))
    || fold(x.name).slice(0, 4) === fold(n.name).slice(0, 4));
  if (family.length) out.push(`Din aceeași familie de nume ${family.length > 1 ? "fac" : "face"} parte și ${listRo(family.slice(0, 5).map((x) => x.name))}, ${family.length > 1 ? "care au pagini proprii" : "care are pagina ei"} aici. Familiile cu aceste nume pot fi înrudite sau nu; doar actele o pot arăta.`);

  // Cuvântul de bază din explicație (primul *cuvânt* cursiv) și celelalte nume din listă care pornesc de la el.
  const base = /\*([^*]+)\*/.exec(n.meaning)?.[1];
  if (base && base.length >= 3) {
    const kin = loadNames().filter((x) => x.slug !== n.slug && x.meaning.includes(`*${base}*`)).map((x) => x.name);
    out.push(kin.length
      ? `Cuvântul de la care pornește numele, *${base}*, stă și la baza ${kin.length === 1 ? "unui alt nume" : `altor ${plural(kin.length, "nume", "nume")}`} din lista noastră: ${listRo(kin.slice(0, 6))}. Când găsești în același sat mai multe dintre ele, merită verificat dacă nu sunt ramuri ale aceleiași familii, despărțite de felul în care s-au scris actele.`
      : `Cuvântul de la care pornește numele, *${base}*, nu stă la baza niciunui alt nume din lista noastră, așa că ${n.name} are aici o explicație doar a lui.`);
  }

  if (n.regions.length) {
    const near = loadNames().filter((x) => x.slug !== n.slug && x.regions.some((r) => n.regions.includes(r)) && !family.includes(x)).slice(0, 6).map((x) => x.name);
    if (near.length) out.push(`Alte nume des întâlnite în aceleași regiuni sunt ${listRo(near)}. Dacă în arborele tău apar mai multe dintre ele, e un semn că familia a trăit multă vreme în aceeași zonă.`);
  }

  if (n.regions.length) {
    const counties = loadCounties().filter((c) => c.regions.some((r) => n.regions.includes(r))).map((c) => c.name);
    const regs = n.regions.map((r) => REGIONS[r].name);
    out.push(`Regiunile în care numele e mai frecvent (${listRo(regs)}) cuprind azi ${plural(counties.length, "județ", "județe")}: ${listRo(counties)}. Serviciile județene ale Arhivelor Naționale din aceste județe sunt primul loc unde ceri registrele vechi ale unei familii ${n.name}.`);
  }

  else {
    out.push(`În lista noastră, ${n.name} nu e legat de o regiune anume: numele apare în toată țara, iar familii fără legătură între ele l-au primit în locuri diferite. Locul de origine al familiei tale îl afli deci din acte, nu din nume: pornește de la satul trecut în actul de naștere al celui mai vechi strămoș pe care îl știi.`);
  }

  const same = loadNames().filter((x) => x.kind === n.kind);
  out.push(`În lista Cartea Neamului, ${n.name} e unul dintre cele ${same.length} de nume din categoria „${KIND_LABEL[n.kind].toLowerCase()}”, din ${loadNames().length} de nume explicate până acum.`);
  return out;
}

export const profileWords = (n: Surname) => nameProfile(n).join(" ").split(/\s+/).filter(Boolean).length;
