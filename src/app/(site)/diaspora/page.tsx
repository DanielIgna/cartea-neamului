import type { Metadata } from "next";
import { DiasporaPage, diasporaMetadata } from "@/components/diaspora/DiasporaPages";

export const generateMetadata = (): Promise<Metadata> => diasporaMetadata();

/** Hubul /diaspora (pentru cine e intrat în cont; vizitatorii primesc varianta gata făcută din app/(public)). */
export default function Hub() {
  return <DiasporaPage />;
}
