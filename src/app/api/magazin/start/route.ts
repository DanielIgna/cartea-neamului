import { db } from "@/db";
import { isLocale, localizedPath, type Locale } from "@/i18n/locales";
import { SHOP_CATEGORIES, modelPath } from "@/lib/invitatii-nunta";
import { publishedModel } from "@/lib/invitatii-nunta-produse";
import { createShopCheckout, parseShopBuyer, shopOpen, shopPaymentsReady, shopWaiver } from "@/lib/invitatii-nunta-server";
import { siteOrigin } from "@/lib/site";

/**
 * „Cumpără și descarcă” pentru accesoriile de nuntă și jurnalele de familie (Daniel, 28.11.2026): aceeași plată Stripe fără cont
 * ca la invitații, dar fără câmpul de cod (codurile invitațiilor nu se aplică aici). Prețul se ia din baza de date (produsul
 * publicat, scris din Admin) după limba paginii, niciodată din formular. Invitațiile au ruta lor, neschimbată.
 */
export async function POST(req: Request) {
  const origin = await siteOrigin();
  const form = await req.formData();
  const c = form.get("category");
  const category = c === "accesorii" || c === "jurnal" ? c : null;
  const l = form.get("locale");
  const locale: Locale = isLocale(l) ? l : "ro";
  if (!category) return Response.redirect(`${origin}${localizedPath("/produse", locale)}`, 303);
  const model = await publishedModel(db, form.get("slug"), category);
  if (!model) return Response.redirect(`${origin}${localizedPath(SHOP_CATEGORIES[category].path, locale)}`, 303);
  const back = (q: string) => Response.redirect(`${origin}${localizedPath(modelPath(model), locale)}?${q}#cumpara`, 303);
  if (!shopPaymentsReady() || !(await shopOpen(db, category))) return back("eroare=oprit");
  const who = parseShopBuyer(form);
  if (!who.ok) return back(`eroare=${who.error}`);
  if (form.get("acord") !== "on") return back("eroare=acord");
  try {
    const url = await createShopCheckout({ model, locale, origin, ...shopWaiver(locale, origin, category), buyer: who.buyer });
    return Response.redirect(url, 303);
  } catch (e) {
    console.error("magazin start", e instanceof Error ? e.message : "Error");
    return back("eroare=1");
  }
}
