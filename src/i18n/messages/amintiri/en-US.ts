import type { AmintiriCatalog } from "./ro";
import type { DeepPartial } from "../types";

/** US English: only the words that differ from British English (en-GB.ts). */
export const enUSAmintiri: DeepPartial<AmintiriCatalog> = {
  MemoryForm: {
    faithInvalid: "Check the consent box so that the answer can be kept.",
  },
  Questions: {
    tree: {
      siblingsWhich: "Which of your brothers and sisters did you get along with best: {names}? Why?",
    },
    history: {
      collectivization: "What did your family tell you about collectivization? What happened to the family’s land and animals?",
      earthquake: "You were {age} at the time of the earthquake of March 4, 1977. Where were you that evening?",
      queues: "What were the food lines like in the ’80s? What was hardest to find?",
      eclipse: "Did you see the solar eclipse of August 11, 1999? Where were you?",
    },
    any: {
      game: "What was your favorite game when you were little?",
      summer: "What did you do during summer vacation when you were a child?",
      firstSalary: "What did you spend your first paycheck on?",
    },
  },
  LadaErrors: {
    faithConsent: "To write in the “Faith” chapter, first check the consent box above the button.",
  },
};
