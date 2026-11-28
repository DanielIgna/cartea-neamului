import { AdminCategoryList } from "@/components/admin/MagazinAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accesorii nuntă · Admin" };

/** Admin → Accesorii nuntă: comutatorul rubricii, produsele (cu vânzări) și ultimele comenzi. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <AdminCategoryList category="accesorii" q={await searchParams} />;
}
