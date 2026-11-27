import { db } from "@/db";
import { isLocale, localizedPath, type Locale } from "@/i18n/locales";
import { modelBySlug, modelPath } from "@/lib/invitatii-nunta";
import { createShopCheckout, shopOpen, shopPaymentsReady, shopWaiver } from "@/lib/invitatii-nunta-server";
import { siteOrigin } from "@/lib/site";

/**
 * „Cumpără și descarcă” de pe /invitatii-nunta/<model>: fără cont. Prețul se ia din catalog după model și limba paginii
 * (45 lei pe română, 9 € în celelalte), nu din formular. Fără bifa pentru acces imediat, omul se întoarce pe pagină.
 */
export async function POST(req: Request) {
  const origin = await siteOrigin();
  const form = await req.formData();
  const model = modelBySlug(form.get("slug"));
  const l = form.get("locale");
  const locale: Locale = isLocale(l) ? l : "ro";
  if (!model) return Response.redirect(`${origin}${localizedPath("/invitatii-nunta", locale)}`, 303);
  const back = (q: string) => Response.redirect(`${origin}${localizedPath(modelPath(model), locale)}?${q}#cumpara`, 303);
  if (!shopPaymentsReady() || !(await shopOpen(db))) return back("eroare=oprit");
  if (form.get("acord") !== "on") return back("eroare=acord");
  try {
    const url = await createShopCheckout({ model, locale, origin, ...shopWaiver(locale, origin) });
    return Response.redirect(url, 303);
  } catch (e) {
    console.error("invitatii-nunta start", e instanceof Error ? e.message : "Error");
    return back("eroare=1");
  }
}
