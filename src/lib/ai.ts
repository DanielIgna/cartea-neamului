import type { PersonView } from "./tree-data";

/** Modelul implicit din catalogul Neon AI Gateway; se poate schimba cu AI_MODEL fără alte modificări. */
export const DEFAULT_AI_MODEL = "claude-haiku-4-5";

export function aiConfigured() {
  return Boolean(process.env.NEON_AI_GATEWAY_BASE_URL && process.env.NEON_AI_GATEWAY_TOKEN);
}

/** Un apel „chat completions” prin Neon AI Gateway (ruta /v1, compatibilă OpenAI, merge cu orice model din catalog). */
export async function chat(messages: { role: "system" | "user"; content: string }[], { maxTokens = 400 } = {}) {
  const res = await fetch(`${process.env.NEON_AI_GATEWAY_BASE_URL}/v1/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.NEON_AI_GATEWAY_TOKEN}`, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.AI_MODEL || DEFAULT_AI_MODEL, messages, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`AI Gateway a răspuns ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("AI Gateway nu a întors niciun text.");
  return text;
}

/** Doar fapte din fișă, fără nimic despre persoane în viață (nu le trimitem datele în afara aplicației). */
export function biographyPrompt(p: PersonView, relatives: { relation: string; name: string; years: string }[]) {
  const facts = [
    `Nume: ${p.name}${p.birthSurname ? ` (născut(ă) ${p.birthSurname})` : ""}`,
    (p.birthText || p.birthPlace) && `Naștere: ${[p.birthText, p.birthPlace].filter(Boolean).join(", ")}`,
    (p.deathText || p.deathPlace) && `Deces: ${[p.deathText, p.deathPlace].filter(Boolean).join(", ")}`,
    p.occupation && `Ocupație: ${p.occupation}`,
    p.documents.length && `Documente în arhivă: ${p.documents.map((d) => `${d.title}${d.dateText ? ` (${d.dateText})` : ""}`).join("; ")}`,
    relatives.length && `Rude: ${relatives.map((r) => `${r.relation} ${r.name}${r.years ? ` (${r.years})` : ""}`).join("; ")}`,
  ].filter(Boolean).join("\n");
  return [
    {
      role: "system" as const,
      content: "Ești arhivarul unei familii din România. Scrii în limba română, cald și sobru, ca într-o carte de familie. "
        + "Folosește doar faptele primite. Nu inventa evenimente, nume sau date; poți aminti pe scurt contextul istoric al locului și al epocii, "
        + "marcându-l ca atare. Maximum 90 de cuvinte, un singur paragraf, fără titlu.",
    },
    { role: "user" as const, content: `Scrie o scurtă biografie pentru fișa acestei persoane:\n${facts}` },
  ];
}
