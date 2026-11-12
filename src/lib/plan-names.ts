/** Numele planurilor, separat de restul, ca să poată fi folosite și în formularele din browser (fără baza de date). */
export const PLANS = {
  gratuit: { label: "Gratuit", hint: "ca toți: zilele gratuite, apoi plătește anul" },
  mereu: { label: "Gratuit mereu", hint: "familia, prietenii și cei care ajută, fără limite" },
  familie: { label: "Plătit", hint: "a plătit anul (până la data pusă; fără dată, fără termen)" },
} as const;
export type Plan = keyof typeof PLANS;
export const isPlan = (v: unknown): v is Plan => typeof v === "string" && Object.prototype.hasOwnProperty.call(PLANS, v);
