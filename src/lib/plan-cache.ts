import { unstable_cache } from "next/cache";
import { db } from "@/db";
import { DEFAULT_SETTINGS, PLANS_TAG, planSettings, type PlanSettings } from "@/lib/plans";

const cached = unstable_cache(() => planSettings(db), ["plan-settings"], { tags: [PLANS_TAG], revalidate: 600 });

/**
 * Prețurile și plafoanele din Admin → Manager control pentru paginile publice: în cache 10 minute, golit pe loc la salvare.
 * La construirea fără bază de date (verificarea de pe GitHub) se folosesc valorile de pornire; o eroare nu rămâne în cache.
 */
export const publicPlanSettings = (): Promise<PlanSettings> => cached().catch(() => DEFAULT_SETTINGS);
