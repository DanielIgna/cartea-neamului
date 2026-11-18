# CRM autonom – inventarul a ce există deja (Regula 0)

Scris pe 17.11.2026, înainte de orice cod pentru CRM. Scopul: CRM-ul se construiește **pe ce există**. Pentru fiecare piesă:
unde e în cod, ce tabele citește/scrie și ce face CRM-ul cu ea (refolosește / leagă / lipsește).

## 1. Paginile din /admin și ce citesc

Meniul e definit într-un singur loc: `src/lib/admin-menu.ts` (orice pagină nouă se adaugă acolo). Accesul: `requireAdmin()` /
`adminReady()` din `src/lib/admin-access.ts` (cine nu e admin vede 404; în producție cere verificarea în 2 pași). Componentele de UI:
`src/components/admin/ui.tsx` (`AdminNav`, `Stat`, `HBars`, `Bars`, `num`, `day`, `ago`…), stilurile `card`, `tbl`, `stats`, `form`.

| Pagina | Fișiere | Tabele citite |
|---|---|---|
| Panou de bord `/admin` | `admin/page.tsx`, `lib/admin-briefing.ts` | user, payment, problem_report, audit_log, security_event, seo_* |
| Oameni `/admin/oameni` (+ fișa `[id]`) | `lib/admin-people.ts` (`peopleList`, `stageOf`, `funnelOf`), `lib/sursa.ts` | user, tree, tree_member, person, invitation, memory, consent, usage_day, account_source, account_plan |
| Business `/admin/business` | `lib/admin-stats.ts` → `businessStats` | user, session, account, tree, person, document, message, invitation, join_request, place_contact, book_export |
| Infra & Dev `/admin/infra` | `lib/admin-stats.ts` → `infraStats`, `lib/admin.ts` | audit_log (erori), tabele de mărime, variabile de mediu (doar dacă sunt puse) |
| Analiză `/admin/analiza` | `lib/analiza.ts`, `lib/conversii.ts`, `lib/sursa.ts` | page_view, visit_salt, conversion, account_source, source_link, payment |
| SEO `/admin/seo` | `lib/seo*.ts`, `lib/motor-seo/*`, `lib/continut/prag` | seo_queue, app_setting (Search Console), automation_run |
| Autonomie `/admin/autonomie` | `lib/autonomie.ts` | automation_run, automation_mark, autonomy_snapshot, app_setting `automatizari` |
| Creștere `/admin/crestere` | `lib/crestere.ts` | invitation, invite_referral, consent (`news`), automation_mark (`bun-venit`), page_view (utm) |
| Invitații `/admin/invitatii` | `lib/invitatii.ts` | invite_code, invite_referral, invite_click, app_setting |
| Linkuri cu sursă `/admin/linkuri` | `lib/sursa.ts`, `app/linkuri-actions.ts` | source_link, page_view.source, account_source |
| Calendar de conținut `/admin/calendar` | `lib/calendar-continut.ts` | app_setting (marcaje „făcut/sărit”), page_view (vizite pe utm) |
| City Partners `/admin/parteneri` (+ `[id]`, `kit`, raport CSV) | `lib/parteneri-crm.ts`, `lib/carduri-cadou.ts` | partners, partner_contact_log, partner_referral, gift_cards, gift_card_batches |
| Carduri cadou / Parteneri magazine `/admin/carduri` | `lib/carduri-cadou.ts` | gift_card_batches, gift_cards, gift_card_attempt, partners |
| Sănătatea afacerii `/admin/sanatate` | `lib/sanatate-afacere.ts` | user, payment, conversion, page_view, invite_referral, app_setting |
| Conversie `/admin/conversie` | `lib/conversie.ts`, `lib/conversie-mail.ts` | conversion_mail, conversion_offer, app_setting `conversie` |
| Învățare `/admin/invatare`, Control, Istoric, Securitate, Email, Arhivă, Probleme, Propuneri, ADN, Poze, Texte, Cunoștințe | fișierele cu același nume din `lib/` | nu sunt atinse de CRM |

**Cifre incoerente (18 vs 19):** Oameni scoate contul demo (`DEMO_EMAIL`, `lib/admin-people.ts`), Business și Infra
numără tot tabelul `user`. Repararea (demo + `@example.com` + sursă `test-link-*`, filtru „ascunde conturile de test”) o face firul
„Repară live și secțiunea Școli”, în `src/lib/conturi-test.ts` (`testAccountSql`, `realAccountSql`, `isTestAccount`). CRM-ul
**folosește același helper** pentru toate cifrele lui.

## 2. Tabelele care contează pentru CRM

| Ce | Tabel(e) | Fișier |
|---|---|---|
| Utilizatori | `user` (Better Auth; `free_until` = zile câștigate prin invitații) + `session`, `account` | `db/schema.ts` |
| Arbori și persoane | `tree`, `tree_member`, `person`, `relationship`, `document`, `memory` | `db/schema.ts` |
| Abonamente / plăți | `account_plan` (plan, tier, paid_until, keep_until), `payment` (id = sesiunea Stripe) | `lib/plans.ts`, `lib/plati.ts` |
| Codurile de reducere fixe | `TEST90`, `NEAM90` sunt coduri promoționale **în Stripe** (nu în baza noastră) | — |
| Invitații în arbore | `invitation` (token, valabil 14 zile: `INVITE_VALID_DAYS`) | `lib/invitations.ts` |
| Programul de recomandări | `invite_code` (/i/&lt;cod&gt;), `invite_referral` (cine pe cine a adus, status, zile date), `invite_click`; setări în app_setting: implicit +7 zile celui care invită, +7 celui invitat (se schimbă din Admin → Invitații), plafon 20/lună | `lib/invitatii.ts` |
| Linkuri `?src=` | `source_link` (linkurile făcute), `account_source` (sursa primului/ultimului contact, răspunsul din formular, `invite`) – sursa se scrie doar cu cookie-urile de analiză acceptate | `lib/sursa.ts`, `lib/sursa-shared.ts` |
| Vizite anonime | `page_view` (fără cookie, `source` = eticheta ?src), `visit_salt` | `lib/vizite.ts` |
| Atribuirea conversiilor | `conversion` (cta, cont, arbore, plata-start, plata) | `lib/conversii.ts` |
| Consimțământ | `consent` (user_id, purpose, text_version, granted, created_at) – un jurnal, ultima alegere contează. Scopuri: `terms`, `faith`, `usage`, `withdrawal`, `news` (sfaturi pe email), `conversie` (doar dezabonarea) | `lib/consent.ts`, `lib/legal.ts` |
| Consimțământ parteneri | `partner_consent` (PropManage), `propmanage_invite` | `lib/partners.ts`, `lib/propmanage-cont.ts` |
| Carduri cadou | `gift_card_batches`, `gift_cards` (generat → livrat → vândut → folosit), `gift_card_attempt` | `lib/carduri-cadou.ts` |
| Parteneri (magazine și firme) | `partners` (are deja `etapa` prospect→activ, `tip` magazin/firma, `ref_code`, `urmatorul_pas_la`), `partner_contact_log`, `partner_referral` | `lib/parteneri-crm.ts` |
| Vești în cont | `user_notice` | `lib/invitatii.ts` |
| Setări | `app_setting` (cheie → JSON) | peste tot |

## 3. Joburi programate și email

- **Un singur ceas:** `vercel.json` → `/api/cron/autonomie` zilnic la 05:15 UTC, cu `CRON_SECRET`. Rulează `runLoop` din
  `lib/autonomie.ts` (fiecare automatizare pornită și scadentă, jurnal în `automation_run`, deduplicare în `automation_mark`,
  oprire singură după 3 erori) și `sweepRewards` (invitațiile).
- Automatizările existente (comutator în Admin → Autonomie): `sanatate`, `curatenie`, `sitemap` (retrimiterea sitemap-ului, săptămânal),
  `aminteste-proba`, `aminteste-an`, `bun-venit`, `probleme-vechi`, `arhivare`, `motor-seo`, `conversie`.
- `/api/cron/aminteste-plata`: rută veche, păstrată, nu e în vercel.json.
- **Atenție la plan:** pe Vercel Hobby un cron poate rula cel mult o dată pe zi; un cron „la oră” trebuie Vercel Pro. Jobul CRM se
  agață de ceasul existent (ca automatizare în plus) și are buton „Rulează acum”; când trecem pe Pro, se poate muta pe oră fără alt cod.
- **Email:** Resend, `lib/email.ts` → `sendEmail({to, subject, html, text, idempotencyKey, tag})`, cheie `RESEND_API_KEY`, expeditor
  `contact@carteaneamului.ro`. Șabloane: `lib/emailuri.ts` (`renderMail`, `footerFor`). Fără cheie, emailul e sărit, nu cade nimic.
- Dezabonare: `/dezabonare?l=…` + `/api/vesti/dezabonare` (semnătură HMAC pe user), pentru `vesti` și `conversie`.

## 4. Emailurile de conversie din trial

**Există deja (PR #139), nu se dublează:** `lib/conversie.ts` + `lib/conversie-mail.ts`, tabele `conversion_mail` și
`conversion_offer`. Pașii: ziua 1 (bun venit), 3 (progres + invitație), 5 (planuri), 7 (ultima zi), 8 (cod unic de 20% pe 48 h, cupon
Stripe, o folosire), 14 (ultima reamintire); zilele/procentul se schimbă din Admin → Conversie. Automatizarea `conversie` e **oprită**
până o pornește Daniel. Statistici în Analiză → Conversii. CRM-ul doar le citește (activități + cifre).

Sfaturile de bun venit (`bun-venit`, 5 emailuri în 21 de zile) există, dar au 0 trimise: bifa de consimțământ e reparată în firul
„Repară live și secțiunea Școli”.

## 5. Ce lipsește și se construiește acum (simplu)

Nu există în acest cod: pipeline de lead-uri pentru organizații, scoring, coadă de aprobări generală, listă globală „nu contacta”,
jurnal de activități pe organizații (în afară de `partner_contact_log`), ingestie de evenimente din afară, import CSV, formular
/parteneriate. Folderul `/import` cu CSV-urile nu e încă în repo.

Tabele noi (migrația 0040, Etapa 1): `crm_organizations`, `crm_contacts`, `crm_activities`, `crm_deals`, `crm_approvals`,
`crm_suppression`, `crm_user_signals` (scor + etapă pe user, fără a dubla `user`).

Se construiesc în alte fire și se refolosesc aici: filtrul de conturi de test (`lib/conturi-test.ts`), pasul ghidat + emailul de
24 h, mesajul „Invită-l pe…” după 5 persoane, generatorul de linkuri pentru grupuri Facebook, Admin → Școli (`lib/scoli.ts`:
`school`, `school_request`, `school_code`, `createSchoolCode` în Stripe).

## 6. Ce NU se portează

Rapoarte AI nocturne, bucle de autoreparare la câteva minute, scoruri de sănătate multiple, date demo în producție. Nimic pe site nu
pomenește uneltele de construcție.

## 7. Setări în Vercel (18 noiembrie 2026)

Puse în producție: CRM_INGEST_TOKEN (ingestia CRM), NEXT_PUBLIC_TURNSTILE_SITE_KEY și TURNSTILE_SECRET_KEY („nu sunt robot” la
contul nou), BETTER_AUTH_URL=https://carteaneamului.ro. Cheia Turnstile intră și în CSP la build, deci orice schimbare a ei cere o
publicare nouă.
