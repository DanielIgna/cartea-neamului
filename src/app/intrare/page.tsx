import { redirect } from "next/navigation";
import { currentUser } from "@/lib/access";
import AuthForm from "@/components/AuthForm";

export const dynamic = "force-dynamic";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ next?: string; mod?: string }> }) {
  const { next, mod } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (await currentUser()) redirect(safeNext);
  return <div className="card" style={{ maxWidth: 440, margin: "0 auto" }}><AuthForm next={safeNext} startWithSignUp={mod === "cont-nou"} /></div>;
}
