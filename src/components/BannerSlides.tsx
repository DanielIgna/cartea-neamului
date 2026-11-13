"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

type Img = { src: string; custom: boolean };

/**
 * Pozele bannerului primei pagini, rulate ca un film vechi: cadrul de acum se apropie încet, la schimbare pâlpâie și
 * urcă puțin ca pelicula, peste tot stau granulația și zgârieturile filmului. Pe ecrane late, pe margini rulează două
 * benzi de film cu toate pozele. Pozele se aleg în Admin → Poze prima pagină. Cine a cerut mai puțină mișcare în sistem
 * vede doar prima poză, fără efecte mișcate.
 */
export default function BannerSlides({ imgs, every = 7000 }: { imgs: Img[]; every?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (imgs.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!document.hidden) setI((n) => (n + 1) % imgs.length); }, every);
    return () => clearInterval(t);
  }, [imgs.length, every]);

  // Benzile de pe margini: destule cadre cât să umple înălțimea, dublate ca rularea să nu aibă cusătură.
  const frames = imgs.length ? Array.from({ length: Math.max(6, imgs.length) }, (_, n) => imgs[n % imgs.length]) : [];
  const reel = (side: "l" | "r") => (
    <div className={`lp-reel lp-reel-${side}`}>
      <div className="lp-reel-track">
        {[...frames, ...frames].map((img, n) => (
          <span key={n} className="lp-reel-frame">
            <Image src={img.src} alt="" fill sizes="120px" unoptimized={img.custom} />
          </span>
        ))}
      </div>
    </div>
  );

  return (
    <div className="lp-banner-slides" aria-hidden="true">
      {imgs.map((img, n) => (
        <Image key={img.src} src={img.src} alt="" fill sizes="100vw" quality={60} priority={n === 0} unoptimized={img.custom}
          className={`lp-img lp-banner-img${n === i ? " on" : ""}`} />
      ))}
      <span key={`f${i}`} className="lp-film" />
      {imgs.length > 1 && reel("l")}
      {imgs.length > 1 && reel("r")}
    </div>
  );
}
