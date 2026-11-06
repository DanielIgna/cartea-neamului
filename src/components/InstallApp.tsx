"use client";
import { useEffect, useState } from "react";

/** Evenimentul prin care Chrome și Edge (pe Android și pe calculator) lasă site-ul să ceară punerea lui ca aplicație. */
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type W = Window & { __cnInstall?: InstallEvent | null };
const READY = "cn-install-ready";
const HIDDEN = "cn-install-ascuns";

/**
 * Pe fiecare pagină: pornește service worker-ul (pagina „Nu ai internet acum”) și ține minte cererea de instalare,
 * care vine o singură dată, la încărcare, ca butonul „Pune aplicația pe telefon” s-o găsească pe orice pagină.
 */
export function PwaSetup() {
  useEffect(() => {
    const secure = location.protocol === "https:" || location.hostname === "localhost";
    if ("serviceWorker" in navigator && secure) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const keep = (e: Event) => { e.preventDefault(); (window as W).__cnInstall = e as InstallEvent; window.dispatchEvent(new Event(READY)); };
    const done = () => { (window as W).__cnInstall = null; window.dispatchEvent(new Event(READY)); };
    window.addEventListener("beforeinstallprompt", keep);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", keep); window.removeEventListener("appinstalled", done); };
  }, []);
  return null;
}

/**
 * „Pune aplicația pe telefon”: pe Android și pe calculator, un buton care deschide fereastra browserului; pe iPhone, unde nu
 * există așa ceva, cei doi pași de făcut în Safari. Nu apare dacă e deja deschisă ca aplicație sau dacă omul a închis-o.
 */
export default function InstallApp({ compact = false }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [where, setWhere] = useState("telefon");

  useEffect(() => {
    const standalone = matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let hidden = false;
    try { hidden = localStorage.getItem(HIDDEN) === "1"; } catch { /* fără localStorage */ }
    if (standalone || hidden) return;
    const ua = navigator.userAgent;
    setIos(/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1));
    if (!matchMedia("(pointer: coarse)").matches) setWhere("calculator");
    const sync = () => setPrompt((window as W).__cnInstall ?? null);
    sync();
    setShow(true);
    window.addEventListener(READY, sync);
    return () => window.removeEventListener(READY, sync);
  }, []);

  if (!show || (!prompt && !ios && !msg)) return null;
  const hide = () => { try { localStorage.setItem(HIDDEN, "1"); } catch { /* fără localStorage */ } setShow(false); };
  return (
    <div className={`install-app${compact ? " compact" : ""}`}>
      <img src="/icons/icon-192.png" alt="" width={44} height={44} />
      <div>
        <b>Pune Cartea Neamului pe {where}</b>
        {msg ? <p>{msg}</p> : prompt ? (
          <p>Se deschide ca o aplicație, {where === "telefon" ? "direct de pe ecranul principal" : "dintr-o iconiță a ei"}, fără să mai cauți site-ul.</p>
        ) : (
          <p>În Safari, apasă butonul <b>Partajează</b> (pătratul cu săgeata în sus), apoi <b>Adaugă pe ecranul principal</b>.</p>
        )}
        <div className="actions" style={{ marginTop: 8 }}>
          {prompt && !msg && (
            <button className="btn primary" onClick={async () => {
              await prompt.prompt();
              const { outcome } = await prompt.userChoice;
              (window as W).__cnInstall = null;
              setPrompt(null);
              setMsg(outcome === "accepted" ? (where === "telefon" ? "Gata: o găsești pe ecranul principal." : "Gata: o găsești printre aplicații.") : "Bine, o poți pune oricând de aici.");
            }}>Pune aplicația</button>
          )}
          <button className="btn" onClick={hide}>{msg ? "Închide" : "Nu acum"}</button>
        </div>
      </div>
    </div>
  );
}
