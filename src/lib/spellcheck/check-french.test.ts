import { describe, expect, it } from "vitest";

import { conjugationForms } from "@/lib/conjugation/forms";
import { grammarPoints } from "@/lib/grammar/points";
import { JLPT_KANJI } from "@/lib/kanji/kanji";

import { findUnknownWords } from "./check-french";

// Repère les fautes de frappe / mots inexistants dans le contenu français
// statique (pas de vérification de sens ni de grammaire, seulement
// l'existence du mot). Un faux positif légitime (terme technique, nom
// propre) s'ajoute à french-allowlist.ts ; un vrai résultat corrige le
// contenu directement dans points.ts / forms.ts / le générateur de kanji.
function reportUnknownWords(label: string, id: string, text: string): string[] {
  return findUnknownWords(text).map((word) => `${label} ${id}: "${word}" (dans « ${text} »)`);
}

describe("orthographe du contenu français statique", () => {
  it("grammarPoints ne contient aucun mot inconnu du dictionnaire", () => {
    const issues = grammarPoints.flatMap((point) => [
      ...reportUnknownWords("grammaire", point.id, point.meaning),
      ...reportUnknownWords("grammaire", point.id, point.explanation),
      ...point.examples.flatMap((example) => reportUnknownWords("grammaire", point.id, example.fr)),
    ]);

    expect(issues).toEqual([]);
  });

  it("conjugationForms ne contient aucun mot inconnu du dictionnaire", () => {
    const issues = conjugationForms.flatMap((form) => [
      ...reportUnknownWords("conjugaison", form.id, form.name),
      ...reportUnknownWords("conjugaison", form.id, form.explanation),
      ...form.examples.flatMap((example) => reportUnknownWords("conjugaison", form.id, example.meaning)),
    ]);

    expect(issues).toEqual([]);
  });

  it("JLPT_KANJI ne contient aucun mot inconnu du dictionnaire", () => {
    const issues = JLPT_KANJI.flatMap((entry) => reportUnknownWords("kanji", entry.kanji, entry.meaning));

    expect(issues).toEqual([]);
  });
});
