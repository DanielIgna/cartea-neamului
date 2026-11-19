import type { Catalog, DeepPartial } from "./ro";
import { enUSArbore } from "./arbore/en-US";
import { enUSAmintiri } from "./amintiri/en-US";
import { enUSVremuri } from "./vremuri/en-US";
import { enUSCarte } from "./carte/en-US";
import { enUSCalatorie } from "./calatorie/en-US";
import { enUSBiserica } from "./biserica/en-US";
import { enUSParteneri } from "./parteneri/en-US";
import { enUSFilm } from "./film/en-US";
import { enUSLegal } from "./legal/en-US";
import { enUSDatele } from "./datele/en-US";
import { enUSPastrare } from "./pastrare/en-US";
import { enUSSecuritate } from "./securitate/en-US";

/**
 * US English: only what differs from British English (en-GB.ts), which fills in the rest.
 * Dates written by hand are month first here (03/12/1970 is March 12); the server turns them into 1970-03-12.
 */
export const enUS: DeepPartial<Catalog> = {
  // Titles and descriptions for Google in the US and Canada (Daniel, 18.11.2026): Romanian heritage, grandparents' voices and the
  // PDF family book with QR codes. Canada in English gets these pages too (hreflang en-CA → /en-us).
  Meta: {
    homeTitle: "Collaborative Family Tree & Audio Heirloom Book",
    description: "Build your Romanian and European family tree together. Record your grandparents’ voices, map the old villages and make a PDF family book with QR codes.",
  },
  Resources: {
    metaTitle: "Free Romanian Genealogy Resources & Archives",
    metaDescription: "Romanian archives, parish registers, censuses, digital libraries and old newspapers: where to trace your Romanian family for free, from anywhere.",
  },
  GiftPage: {
    metaTitle: "Meaningful Christmas Gift for Grandparents, {price}",
    metaDescription: "A Christmas gift for immigrant parents and grandparents: a year in The Family Book for {price}, with the family tree, old photos and their voices.",
  },
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
  ...enUSFilm,
  ...enUSLegal,
  ...enUSDatele,
  ...enUSPastrare,
  ...enUSSecuritate,
};
