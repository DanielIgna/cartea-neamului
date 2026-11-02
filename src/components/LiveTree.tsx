"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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

function LiveStatus({ treeId, userId, sealedQuery, initialData }: Props) {
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
    setLastChange(new Date().toLocaleTimeString("ro-RO"));
    // Mai multe schimbări apropiate = o singură reîncărcare.
    clearTimeout(timer.current);
    timer.current = setTimeout(() => router.refresh(), 300);
  }, [data, router]);

  const label = status === "error" ? "actualizările live s-au oprit" : status === "live" ? "live" : "se conectează…";
  return (
    <span className="chip" role="status" data-live-status={status} title="Arborele se actualizează singur când rudele adaugă persoane.">
      ● {label}{lastChange ? ` · actualizat la ${lastChange}` : ""}
    </span>
  );
}

const versionKey = (rows: readonly PersonVersion[]) => rows.map((r) => `${r.id}@${r.version}`).sort().join(",");
