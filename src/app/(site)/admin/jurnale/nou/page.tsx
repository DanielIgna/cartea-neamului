import { AdminCategoryNew } from "@/components/admin/MagazinAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nou · Jurnale de familie · Admin" };

/** Admin → Jurnale de familie → Adaugă: textele și prețul; fișierul și pozele se pun după salvare. */
export default function Page() {
  return <AdminCategoryNew category="jurnal" />;
}
