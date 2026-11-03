/** Contul de probă: parola e publică, așa că îl pot folosi mai mulți oameni deodată. */
export const DEMO_EMAIL = "demo@cartea-neamului.ro";
export const isDemo = (email: string | null | undefined) => email?.toLowerCase() === DEMO_EMAIL;
