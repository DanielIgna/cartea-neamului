import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { ensureSchema } from "@/lib/bootstrap";

const h = toNextJsHandler(auth);
export async function GET(req: Request) { await ensureSchema(); return h.GET(req); }
export async function POST(req: Request) { await ensureSchema(); return h.POST(req); }
