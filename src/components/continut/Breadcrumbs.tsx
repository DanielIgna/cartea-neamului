import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { canonicalUrl } from "@/lib/page-metadata";

export type Crumb = { name: string; path: string };

/** Firul de pagini de deasupra titlului (Acasă › Ghiduri › …), plus același fir pentru Google (BreadcrumbList). */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ name: "Acasă", path: "/" }, ...items];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(all)} />
      <nav className="crumbs" aria-label="Unde ești">
        <ol>
          {all.map((c, i) => (
            <li key={c.path}>
              {i < all.length - 1 ? <Link href={c.path}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function breadcrumbJsonLd(all: Crumb[]) {
  return {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: canonicalUrl(c.path) })),
  };
}
