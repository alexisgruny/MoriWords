// Petit conjugueur local, pour fabriquer les leurres du QCM de conjugaison :
// le même mot à d'autres formes (書かない / 書きます / 書いて / 書いた). Si les
// 4 choix étaient 4 verbes différents, on trouverait la réponse au seul sens
// du verbe, sans rien savoir de la forme. Couvre les formes courantes des
// verbes (godan, ichidan, する, 来る) et des adjectifs en -i et en -na.

const U_ROW = "うくぐすつぬぶむる";
const ROWS: Record<string, [string, string, string, string]> = {
  // [a, i, e, o]
  う: ["わ", "い", "え", "お"],
  く: ["か", "き", "け", "こ"],
  ぐ: ["が", "ぎ", "げ", "ご"],
  す: ["さ", "し", "せ", "そ"],
  つ: ["た", "ち", "て", "と"],
  ぬ: ["な", "に", "ね", "の"],
  ぶ: ["ば", "び", "べ", "ぼ"],
  む: ["ま", "み", "め", "も"],
  る: ["ら", "り", "れ", "ろ"],
};
const I_OR_E_ROW = "いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ";

// Verbes en -iru / -eru qui se conjuguent pourtant comme des godan.
const GODAN_EXCEPTIONS = new Set(["知る", "帰る", "入る", "走る", "切る", "要る", "減る", "滑る", "喋る", "限る", "握る", "参る", "散る", "蹴る", "焦る", "混じる"]);

function teForm(stem: string, last: string, base: string): [string, string] {
  if (base === "行く" || base === "いく") {
    return [`${stem}って`, `${stem}った`];
  }
  if ("うつる".includes(last)) return [`${stem}って`, `${stem}った`];
  if ("むぶぬ".includes(last)) return [`${stem}んで`, `${stem}んだ`];
  if (last === "く") return [`${stem}いて`, `${stem}いた`];
  if (last === "ぐ") return [`${stem}いで`, `${stem}いだ`];
  return [`${stem}して`, `${stem}した`];
}

function godanForms(base: string): string[] {
  const stem = base.slice(0, -1);
  const [a, i, e, o] = ROWS[base.slice(-1)];
  const [te, ta] = teForm(stem, base.slice(-1), base);
  return [
    `${stem}${i}ます`, `${stem}${i}ません`, `${stem}${i}ました`, te, ta,
    `${stem}${a}ない`, `${stem}${a}なかった`, `${stem}${o}う`, `${stem}${e}る`,
    `${stem}${a}れる`, `${stem}${a}せる`, `${stem}${e}ば`, `${ta}ら`,
  ];
}

function ichidanForms(base: string): string[] {
  const stem = base.slice(0, -1);
  return [
    `${stem}ます`, `${stem}ません`, `${stem}ました`, `${stem}て`, `${stem}た`,
    `${stem}ない`, `${stem}なかった`, `${stem}よう`, `${stem}られる`,
    `${stem}させる`, `${stem}れば`, `${stem}たら`,
  ];
}

function suruForms(prefix: string): string[] {
  return ["します", "しません", "しました", "して", "した", "しない", "しなかった", "しよう", "される", "させる", "すれば", "したら"].map(
    (ending) => `${prefix}${ending}`,
  );
}

function kuruForms(prefix: string): string[] {
  return ["ます", "ません", "ました", "て", "た", "ない", "なかった", "よう", "られる", "させる", "れば", "たら"].map(
    (ending) => `${prefix}${ending}`,
  );
}

function iAdjectiveForms(base: string): string[] {
  const stem = base === "いい" ? "よ" : base.slice(0, -1);
  return [`${base}です`, `${stem}くない`, `${stem}かった`, `${stem}くなかった`, `${stem}くて`, `${stem}ければ`, `${stem}かったら`, `${stem}く`];
}

function naAdjectiveForms(base: string): string[] {
  return [`${base}だ`, `${base}です`, `${base}じゃない`, `${base}だった`, `${base}でした`, `${base}で`, `${base}なら`, `${base}な`];
}

// Formes courantes d'un mot (reading : sa lecture en kana, pour distinguer
// ichidan et godan quand le kanji cache la voyelle avant る).
export function conjugationsOf(base: string, reading?: string): string[] {
  if (base.endsWith("する")) return suruForms(base.slice(0, -2));
  if (base === "来る" || base === "くる") return kuruForms(base === "来る" ? "来" : "");
  if (base.endsWith("い") && !U_ROW.includes(base.slice(-1))) return iAdjectiveForms(base);
  if (!U_ROW.includes(base.slice(-1))) return naAdjectiveForms(base);

  const kana = reading ?? base;
  const beforeRu = kana.slice(-2, -1);
  const isIchidan = base.endsWith("る") && I_OR_E_ROW.includes(beforeRu) && !GODAN_EXCEPTIONS.has(base);
  return isIchidan ? ichidanForms(base) : godanForms(base);
}
