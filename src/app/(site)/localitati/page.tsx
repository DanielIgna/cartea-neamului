import { LocalitiesHub, localitiesHubMetadata } from "@/components/continut/LocalityPages";

export const metadata = localitiesHubMetadata();

/** Hubul /localitati; vizitatorii fără cont primesc varianta gata făcută din app/(public). */
export default function Hub() {
  return <LocalitiesHub />;
}
