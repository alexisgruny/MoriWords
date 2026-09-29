import type HanziWriter from "hanzi-writer";
import type { HanziWriterOptions } from "hanzi-writer";

import { strokeDataUrl } from "./writing";

// Couleurs du thème (clair ou sombre) : Hanzi Writer attend des couleurs CSS,
// pas des variables, donc on les lit au moment de créer le tracé.
function themeColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

// Crée un Hanzi Writer (chargé à la demande, navigateur uniquement) avec les
// couleurs du site et les tracés servis par public/strokes. Il vit dans son
// propre élément, ajouté au conteneur : remove() l'enlève sans toucher à un
// autre tracé monté entre-temps (React monte deux fois en développement).
export async function createWriter(
  container: HTMLElement,
  character: string,
  options: Partial<HanziWriterOptions> & { onLoadError?: () => void },
): Promise<{ writer: HanziWriter; remove: () => void }> {
  const { default: Writer } = await import("hanzi-writer");
  const { onLoadError, ...writerOptions } = options;
  const host = document.createElement("div");
  container.appendChild(host);

  const writer = Writer.create(host, character, {
    padding: 16,
    showCharacter: false,
    showOutline: false,
    drawingWidth: 22,
    strokeColor: themeColor("--ink", "#1f2328"),
    drawingColor: themeColor("--ink", "#1f2328"),
    outlineColor: themeColor("--line-strong", "#b9b8b0"),
    highlightColor: themeColor("--accent", "#cd2d1c"),
    radicalColor: themeColor("--accent", "#cd2d1c"),
    charDataLoader: (char, onLoad, onError) => {
      fetch(strokeDataUrl(char))
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error("tracé absent"))))
        .then(onLoad)
        .catch((error: unknown) => {
          onLoadError?.();
          onError(error);
        });
    },
    ...writerOptions,
  });

  return { writer, remove: () => host.remove() };
}
