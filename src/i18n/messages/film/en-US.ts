import type { FilmCatalog } from "./ro";
import type { DeepPartial } from "../types";

/** US English: only the words that differ from British English (en-GB.ts). */
export const enUSFilm: DeepPartial<FilmCatalog> = {
  Film: {
    proposeTitle: "Your family’s photo on the home page",
    proposeLead: "If it is chosen, the photo appears in the banner on the site’s home page, which anyone can see. It does not appear until we approve it, and you can withdraw it at any time.",
    consent: "I am in the photo or I have the consent of everyone in it (for children, their parents’ consent) for it to appear publicly on the home page. I know I can withdraw it at any time.",
    sent: "Thank you, we have it! You will see it on the profile under “Your suggested photos,” where we will also show you if it has reached the home page.",
    mineNote: "If you withdraw it, it leaves the home page and we delete our copy too. The photo stays in the tree’s album.",
    captionPlaceholder: "The Pop family, Ieud, summer of 1972",
    errors: { consent: "Check the consent box so that we can put the photo on the home page." },
  },
};
