/** Datele structurate ale unei pagini (JSON-LD), citite de motoarele de căutare; nu se văd pe pagină. */
export default function JsonLd({ data }: { data: object }) {
  // „<” scris ca <, ca textul să nu poată închide eticheta <script>.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
