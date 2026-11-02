/** Evenimente istorice pentru axa sincronologică. `regions: ["*"]` = relevant pentru orice arbore din România. */
export type HistoricalEvent = { from: number; to: number; title: string; regions: string[] };
export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  { from: 1848, to: 1849, title: "Revoluția de la 1848", regions: ["*"] },
  { from: 1867, to: 1867, title: "Dualismul austro-ungar", regions: ["Transilvania", "Maramureș", "Banat", "Crișana"] },
  { from: 1914, to: 1918, title: "Primul Război Mondial", regions: ["*"] },
  { from: 1918, to: 1918, title: "Marea Unire", regions: ["*"] },
  { from: 1940, to: 1944, title: "Ocupația horthystă", regions: ["Maramureș", "Transilvania", "Crișana"] },
  { from: 1949, to: 1962, title: "Colectivizarea", regions: ["*"] },
  { from: 1989, to: 1989, title: "Revoluția", regions: ["*"] },
];
