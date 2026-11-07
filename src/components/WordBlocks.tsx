import { parseWord } from "@/lib/cuvant-final";
import "./time-journey.css";

/** Cuvântul de la finalul călătoriei, cu titluri, versete și paragrafe: în călătorie și în previzualizarea din panou. */
export default function WordBlocks({ text }: { text: string }) {
  return (
    <>
      {parseWord(text).map((b, i) =>
        b.kind === "title" ? <h2 key={i}>{b.text}</h2>
          : b.kind === "verse" ? <blockquote key={i}><p>„{b.text.replace(/^[„"]|[”"]$/g, "")}”</p>{b.ref && <cite>{b.ref}</cite>}</blockquote>
          : <p key={i}>{b.text}</p>)}
    </>
  );
}
