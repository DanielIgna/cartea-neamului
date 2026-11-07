/** Evenimente istorice pentru axa sincronologică. `regions: ["*"]` = relevant pentru orice arbore din România. */
/** `id` dă numele în fiecare limbă (catalogul „Timeline.events”); `title` e numele în română. */
export type HistoricalEvent = { id: "rev1848" | "dualism" | "ww1" | "union" | "horthy" | "collectivization" | "rev1989"; from: number; to: number; title: string; regions: string[] };
export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  { id: "rev1848", from: 1848, to: 1849, title: "Revoluția de la 1848", regions: ["*"] },
  { id: "dualism", from: 1867, to: 1867, title: "Dualismul austro-ungar", regions: ["Transilvania", "Maramureș", "Banat", "Crișana"] },
  { id: "ww1", from: 1914, to: 1918, title: "Primul Război Mondial", regions: ["*"] },
  { id: "union", from: 1918, to: 1918, title: "Marea Unire", regions: ["*"] },
  { id: "horthy", from: 1940, to: 1944, title: "Ocupația horthystă", regions: ["Maramureș", "Transilvania", "Crișana"] },
  { id: "collectivization", from: 1949, to: 1962, title: "Colectivizarea", regions: ["*"] },
  { id: "rev1989", from: 1989, to: 1989, title: "Revoluția", regions: ["*"] },
];
