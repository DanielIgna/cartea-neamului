"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SharedPlace } from "@/lib/map-data";
import type { Match } from "@/lib/shared-places";
import { requestContact, setDiscoverable } from "@/app/harta-actions";
import { de, persoane } from "@/lib/ro-words";

export type Nearby = { on: boolean; owner: boolean; demo: boolean; matches: Match[] };
const neamuri = (n: number) => (n === 1 ? "un neam" : `${de(n)} neamuri`);
const span = (p: { fromYear: number | null; toYear: number | null }) =>
  p.fromYear && p.toYear ? (p.fromYear === p.toYear ? `${p.fromYear}` : `${p.fromYear}–${p.toYear}`) : `${p.fromYear ?? p.toYear ?? ""}`;

/** Familiile din alți arbori care au strămoși în aceleași sate (sau în aceeași comună), cu „Cere legătura”. */
export default function NearbyFamilies({ treeId, nearby, shared, place, onAll }: {
  treeId: string; nearby: Nearby; shared: SharedPlace[]; place: { id: string; area?: string; name: string } | null; onAll: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [asking, setAsking] = useState<string | null>(null);

  async function toggle(on: boolean) {
    setBusy(true); setErr(null);
    const res = await setDiscoverable(treeId, on);
    setBusy(false);
    if (res.error) setErr(res.error); else router.refresh();
  }

  const list = place ? nearby.matches.filter((m) => m.places.some((c) => c.placeId === place.id || (!!place.area && c.area === place.area))) : nearby.matches;
  const preview = (
    <details className="share-preview">
      <summary>Ce văd celelalte familii din neamul vostru</summary>
      {shared.length ? (
        <ul>
          {[...shared].sort((a, b) => b.people - a.people).slice(0, 8).map((s) => (
            <li key={s.placeId}><b>{s.name}</b>: {persoane(s.people)}{span(s) ? `, ${span(s)}` : ""}{s.surnames ? ` · ${s.surnames}` : ""}</li>
          ))}
          {shared.length > 8 && <li className="muted">și încă {de(shared.length - 8)} {shared.length - 8 === 1 ? "loc" : "locuri"}</li>}
        </ul>
      ) : <p className="muted">Încă nimic: în fișele celor decedați nu e trecut niciun sat găsit pe hartă.</p>}
    </details>
  );

  return (
    <div className="card nearby">
      <div className="section-label" style={{ marginTop: 0 }}>Din aceleași locuri{place && nearby.on ? ` · ${place.name}` : ""}</div>
      {nearby.demo ? (
        <p className="muted" style={{ margin: 0 }}>Aici găsești familiile din alți arbori care au strămoși în aceleași sate. Contul de probă e folosit de mai mulți oameni, așa că nu poate arăta neamul altor familii. Fă-ți un cont al tău ca să le găsești.</p>
      ) : !nearby.on ? (
        <>
          <p style={{ marginTop: 0, fontSize: 14 }}>Găsește familiile din alți arbori care au strămoși în aceleași sate. Ele văd doar satele, câte persoane decedate sunt acolo, anii și numele de familie, plus numele arborelui și {nearby.owner ? "prenumele tău" : "prenumele proprietarului"} cu inițiala. Cei în viață nu apar niciodată. Vedeți și voi la fel neamurile lor.</p>
          {nearby.owner ? (
            <>
              {preview}
              <div className="actions" style={{ marginTop: 10 }}><button className="btn primary" disabled={busy} onClick={() => toggle(true)}>{busy ? "Se pornește…" : "Arată neamul celor din aceleași sate"}</button></div>
            </>
          ) : <p className="muted" style={{ margin: 0, fontSize: 14 }}>Doar proprietarul arborelui poate porni asta.</p>}
        </>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
            Neamul vostru poate fi găsit de familiile cu strămoși în aceleași sate.{" "}
            {nearby.owner && <button className="linklike" disabled={busy} onClick={() => toggle(false)}>Nu-l mai arăta</button>}
          </p>
          {nearby.owner && preview}
          {place && <p style={{ fontSize: 14 }}>{list.length ? `${neamuri(list.length)} cu strămoși aici sau în aceeași comună.` : `Încă nicio altă familie cu strămoși în ${place.name}.`}{" "}
            {nearby.matches.length > 0 && <button className="linklike" onClick={onAll}>Toate locurile</button>}</p>}
          {!place && !list.length && <p style={{ fontSize: 14, marginBottom: 0 }}>Încă nicio altă familie cu strămoși în aceleași sate. Pe măsură ce vin alte neamuri pe site, apar aici.</p>}
          <div className="stack" style={{ gap: 10 }}>
            {list.map((m) => <MatchRow key={m.treeId} m={m} treeId={treeId} asking={asking === m.treeId} onAsk={(on) => setAsking(on ? m.treeId : null)} />)}
          </div>
        </>
      )}
      {err && <p className="err" style={{ marginBottom: 0 }}>{err}</p>}
    </div>
  );
}

function MatchRow({ m, treeId, asking, onAsk }: { m: Match; treeId: string; asking: boolean; onAsk: (on: boolean) => void }) {
  const router = useRouter();
  const [placeId, setPlaceId] = useState(m.places[0]?.placeId ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const c = m.contact;

  async function send() {
    setBusy(true); setErr(null);
    const res = await requestContact({ fromTreeId: treeId, toTreeId: m.treeId, placeId, note: note.trim() || null });
    setBusy(false);
    if (res.error) { setErr(res.error); return; }
    onAsk(false);
    router.refresh();
  }

  return (
    <div className="match">
      <div><b>{m.treeName}</b> <span className="muted">· {m.owner}</span></div>
      <ul>
        {m.places.map((p) => (
          <li key={p.placeId}>
            <b>{p.name}</b>{!p.same && p.mine.length ? <span className="muted"> (aceeași comună cu {p.mine.join(", ")})</span> : null}: {persoane(p.people)}
            {p.years ? `, ${p.years}` : ""}{p.surnames ? ` · ${p.surnames}` : ""}
          </li>
        ))}
      </ul>
      {c ? (
        <div className="actions" style={{ marginTop: 6, alignItems: "center" }}>
          {c.status === "pending" && (c.outgoing
            ? <span className="chip">Cerere trimisă · așteaptă răspunsul</span>
            : <><span className="chip priv">Vă cere legătura</span> <Link href="/mesaje">Răspunde în Mesaje</Link></>)}
          {c.status === "accepted" && <><span className="chip ok">Legătură acceptată</span> {c.href && <Link href={c.href}>Scrie-i</Link>}</>}
          {c.status === "declined" && <span className="chip">{c.outgoing ? "Nu a acceptat legătura" : "Ai refuzat legătura"}</span>}
        </div>
      ) : asking ? (
        <div className="ask">
          {m.places.length > 1 && (
            <label>Locul despre care scrii
              <select value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
                {m.places.map((p) => <option key={p.placeId} value={p.placeId}>{p.name}</option>)}
              </select>
            </label>
          )}
          <label>Câteva cuvinte pentru {m.owner} (nu e obligatoriu)
            <textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)}
              placeholder={`De pildă: bunicul meu s-a născut în ${m.places.find((p) => p.placeId === placeId)?.name ?? "același sat"}. Poate suntem rude.`} />
          </label>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>{m.owner} va vedea numele tău, numele arborelui vostru și ce scrii aici. După ce acceptă, vă puteți scrie în Mesaje.</p>
          {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
          <div className="actions">
            <button className="btn primary" disabled={busy || !placeId} onClick={send}>{busy ? "Se trimite…" : "Trimite cererea"}</button>
            <button className="btn" disabled={busy} onClick={() => onAsk(false)}>Renunță</button>
          </div>
        </div>
      ) : (
        <div className="actions" style={{ marginTop: 6 }}><button className="btn" onClick={() => onAsk(true)}>Cere legătura</button></div>
      )}
    </div>
  );
}
