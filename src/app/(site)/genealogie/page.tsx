import { GenealogieHub, genealogieHubMetadata } from "@/components/continut/GenealogieOrase";

export const metadata = genealogieHubMetadata();

/** Hubul /genealogie; vizitatorii fără cont primesc varianta gata făcută din app/(public). */
export default function Hub() {
  return <GenealogieHub />;
}
