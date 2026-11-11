"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * Pozele bannerului primei pagini. Cu mai multe poze (alese în Admin → Poze prima pagină) se schimbă singure, încet,
 * la câteva secunde; cine a cerut mai puțină mișcare în sistem vede doar prima poză.
 */
export default function BannerSlides({ imgs, every = 7000 }: { imgs: { src: string; custom: boolean }[]; every?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (imgs.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!document.hidden) setI((n) => (n + 1) % imgs.length); }, every);
    return () => clearInterval(t);
  }, [imgs.length, every]);
  return (
    <div className="lp-banner-slides" aria-hidden="true">
      {imgs.map((img, n) => (
        <Image key={img.src} src={img.src} alt="" fill sizes="100vw" priority={n === 0} unoptimized={img.custom}
          className={`lp-img lp-banner-img${n === i ? " on" : ""}`} />
      ))}
    </div>
  );
}
