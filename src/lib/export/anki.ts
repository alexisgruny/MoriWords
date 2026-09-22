// Les champs d'une carte dont on a besoin pour construire une ligne Anki.
export type AnkiExportableCard = {
  lemma: string;
  reading?: string | null;
  meaning?: string | null;
};

// Transforme une liste de cartes en texte au format d'import d'Anki :
// des lignes d'en-tête commençant par # (séparateur, pas de HTML, colonnes),
// puis une ligne par carte avec le mot devant (Front) et le sens derrière
// (Back), séparés par une tabulation.
export function cardsToAnkiTsv(cards: AnkiExportableCard[]): string {
  const header = ["#separator:tab", "#html:false", "#columns:Front\tBack"];

  const rows = cards.map((card) => {
    const front = card.reading
      ? `${card.lemma} (${card.reading})`
      : card.lemma;
    const back = card.meaning?.trim() || "Sens à compléter";

    return [sanitizeField(front), sanitizeField(back)].join("\t");
  });

  return [...header, ...rows].join("\n");
}

// Enlève les tabulations et retours à la ligne d'un champ pour ne pas casser
// la structure du fichier (une carte = une seule ligne, deux colonnes).
function sanitizeField(value: string): string {
  return value.trim().replace(/\t/g, " ").replace(/\r?\n/g, " ");
}
