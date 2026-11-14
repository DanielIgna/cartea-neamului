import type { DeepPartial } from "../types";
import type { LegalCatalog } from "./ro";

export const enUSLegal: DeepPartial<LegalCatalog> = {
  Legal: {
    Privacy: {
      sections: {
        intro: {
          p1: "The Family Book is a place where families build their family tree together, keep their memories and print their family book. Here we explain, briefly and in plain words, what data we keep, why, who sees it and how you download or delete it. In short: family trees are private, you choose who sees your memories, we sell nothing and we show no ads. Our partner, PropManage, receives only your email address, and only if you tick the box for it. If you ask for the free PropManage account and tick the box for it, we also give them your name.",
        },
        who: {
          l6: "We do not sell data, we show no ads and we give it to no one else apart from the providers below, our partner PropManage (only the email address of those who ticked the box, as described below) and the authorities, when the law requires it. For the free PropManage account, only if you tick the box, they also receive your name.",
        },
        vendors: {
          l2: "<b>Neon</b> (Databricks Inc., USA) stores the database, photos, documents and recordings, in a data center in Frankfurt (Germany, EU).",
        },
        partner: {
          p1: "PropManage (<pm>propmanage.ro</pm>) is a platform for home owners and a partner of the Family Book. You find it only on the <partners>Partners</partners> page; there are no ads in the family tree, memories, timeline, map or book.",
        },
      },
    },
  },
};
