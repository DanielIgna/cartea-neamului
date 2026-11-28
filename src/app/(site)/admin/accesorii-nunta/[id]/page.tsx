import { AdminCategoryProduct } from "@/components/admin/MagazinAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Produs · Accesorii nuntă · Admin" };

/** Admin → Accesorii nuntă → un produs: starea, fișierul, pozele, textele și ștergerea. */
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  return <AdminCategoryProduct category="accesorii" id={(await params).id} q={await searchParams} />;
}
