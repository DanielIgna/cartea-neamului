import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { ensureSchema } from "@/lib/bootstrap";

const h = toNextJsHandler(auth);
export async function GET(req: Request) { await ensureSchema(); return h.GET(req); }
export async function POST(req: Request) {
  await ensureSchema();
  if (!new URL(req.url).pathname.endsWith("/request-password-reset")) return h.POST(req);
  // „Ai uitat parola?”: același răspuns, în cam același timp, fie că emailul are cont, fie că nu (better-auth adaugă
  // altfel un mesaj doar când contul lipsește). Erorile (email scris greșit, prea multe cereri) rămân cum sunt.
  const [res] = await Promise.all([h.POST(req), new Promise((r) => setTimeout(r, 600))]);
  return res.ok ? Response.json({ status: true }) : res;
}
