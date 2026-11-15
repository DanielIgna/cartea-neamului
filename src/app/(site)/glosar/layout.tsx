import UntranslatedSection from "@/components/UntranslatedNote";

/** Secțiunea e încă doar în română: în altă limbă se arată cu o notă (src/components/UntranslatedNote.tsx). */
export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return <UntranslatedSection>{children}</UntranslatedSection>;
}
