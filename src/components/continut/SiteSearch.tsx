/** Caseta de căutare din paginile-hub (nume, localități, ghiduri, glosar); trimite la /cauta, fără JavaScript. */
export default function SiteSearch({ placeholder = "Caută un nume, o comună, un județ sau un ghid" }: { placeholder?: string }) {
  return (
    <form action="/cauta" method="get" role="search" className="site-search">
      <input name="q" placeholder={placeholder} aria-label="Caută în site" />
      <button className="btn">Caută</button>
    </form>
  );
}
