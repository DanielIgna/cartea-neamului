import Link from "next/link";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin-access";
import { activeImages, HOME_SLOTS, homeImagesState, isMultiSlot, MAX_ACTIVE, slotOptions } from "@/lib/home-images";
import { storageConfigured } from "@/lib/storage";
import { AdminNav } from "@/components/admin/ui";
import HomeImageSlot from "@/components/admin/HomeImageSlot";

export const dynamic = "force-dynamic";
export const metadata = { title: "Poze prima pagină · Admin" };

/**
 * Pozele primei pagini, pe care adminul le schimbă singur: bannerul, cele patru generații, cartonașele și benzile.
 * Fiecare loc are poza inițială și câteva variante (Unsplash, licență liberă); un clic alege ce stă pe pagină, iar adminul
 * poate adăuga pozele lui. La banner se pot alege mai multe, care se schimbă singure.
 */
export default async function AdminHomeImages() {
  await requireAdmin("/admin/poze");
  const state = await homeImagesState(db);
  return (
    <section className="stack">
      <AdminNav active="poze" />
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Pozele de pe prima pagină</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Alege ce poze stau pe <Link href="/">prima pagină</Link>: apasă pe o poză ca s-o pui pe pagină. La banner poți bifa mai multe,
          care se schimbă singure. Schimbarea se vede imediat, pentru toți. Pune doar poze pe care ai voie să le
          folosești: ale tale, cu acordul celor din ele, sau de pe site-uri cu licență liberă (Unsplash, Pexels). Pozele gata puse aici sunt de pe Unsplash și se pot folosi liber.
        </p>
        {!storageConfigured() && <p className="err">Locul pentru fișiere (Neon Storage) nu e pornit, deci deocamdată nu se pot încărca poze.</p>}
      </div>
      <div className="home-slots">
        {HOME_SLOTS.map((s) => (
          <HomeImageSlot key={s.id} slot={s.id} label={s.label} hint={s.hint} wide={"wide" in s && s.wide} multi={isMultiSlot(s.id)} max={MAX_ACTIVE}
            options={slotOptions(s.id, state[s.id])} active={activeImages(s.id, state[s.id]).map((i) => i.id)} />
        ))}
      </div>
    </section>
  );
}
