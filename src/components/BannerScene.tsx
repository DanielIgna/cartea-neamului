/**
 * Desenul din bannerul primei pagini: un sat la apus, cu biserica de lemn, un copac bătrân și o familie,
 * trei generații ținându-se de mână. E desenat (SVG), nu fotografie, ca să se încarce pe loc; se poate înlocui
 * oricând cu o poză veche de familie (vezi .lp-banner-photo în globals.css).
 */

type P = { x: number; h: number; dress?: boolean; cane?: boolean };
const BASE = 652;
// De la stânga la dreapta: bunicul cu baston, bunica, tata, mama, fata, băiatul cel mic.
const FAMILY: P[] = [
  { x: 214, h: 150, cane: true }, { x: 270, h: 142, dress: true }, { x: 340, h: 178 },
  { x: 408, h: 162, dress: true }, { x: 462, h: 112, dress: true }, { x: 500, h: 88 },
];

function person({ x, h, dress, cane }: P) {
  const b = BASE, r = h * 0.075, hy = b - h + r, neck = b - h + 2 * r + 1, sh = h * 0.13, hip = h * 0.095, waist = b - h * 0.47;
  const top = `M${x - sh} ${neck + h * 0.05}Q${x - sh} ${neck} ${x - sh * 0.4} ${neck}L${x + sh * 0.4} ${neck}Q${x + sh} ${neck} ${x + sh} ${neck + h * 0.05}`;
  const body = dress
    ? `${top}L${x + hip * 1.7} ${b - h * 0.13}L${x + hip * 0.7} ${b - h * 0.13}L${x + hip * 0.6} ${b}L${x + hip * 0.15} ${b}L${x} ${b - h * 0.13}L${x - hip * 0.15} ${b}L${x - hip * 0.6} ${b}L${x - hip * 0.7} ${b - h * 0.13}L${x - hip * 1.7} ${b - h * 0.13}Z`
    : `${top}L${x + hip} ${waist}L${x + hip * 0.95} ${b}L${x + hip * 0.2} ${b}L${x} ${waist + h * 0.08}L${x - hip * 0.2} ${b}L${x - hip * 0.95} ${b}L${x - hip} ${waist}Z`;
  return (
    <g key={x}>
      <circle cx={x} cy={hy} r={r} />
      <path d={body} />
      {cane && <path d={`M${x - sh - 4} ${b - h * 0.42}L${x - sh - 14} ${b}`} className="lp-scene-stroke" strokeWidth={4} />}
    </g>
  );
}
// Mâinile date: de la umărul unuia la umărul celui de lângă, cu o mică coborâre la mijloc.
function hands() {
  return FAMILY.slice(0, -1).map((a, i) => {
    const c = FAMILY[i + 1];
    const ay = BASE - a.h + 2 * a.h * 0.075 + a.h * 0.06, cy = BASE - c.h + 2 * c.h * 0.075 + c.h * 0.06;
    const mx = (a.x + c.x) / 2, my = Math.max(BASE - a.h * 0.42, BASE - c.h * 0.42);
    return <path key={i} d={`M${a.x + a.h * 0.12} ${ay}L${mx} ${my}L${c.x - c.h * 0.12} ${cy}`} className="lp-scene-stroke" strokeWidth={5} />;
  });
}

const LEAVES: [number, number, number][] = [
  [1130, 330, 70], [1068, 360, 58], [1192, 360, 60], [1040, 410, 48], [1222, 412, 50], [1100, 300, 50], [1162, 292, 52],
  [1130, 262, 44], [1090, 420, 52], [1172, 420, 52], [1010, 380, 36], [1252, 378, 38], [1130, 400, 60],
];
const STARS: [number, number][] = [[120, 80], [260, 150], [410, 60], [640, 110], [980, 70], [1250, 130], [1420, 60], [1530, 160], [820, 40], [1340, 220], [60, 220]];

/** Pe ecran lat se vede toată scena; pe telefon, partea din stânga, cu familia (vezi .lp-scene-phone). */
export default function BannerScene({ phone = false }: { phone?: boolean }) {
  return (
    <svg className={phone ? "lp-scene lp-scene-phone" : "lp-scene lp-scene-wide"} viewBox="0 0 1600 700" preserveAspectRatio={phone ? "xMinYMax slice" : "xMidYMax slice"} aria-hidden="true">
      <defs>
        <linearGradient id={phone ? "lp-sky-p" : "lp-sky"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b120f" /><stop offset=".42" stopColor="#3f261b" /><stop offset=".7" stopColor="#9a5a2e" /><stop offset=".86" stopColor="#df9a52" />
        </linearGradient>
        <radialGradient id={phone ? "lp-glow-p" : "lp-glow"} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffd38a" stopOpacity=".95" /><stop offset=".35" stopColor="#f2a65a" stopOpacity=".55" /><stop offset="1" stopColor="#f2a65a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="700" fill={phone ? "url(#lp-sky-p)" : "url(#lp-sky)"} />
      {STARS.map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.6" fill="#f6e7cf" opacity=".55" />)}
      <circle cx="900" cy="548" r="300" fill={phone ? "url(#lp-glow-p)" : "url(#lp-glow)"} />
      <circle cx="900" cy="548" r="58" fill="#ffd796" />
      <path d="M0 528Q200 470 420 505T860 498T1250 474T1600 506V700H0Z" fill="#6e3f25" opacity=".55" />
      <path d="M0 596Q260 540 520 578T1040 590Q1300 545 1600 578V700H0Z" fill="#3b2218" />
      {/* Casele satului, cu ferestrele aprinse */}
      <g fill="#2a1912">
        {[[560, 1], [640, 0.9], [716, 1.1]].map(([x, s]) => (
          <g key={x} transform={`translate(${x} ${574 - 6 * s}) scale(${s})`}><path d="M-26 0L0 -24L26 0V32H-26Z" /><rect x="-9" y="10" width="7" height="7" fill="#f2b765" opacity=".8" /></g>
        ))}
      </g>
      {/* Biserica de lemn, cu turnul înalt */}
      <g fill="#24150f" transform="translate(1400 0)">
        <path d="M-46 590V540L-60 540L0 500L60 540L46 540V590Z" />
        <rect x="-15" y="470" width="30" height="40" />
        <path d="M-22 474L0 350L22 474Z" />
        <path d="M0 350V328M-7 337H7" className="lp-scene-stroke" stroke="#24150f" strokeWidth="3" />
      </g>
      {/* Copacul bătrân al neamului */}
      <g className="lp-scene-dark" transform="translate(70 0)">
        <path d="M1118 600Q1124 520 1112 470Q1100 430 1070 410L1078 404Q1110 420 1124 446Q1128 400 1122 360L1138 360Q1134 410 1140 446Q1156 418 1190 404L1196 412Q1162 432 1150 476Q1140 530 1146 600Z" />
        {LEAVES.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />)}
      </g>
      <path d="M0 640Q400 604 800 642T1600 628V700H0Z" fill="#1c110d" />
      <g className="lp-scene-dark">{FAMILY.map(person)}{hands()}</g>
    </svg>
  );
}
