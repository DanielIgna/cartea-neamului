/** Paginarea listelor din paginile-hub (/ghid, /glosar, /nume, /localitati): ?pagina=2, 3… Prima pagină e adresa simplă. */
export const PAGE_SIZE = 60;

export function parsePage(v: string | string[] | undefined): number {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isInteger(n) && n > 1 ? n : 1;
}

export function paginate<T>(items: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { items: items.slice((current - 1) * size, current * size), page: current, pages, outOfRange: page > pages };
}

export const pageHref = (base: string, page: number) => (page <= 1 ? base : `${base}?pagina=${page}`);
