/** Tema culorilor: „auto” urmează setarea calculatorului sau a telefonului; „light” = alb, „dark” = albastru închis. */
export type Theme = "auto" | "light" | "dark";
export const THEME_COOKIE = "tema";
export const parseTheme = (v: string | undefined): Theme => (v === "light" || v === "dark" ? v : "auto");
