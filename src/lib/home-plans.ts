import { getT } from "@/i18n/server";
import type { Locale } from "@/i18n/locales";
import type { HomePlan } from "@/components/HomePlans";
import { LIMIT_KEYS, PERIODS, TIERS, comparePrice, periodPrice, tierBook, tierLimits, tierPrice, yearSaving, type Period, type PlanSettings } from "./plans";
import { money } from "./plati";

/**
 * Cardurile planurilor Basic / Familie / Premium, cu prețul pe fiecare perioadă (lunar, la 3 luni, anual), prețul tăiat cinstit,
 * reînnoirea și plafoanele, din setările din Admin. Aceleași pe prima pagină și în magazin (/produse), ca prețurile să nu difere.
 */
export async function homePlanCards(s: PlanSettings, locale: Locale) {
  const [tsub, tpr, tp] = await Promise.all([getT("Sub", locale), getT("Preturi", locale), getT("Plata", locale)]);
  const lei = locale === "ro";
  const nf = new Intl.NumberFormat(locale);
  const label = (v: { lei: number; eur: number }) => money(lei ? v.lei : v.eur, locale).label;
  const periods: Period[] = s.subs ? [...PERIODS] : ["an"];
  const bestSaving = s.subs ? Math.max(...TIERS.map((x) => yearSaving(x, s, lei))) : 0;
  const plans: HomePlan[] = TIERS.map((x) => {
    const lim = tierLimits(x, s), book = tierBook(x, s), name = tp(`tiers.${x}.name`);
    const year = label(tierPrice(x, true, s));
    const at = (p: Period) => {
      const v = s.subs || p === "an" ? periodPrice(x, p, true, s) : null;
      return v ? (s.subs ? tsub("price", { price: label(v), per: tsub(`per.${p}`) }) : tp("perYear", { price: label(v) })) : null;
    };
    const wasAt = (p: Period) => {
      const w = comparePrice(x, p, true, s, false, lei);
      return w && w.kind === "monthly" ? { price: money(w.was, locale).label, note: tpr("wasMonthly", { count: w.count, price: money(w.month, locale).label }) } : null;
    };
    const renew = s.subs ? label(periodPrice(x, "an", true, s, true)!) : year;
    const saving = s.subs ? yearSaving(x, s, lei) : 0;
    return {
      key: x, name, badge: x === "familie" ? tp("recommended") : undefined,
      price: { luna: at("luna"), trimestru: at("trimestru"), an: at("an") },
      was: { luna: wasAt("luna"), trimestru: wasAt("trimestru"), an: wasAt("an") },
      orYear: tpr("orYear", { price: year }),
      save: saving > 0 ? tsub("saveYear", { percent: saving }) : "",
      renew: renew !== year ? tsub("renewFrom", { price: renew }) : "",
      lead: tp(`tiers.${x}.lead`, { days: String(s.trialDays), price: money(lei ? s.invitePriceLei : s.invitePriceEur, locale).label, writers: String(lim.writers ?? "∞"), trees: lim.trees ?? 0 }),
      limits: [
        ...LIMIT_KEYS.map((k): [string, string] => [tp(`lim.${k}`), lim[k] === null ? tp("unlimited") : nf.format(lim[k])]),
        [tp("lim.book"), book === "toti" ? tp("bookAll") : book === "una" ? tp("bookOne") : tp("bookSeparate", { price: label({ lei: s.bookLei, eur: s.bookEur }) })],
      ],
      choose: tpr("choose", { plan: name }),
    };
  });
  return {
    plans, periods,
    props: {
      periodNames: { luna: tpr("periods.luna"), trimestru: tpr("periods.trimestru"), an: tpr("periods.an") },
      periodLabel: tpr("periodLabel"), saveTag: bestSaving > 0 ? tpr("save", { percent: bestSaving }) : "",
      onlyYearly: tpr("onlyYearly"), trial: tpr("trial", { days: String(s.trialDays) }),
    },
  };
}
