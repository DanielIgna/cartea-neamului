import { AdminCategoryNew } from "@/components/admin/MagazinAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nou · Accesorii nuntă · Admin" };

/** Admin → Accesorii nuntă → Adaugă: textele și prețul; fișierul și pozele se pun după salvare. */
export default function Page() {
  return <AdminCategoryNew category="accesorii" />;
}
