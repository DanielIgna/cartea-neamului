/**
 * Platformele unde cardurile cadou digitale (coduri de activare, Admin → Coduri de activare) se vând prin înscriere ca vânzător,
 * nu printr-un email către cumpărători (Daniel, 25.11.2026). Verificat pe paginile oficiale în 25.11.2026; condițiile se pot
 * schimba, deci se recitesc la înscriere. Se arată în Admin → CRM → Magazine online.
 */
export type Platform = { nume: string; prioritate: "acum" | "după Crăciun" | "nu"; link: string; cum: string; cost: string; nota: string; sursa: string };

export const PLATFORME: Platform[] = [
  {
    nume: "Trendyol", prioritate: "acum", link: "https://www.trendyol.com/ro", cum: "Cont de vânzător (deja în lucru, primul canal).",
    cost: "Comisionul din contractul Trendyol.", nota: "Sursa codurilor în Admin → Coduri de activare: „trendyol”.", sursa: "https://www.trendyol.com/ro",
  },
  {
    nume: "eMAG Marketplace", prioritate: "acum", link: "https://marketplace.emag.ro/infocenter/start-selling/",
    cum: "Înregistrare ca seller pe firmă (PFA-ul), apoi contractul și produsul; fiecare comandă are AWB, deci cel mai sigur e cardul tipărit în plic.",
    cost: "Fără taxă de înscriere; comision 7–25% în funcție de categorie, grila exactă e în contract.",
    nota: "Aprobarea ia câteva zile: înscrie-te azi ca să prinzi Crăciunul. Întreabă la înscriere dacă un cod digital fără livrare e permis în categoria aleasă.",
    sursa: "https://marketplace.emag.ro/infocenter/start-selling/taxe-si-comisioane/",
  },
  {
    nume: "Librarie.net", prioritate: "acum", link: "https://www.librarie.net/contact",
    cum: "Formularul de contact, departamentul „furnizori”, sau telefonul pentru furnizori 0722 234 282 (L–V 8–17).",
    cost: "Discountul de revânzare se negociază.", nota: "Nu are o adresă de email publică; e și în lista de magazine de mai sus, cu telefonul.",
    sursa: "https://www.librarie.net/contact",
  },
  {
    nume: "Etsy (diaspora)", prioritate: "după Crăciun", link: "https://www.etsy.com/sell",
    cum: "Magazin Etsy cu un produs digital descărcabil: un „kit al familiei” în PDF făcut de tine (fișă de arbore + întrebări pentru bunici) care include codul.",
    cost: "Taxă de listare și comision la vânzare, afișate pe etsy.com/sell.",
    nota: "Etsy cere ca produsul să fie făcut sau desenat de tine, iar serviciile simple nu sunt permise; un cod singur poate fi respins. Recitește regulile Etsy înainte.",
    sursa: "https://www.etsy.com/sell",
  },
  {
    nume: "Kaufland Global Marketplace (diaspora DE, AT etc.)", prioritate: "după Crăciun", link: "https://www.kauflandglobalmarketplace.com/en/seller-registration/",
    cum: "Înregistrare ca vânzător, un singur cont pentru toate țările Kaufland.",
    cost: "Abonament de la 39,95 €/lună + TVA, plus comision pe categorie.", nota: "Merită doar dacă vânzările din diaspora acoperă abonamentul.",
    sursa: "https://www.kauflandglobalmarketplace.com/en/conditions/",
  },
  {
    nume: "Altex Marketplace", prioritate: "nu", link: "https://altex.ro/marketplace/",
    cum: "Formularul „Înscrie-te acum”.", cost: "Comision unic 8% la comenzile peste 100 lei.",
    nota: "Preferă firme cu minimum doi ani și cifră de afaceri de cel puțin 300.000 € în ultimul an, deci șanse mici acum.",
    sursa: "https://altex.ro/marketplace/",
  },
  {
    nume: "Amazon", prioritate: "nu", link: "https://sellercentral.amazon.com/help/hub/reference/external/G200164450",
    cum: "—", cost: "—", nota: "Cardurile cadou și codurile de valoare se vând doar de vânzători aprobați dinainte de Amazon.",
    sursa: "https://sellercentral.amazon.com/help/hub/reference/external/G200164450",
  },
  {
    nume: "eBay", prioritate: "nu", link: "https://www.ebay.com/help/policies/prohibited-restricted-items/gift-cards-policy?id=4294",
    cum: "—", cost: "—", nota: "eBay interzice cardurile cadou, inclusiv codurile digitale și voucherele de servicii.",
    sursa: "https://www.ebay.com/help/policies/prohibited-restricted-items/gift-cards-policy?id=4294",
  },
];

/** Cele pe care nu le-am putut verifica de aici (Daniel le poate întreba direct, în librărie). */
export const DE_VERIFICAT = [
  "Humanitas (libhumanitas.ro): site-ul cere o verificare anti-roboți, deci adresa nu e luată de acolo; întreabă în librărie cine se ocupă de furnizori.",
  "Diverta: diverta.ro e o firmă de hărți, nu lanțul de librării, iar dol.ro nu răspunde; contactul se cere într-o librărie Diverta.",
];
