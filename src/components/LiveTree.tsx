"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "use-intl";
import { createRealtimeClient, type SealedLiveQuery } from "@neon/realtime/client";
import { RealtimeProvider, useLiveQuery } from "@neon/realtime-react";
import type { PersonVersion } from "@/lib/realtime";

type Props = { url: string; treeId: string; userId: string; sealedQuery: SealedLiveQuery<PersonVersion>; initialData: PersonVersion[] };

// O reîncărcare completă a paginii resetează starea.
let signedOut = false;

/**
 * Ține arborele la zi: când altă rudă adaugă sau corectează o persoană, Neon Realtime trimite schimbarea
 * și reîncărcăm datele paginii (router.refresh), fără ca utilizatorul să apese ceva.
 */
export default function LiveTree(props: Props) {
  // Clientul se creează o singură dată, în browser; la randarea pe server nu se conectează.
  const [client] = useState(() => createRealtimeClient({ url: props.url }));
  return <RealtimeProvider client={client}><LiveStatus {...props} /></RealtimeProvider>;
}

function LiveStatus({ treeId, userId, sealedQuery: fresh, initialData }: Props) {
  // Interogarea sigilată vine din nou la fiecare reîncărcare a datelor paginii (router.refresh); dacă am da-o mai departe,
  // abonamentul s-ar relua și eticheta ar sări pe „se conectează…”. O păstrăm pe prima; o reînnoiește refreshQuery.
  const [sealedQuery] = useState(fresh);
  const t = useTranslations("Charts"), locale = useLocale();
  const router = useRouter();
  const [lastChange, setLastChange] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const refreshQuery = useCallback(async () => {
    if (signedOut) throw new Error("Delogat");
    const res = await fetch(`/api/arbore/${treeId}/live`, { method: "POST", body: JSON.stringify({ userId }) });
    if (res.status === 401) {
      signedOut = true; // hook-ul reîncearcă în fiecare secundă; ne oprim și reîncărcăm pagina
      window.location.reload();
      throw new Error("Delogat");
    }
    if (!res.ok) throw new Error(`Nu am putut reînnoi abonamentul live (${res.status})`);
    return (await res.json()) as SealedLiveQuery<PersonVersion>;
  }, [treeId, userId]);

  const { data, status } = useLiveQuery(sealedQuery, { refreshQuery, initialData });

  // O schimbare poate veni ca „changes” sau ca resincronizare completă („rows”, de ex. la interogări cu join),
  // deci comparăm ce s-a schimbat efectiv: setul de (id, versiune).
  const seen = useRef(versionKey(initialData));
  useEffect(() => {
    if (!data) return;
    const key = versionKey(data);
    if (key === seen.current) return;
    seen.current = key;
    setLastChange(new Date().toLocaleTimeString(locale));
    // Mai multe schimbări apropiate = o singură reîncărcare.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => router.refresh(), 300);
  }, [data, router]);

  // După ce a fost o dată „live”, o reconectare scurtă nu mai schimbă eticheta; doar o eroare care ține o vreme.
  const [everLive, setEverLive] = useState(false);
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (status === "live") { setEverLive(true); setDown(false); return; }
    if (status !== "error") return;
    const k = setTimeout(() => setDown(true), 5000);
    return () => clearTimeout(k);
  }, [status]);
  const label = down ? t("liveStopped") : status === "live" || everLive ? t("live") : status === "error" ? t("liveStopped") : t("connecting");
  return (
    <span className="chip" role="status" data-live-status={down ? "error" : everLive ? "live" : status} title={t("liveTitle")}>
      ● {label}{lastChange ? ` · ${t("updatedAt", { time: lastChange })}` : ""}
    </span>
  );
}

const versionKey = (rows: readonly PersonVersion[]) => rows.map((r) => `${r.id}@${r.version}`).sort().join(",");
