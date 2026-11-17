import type { Metadata } from "next";
import SchoolPageView from "@/components/scoala/SchoolPageView";
import { publicPageMetadata } from "@/lib/page-metadata";
import { schoolPage } from "@/lib/scoala";

const page = schoolPage("")!;
export const metadata: Metadata = publicPageMetadata({ path: page.path, title: page.title, description: page.description });

/** /scoala: arborele genealogic pentru școală, ghid pentru părinți și învățători (src/lib/scoala.ts). */
export default function SchoolHub() {
  return <SchoolPageView page={page} />;
}
