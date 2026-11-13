"use client";
import { useEffect, useRef, useState } from "react";
import type { BookFormat } from "@/lib/book";
import { PAGE, ROT, bookCss, contentBox } from "@/lib/book-css";
import type { Previewer } from "pagedjs";
import { useTranslations } from "use-intl";
import { partnerUrl } from "@/lib/partners-shared";

/** Cardul partenerului de după „Descarcă PDF” apare o singură dată pe acest browser; închis, nu mai apare niciodată. */
const PARTNER_SEEN = "cn-partener-carte";
const seenPartner = () => { try { return !!localStorage.getItem(PARTNER_SEEN); } catch { return true; } };
const markPartner = () => { try { localStorage.setItem(PARTNER_SEEN, "1"); } catch { /* fără localStorage, nu-l arătăm */ } };

/**
 * Cartea, așezată pe pagini în browser cu Paged.js: conținutul vine gata de pe server (ascuns), iar aici o copie a lui
 * se împarte pe pagini A4 sau A5, cu antete, numerele paginilor și trimiterile „(p. 14)”. „Descarcă PDF” deschide
 * fereastra de tipărire, din care se alege „Salvează ca PDF”.
 */

// Paged.js nu se poate opri la jumătate: o așezare nouă așteaptă să se termine cea veche.
let queue: Promise<unknown> = Promise.resolve();
// O a doua așezare în același document iese greșit (doar coperta), așa că fiecare carte se face într-o pagină proaspătă:
// alegerile noi reîncarcă pagina, iar o întoarcere aici fără reîncărcare (de pildă cu „Înapoi” din browser) o reîncarcă.
let laidOut = false;
// O imagine transparentă de 1×1 pixeli: în locul unei poze stricate se vede fondul gri al ramei.
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/** id-urile din desene (degradeul scoarței copacului) există și în sursa ascunsă: copia primește altele, ca să le găsească pe ale ei. */
function renameSvgIds(root: HTMLElement) {
  root.querySelectorAll("svg").forEach((svg, i) => {
    const ids = [...svg.querySelectorAll("[id]")].map((el) => el.id);
    if (!ids.length) return;
    svg.querySelectorAll("[id]").forEach((el) => { el.id = `${el.id}-bk${i}`; });
    for (const el of [svg, ...svg.querySelectorAll("*")]) for (const a of ["fill", "stroke", "clip-path", "mask", "filter", "href"]) {
      const v = el.getAttribute(a);
      if (!v?.includes("#")) continue;
      let next = v;
      for (const id of ids) next = next === `#${id}` ? `#${id}-bk${i}` : next.split(`#${id})`).join(`#${id}-bk${i})`);
      if (next !== v) el.setAttribute(a, next);
    }
  });
}

/** Pregătește copia: ancorele primesc id-uri (doar copia, ca trimiterile să ducă la paginile ei), desenele late se întorc pe lungimea paginii. */
function prepare(root: HTMLElement, format: BookFormat) {
  root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((el) => { el.id = el.dataset.anchor!; el.removeAttribute("data-anchor"); });
  // Pozele din sursa ascunsă au loading="lazy", ca browserul să nu le descarce de două ori; cele de pe pagini se încarcă imediat.
  root.querySelectorAll("img").forEach((img) => { img.loading = "eager"; });
  renameSvgIds(root);
  const box = contentBox(format);
  root.querySelectorAll<HTMLElement>(".bk-fig[data-fit]").forEach((fig) => {
    const vb = fig.querySelector("svg")?.viewBox.baseVal;
    if (!vb?.width || !vb.height) return;
    const flat = Math.min(box.w / vb.width, (box.h - 45) / vb.height);
    const turned = Math.min(ROT(format) / vb.width, box.w / vb.height);
    if (turned > flat * 1.2) fig.classList.add("rot");
  });
}

/** Paged.js urmărește mărimea fiecărei pagini (ca să le reașeze); după așezare, sau când pagina e închisă, nu mai e nevoie. */
function stopListening(previewer: Previewer | null) {
  try { previewer?.chunker.pages?.forEach((p) => p.removeListeners()); } catch { /* nu apucase să facă pagini */ }
}

/** Numerele paginilor din cuprins, din index și din trimiteri, după ce s-a văzut pe ce pagină a ajuns fiecare fișă. */
function fillPageNumbers(area: HTMLElement) {
  const at = new Map<string, string>();
  area.querySelectorAll<HTMLElement>(".pagedjs_page").forEach((page) => {
    page.querySelectorAll<HTMLElement>("[id]").forEach((el) => { if (!at.has(el.id)) at.set(el.id, page.dataset.pageNumber ?? ""); });
  });
  area.querySelectorAll<HTMLElement>("[data-pg]").forEach((el) => {
    const n = at.get(el.dataset.pg!);
    el.textContent = n ? `${el.dataset.before ?? ""}${n}${el.dataset.after ?? ""}` : "";
  });
}

/**
 * `locked`: plățile sunt pornite și omul n-a plătit cartea: o vede toată, cu „Previzualizare” pe fiecare pagină (și la tipărire),
 * iar în locul lui „Descarcă PDF” e butonul de plată.
 */
export default function BookView({ format, renderKey, fileName, locked, printFrom, children }: {
  format: BookFormat; renderKey: string; fileName: string; locked?: { buyHref: string; price: string } | null;
  /** „de la X lei” la cartea tipărită, din Admin (doar când e pus). */
  printFrom?: string | null; children: React.ReactNode;
}) {
  const src = useRef<HTMLDivElement>(null), out = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"work" | "done" | "error">("work");
  const tp = useTranslations("Partners.bookCard");
  const [partner, setPartner] = useState(false);
  const [pages, setPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const t = useTranslations("BookUi.view");

  useEffect(() => {
    if (laidOut) {
      window.location.reload();
      return;
    }
    let alive = true;
    let previewer: Previewer | null = null;
    // Paged.js pune pe pagini doar ce e înăuntrul rădăcinii cărții, nu și rădăcina: stilurile ei (.bk) stau pe containerul paginilor.
    const target = document.createElement("div");
    target.className = "book-target bk";
    out.current!.appendChild(target);
    setPhase("work");
    setPages(0);
    const run = async () => {
      if (!alive) return;
      const { Previewer } = await import("pagedjs");
      if (!alive) return;
      laidOut = true;
      previewer = new Previewer();
      previewer.on("page", () => { if (alive) setPages((n) => n + 1); });
      const content = src.current!.firstElementChild!.cloneNode(true) as HTMLElement;
      prepare(content, format);
      const flow = await previewer.preview(content, [{ [location.href]: bookCss(format) }], target);
      if (!alive) {
        previewer.polisher.destroy();
        return;
      }
      // Pozele s-au încărcat înainte de așezare; paginile nu mai trebuie să se reașeze când li se schimbă mărimea.
      stopListening(previewer);
      // O poză care nu s-a putut încărca nu lasă iconița de „imagine stricată” în carte: rămâne doar locul ei, gri.
      target.querySelectorAll("img").forEach((img) => { if (img.complete && !img.naturalWidth) { img.alt = ""; img.src = BLANK; } });
      fillPageNumbers(target);
      setPages(flow.total);
      setPhase("done");
    };
    const job = queue.then(run).catch((e) => {
      console.error("Cartea: nu am putut așeza paginile", e);
      if (alive) setPhase("error");
    });
    queue = job;
    return () => {
      alive = false;
      stopListening(previewer);
      target.remove();
      // Stilurile puse de Paged.js (mărimea paginii, regulile de tipar) nu trebuie să rămână pe celelalte pagini ale site-ului.
      try { previewer?.polisher.destroy(); } catch { /* încă nu le pusese */ }
    };
  }, [renderKey, format]);

  // Pe telefon, foaia se micșorează cât să încapă pe lățimea ecranului.
  useEffect(() => {
    if (phase !== "done") return;
    const fit = () => setZoom(Math.min(1, ((stage.current?.clientWidth ?? 800) - 4) / ((PAGE[format].w * 96) / 25.4)));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [phase, format]);

  const print = () => {
    const title = document.title;
    document.title = fileName; // numele fișierului PDF propus de browser
    window.print();
    document.title = title;
    // După prima descărcare, o singură dată: un card discret despre partener, în afara cărții (nu se tipărește).
    if (!seenPartner()) { markPartner(); setPartner(true); }
  };

  return (
    <>
      <div className="card book-chrome book-status" aria-live="polite">
        {phase === "work" && <span className="muted">{pages ? t("workingPages", { count: pages }) : t("working")}</span>}
        {phase === "error" && <span>{t("error")}</span>}
        {phase === "done" && (
          <>
            {locked
              ? <a className="btn primary" href={locked.buyHref}>{t("buy", { price: locked.price })}</a>
              : <button type="button" className="btn primary" onClick={print}>{t("download")}</button>}
            <a className="btn" href={`/contact?tipar=${pages}&format=${format}`}>{t("printed")}</a>
            {printFrom && <span className="muted book-print-from">{t("printFrom", { price: printFrom })}</span>}
            <span className="muted">{t(locked ? "previewNote" : "ready", { count: pages })}</span>
          </>
        )}
      </div>
      {partner && (
        <aside className="card book-chrome partner-card" aria-label={tp("label")}>
          <button type="button" className="partner-close" onClick={() => setPartner(false)} aria-label={tp("close")} title={tp("close")}>×</button>
          <div className="section-label" style={{ marginTop: 0 }}>{tp("label")}</div>
          <p>{tp("text")}</p>
          <div className="actions">
            <a className="btn" href={partnerUrl("carte")} target="_blank" rel="noopener noreferrer">{tp("cta")}</a>
            <button type="button" className="linkish" onClick={() => setPartner(false)}>{tp("close")}</button>
          </div>
        </aside>
      )}
      <div ref={src} className="book-source" hidden>{children}</div>
      <div ref={stage} className={`book-stage${locked ? " book-locked" : ""}`} style={locked ? ({ "--wm": JSON.stringify(t("preview")) } as React.CSSProperties) : undefined}>
        <div ref={out} className={`book-pages${phase === "done" ? "" : " busy"}`} data-phase={phase} data-key={renderKey} style={phase === "done" && zoom < 1 ? { zoom } : undefined} />
      </div>
    </>
  );
}
