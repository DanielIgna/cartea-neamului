import type { CalatorieCatalog } from "./ro";
import type { DeepPartial } from "../types";

/** US English: only the words that differ from British English (en-GB.ts). */
export const enUSCalatorie: DeepPartial<CalatorieCatalog> = {
  Journey: {
    cockpit: { moving: "Traveling back through the years…" },
    regime: {
      p1: "Here the ship passes through the years of communism in Romania. People’s land was taken from them in collectivization, and those who resisted ended up in the prisons of Sighet and Aiud or at the Danube–Black Sea Canal labor camps. The Securitate, the secret police, listened in, and neighbors were pushed to inform on each other.",
    },
  },
};
