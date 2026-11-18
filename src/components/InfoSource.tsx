/** „Sursa informației” a unei persoane (Surse publice): textul scris de familie și, dacă există, linkul, deschis într-o filă nouă. */
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

export default function InfoSource({ label, text, url }: { label: string; text?: string | null; url?: string | null }) {
  if (!text && !url) return null;
  return (
    <p className="info-source" data-testid="info-source">
      <b>{label}:</b> {text}{text && url ? " · " : ""}
      {url && <a href={url} target="_blank" rel="noopener noreferrer">{host(url)}</a>}
    </p>
  );
}
