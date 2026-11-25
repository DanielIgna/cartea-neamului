"use client";

import Link from "next/link";
import { useState } from "react";

type Period = "luna" | "trimestru" | "an";

export type HomePlan = {
  key: "basic" | "familie" | "premium";
  name: string;
  badge?: string;
  /** Prețul pe perioada aleasă („16,99 lei / lună”); null = planul nu se plătește așa (Basic doar anual). */
  price: Record<Period, string | null>;
  /** Prețul pe an, arătat mic la Lunar și La 3 luni („sau 149 lei pe an”). */
  orYear: string;
  /** Prețul tăiat pe fiecare perioadă, cu ce e el („12 × 16,99 lei, dacă plătești lunar”); null = nimic de tăiat. */
  was: Record<Period, { price: string; note: string } | null>;
  /** „Economisești 20% față de plata lunară” (doar la Anual); "" = nu e cazul. */
  save: string;
  /** „Din al doilea an: 119 lei pe an”; "" = același preț. */
  renew: string;
  lead: string;
  limits: [string, string][];
  choose: string;
};

/**
 * Cardurile de prețuri de pe prima pagină (Daniel, 25.11.2026): comutatorul Lunar / La 3 luni / Anual (Anual ales de la început),
 * cardurile clicabile cu butonul „Alege planul” care duce la plată cu planul și perioada alese (după crearea contului, dacă e nevoie),
 * iar plafoanele stau pe aceleași rânduri în toate cele trei carduri, ca să se compare ușor.
 */
export default function HomePlans({ plans, periods, periodNames, periodLabel, saveTag, onlyYearly, trial }: {
  plans: HomePlan[];
  periods: Period[];
  periodNames: Record<Period, string>;
  periodLabel: string;
  saveTag: string;
  onlyYearly: string;
  trial: string;
}) {
  const [period, setPeriod] = useState<Period>("an");
  // Cine nu are cont își face unul și ajunge apoi la plată cu planul și perioada alese (/intrare le ține minte);
  // cine e deja în cont e trimis de /intrare direct la plată.
  const href = (plan: HomePlan["key"], p: Period) => `/intrare?mod=cont-nou&plan=${plan}&perioada=${p}`;
  return (
    <>
      {periods.length > 1 && (
        <div className="lp-period" role="group" aria-label={periodLabel}>
          {periods.map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {periodNames[p]}{p === "an" && saveTag && <small>{saveTag}</small>}
            </button>
          ))}
        </div>
      )}
      <div className="lp-plans">
        {plans.map((x) => {
          const price = x.price[period];
          const p: Period = price ? period : "an";
          return (
            <article key={x.key} className={`lp-plan${x.badge ? " lp-plan-rec" : ""}`}>
              {x.badge && <span className="lp-plan-badge">{x.badge}</span>}
              <h3>{x.name}</h3>
              <div className="lp-plan-cost">
                {price && x.was[period] && <p className="price-was"><s>{x.was[period]!.price}</s> <span>{x.was[period]!.note}</span></p>}
                {price
                  ? <p className="lp-plan-price">{price}</p>
                  : <><p className="lp-plan-price lp-plan-only">{onlyYearly}</p><p className="lp-plan-sub">{x.price.an}</p></>}
                {price && period !== "an" && <p className="lp-plan-sub">{x.orYear}</p>}
                {period === "an" && x.save && <p className="lp-plan-save">{x.save}</p>}
                {x.renew && <p className="lp-plan-sub">{x.renew}</p>}
              </div>
              <p className="lp-plan-lead">{x.lead}</p>
              <ul>
                {x.limits.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}
              </ul>
              <div className="lp-plan-go">
                <Link className={`lp-btn ${x.badge ? "lp-btn-gold" : "lp-btn-line"} lp-plan-btn`} href={href(x.key, p)}>{x.choose}</Link>
                <p>{trial}</p>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
