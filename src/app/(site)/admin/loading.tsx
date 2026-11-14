/**
 * La un clic în meniul panoului: meniul rămâne pe loc și doar partea din dreapta arată că pagina se încarcă,
 * în loc să se golească tot ecranul până răspunde serverul.
 */
export default function AdminLoading() {
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
