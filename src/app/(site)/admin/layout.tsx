import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";

/** Tot panoul de admin rămâne în afara motoarelor de căutare (pe lângă robots.txt). */
export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
