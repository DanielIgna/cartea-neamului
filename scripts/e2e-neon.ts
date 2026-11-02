/**
 * Verificare cap-coadă a serviciilor Neon pe aplicația pornită (npm run start), cu contul demo din seed.
 * Rulează: npx tsx --env-file=.env.local scripts/e2e-neon.ts [http://localhost:3100]
 */
import { createRealtimeClient, type SealedLiveQuery } from "@neon/realtime/client";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { document, person, tree } from "../src/db/schema";
import { BUCKET } from "../src/lib/storage";
import type { PersonVersion } from "../src/lib/realtime";

const BASE = process.argv[2] ?? "http://localhost:3100";
const results: [string, boolean, string][] = [];
const ok = (name: string, pass: boolean, detail: string) => { results.push([name, pass, detail]); console.log(`${pass ? "✔" : "✘"} ${name}: ${detail}`); };

// 1. Autentificare (Better Auth, sesiuni în Postgres pe Neon)
const login = await fetch(`${BASE}/api/auth/sign-in/email`, {
  method: "POST", headers: { "content-type": "application/json", origin: BASE },
  body: JSON.stringify({ email: "demo@cartea-neamului.ro", password: "demo-parola-123" }),
});
const cookie = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
const me = (await login.json().catch(() => ({}))) as { user?: { id: string } };
ok("Autentificare cont demo", login.ok && !!cookie, `HTTP ${login.status}`);
const h = { cookie, origin: BASE };

// 2. Arborele din Neon
const [t] = await db.select().from(tree).where(eq(tree.name, "Neamul Pop din Ieud"));
const page = await fetch(`${BASE}/arbore/${t.id}`, { headers: h });
const html = await page.text();
ok("Arbore încărcat din Neon Postgres", page.ok && html.includes("Ascendenții lui"), `HTTP ${page.status}, ${(await db.select().from(person).where(eq(person.treeId, t.id))).length} persoane în baza Neon`);

// 3. Object Storage: upload + citire înapoi prin URL presemnat
const [toader] = await db.select().from(person).where(and(eq(person.treeId, t.id), eq(person.gedcomXref, "@I8@")));
const bytes = new TextEncoder().encode(`%PDF-1.4\n% test Cartea Neamului ${Date.now()}\n%%EOF\n`);
const form = new FormData();
form.set("personId", toader.id); form.set("title", "Test e2e: act scanat"); form.set("kind", "act"); form.set("dateText", "1920");
form.set("file", new File([bytes], "act-test.pdf", { type: "application/pdf" }));
const up = await fetch(`${BASE}/api/arbore/${t.id}/documente`, { method: "POST", headers: h, body: form });
const doc = (await up.json()) as { id?: string; error?: string };
ok("Upload document în bucket „assets”", up.status === 201 && !!doc.id, `HTTP ${up.status} ${doc.error ?? `document ${doc.id}`}`);
const open = await fetch(`${BASE}/api/document/${doc.id}`, { headers: h, redirect: "manual" });
const signed = open.headers.get("location") ?? "";
const back = signed ? new Uint8Array(await (await fetch(signed)).arrayBuffer()) : new Uint8Array();
ok("Citire înapoi prin URL presemnat", open.status === 302 && Buffer.from(back).equals(Buffer.from(bytes)),
  `redirect ${open.status} spre ${signed ? new URL(signed).host : "-"} (semnătură în query: ${signed.includes("X-Amz-Signature")}), ${back.length} octeți identici`);
const anon = await fetch(`${BASE}/api/document/${doc.id}`, { redirect: "manual" });
ok("Document refuzat fără cont", anon.status === 401, `HTTP ${anon.status}`);

// 4. Neon Function + starea serviciilor
const stare = await fetch(`${BASE}/api/stare`, { headers: h });
const s = (await stare.json()) as Record<string, { ok: boolean; detail: unknown }>;
ok("Neon Function „hello”", !!s.function?.ok, JSON.stringify(s.function?.detail));
ok("Postgres + bucket în /api/stare", !!s.postgres?.ok && !!s.storage?.ok, `${JSON.stringify(s.postgres?.detail)} · ${JSON.stringify(s.storage?.detail)}`);

// 5. Realtime: abonare ca browserul, apoi „altă rudă” adaugă o persoană
const sealedRes = await fetch(`${BASE}/api/arbore/${t.id}/live`, { method: "POST", headers: h, body: JSON.stringify({ userId: me.user?.id }) });
const sealed = (await sealedRes.json()) as SealedLiveQuery<PersonVersion>;
const client = createRealtimeClient({ url: process.env.NEON_REALTIME_URL! });
const sub = client.subscribe(sealed);
await sub.awaitRows((rows) => rows.length > 0, 15_000);
const initial = sub.getSnapshot().data ?? [];
const t0 = Date.now();
const got = sub.awaitRows((rows) => rows.length === initial.length + 1, 20_000);
const [added] = await db.insert(person).values({ treeId: t.id, givenName: "Rudă", surname: "Test Realtime", createdBy: me.user?.id }).returning();
try {
  await got;
  ok("Eveniment Neon Realtime", true, `${initial.length} rânduri inițiale; persoana adăugată de „altă rudă” a sosit live în ${Date.now() - t0} ms de la inserare (${sub.getSnapshot().data?.length} rânduri)`);
} catch (e) {
  ok("Eveniment Neon Realtime", false, String(e));
}
sub.unsubscribe(); client.close();
await db.delete(person).where(eq(person.id, added.id));
const anonLive = await fetch(`${BASE}/api/arbore/${t.id}/live`, { method: "POST", body: "{}" });
ok("Interogare live refuzată fără cont", anonLive.status === 401, `HTTP ${anonLive.status}`);

// 6. AI Gateway
const ai = process.env.NEON_AI_GATEWAY_BASE_URL
  ? await fetch(`${process.env.NEON_AI_GATEWAY_BASE_URL}/v1/models`, { headers: { authorization: `Bearer ${process.env.NEON_AI_GATEWAY_TOKEN}` } }).then((r) => `HTTP ${r.status}`)
  : "NEON_AI_GATEWAY_* lipsesc (planul Free nu permite AI Gateway)";
ok("Neon AI Gateway", ai === "HTTP 200", ai);

// Curățenie: documentele de test (rând + fișier din bucket)
const s3 = new S3Client({ forcePathStyle: true });
for (const d of await db.select().from(document).where(eq(document.title, "Test e2e: act scanat"))) {
  if (d.fileKey) await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: d.fileKey }));
  await db.delete(document).where(eq(document.id, d.id));
}

const failed = results.filter((r) => !r[1]).length;
console.log(`\n${results.length - failed}/${results.length} verificări trecute`);
process.exit(0);
