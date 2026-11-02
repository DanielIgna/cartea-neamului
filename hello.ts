/**
 * Neon Function „hello”: un punct de control public, fără date din arbori.
 * Aplicația îl apelează din /api/stare ca să verifice că funcțiile de pe ramura curentă răspund.
 */
export default async function hello(): Promise<Response> {
  return Response.json({
    ok: true,
    message: "Salutare din Neon Functions — Cartea Neamului",
    branch: process.env.NEON_BRANCH ?? null,
    time: new Date().toISOString(),
  });
}
