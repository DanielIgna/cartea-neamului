import Link from "next/link";
import type { Block, Inline } from "@/lib/continut/markdown";

function Text({ v }: { v: Inline[] }) {
  return v.map((x, i) => {
    if (x.t === "b") return <b key={i}>{x.v}</b>;
    if (x.t === "i") return <i key={i}>{x.v}</i>;
    if (x.t === "a") {
      return x.href.startsWith("/")
        ? <Link key={i} href={x.href}>{x.v}</Link>
        : <a key={i} href={x.href} target="_blank" rel="noopener noreferrer">{x.v}</a>;
    }
    return x.v;
  });
}

/** Textul unui ghid sau al unui termen din glosar (vezi src/lib/continut/markdown.ts). */
export default function Prose({ blocks }: { blocks: Block[] }) {
  return blocks.map((b, i) => {
    switch (b.t) {
      case "h2": return <h2 key={i} id={b.id}>{b.v}</h2>;
      case "h3": return <h3 key={i} id={b.id}>{b.v}</h3>;
      case "p": return <p key={i}><Text v={b.v} /></p>;
      case "note": return <p key={i} className="prose-note"><Text v={b.v} /></p>;
      case "ul": return <ul key={i}>{b.items.map((it, j) => <li key={j}><Text v={it} /></li>)}</ul>;
      case "ol": return <ol key={i}>{b.items.map((it, j) => <li key={j}><Text v={it} /></li>)}</ol>;
      case "img": return (
        <figure key={i} className="prose-figure">
          {/* eslint-disable-next-line @next/next/no-img-element -- desen SVG static, fără optimizare */}
          <img src={b.src} alt={b.alt} loading="lazy" decoding="async" style={{ width: "100%", height: "auto" }} />
          {b.v ? <figcaption>{b.v}</figcaption> : null}
        </figure>
      );
    }
  });
}
