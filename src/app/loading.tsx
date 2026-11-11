/**
 * Se arată pe loc, imediat după un clic, cât timp serverul pregătește pagina cerută.
 * Fără ea, browserul rămâne pe pagina veche și pare că butonul n-a mers.
 * Next o încarcă dinainte pentru linkurile vizibile, așa că apare instant.
 */
export default function Loading() {
  return (
    <div className="page-loading" role="status" aria-busy="true">
      <div className="page-loading-bar" />
      <div className="card page-loading-card">
        <div className="sk sk-title" />
        <div className="sk" />
        <div className="sk" />
        <div className="sk sk-short" />
      </div>
    </div>
  );
}
