/** Inelul unui scor 0–100: verde de la 80, galben de la 50, roșu sub. */
export default function Ring({ score, size = 84 }: { score: number; size?: number }) {
  const r = 34, c = 2 * Math.PI * r;
  const color = score >= 80 ? "var(--ok, #2f8f5b)" : score >= 50 ? "var(--warn, #c98a1b)" : "var(--bad, #b8432f)";
  return (
    <svg width={size} height={size} viewBox="0 0 84 84" role="img" aria-label={`${score} din 100`}>
      <circle cx="42" cy="42" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="8" />
      <circle cx="42" cy="42" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${(c * Math.max(0, Math.min(100, score))) / 100} ${c}`} transform="rotate(-90 42 42)" />
      <text x="42" y="48" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">{score}</text>
    </svg>
  );
}
