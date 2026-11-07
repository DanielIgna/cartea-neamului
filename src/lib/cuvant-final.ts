/**
 * Cuvântul de la capătul călătoriei în timp: după ce nava a trecut pe la toți strămoșii știuți, merge „dincolo de timp”,
 * la cele două spițe ale Bibliei: a lui Adam (Geneza 5) și a lui Isus Hristos (Matei 1). Versetele sunt din traducerea
 * Dumitru Cornilescu. Proprietarul arborelui poate păstra textul acesta, îl poate scrie cu vorbele lui sau îl poate ascunde.
 *
 * Scrierea e simplă, ca s-o poată schimba oricine: „## ” la început de rând = titlu, „> ” = verset (cu trimiterea după „ — ”),
 * un rând gol = paragraf nou.
 */
export const DEFAULT_WORD = `## Două spițe, două cărți
Am coborât prin ani din om în om, până unde ne-au mai rămas numele. Dar orice spiță, oricât de lungă, duce mai departe, la începutul tuturor neamurilor. Biblia păstrează două spițe, și fiecare om e chemat să afle în care dintre ele e scris.

## Spița lui Adam
> Iată cartea neamurilor lui Adam. În ziua când a făcut Dumnezeu pe om, l-a făcut după asemănarea lui Dumnezeu. — Geneza 5:1

Geneza 5 e prima spiță din Biblie: Adam, Set, Enos și mai departe, din tată în fiu, iar despre fiecare se spune că a trăit, a născut fii și fiice, „apoi a murit”. Este și spița noastră. Niciunul dintre noi nu și-a ales părinții, satul sau veacul în care a venit pe lume: ne-am născut fără voia noastră, urmași ai lui Adam, și purtăm toți aceeași moștenire, păcatul și moartea.

## Spița lui Isus Hristos
> Cartea neamului lui Isus Hristos, fiul lui David, fiul lui Avraam. — Matei 1:1

Noul Testament începe tot cu o spiță, dar cu alta: neamul lui Isus Hristos. Fiul lui Dumnezeu a luat chip de om și a locuit printre noi.

> Și Cuvântul S-a făcut trup și a locuit printre noi, plin de har și de adevăr. — Ioan 1:14

El este Mielul lui Dumnezeu, care a fost pus pe cruce și a murit în locul meu și al tău, omule, oricine ai fi tu. În spița Lui intri prin credință:

> Dar tuturor celor ce L-au primit, adică celor ce cred în Numele Lui, le-a dat dreptul să se facă copii ai lui Dumnezeu; născuți nu din sânge, nici din voia firii lor, nici din voia vreunui om, ci din Dumnezeu. — Ioan 1:12–13

Toți ne naștem în Adam. Toți suntem chemați să credem în Hristos și să ne naștem din nou în El.

> Adevărat, adevărat îți spun că, dacă un om nu se naște din nou, nu poate vedea Împărăția lui Dumnezeu. — Ioan 3:3

## Cartea vieții
Cartea neamului nostru păstrează numele celor dragi, ca să nu-i uităm. Dar există o carte care contează mai mult decât orice arbore: Cartea vieții. În ea sunt scriși cei care L-au primit pe Domnul Isus Hristos ca Mântuitor al vieții lor. Ei au o chemare cerească: să trăiască în lume sfinți și fără prihană, adică puși deoparte pentru Dumnezeu, să facă voia Lui și, în cele din urmă, să moștenească nemurirea.

> Și viața veșnică este aceasta: să Te cunoască pe Tine, singurul Dumnezeu adevărat, și pe Isus Hristos, pe care L-ai trimis Tu. — Ioan 17:3

## Adevărul care face liberi
Călătoria prin istorie ne-a arătat sisteme care au stăpânit oamenii prin minciună, prin frică și prin manipulare: comunismul, care le-a luat bunicilor noștri pământul, credința și libertatea de a spune ce gândesc, iar după el ideologiile de tot felul, de la neomarxism până azi, care încearcă să rescrie ce este omul, familia și adevărul. În Cuvântul lui Dumnezeu există un Adevăr care nu se schimbă, iar acest Adevăr nu este o idee, ci o Persoană: Însuși Isus Hristos.

> Eu sunt Calea, Adevărul și Viața. Nimeni nu vine la Tatăl decât prin Mine. — Ioan 14:6

> Veți cunoaște adevărul, și adevărul vă va face slobozi. — Ioan 8:32

## Pentru neamul și țara noastră
Ce am primit de la înaintași nu se oprește la noi. Așa cum o generație lasă urmașilor ei numele, pământul și amintirile, tot așa smerenia și rugăciunea unei generații ajung binecuvântare pentru neamul și pentru țara ei.

> Dacă poporul Meu, peste care este chemat Numele Meu, se va smeri, se va ruga și va căuta Fața Mea și se va abate de la căile lui rele, îl voi asculta din ceruri, îi voi ierta păcatul și-i voi tămădui țara. — 2 Cronici 7:14

## O întrebare pentru tine
Ai văzut din ce neam te tragi. Dar în ce carte este scris numele tău?

Dumnezeu ne-a lăsat o scrisoare de dragoste: Biblia, Cuvântul Lui. Te chemăm să o deschizi și să o citești. Poți începe cu Evanghelia după Ioan.

> Fiindcă atât de mult a iubit Dumnezeu lumea, că a dat pe singurul Lui Fiu, pentru ca oricine crede în El să nu piară, ci să aibă viața veșnică. — Ioan 3:16`;

export type WordBlock = { kind: "title"; text: string } | { kind: "verse"; text: string; ref: string | null } | { kind: "para"; text: string };

/** Textul scris (al proprietarului sau cel de bază) desfăcut în titluri, versete și paragrafe. */
export function parseWord(text: string): WordBlock[] {
  const out: WordBlock[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) out.push({ kind: "para", text: para.join(" ") }); para = []; };
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith("## ")) { flush(); out.push({ kind: "title", text: line.slice(3).trim() }); continue; }
    if (line.startsWith(">")) {
      flush();
      const body = line.replace(/^>\s*/, "");
      // Trimiterea vine după „ — ” (sau „ - ”): „Ioan 1:12–13”.
      const m = body.match(/^(.*\S)\s+—\s+(\S.{1,39})$/) ?? body.match(/^(.*\S)\s+-\s+(\S.{1,39})$/);
      out.push(m ? { kind: "verse", text: m[1], ref: m[2].trim() } : { kind: "verse", text: body, ref: null });
      continue;
    }
    para.push(line);
  }
  flush();
  return out;
}

/** Ce se arată la final: `null` în baza de date = textul de bază; un text gol = proprietarul l-a ascuns. */
export function wordFor(stored: string | null | undefined): string | null {
  if (stored === null || stored === undefined) return DEFAULT_WORD;
  return stored.trim() ? stored : null;
}

export const MAX_WORD = 12000;
