import type { Metadata } from "next";
import { PRIVATE_ROBOTS } from "@/lib/page-metadata";

/** Mesajele, cu toate conversațiile de sub ele, rămân în afara motoarelor de căutare (pe lângă robots.txt). */
export const metadata: Metadata = { robots: PRIVATE_ROBOTS };

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
