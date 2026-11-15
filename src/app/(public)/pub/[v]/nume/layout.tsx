import UntranslatedSection from "@/components/UntranslatedNote";
import { readVariant, type VariantParams } from "@/lib/public-variant-server";

/** Secțiunea e încă doar în română: în altă limbă se arată cu o notă (src/components/UntranslatedNote.tsx). */
export default async function SectionLayout({ children, params }: { children: React.ReactNode } & VariantParams) {
  await readVariant({ params });
  return <UntranslatedSection>{children}</UntranslatedSection>;
}
