# Cartea Neamului

Platformă pentru arbori genealogici construiți împreună de familie, cu evantai pe generații, fișe de persoană,
arhivă de documente, cronologie istorică și, ca produs plătit, cartea familiei în PDF gata de tipar.

Planul complet (arhitectură, scheme de date, GDPR, etape) e în documentul de blueprint din proiect.
Prototipul de interfață, cu date de exemplu, e în [`docs/prototip-ui.html`](docs/prototip-ui.html).

## Pornire rapidă

Ai nevoie doar de Node.js 22. Baza de date rulează local, embedded, fără instalare.

```bash
npm install
npm run db:seed     # creează schema și familia de exemplu „Neamul Pop din Ieud” (inventată)
npm run dev         # http://localhost:3000
```

Intră cu contul de exemplu `demo@cartea-neamului.ro`, parola `demo-parola-123` (există doar în baza ta locală).

## Comenzi

| Comandă | Ce face |
| --- | --- |
| `npm run dev` | Aplicația în modul de dezvoltare |
| `npm test` | Teste: date istorice, GEDCOM, ascendenți pe generații, GDPR la export |
| `npm run lint` | Verificare TypeScript |
| `npm run build` | Build de producție |
| `npm run db:push` | Aplică migrațiile pe baza de date curentă |
| `npm run db:seed` | Migrații + familia de exemplu |
| `npx drizzle-kit generate` | Generează o migrație nouă după ce modifici `src/db/schema.ts` |
| `npm run e2e:neon` | Verifică cap-coadă serviciile Neon pe aplicația pornită (`npm run start -- -p 3100`) |

## Stack (toate cu plan gratuit)

- **Next.js 15** (App Router, React 19, TypeScript)
- **PostgreSQL**: local cu PGlite; în cloud cu **Neon** (node-postgres cu pool, recomandarea Neon pentru Vercel)
- **Drizzle ORM** pentru schemă și migrații (`src/db/schema.ts`, `drizzle/`)
- **Better Auth** pentru conturi (email + parolă), sesiuni în aceeași bază de date
- **Neon Object Storage**: bucket privat `assets` pentru actele și fotografiile din fișe, deschise prin URL presemnat
- **Neon Realtime**: arborele se actualizează singur când altă rudă adaugă sau corectează o persoană
- **Neon Functions**: funcția `hello` (`hello.ts`), verificată de `/api/stare`
- **Neon AI Gateway**: ciornă de biografie pentru persoanele decedate (necesită plan Neon plătit)
- Urmează: **Stripe** pentru plata cărții

## Neon

Serviciile sunt declarate în `neon.ts`. Legătura cu proiectul e în `.neon` (nu intră în git).

```bash
npx neon@latest login     # o dată, în browser
npx neon@latest deploy    # creează serviciile din neon.ts și scrie variabilele în .env.local
npm run db:seed           # schema + familia de exemplu, direct în Neon
```

Pe planul Free, Neon refuză `deploy` cât timp `neon.ts` conține `aiGateway`. Restul serviciilor merg;
sugestiile de biografie apar doar când există variabilele `NEON_AI_GATEWAY_*` (după trecerea pe un plan plătit).
## Online (Vercel)

Aplicația e publicată la **https://cartea-neamului.vercel.app** (proiectul Vercel `cartea-neamului`, legat de acest repo:
fiecare push pe `main` publică automat). Variabilele de producție sunt setate în Vercel, nu în cod:
cele de la Neon (`DATABASE_URL`, `NEON_REALTIME_*`, `NEON_FUNCTION_HELLO_BASE_URL`, …), un `BETTER_AUTH_SECRET` propriu și
cheile bucket-ului cu prefixul `NEON_STORAGE_` (Vercel rezervă numele `AWS_*`). `BETTER_AUTH_URL` nu e necesar pe Vercel:
aplicația folosește domeniul de producție dat de Vercel.

Better Auth rămâne în aplicație (tabelele `user`/`session` în același Postgres), cum recomandă skill-ul `neon-auth`
pentru aplicații care au deja Better Auth.

## Structură

```
src/db/          schema și conexiunea (PGlite sau Neon)
src/lib/         logica: GEDCOM, ascendenți (CTE recursiv + Ahnentafel), date aproximative, evenimente istorice
src/app/         paginile: lista de arbori, arborele, cronologia, API export GEDCOM
src/components/  evantaiul, arborele clasic, fișa persoanei
tests/           teste Vitest (rulează pe un Postgres în memorie)
fixtures/        familia de exemplu în format GEDCOM
```

## Familii noi și aplicația pe telefon

- Cine își face cont și n-are niciun arbore ajunge la „Pornește-ți arborele” (`src/components/FamilyStart.tsx`): patru pași
  (tu, părinții, bunicii, arborele), cu numele de familie completate de la un pas la altul. `createFamilyTree`
  (`src/lib/family-start.ts`) face într-o singură tranzacție arborele, fișa revendicată a omului (în centru), părinții,
  bunicii și legăturile dintre ei; bunicii intră doar împreună cu părintele lor.
- După creare, `/arbore/{id}/bun-venit`: linkuri de invitație (unul pentru toți și câte unul pe numele fiecărei rude în viață),
  fișa și autobiografia omului, modul „la bunici”. `/arbore-nou` e același drum pentru încă un arbore, plus aducerea unui fișier GEDCOM.
- Aplicația pe telefon: `src/app/manifest.ts`, iconițele din `public/icons` și `src/app/apple-icon.png`, plus `public/sw.js`,
  care arată doar pagina „Nu ai internet acum” (`public/offline.html`) și nu ține nimic din arbore. Butonul „Pune aplicația”
  (`src/components/InstallApp.tsx`) deschide fereastra browserului pe Android și pe calculator și arată pașii din Safari pe iPhone.
  Când se schimbă `offline.html`, se schimbă și numele cache-ului din `sw.js`.

## Conturi, roluri și invitații

| Rol | Ce poate face |
| --- | --- |
| proprietar | tot, inclusiv să invite rude |
| editor | corectează tot arborele, invită rude |
| contributor | adaugă persoane, poze, documente |
| vizitator | doar vede |

Invitațiile sunt linkuri valabile 14 zile, folosibile o singură dată; în baza de date se păstrează doar hash-ul lor.
O invitație poate fi legată de o persoană în viață din arbore: când o acceptă, ruda își revendică fișa.

## Confidențialitate

Arborii sunt vizibili doar membrilor. Persoanele în viață sunt private în arbore, iar exportul GEDCOM
le ascunde implicit (`?living=1` le include, tot doar pentru membri).

- `/confidentialitate` și `/termeni`: textele pe înțelesul oricui, legate din subsolul fiecărei pagini și de la crearea contului.
  Cât timp site-ul e în probă (`BETA` în `src/lib/legal.ts`), de date răspunde Daniel Igna, ca persoană fizică, cu adresa de contact
  din același fișier; `OPERATOR_NAME` și `CONTACT_EMAIL` (pe Vercel) le înlocuiesc, de pildă când vine o firmă.
- `/datele-mele`: descărcarea tuturor datelor contului (JSON, `/api/datele-mele`), acordurile date și ștergerea contului.
  La ștergere pleacă tot ce e al omului; arborii cu alți membri trec la unul dintre ei, cei în care e singur se șterg
  cu totul, iar fișa lui rămâne în arbore fără legătura cu contul (și, dacă vrea, fără datele lui). Logica: `src/lib/account.ts`.
- Acordurile stau în tabelul `consent` (`src/lib/consent.ts`): `terms` la crearea contului și `faith` pentru capitolul
  „Credința”, cerut explicit înainte de primul răspuns (date din categoria specială, art. 9 GDPR). Retragerea lui șterge
  răspunsurile din capitol.

## Panoul de admin

`/admin` se vede doar pentru adresele din `ADMIN_EMAILS` (pe Vercel) și pentru cel care ține site-ul (`OWNER_ADMIN` în
`src/lib/admin.ts`: contul lui cu emailul verificat sau făcut înainte de regulă). Ceilalți primesc „pagina nu există”.

- **Prezentare**: câte un cartonaș cu cifrele de bază pentru fiecare zonă.
- **Oamenii** (`/admin/oameni`, `src/lib/admin-people.ts`): fiecare cont cu cât și-a crescut arborele, ce a folosit și până unde
  a ajuns (cont → arbore → rude chemate → amintiri), drumul tuturor, ce folosesc și câteva observații din cifre. Fișa unui om
  (`/admin/oameni/{id}`) arată arborii lui, ce a făcut săptămână cu săptămână și de pe ce dispozitiv intră. Doar numere: nimic
  din ce scriu oamenii și nimic din capitolul „Credința”.
- **Business**: creșterea, conținutul și banii posibili, cu limitele din Manager control.
- **Manager control** (`/admin/control`, `src/lib/plans.ts`): planul fiecărui cont (gratuit, gratuit mereu, „Familie”) cu o notă,
  limitele planului gratuit (persoane și fișiere pe arbore) și prețul pe an. Totul stă în tabelele `account_plan` și `app_setting`
  și nu se vede nicăieri în site cât timp plățile nu sunt pornite. GEDCOM și „Datele mele” rămân gratuite oricum.
- **Texte** (`/admin/texte`, `src/lib/texte.ts`): cuvântul de la finalul Călătoriei în timp, scris pentru toți arborii unde
  proprietarul n-a pus textul lui (stă în `app_setting`, cheia `cuvant_final`). Cu previzualizare și „Pune înapoi textul
  inițial”, care se întoarce la `DEFAULT_WORD` din `src/lib/cuvant-final.ts`.
- **Infra & Dev**: baza de date, migrațiile, erorile prinse, cheile de mediu (doar dacă sunt puse, niciodată valoarea).
