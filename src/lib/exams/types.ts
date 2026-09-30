// Types et libellés partagés avec le navigateur : séparés de build-exam.ts
// pour ne pas envoyer les ~2 200 kanji et la grammaire dans la page.
export type ExamCategory = "kanji-sens" | "kanji-lecture" | "vocabulaire" | "grammaire" | "conjugaison";

export const CATEGORY_LABELS: Record<ExamCategory, string> = {
  "kanji-sens": "Sens des kanji",
  "kanji-lecture": "Lecture des kanji",
  vocabulaire: "Vocabulaire",
  grammaire: "Grammaire",
  conjugaison: "Conjugaison",
};

// Question envoyée au navigateur : jamais la bonne réponse.
export type ExamQuestion = {
  category: ExamCategory;
  prompt: string;
  // Texte japonais mis en avant (kanji, mot…), s'il y en a un.
  subject?: string;
  // Phrase japonaise à trous (grammaire), affichée sous la consigne.
  sentence?: string;
  choices: string[];
  choicesLang: "ja" | "fr";
};

export type CategoryResult = { correct: number; total: number };
