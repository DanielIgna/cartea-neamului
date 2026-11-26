import { parseBlocks, type Block } from "@/lib/continut/markdown";
import { CRIZE_FILA } from "@/lib/istorie/crize-fila";

/**
 * Filele pentru cei intrați în cont din seria „Vremuri grele” (Daniel, 2026-11-26): ce spune Biblia, în textul Cornilescu
 * (verificat pe bibliaonline.com.br/vdc), atribuit textului biblic și felului în care îl citesc credincioșii. Se importă DOAR
 * din paginile făcute pe loc pentru un cont adevărat (src/app/(site)/istoria-umanitatii/…); paginile publice gata făcute și
 * roboții nu le primesc. Regula de ton: titluri fără limbaj religios, câteva versete, fără îndemnuri la citirea Bibliei.
 */
const INTERBELIC = `
## O învățătură veche despre belșug

Ademenirea belșugului nu e o problemă nouă. După relatarea biblică, Isus le-a spus celor care Îl ascultau:

> „Vedeți și păziți-vă de orice fel de lăcomie de bani, căci viața cuiva nu stă în belșugul avuției lui.” — Luca 12:15

Iar apostolul Pavel îi scria lui Timotei, cu aproape două mii de ani înaintea crizei din 1929:

> „Îndeamnă pe bogații veacului acestuia să nu se îngâmfe și să nu-și pună nădejdea în niște bogății nestatornice, ci în Dumnezeu, care ne dă toate lucrurile din belșug ca să ne bucurăm de ele.” — 1 Timotei 6:17

Mulți dintre bunicii noștri, care au trăit și belșugul anilor '20, și sărăcia anilor '30, citeau aceste versete ca pe o lecție trăită: banii pot pleca peste noapte, dar nădejdea pusă în altceva decât în ei rămâne.
`;

const TIPAR = `
## Un fir care trece prin toată istoria

Vorba despre „nimic nou sub soare” vine dintr-o carte foarte veche. După relatarea biblică, regele Solomon, cunoscut pentru înțelepciunea lui, a scris în Eclesiastul:

> „Ce a fost va mai fi și ce s-a făcut se va mai face; nu este nimic nou sub soare. Dacă este vreun lucru despre care s-ar putea spune: «Iată ceva nou!», de mult lucrul acela era și în veacurile dinaintea noastră.” — Eclesiastul 1:9–10

Pentru credincioși, istoria nu e însă doar un cerc care se repetă. Prin toată Biblia trece un fir roșu, de la primul om până azi: Hristos. Genealogiile biblice, de la Adam până la Isus, pe care le găsești în [Genealogii vechi](/genealogii-vechi), au fost păstrate tocmai ca să arate acest fir. Prima carte a Noului Testament începe chiar cu cuvintele „Cartea neamului lui Isus Hristos” (Matei 1:1), de unde vine și numele acestei platforme.

> „Dar când a venit împlinirea vremii, Dumnezeu a trimis pe Fiul Său, născut din femeie, născut sub Lege.” — Galateni 4:4

Când Ioan Botezătorul L-a văzut pe Isus, după relatarea Evangheliei, a spus:

> „Iată Mielul lui Dumnezeu, care ridică păcatul lumii!” — Ioan 1:29

Așa citesc credincioșii istoria umanității: crizele, războaiele și anii de belșug se repetă, dar în mijlocul lor stă o singură veste care nu se schimbă:

> „Fiindcă atât de mult a iubit Dumnezeu lumea, că a dat pe singurul Lui Fiu, pentru ca oricine crede în El să nu piară, ci să aibă viața veșnică.” — Ioan 3:16

Fiecare cititor e lăsat să cântărească singur aceste cuvinte, așa cum le-au cântărit și strămoșii noștri în vremurile lor grele.
`;

/** Fila fiecărui articol care are una, după slug. */
export const FILE: Record<string, Block[]> = {
  crize: CRIZE_FILA,
  "anii-interbelici": parseBlocks(INTERBELIC),
  "tiparul-istoriei": parseBlocks(TIPAR),
};
