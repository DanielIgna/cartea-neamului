/** Ce folosim din Paged.js (pachetul nu are tipuri): așază un conținut HTML pe pagini, după regulile @page din CSS. */
declare module "pagedjs" {
  export class Previewer {
    constructor(options?: Record<string, unknown>);
    /** `stylesheets`: adrese sau obiecte { adresă: text CSS }; fără ele, Paged.js ia și scoate stilurile paginii. */
    preview(content: Node, stylesheets: (string | Record<string, string>)[], renderTo: HTMLElement): Promise<{ total: number }>;
    on(event: "page" | "rendered" | "rendering" | "size" | "atpages", cb: (...args: unknown[]) => void): void;
    polisher: { destroy(): void };
    chunker: { destroy(): void; pages?: { removeListeners(): void }[] };
  }
}
