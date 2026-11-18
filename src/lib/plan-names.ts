/** Numele planurilor, separat de restul, ca să poată fi folosite și în formularele din browser (fără baza de date). */
export const PLANS = {
  gratuit: { label: "Gratuit", hint: "ca toți: zilele gratuite, apoi plătește anul" },
  // „Acces gratuit” (Daniel, 18.11.2026): toate planurile și cartea PDF, fără termen. Se dă doar din Admin → Oameni.
  mereu: { label: "Acces gratuit", hint: "toate planurile și cartea PDF, fără termen și fără plată (familia, cei care ajută); se dă doar din Admin" },
  familie: { label: "Plătit", hint: "a plătit anul (până la data pusă; fără dată, fără termen)" },
} as const;
export type Plan = keyof typeof PLANS;
export const isPlan = (v: unknown): v is Plan => typeof v === "string" && Object.prototype.hasOwnProperty.call(PLANS, v);

/** Planurile anului plătit, cu numele din panou (aceleași chei ca `TIERS` din src/lib/plans.ts). */
export const TIER_LABELS = { basic: "Basic", familie: "Familie", premium: "Premium" } as const;
