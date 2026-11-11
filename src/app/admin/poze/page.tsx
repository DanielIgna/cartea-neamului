import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { HOME_SLOTS, homeImages } from "@/lib/home-images";
import { storageConfigured } from "@/lib/storage";
import { AdminNav } from "@/components/admin/ui";
import HomeImageSlot from "@/components/admin/HomeImageSlot";

export const dynamic = "force-dynamic";
export const metadata = { title: "Poze prima pagină · Admin" };

/**
 * Pozele primei pagini, pe care adminul le schimbă singur: bannerul, cele patru generații, cartonașele și benzile.
 * Fiecare loc are poza inițială (Unsplash, licență liberă); o poză încărcată o înlocuiește până apeși „Pune înapoi”.
 */
export default async function AdminHomeImages() {
  await requireAdmin("/admin/poze");
  const imgs = await homeImages(db);
  return (
    <section className="stack">
      <AdminNav active="poze" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pozele de pe prima pagină</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Schimbă orice poză de pe <Link href="/">prima pagină</Link>. Poza nouă se vede imediat, pentru toți. Pune doar poze pe care ai voie să le
          folosești: ale tale, cu acordul celor din ele, sau de pe site-uri cu licență liberă (Unsplash, Pexels). Pozele inițiale sunt de pe Unsplash.
        </p>
        {!storageConfigured() && <p className="err">Locul pentru fișiere (Neon Storage) nu e pornit, deci deocamdată nu se pot încărca poze.</p>}
      </div>
      <div className="home-slots">
        {HOME_SLOTS.map((s) => (
          <HomeImageSlot key={s.id} slot={s.id} label={s.label} hint={s.hint} src={imgs[s.id].src} original={`/home/${s.file}.jpg`}
            custom={imgs[s.id].custom} wide={"wide" in s && s.wide} />
        ))}
      </div>
    </section>
  );
}
