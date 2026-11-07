import type { ArboreCatalog } from "./ro";
import type { DeepPartial } from "../types";

/** US English: only the words that differ from British English (en-GB.ts). */
export const enUSArbore: DeepPartial<ArboreCatalog> = {
  Tree: {
    putInCentre: "Put in the center",
    legend360Help: "The ancestor sits at the bottom, in the trunk; each generation is a ring higher up, all the way around. Drag the tree to turn it (and up or down to tilt it), or use the arrow keys. “The family story” goes through the people in order of birth and tells you, for each of them, what life was like in their part of the world at the time.",
    legendHowTo: "Click for the profile; double-click to put the person in the center. Zoom in or out with + and −, with Ctrl and the mouse wheel, or with two fingers on a phone; drag the chart to move around it.",
  },
  Person: {
    putInCentre: "Put in the center",
    unclaimedText: "Send {name} a link. Once {sex, select, M {he has} F {she has} other {they have}} an account, {sex, select, M {he goes} F {she goes} other {they go}} straight into the tree with {sex, select, M {his} F {her} other {their}} own profile in the center, and can carry on the tree with {sex, select, M {his} F {her} other {their}} own family.",
  },
  PersonForm: {
    surname: "Last name",
    birthPlaceholder: "03/12/1985, 1902 or c. 1870",
    deathPlaceholder: "11/5/2008 or 1980",
    dateHint: "For birth and death, write the month, day and year if you know them (03/12/1932); otherwise just the year or “c. 1870”.",
    livingHint: "With the full date of birth (month, day, year), the person can find their own profile when they create an account, and you confirm it’s them.",
    shareHint: "Uncheck those from another marriage.",
  },
};
