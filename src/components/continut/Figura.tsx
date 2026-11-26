/**
 * Un desen din ghiduri, glosar sau paginile de rudenie (Daniel, 25–26.11.2026: imagini desenate, nu fotografii). Clicul pe desen
 * îl deschide mare, într-o filă nouă; src/components/VisitBeacon.tsx numără clicul anonim, după `data-img` (Admin → SEO → Imagini).
 */
export const imgKey = (src: string) => src.replace(/^.*\//, "").replace(/\.[a-z0-9]+$/i, "").slice(0, 60);

export default function Figura({ src, alt, caption }: { src: string; alt: string; caption?: string | null }) {
  return (
    <figure className="prose-figure">
      <a href={src} target="_blank" rel="noopener" data-img={imgKey(src)} title="Deschide desenul mare">
        {/* eslint-disable-next-line @next/next/no-img-element -- desen SVG static, fără optimizare */}
        <img src={src} alt={alt} loading="lazy" decoding="async" style={{ width: "100%", height: "auto", display: "block" }} />
      </a>
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
