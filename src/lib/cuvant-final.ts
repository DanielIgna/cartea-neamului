/**
 * Cuvântul de la capătul călătoriei în timp: după ce nava a trecut pe la toți strămoșii știuți, merge „dincolo de timp”,
 * la cele două spițe ale Bibliei: a lui Adam (Geneza 5) și a lui Isus Hristos (Matei 1). Versetele sunt din traducerea
 * Dumitru Cornilescu. Adminul îl poate schimba pentru toți din panou (pagina „Texte”, src/lib/texte.ts), iar proprietarul unui
 * arbore poate păstra textul de bază, îl poate scrie cu vorbele lui sau îl poate ascunde.
 *
 * Scrierea e simplă, ca s-o poată schimba oricine: „## ” la început de rând = titlu, „> ” = verset (cu trimiterea după „ — ”),
 * un rând gol = paragraf nou.
 */
export const DEFAULT_WORD = `## Două spițe, două cărți
Am coborât prin ani din om în om, până unde ne-au mai rămas numele. Dar orice spiță, oricât de lungă, duce mai departe, spre începutul tuturor neamurilor. Una dintre cele mai vechi cărți ale lumii păstrează două astfel de spițe: una chiar la începutul ei și alta la începutul Noului Testament.

## Spița lui Adam
> Iată cartea neamurilor lui Adam. În ziua când a făcut Dumnezeu pe om, l-a făcut după asemănarea lui Dumnezeu. — Geneza 5:1

Geneza 5 e una dintre cele mai vechi genealogii scrise: Adam, Set, Enos și mai departe, din tată în fiu, iar despre fiecare se spune că a trăit, a avut fii și fiice, „apoi a murit”. Seamănă cu spița fiecăruia dintre noi. Niciunul nu și-a ales părinții, satul sau veacul în care a venit pe lume, și fiecare poveste de aici se încheie la fel.

## Spița lui Isus
> Cartea neamului lui Isus Hristos, fiul lui David, fiul lui Avraam. — Matei 1:1

Noul Testament începe tot cu o genealogie, dar alta: neamul lui Isus din Nazaret, omul de la nașterea căruia lumea își numără anii. Evanghelia după Ioan spune despre el așa:

> Și Cuvântul S-a făcut trup și a locuit printre noi, plin de har și de adevăr. — Ioan 1:14

Ioan mai scrie despre un alt fel de înrudire, care nu vine din părinți:

> Dar tuturor celor ce L-au primit, adică celor ce cred în Numele Lui, le-a dat dreptul să se facă copii ai lui Dumnezeu; născuți nu din sânge, nici din voia firii lor, nici din voia vreunui om, ci din Dumnezeu. — Ioan 1:12–13

Două spițe, așadar: una în care ne naștem toți și una despre care Isus îi vorbește lui Nicodim, un învățat al vremii:

> Adevărat, adevărat îți spun că, dacă un om nu se naște din nou, nu poate vedea Împărăția lui Dumnezeu. — Ioan 3:3

## O altă carte
Cartea neamului nostru păstrează numele celor dragi, ca să nu-i uităm. Textele vechi vorbesc și despre o altă carte și despre o viață care nu se măsoară în ani:

> Și viața veșnică este aceasta: să Te cunoască pe Tine, singurul Dumnezeu adevărat, și pe Isus Hristos, pe care L-ai trimis Tu. — Ioan 17:3

## Adevărul care face liberi
Călătoria prin istorie ne-a arătat sisteme care au stăpânit oamenii prin minciună, prin frică și prin manipulare: comunismul, care le-a luat bunicilor noștri pământul, credința și libertatea de a spune ce gândesc, iar după el ideologiile de tot felul care încearcă să rescrie ce este omul, familia și adevărul. Pentru cine caută ce rămâne adevărat când se schimbă vremurile, iată două fraze rostite acum două mii de ani:

> Eu sunt Calea, Adevărul și Viața. Nimeni nu vine la Tatăl decât prin Mine. — Ioan 14:6

> Veți cunoaște adevărul, și adevărul vă va face slobozi. — Ioan 8:32

## Pentru neamul și țara noastră
Ce am primit de la înaintași nu se oprește la noi. Așa cum o generație lasă urmașilor ei numele, pământul și amintirile, tot așa felul în care trăiește ea ajunge moștenire pentru neamul și pentru țara ei.

> Dacă poporul Meu, peste care este chemat Numele Meu, se va smeri, se va ruga și va căuta Fața Mea și se va abate de la căile lui rele, îl voi asculta din ceruri, îi voi ierta păcatul și-i voi tămădui țara. — 2 Cronici 7:14

## O întrebare pentru tine
Ai văzut din ce neam te tragi. Dar în ce carte este scris numele tău?

Răspunsul nu ți-l poate da nimeni în locul tău. Îl cauți singur.

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

/**
 * Ce se arată la final: `null` în baza de date = textul de bază (cel din panou, dacă adminul l-a schimbat, altfel DEFAULT_WORD);
 * un text gol = proprietarul l-a ascuns.
 */
export function wordFor(stored: string | null | undefined, base: string = DEFAULT_WORD): string | null {
  if (stored === null || stored === undefined) return base;
  return stored.trim() ? stored : null;
}

export const MAX_WORD = 12000;
