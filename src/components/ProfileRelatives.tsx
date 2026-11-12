"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "use-intl";
import type { PersonView } from "@/lib/tree-data";
import { years } from "@/lib/person-text";
import { kinLabel } from "@/lib/kin-words";
import type { RelKind } from "@/lib/relatives";
import { Avatar } from "./Avatar";
import PersonForm from "./PersonForm";

/** Lângă cine și ce fel de rudă se adaugă dintr-un loc gol (de pildă bunicul: tatăl tatălui). */
type Slot = { anchor: string; kind: RelKind };
export type RelativesData = {
  father: string | null; mother: string | null;
  paternal: { grandfather: string | null; grandmother: string | null };
  maternal: { grandfather: string | null; grandmother: string | null };
  partners: string[]; siblings: string[]; children: string[];
  nephews: { via: string; ids: string[] }[]; grandchildren: { via: string; ids: string[] }[];
};
type Props = {
  treeId: string; personId: string; own: boolean; data: RelativesData; people: Record<string, PersonView>;
  /** Fișele pe care cel care se uită le poate corecta de aici. */
  editable: string[];
  /** Poate adăuga rude (are drept în arbore și adminul nu i-a oprit schimbările). */
  canAdd: boolean;
  /** De ce nu poate schimba nimic (limita pusă de admin, sau doar se uită în arbore). */
  lockedNote: string | null;
  /** Pentru fiecare loc gol (`anchor:kind`): frații sau copiii care primesc și ei noua rudă, și cei care ar putea fi chiar ea. */
  share: Record<string, string[]>; lookalikes: Record<string, string[]>;
  /** Pentru „+ Copil”: soții celui lângă care adaugi, ca al doilea părinte. */
  partners: Record<string, string[]>;
  /** Frații doar după un părinte: sexul părintelui comun („după tată” / „după mamă”). */
  half?: Record<string, "M" | "F" | "U">;
};

/** Familia apropiată din profil: părinți, bunici din ambele părți, soți, frați, copii și nepoți. Ce lipsește se adaugă de aici. */
export default function ProfileRelatives(props: Props) {
  const { treeId, data, people, canAdd } = props;
  const t = useTranslations("Relatives"), locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState<{ key: string; slot?: Slot; edit?: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const editable = new Set(props.editable);
  const by = (ids: string[]) => ids.map((x) => people[x]).filter(Boolean);
  const done = (msg?: string) => { setOpen(null); setNotice(msg ?? t("saved")); router.refresh(); };

  const card = (r: PersonView, role?: string) => (
    <div key={r.id} className="kin-card">
      <Avatar p={r} size={44} />
      <span style={{ minWidth: 0 }}>
        {role && <small>{role}</small>}
        <Link href={`/arbore/${treeId}/persoana/${r.id}`} className="kin-name"><b>{r.name}</b></Link>
        <small>{years(r, locale)}</small>
        {editable.has(r.id) && (
          <button type="button" className="linkish" onClick={() => { setNotice(null); setOpen({ key: `edit:${r.id}`, edit: r.id }); }}>{t("edit")}</button>
        )}
      </span>
    </div>
  );
  const addBtn = (slot: Slot, label: string) => canAdd && (
    <button key={`${slot.anchor}:${slot.kind}`} type="button" className="kin-card kin-add" onClick={() => { setNotice(null); setOpen({ key: `${slot.anchor}:${slot.kind}`, slot }); }}>
      <span className="kin-plus" aria-hidden>+</span><span><b>{label}</b></span>
    </button>
  );
  const form = (keys: string[]) => {
    if (!open || !keys.includes(open.key)) return null;
    if (open.edit) {
      const p = people[open.edit];
      return p ? <PersonForm key={open.key} mode="edit" treeId={treeId} person={p} onDone={() => done()} onCancel={() => setOpen(null)} /> : null;
    }
    const { anchor, kind } = open.slot!;
    const a = people[anchor];
    if (!a) return null;
    const k = `${anchor}:${kind}`;
    return (
      <PersonForm key={open.key} mode="add" kind={kind} treeId={treeId} anchor={a} partners={by(props.partners[anchor] ?? [])}
        shareWith={by(props.share[k] ?? [])} lookalikes={by(props.lookalikes[k] ?? [])}
        onDone={(msg) => done(msg)} onCancel={() => setOpen(null)} />
    );
  };
  /** Un grup: titlul, oamenii (fiecare cu „Editează”), locurile goale și formularul deschis pentru unul dintre ei. */
  const group = (title: string, items: ReactNode[], keys: string[], hint?: string | false) => (
    <>
      <div className="section-label">{title}</div>
      {items.some(Boolean) ? <div className="kin-grid">{items}</div> : hint ? <p className="muted" style={{ margin: "4px 0" }}>{hint}</p> : <p className="muted" style={{ margin: "4px 0" }}>—</p>}
      {form(keys)}
    </>
  );
  const editKeys = (ids: (string | null)[]) => ids.filter((x): x is string => !!x).map((x) => `edit:${x}`);

  const me = props.personId;
  const parentsGroup = group(t("parents"), [
    data.father ? card(people[data.father], t("father")) : addBtn({ anchor: me, kind: "father" }, t("addFather")),
    data.mother ? card(people[data.mother], t("mother")) : addBtn({ anchor: me, kind: "mother" }, t("addMother")),
  ], [`${me}:father`, `${me}:mother`, ...editKeys([data.father, data.mother])]);

  const grand = (side: "paternal" | "maternal") => {
    const parent = side === "paternal" ? data.father : data.mother;
    const g = data[side];
    const items = parent ? [
      g.grandfather ? card(people[g.grandfather], t("grandfather")) : addBtn({ anchor: parent, kind: "father" }, t("addGrandfather")),
      g.grandmother ? card(people[g.grandmother], t("grandmother")) : addBtn({ anchor: parent, kind: "mother" }, t("addGrandmother")),
    ] : [];
    return group(t(side), items, parent ? [`${parent}:father`, `${parent}:mother`, ...editKeys([g.grandfather, g.grandmother])] : [],
      !parent && canAdd && t("needParent", { side: side === "paternal" ? "father" : "mother" }));
  };

  const halfRole = (r: PersonView) => {
    const via = props.half?.[r.id];
    return via ? kinLabel({ t: "blood", up: 1, down: 1, half: via }, r.sex, locale) : undefined;
  };
  const list = (title: string, ids: string[], slot: Slot, label: string, roles?: (r: PersonView) => string | undefined) =>
    group(title, [...by(ids).map((r) => card(r, roles?.(r))), addBtn(slot, label)], [`${slot.anchor}:${slot.kind}`, ...editKeys(ids)]);

  /** Nepoții: toți într-un singur șir, copiii fiecărui frate (sau copil) urmați de locul pentru încă unul. */
  const nested = (title: string, rows: { via: string; ids: string[] }[], hint: string) => (
    <>
      <div className="section-label">{title}</div>
      {!rows.length ? <p className="muted" style={{ margin: "4px 0" }}>{canAdd ? hint : "—"}</p> : (
        <div className="kin-grid">
          {rows.filter((row) => people[row.via]).flatMap((row) => [
            ...by(row.ids).map((r) => card(r, t("via", { name: people[row.via].name }))),
            addBtn({ anchor: row.via, kind: "child" }, t("addChildOf", { name: people[row.via].name })),
          ])}
        </div>
      )}
      {form(rows.flatMap((row) => [`${row.via}:child`, ...editKeys(row.ids)]))}
    </>
  );

  return (
    <div className="card">
      <div className="section-label" style={{ marginTop: 0 }}>{t("title")}</div>
      <p className="muted" style={{ marginTop: 0 }}>{props.own ? t("leadOwn") : t("leadOther")}</p>
      {props.lockedNote && <p className="notice">{props.lockedNote}</p>}
      {notice && <p className="notice" role="status">{notice}</p>}
      {group(t("self"), [card(people[me])], editKeys([me]))}
      {parentsGroup}
      {grand("paternal")}
      {grand("maternal")}
      {list(t("spouses"), data.partners, { anchor: me, kind: "spouse" }, t("addSpouse"))}
      {list(t("siblings"), data.siblings, { anchor: me, kind: "sibling" }, t("addSibling"), halfRole)}
      {list(t("children"), data.children, { anchor: me, kind: "child" }, t("addChild"))}
      {nested(t("nephews"), data.nephews, t("needSibling"))}
      {nested(t("grandchildren"), data.grandchildren, t("needChild"))}
    </div>
  );
}
