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
  Cine răspunde de date vine din `OPERATOR_NAME` și `CONTACT_EMAIL` (puse pe Vercel, ca adresa să nu stea în cod).
- `/datele-mele`: descărcarea tuturor datelor contului (JSON, `/api/datele-mele`), acordurile date și ștergerea contului.
  La ștergere pleacă tot ce e al omului; arborii cu alți membri trec la unul dintre ei, cei în care e singur se șterg
  cu totul, iar fișa lui rămâne în arbore fără legătura cu contul (și, dacă vrea, fără datele lui). Logica: `src/lib/account.ts`.
- Acordurile stau în tabelul `consent` (`src/lib/consent.ts`): `terms` la crearea contului și `faith` pentru capitolul
  „Credința”, cerut explicit înainte de primul răspuns (date din categoria specială, art. 9 GDPR). Retragerea lui șterge
  răspunsurile din capitol.
