import { AdminCategoryProduct } from "@/components/admin/MagazinAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produs · Jurnale de familie · Admin" };

/** Admin → Jurnale de familie → un produs: starea, fișierul, pozele, textele și ștergerea. */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  return <AdminCategoryProduct category="jurnal" id={(await params).id} q={await searchParams} />;
}
