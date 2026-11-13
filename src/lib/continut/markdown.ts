/**
 * Un Markdown mic, cât ne trebuie pentru ghiduri și glosar (content/ghid/*.md, content/glosar/*.md): antet cu câmpuri
 * („cheie: valoare” între două linii ---), titluri ## și ###, paragrafe, liste cu - sau 1., citat > (o notă pusă în evidență),
 * iar în text **îngroșat**, *cursiv* și [legături](/ghid/…). Fără HTML în text: totul se afișează ca text, deci nimic nu se
 * poate strecura în pagină.
 */
export type Inline = { t: "text" | "b" | "i"; v: string } | { t: "a"; v: string; href: string };
export type Block =
  | { t: "h2" | "h3"; v: string; id: string }
  | { t: "p" | "note"; v: Inline[] }
  | { t: "ul" | "ol"; items: Inline[][] };

export function slugify(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function parseFrontmatter(src: string): { data: Record<string, string>; body: string } {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(src);
  if (!m) return { data: {}, body: src };
  const data: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { data, body: src.slice(m[0].length) };
}

export const list = (v: string | undefined) => (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  for (let m; (m = re.exec(s)); ) {
    if (m.index > last) out.push({ t: "text", v: s.slice(last, m.index) });
    if (m[1] != null) out.push({ t: "b", v: m[1] });
    else if (m[2] != null) out.push({ t: "i", v: m[2] });
    else out.push({ t: "a", v: m[3], href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ t: "text", v: s.slice(last) });
  return out;
}

export function parseBlocks(body: string): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let items: string[] = [];
  let kind: "ul" | "ol" | null = null;
  let note: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ t: "p", v: parseInline(para.join(" ")) });
    if (items.length && kind) blocks.push({ t: kind, items: items.map(parseInline) });
    if (note.length) blocks.push({ t: "note", v: parseInline(note.join(" ")) });
    para = []; items = []; kind = null; note = [];
  };
  for (const raw of body.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    let m: RegExpExecArray | null;
    if ((m = /^(#{2,3})\s+(.*)$/.exec(line))) {
      flush();
      blocks.push({ t: m[1].length === 2 ? "h2" : "h3", v: m[2], id: slugify(m[2]) });
    } else if ((m = /^[-*]\s+(.*)$/.exec(line)) || (m = /^\d+[.)]\s+(.*)$/.exec(line))) {
      const k = /^\d/.test(line) ? "ol" : "ul";
      if (para.length || note.length || (kind && kind !== k)) flush();
      kind = k;
      items.push(m[1]);
    } else if ((m = /^>\s?(.*)$/.exec(line))) {
      if (para.length || items.length) flush();
      note.push(m[1]);
    } else if (items.length) {
      items[items.length - 1] += ` ${line}`;
    } else {
      para.push(line);
    }
  }
  flush();
  return blocks;
}

/** Textul simplu al unui bloc (pentru numărul de cuvinte și pentru verificări). */
export function plainText(blocks: Block[]): string {
  const inl = (v: Inline[]) => v.map((x) => x.v).join("");
  return blocks.map((b) => ("items" in b ? b.items.map(inl).join(" ") : typeof b.v === "string" ? b.v : inl(b.v))).join(" ");
}

/** Toate legăturile din text (ca testele să verifice că duc la pagini care există). */
export function links(blocks: Block[]): string[] {
  const inl = (v: Inline[]) => v.flatMap((x) => (x.t === "a" ? [x.href] : []));
  return blocks.flatMap((b) => ("items" in b ? b.items.flatMap(inl) : typeof b.v === "string" ? [] : inl(b.v)));
}
