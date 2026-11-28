import { AdminCategoryList } from "@/components/admin/MagazinAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Jurnale de familie · Admin" };

/** Admin → Jurnale de familie: comutatorul rubricii, produsele (cu vânzări) și ultimele comenzi. */
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <AdminCategoryList category="jurnal" q={await searchParams} />;
}
