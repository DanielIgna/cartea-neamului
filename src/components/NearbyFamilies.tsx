"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "use-intl";
import type { SharedPlace } from "@/lib/map-data";
import type { Match } from "@/lib/shared-places";
import { requestContact, setDiscoverable } from "@/app/harta-actions";

export type Nearby = { on: boolean; owner: boolean; demo: boolean; matches: Match[] };
const span = (p: { fromYear: number | null; toYear: number | null }) =>
  p.fromYear && p.toYear ? (p.fromYear === p.toYear ? `${p.fromYear}` : `${p.fromYear}–${p.toYear}`) : `${p.fromYear ?? p.toYear ?? ""}`;

/** Familiile din alți arbori care au strămoși în aceleași sate (sau în aceeași comună), cu „Cere legătura”. */
export default function NearbyFamilies({ treeId, nearby, shared, place, onAll }: {
  treeId: string; nearby: Nearby; shared: SharedPlace[]; place: { id: string; area?: string; name: string } | null; onAll: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("Nearby");
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
      <summary>{t("previewTitle")}</summary>
      {shared.length ? (
        <ul>
          {[...shared].sort((a, b) => b.people - a.people).slice(0, 8).map((s) => (
            <li key={s.placeId}><b>{s.name}</b>: {t("people", { count: s.people })}{span(s) ? `, ${span(s)}` : ""}{s.surnames ? ` · ${s.surnames}` : ""}</li>
          ))}
          {shared.length > 8 && <li className="muted">{t("morePlaces", { count: shared.length - 8 })}</li>}
        </ul>
      ) : <p className="muted">{t("previewEmpty")}</p>}
    </details>
  );

  return (
    <div className="card nearby">
      <div className="section-label" style={{ marginTop: 0 }}>{t("title")}{place && nearby.on ? ` · ${place.name}` : ""}</div>
      {nearby.demo ? (
        <p className="muted" style={{ margin: 0 }}>{t("demo")}</p>
      ) : !nearby.on ? (
        <>
          <p style={{ marginTop: 0, fontSize: 14 }}>{t("offText", { owner: nearby.owner ? "yes" : "no" })}</p>
          {nearby.owner ? (
            <>
              {preview}
              <div className="actions" style={{ marginTop: 10 }}><button className="btn primary" disabled={busy} onClick={() => toggle(true)}>{busy ? t("starting") : t("turnOn")}</button></div>
            </>
          ) : <p className="muted" style={{ margin: 0, fontSize: 14 }}>{t("ownerOnly")}</p>}
        </>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>
            {t("onText")}{" "}
            {nearby.owner && <button className="linklike" disabled={busy} onClick={() => toggle(false)}>{t("turnOff")}</button>}
          </p>
          {nearby.owner && preview}
          {place && <p style={{ fontSize: 14 }}>{list.length ? t("hereCount", { count: list.length }) : t("noneHere", { place: place.name })}{" "}
            {nearby.matches.length > 0 && <button className="linklike" onClick={onAll}>{t("allPlaces")}</button>}</p>}
          {!place && !list.length && <p style={{ fontSize: 14, marginBottom: 0 }}>{t("noneYet")}</p>}
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
  const t = useTranslations("Nearby");
  const [placeId, setPlaceId] = useState(m.places[0]?.placeId ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const c = m.contact;
  const chosen = m.places.find((p) => p.placeId === placeId)?.name;

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
            <b>{p.name}</b>{!p.same && p.mine.length ? <span className="muted"> {t("sameCommune", { names: p.mine.join(", ") })}</span> : null}: {t("people", { count: p.people })}
            {p.years ? `, ${p.years}` : ""}{p.surnames ? ` · ${p.surnames}` : ""}
          </li>
        ))}
      </ul>
      {c ? (
        <div className="actions" style={{ marginTop: 6, alignItems: "center" }}>
          {c.status === "pending" && (c.outgoing
            ? <span className="chip">{t("sent")}</span>
            : <><span className="chip priv">{t("asksYou")}</span> <Link href="/mesaje">{t("answerInMessages")}</Link></>)}
          {c.status === "accepted" && <><span className="chip ok">{t("accepted")}</span> {c.href && <Link href={c.href}>{t("writeTo")}</Link>}</>}
          {c.status === "declined" && <span className="chip">{c.outgoing ? t("notAccepted") : t("youRefused")}</span>}
        </div>
      ) : asking ? (
        <div className="ask">
          {m.places.length > 1 && (
            <label>{t("placeLabel")}
              <select value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
                {m.places.map((p) => <option key={p.placeId} value={p.placeId}>{p.name}</option>)}
              </select>
            </label>
          )}
          <label>{t("noteLabel", { owner: m.owner })}
            <textarea value={note} maxLength={500} onChange={(e) => setNote(e.target.value)}
              placeholder={chosen ? t("notePlaceholder", { place: chosen }) : t("notePlaceholderSame")} />
          </label>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>{t("noteHelp", { owner: m.owner })}</p>
          {err && <p className="err" style={{ margin: 0 }}>{err}</p>}
          <div className="actions">
            <button className="btn primary" disabled={busy || !placeId} onClick={send}>{busy ? t("sending") : t("send")}</button>
            <button className="btn" disabled={busy} onClick={() => onAsk(false)}>{t("cancel")}</button>
          </div>
        </div>
      ) : (
        <div className="actions" style={{ marginTop: 6 }}><button className="btn" onClick={() => onAsk(true)}>{t("ask")}</button></div>
      )}
    </div>
  );
}
