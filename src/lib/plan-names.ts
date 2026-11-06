/** Numele planurilor, separat de restul, ca să poată fi folosite și în formularele din browser (fără baza de date). */
export const PLANS = {
  gratuit: { label: "Gratuit", hint: "ca toți, până la limitele planului gratuit" },
  mereu: { label: "Gratuit mereu", hint: "familia, prietenii și cei care ajută, fără limite" },
  familie: { label: "Familie (plătește)", hint: "abonamentul pentru arborii mari" },
} as const;
export type Plan = keyof typeof PLANS;
export const isPlan = (v: unknown): v is Plan => typeof v === "string" && Object.prototype.hasOwnProperty.call(PLANS, v);
