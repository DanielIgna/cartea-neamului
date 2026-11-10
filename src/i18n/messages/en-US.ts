import type { Catalog, DeepPartial } from "./ro";
import { enUSArbore } from "./arbore/en-US";
import { enUSAmintiri } from "./amintiri/en-US";
import { enUSVremuri } from "./vremuri/en-US";
import { enUSCarte } from "./carte/en-US";
import { enUSCalatorie } from "./calatorie/en-US";
import { enUSBiserica } from "./biserica/en-US";
import { enUSParteneri } from "./parteneri/en-US";

/**
 * US English: only what differs from British English (en-GB.ts), which fills in the rest.
 * Dates written by hand are month first here (03/12/1970 is March 12); the server turns them into 1970-03-12.
 */
export const enUS: DeepPartial<Catalog> = {
  ThemeSwitch: {
    label: "Color theme",
  },
  FamilyStart: {
    surname: "Last name",
    surnameNow: "Current last name",
    birthDatePlaceholder: "03/12/1970",
    parentsText: "Write what you know; leave blank what you don’t, and add it later from the tree. If they are alive, their full date of birth (for example 03/12/1950) helps them find their own profile when they create an account.",
    grandNoParents: "Grandparents are linked to the parents. To add them here, go back and write the name of at least one parent. Or keep going: you can add them from the tree at any time.",
  },
  JoinTree: {
    surname: "Last name",
    marriedHint: "Married women can also write the last name they had before marriage.",
  },
  Errors: {
    findSurname: "Write the last name.",
    join: {
      names: "Write the first and last name.",
    },
  },
  ...enUSArbore,
  // Etapa 3: Lada cu amintiri, întrebările, „la bunici”, povestea și autobiografia.
  ...enUSAmintiri,
  // Povestea vremurilor: epocile, viața de atunci, evenimentele și ținuturile.
  ...enUSVremuri,
  ...enUSCarte,
  ...enUSCalatorie,
  ...enUSBiserica,
  ...enUSParteneri,
};
