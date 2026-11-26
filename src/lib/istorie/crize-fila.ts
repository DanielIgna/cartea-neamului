import { parseBlocks, type Block } from "@/lib/continut/markdown";

/**
 * Fila pentru cei intrați în cont din „Crizele care au schimbat lumea” (Daniel, 2026-11-26): ce spune Biblia despre vremurile
 * grele (Matei 24, Apocalipsa 13) și cum o citesc credincioșii. Apare printre rânduri, doar în pagina făcută pe loc pentru un
 * cont adevărat (src/app/(site)/istoria-umanitatii/crize); pagina publică gata făcută și roboții nu o primesc.
 * Regula de ton: titlu fără limbaj religios, câteva versete (Cornilescu, verificate pe bibliaonline.com.br/vdc), atribuite
 * textului biblic și interpretării lui, nu prezentate ca fapt istoric; fără îndemnuri sau legături spre citirea Bibliei.
 */
const TEXT = `
## O carte veche despre vremurile grele

Mulți dintre bunicii care au trecut prin foamete, război și lipsuri au găsit putere și în cuvinte mai vechi de două mii de ani. După relatarea biblică, când ucenicii L-au întrebat pe Isus despre vremurile de la sfârșit, El le-a răspuns:

> „Băgați de seamă să nu vă înșele cineva. […] Veți auzi de războaie și vești de războaie: vedeți să nu vă înspăimântați, căci toate aceste lucruri trebuie să se întâmple. Dar sfârșitul tot nu va fi atunci.” — Matei 24:4, 6

> „Un neam se va scula împotriva altui neam, și o împărăție, împotriva altei împărății; și, pe alocurea, vor fi cutremure de pământ, foamete și ciumi. Dar toate aceste lucruri nu vor fi decât începutul durerilor.” — Matei 24:7–8

Ultima carte a Bibliei, Apocalipsa, descrie o vreme în care o singură putere va stăpâni peste toate popoarele și va ajunge să hotărască până și cine poate cumpăra o pâine:

> „Și a făcut ca toți: mici și mari, bogați și săraci, slobozi și robi, să primească un semn pe mâna dreaptă sau pe frunte și nimeni să nu poată cumpăra sau vinde fără să aibă semnul acesta […].” — Apocalipsa 13:16–17

Mulți credincioși citesc aceste versete ca pe un avertisment pentru zilele din urmă: o criză mare, care ar lovi toată lumea deodată, ar putea fi folosită ca să supună popoarele unui singur stăpân, pe care tradiția creștină îl numește antihrist, iar omul n-ar mai putea trăi fără să se plece. Alții văd în ele chipul oricărei puteri care le cere oamenilor să-și dea conștiința în schimbul pâinii, cum s-a întâmplat și sub regimurile pe care le-au cunoscut bunicii noștri. Textul nu spune când vor fi aceste lucruri, iar fiecare cititor e lăsat să cântărească singur.

Pe lângă avertisment, același capitol din Matei lasă și o încurajare, pe care mulți bătrâni o știau pe de rost:

> „Dar cine va răbda până la sfârșit va fi mântuit.” — Matei 24:13

Poate de aceea oamenii care au trecut prin cele mai grele crize spun același lucru: banii, pământul și chiar libertatea ți le poate lua cineva, dar nu și nădejdea.
`;

export const CRIZE_FILA: Block[] = parseBlocks(TEXT);
