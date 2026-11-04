/** Tipul fișierului fără parametri („audio/webm;codecs=opus” → „audio/webm”); mesajele vocale de pe WhatsApp vin uneori fără tip. */
export function fileType(file: { type: string; name: string }) {
  const t = file.type.split(";")[0].trim().toLowerCase();
  if (t) return t;
  const ext = file.name.toLowerCase().split(".").pop() ?? "";
  return ({ opus: "audio/ogg", ogg: "audio/ogg", oga: "audio/ogg", m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav", webm: "audio/webm", aac: "audio/aac" } as Record<string, string>)[ext] ?? "";
}
