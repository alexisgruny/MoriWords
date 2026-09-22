export type AnkiExportableCard = {
  lemma: string;
  reading?: string | null;
  meaning?: string | null;
};

// Anki's plain text import understands `#`-prefixed header directives
// (separator, whether fields contain HTML, column mapping) followed by one
// note per line. Tab-separated is safest here since Japanese fields can
// contain commas. See https://docs.ankiweb.net/importing/text-files.html
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

function sanitizeField(value: string): string {
  return value.trim().replace(/\t/g, " ").replace(/\r?\n/g, " ");
}
