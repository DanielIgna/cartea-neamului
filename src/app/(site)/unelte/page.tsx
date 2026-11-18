import type { Metadata } from "next";
import { ToolsHub } from "@/components/unelte/ToolPages";
import { TOOLS_HUB } from "@/lib/unelte/rudenie-pagini";
import { TOOLS_DESCRIPTION, TOOLS_TITLE } from "@/lib/unelte/unelte";
import { publicPageMetadata } from "@/lib/page-metadata";

export const metadata: Metadata = publicPageMetadata({ path: TOOLS_HUB, title: `${TOOLS_TITLE} | Cartea Neamului`, description: TOOLS_DESCRIPTION });

/** /unelte: uneltele gratuite (src/lib/unelte). */
export default function Tools() {
  return <ToolsHub />;
}
