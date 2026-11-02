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

## Stack (toate cu plan gratuit)

- **Next.js 15** (App Router, React 19, TypeScript)
- **PostgreSQL**: local cu PGlite; în cloud cu **Neon** (setezi `DATABASE_URL`, vezi `.env.example`)
- **Drizzle ORM** pentru schemă și migrații (`src/db/schema.ts`, `drizzle/`)
- Urmează: **Better Auth** pentru conturi, **Cloudflare R2** pentru fișiere, **Stripe** pentru plata cărții

## Structură

```
src/db/          schema și conexiunea (PGlite sau Neon)
src/lib/         logica: GEDCOM, ascendenți (CTE recursiv + Ahnentafel), date aproximative, evenimente istorice
src/app/         paginile: lista de arbori, arborele, cronologia, API export GEDCOM
src/components/  evantaiul, arborele clasic, fișa persoanei
tests/           teste Vitest (rulează pe un Postgres în memorie)
fixtures/        familia de exemplu în format GEDCOM
```

## Confidențialitate

Persoanele în viață sunt private în arbore. Exportul GEDCOM le ascunde implicit (`?living=1` le include,
pentru membrii arborelui, după ce adăugăm conturile).
