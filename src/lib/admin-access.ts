import { notFound } from "next/navigation";
import { currentUser, requireUser } from "./access";
import { isAdminUser } from "./admin";

export async function isAdmin() {
  const me = await currentUser();
  return isAdminUser(me);
}

/** Paginile de admin: cine nu e admin vede „pagina nu există”, ca să nu afle nici că panoul e acolo. */
export async function requireAdmin(next = "/admin") {
  const me = await requireUser(next);
  if (!isAdminUser(me)) notFound();
  return me;
}
