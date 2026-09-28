// Référentiel de conjugaison japonaise classé par niveau JLPT. Jeu de données
// curé à la main (statique : gratuit, instantané, testable), sur le même
// modèle que src/lib/grammar/points.ts ; pour l'étendre, ajouter une entrée
// avec un id unique.
import { type GrammarLevel } from "@/lib/grammar/points";

export type ConjugationExample = {
  base: string;
  reading?: string;
  conjugated: string;
  meaning: string;
};

export type ConjugationForm = {
  id: string;
  level: GrammarLevel;
  category: string;
  name: string;
  formation: string;
  explanation: string;
  examples: ConjugationExample[];
};

export const conjugationForms: ConjugationForm[] = [
  // ---------------------------------------------------------------- N5
  {
    id: "n5-masu",
    level: "N5",
    category: "Verbes",
    name: "Forme en ます (présent poli)",
    formation: "Godan : base -i (dernière syllabe en -u → -i) + ます. Ichidan : retirer る + ます. Irréguliers : する→します, 来る→来ます.",
    explanation: "Forme polie, utilisée par défaut avec des inconnus ou en public. Le dictionnaire donne la forme en -u ; c'est celle qu'on conjugue à partir de la base -i.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書きます", meaning: "écrire" },
      { base: "食べる", reading: "たべる", conjugated: "食べます", meaning: "manger" },
      { base: "する", conjugated: "します", meaning: "faire" },
    ],
  },
  {
    id: "n5-masen",
    level: "N5",
    category: "Verbes",
    name: "Forme en ません (présent poli négatif)",
    formation: "Base -i + ません.",
    explanation: "Négation polie du présent : remplace simplement ます par ません.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書きません", meaning: "ne pas écrire" },
      { base: "食べる", reading: "たべる", conjugated: "食べません", meaning: "ne pas manger" },
    ],
  },
  {
    id: "n5-mashita",
    level: "N5",
    category: "Verbes",
    name: "Forme en ました / ませんでした (passé poli)",
    formation: "Base -i + ました (affirmatif) ou + ませんでした (négatif).",
    explanation: "Passé poli : ました remplace ます, ませんでした remplace ません.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書きました", meaning: "j'ai écrit" },
      { base: "食べる", reading: "たべる", conjugated: "食べませんでした", meaning: "je n'ai pas mangé" },
    ],
  },
  {
    id: "n5-te-form",
    level: "N5",
    category: "Verbes",
    name: "Forme en て",
    formation:
      "Godan : dépend de la dernière syllabe (う/つ/る→って, む/ぶ/ぬ→んで, く→いて, ぐ→いで, す→して). Ichidan : retirer る + て. Irréguliers : する→して, 来る→来て.",
    explanation: "Sert à enchaîner des actions, faire une demande (~てください), ou combiner avec いる/おく/みる. La forme la plus utilisée du verbe au quotidien.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書いて", meaning: "écrire (et...)" },
      { base: "飲む", reading: "のむ", conjugated: "飲んで", meaning: "boire (et...)" },
      { base: "食べる", reading: "たべる", conjugated: "食べて", meaning: "manger (et...)" },
    ],
  },
  {
    id: "n5-teiru",
    level: "N5",
    category: "Verbes",
    name: "~ている (action en cours / état)",
    formation: "Base て + いる.",
    explanation: "Selon le verbe, indique une action en cours (\"je mange\") ou un état résultant d'un changement (\"la fenêtre est ouverte\", \"il est marié\").",
    examples: [
      { base: "食べる", reading: "たべる", conjugated: "食べている", meaning: "être en train de manger" },
      { base: "結婚する", reading: "けっこんする", conjugated: "結婚している", meaning: "être marié" },
    ],
  },
  {
    id: "n5-nai-form",
    level: "N5",
    category: "Verbes",
    name: "Forme en ない (présent négatif, familier)",
    formation: "Godan : base -a (う→わ) + ない. Ichidan : retirer る + ない. Irréguliers : しない, 来ない.",
    explanation: "Équivalent familier de ません, utilisé entre proches ou à l'écrit informel.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書かない", meaning: "ne pas écrire" },
      { base: "食べる", reading: "たべる", conjugated: "食べない", meaning: "ne pas manger" },
    ],
  },
  {
    id: "n5-ta-form",
    level: "N5",
    category: "Verbes",
    name: "Forme en た (passé affirmatif, familier)",
    formation: "Mêmes règles que la forme en て, en remplaçant て par た (って→った, んで→んだ, いて→いた...).",
    explanation: "Équivalent familier de ました.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書いた", meaning: "j'ai écrit" },
      { base: "飲む", reading: "のむ", conjugated: "飲んだ", meaning: "j'ai bu" },
    ],
  },
  {
    id: "n5-nakatta",
    level: "N5",
    category: "Verbes",
    name: "Forme en なかった (passé négatif, familier)",
    formation: "Forme en ない : remplacer le い final par かった.",
    explanation: "Équivalent familier de ませんでした.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書かなかった", meaning: "je n'ai pas écrit" },
      { base: "食べる", reading: "たべる", conjugated: "食べなかった", meaning: "je n'ai pas mangé" },
    ],
  },
  {
    id: "n5-i-adjective",
    level: "N5",
    category: "Adjectifs en い",
    name: "Conjugaison des adjectifs en い",
    formation: "Présent : base+い. Négatif : base+くない. Passé : base+かった. Passé négatif : base+くなかった. Exception : いい (bon) → よかった, よくない.",
    explanation: "Les adjectifs en い se conjuguent seuls, sans です/だ (です peut s'ajouter pour la politesse mais ne change pas le sens).",
    examples: [
      { base: "高い", reading: "たかい", conjugated: "高くなかった", meaning: "n'était pas cher/haut" },
      { base: "いい", conjugated: "よかった", meaning: "c'était bien" },
    ],
  },
  {
    id: "n5-na-adjective",
    level: "N5",
    category: "Adjectifs en な",
    name: "Conjugaison des adjectifs en な",
    formation: "Se conjuguent comme です/だ : présent 静かです, négatif 静かじゃない/ではない, passé 静かでした, passé négatif 静かじゃなかった/ではなかった.",
    explanation: "Le な n'apparaît que devant un nom (静かな部屋 = une pièce calme) ; seul, l'adjectif se conjugue via です/だ.",
    examples: [
      { base: "静か", reading: "しずか", conjugated: "静かじゃなかった", meaning: "ce n'était pas calme" },
    ],
  },
  {
    id: "n5-tai",
    level: "N5",
    category: "Verbes",
    name: "~たい (vouloir faire)",
    formation: "Base -i + たい, puis se conjugue ensuite comme un adjectif en い.",
    explanation: "N'exprime le désir que du locuteur (ou en question) ; pour un tiers, on utilise plutôt ~たがっている.",
    examples: [
      { base: "食べる", reading: "たべる", conjugated: "食べたい", meaning: "vouloir manger" },
      { base: "行く", reading: "いく", conjugated: "行きたくない", meaning: "ne pas vouloir y aller" },
    ],
  },
  {
    id: "n5-mashou",
    level: "N5",
    category: "Verbes",
    name: "~ましょう (volitif poli, « faisons »)",
    formation: "Base -i + ましょう.",
    explanation: "Propose de faire quelque chose ensemble, poliment.",
    examples: [
      { base: "行く", reading: "いく", conjugated: "行きましょう", meaning: "allons-y" },
    ],
  },

  // ---------------------------------------------------------------- N4
  {
    id: "n4-volitional-plain",
    level: "N4",
    category: "Verbes",
    name: "Forme volitive familière (よう/おう)",
    formation: "Godan : base -o (う→おう) + う. Ichidan : retirer る + よう. Irréguliers : しよう, 来よう.",
    explanation: "Équivalent familier de ましょう, aussi utilisé pour exprimer une intention (~ようと思う).",
    examples: [
      { base: "行く", reading: "いく", conjugated: "行こう", meaning: "allons-y (familier)" },
      { base: "食べる", reading: "たべる", conjugated: "食べよう", meaning: "mangeons (familier)" },
    ],
  },
  {
    id: "n4-conditional-ba",
    level: "N4",
    category: "Verbes",
    name: "Conditionnel ~ば",
    formation: "Godan : base -e + ば. Ichidan : retirer る + れば. Irréguliers : すれば, くれば. Adjectifs en い : retirer い + ければ.",
    explanation: "Condition générale ou hypothèse (« si »), souvent utilisée pour des vérités générales ou des conseils.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書けば", meaning: "si (on) écrit" },
      { base: "高い", reading: "たかい", conjugated: "高ければ", meaning: "si c'est cher" },
    ],
  },
  {
    id: "n4-conditional-tara",
    level: "N4",
    category: "Verbes",
    name: "Conditionnel ~たら",
    formation: "Forme en た + ら.",
    explanation: "Condition ou séquence temporelle (« quand/une fois que »), plus concrète et plus courante à l'oral que ~ば.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書いたら", meaning: "une fois écrit / si (on) écrit" },
    ],
  },
  {
    id: "n4-potential",
    level: "N4",
    category: "Verbes",
    name: "Forme potentielle (pouvoir faire)",
    formation: "Godan : base -e + る. Ichidan : retirer る + られる (souvent contracté en れる à l'oral). Irréguliers : できる, 来られる.",
    explanation: "Décrit une capacité (savoir/pouvoir faire), pas une permission (pour ça, voir ~てもいい). Une fois formée, elle se conjugue comme un verbe en -る classique (食べる, 見る...).",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書ける", meaning: "pouvoir écrire" },
      { base: "食べる", reading: "たべる", conjugated: "食べられる", meaning: "pouvoir manger" },
      { base: "する", conjugated: "できる", meaning: "pouvoir faire" },
    ],
  },
  {
    id: "n4-passive",
    level: "N4",
    category: "Verbes",
    name: "Forme passive",
    formation: "Godan : base -a + れる. Ichidan : retirer る + られる. Irréguliers : される, 来られる.",
    explanation: "Comme en français, mais aussi utilisée pour dire qu'on subit une action qui nous dérange ou nous gêne (« il m'a plu dessus » plutôt que juste « il a plu ») — une nuance qui n'a pas vraiment d'équivalent en français.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書かれる", meaning: "être écrit" },
      { base: "褒める", reading: "ほめる", conjugated: "褒められる", meaning: "être félicité" },
    ],
  },
  {
    id: "n4-nakereba",
    level: "N4",
    category: "Verbes",
    name: "~なければならない (devoir faire)",
    formation: "Forme en ない : retirer le い final + ければならない (ou plus familier : ~なきゃ).",
    explanation: "Obligation. ~なくてもいい en est l'opposé (« ce n'est pas la peine de »).",
    examples: [
      { base: "行く", reading: "いく", conjugated: "行かなければならない", meaning: "devoir y aller" },
    ],
  },

  // ---------------------------------------------------------------- N3
  {
    id: "n3-causative",
    level: "N3",
    category: "Verbes",
    name: "Forme causative (faire faire, laisser faire)",
    formation: "Godan : base -a + せる. Ichidan : retirer る + させる. Irréguliers : させる, 来させる.",
    explanation: "Selon le contexte : « faire faire » (contrainte) ou « laisser faire » (permission).",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書かせる", meaning: "faire écrire" },
      { base: "食べる", reading: "たべる", conjugated: "食べさせる", meaning: "faire/laisser manger" },
    ],
  },
  {
    id: "n3-causative-passive",
    level: "N3",
    category: "Verbes",
    name: "Forme causative-passive (être forcé de faire)",
    formation:
      "Forme causative + られる : godan せられる (souvent contracté en される, sauf pour les verbes déjà en す comme 話す, où la contraction créerait une ambiguïté avec le passif). Ichidan : させられる.",
    explanation: "Exprime qu'on est contraint par quelqu'un d'autre de faire une action qu'on ne voulait pas faire.",
    examples: [
      { base: "書く", reading: "かく", conjugated: "書かせられる / 書かされる", meaning: "être forcé d'écrire" },
      { base: "食べる", reading: "たべる", conjugated: "食べさせられる", meaning: "être forcé de manger" },
    ],
  },
  {
    id: "n3-sou-looks-like",
    level: "N3",
    category: "Verbes et adjectifs",
    name: "~そう (avoir l'air de, sur le point de)",
    formation: "Base -i (verbes) ou radical de l'adjectif (retirer い, ou な pour les adjectifs en な) + そう.",
    explanation: "Une impression basée sur ce qu'on voit, sur le moment. À ne pas confondre avec un autre ~そうです, qui se construit différemment (verbe/adjectif à la forme du dictionnaire + そうです) et qui veut plutôt dire « on m'a dit que ».",
    examples: [
      { base: "降る", reading: "ふる", conjugated: "降りそう", meaning: "on dirait qu'il va pleuvoir" },
      { base: "美味しい", reading: "おいしい", conjugated: "美味しそう", meaning: "ça a l'air bon" },
    ],
  },

  // ---------------------------------------------------------------- N2
  {
    id: "n2-sonkeigo-regular",
    level: "N2",
    category: "Registre poli (敬語)",
    name: "Forme honorifique お + base -i + になる",
    formation: "お + base -i + になる.",
    explanation: "Élève l'action de l'interlocuteur ou d'un tiers respecté (jamais sa propre action). Utilisé dans un cadre professionnel ou très formel.",
    examples: [
      { base: "読む", reading: "よむ", conjugated: "お読みになる", meaning: "lire (honorifique)" },
    ],
  },
  {
    id: "n2-kenjougo-regular",
    level: "N2",
    category: "Registre poli (敬語)",
    name: "Forme humble お + base -i + する",
    formation: "お + base -i + する (ou いたす, encore plus formel).",
    explanation: "Abaisse sa propre action pour élever indirectement l'interlocuteur. Pendant honorifique du お...になる, mais pour soi-même.",
    examples: [
      { base: "持つ", reading: "もつ", conjugated: "お持ちします", meaning: "porter (humble)" },
      { base: "伝える", reading: "つたえる", conjugated: "お伝えいたします", meaning: "transmettre (très humble)" },
    ],
  },
  {
    id: "n2-sonkeigo-irregular",
    level: "N2",
    category: "Registre poli (敬語)",
    name: "Verbes honorifiques irréguliers",
    formation: "Certains verbes très courants ont une forme honorifique entièrement différente, à mémoriser un par un.",
    explanation: "する→なさる, 行く/来る/いる→いらっしゃる, 食べる/飲む→召し上がる, 言う→おっしゃる, 見る→ご覧になる.",
    examples: [
      { base: "行く", reading: "いく", conjugated: "いらっしゃる", meaning: "aller/venir (honorifique)" },
      { base: "食べる", reading: "たべる", conjugated: "召し上がる", meaning: "manger (honorifique)" },
    ],
  },
  {
    id: "n2-kenjougo-irregular",
    level: "N2",
    category: "Registre poli (敬語)",
    name: "Verbes humbles irréguliers",
    formation: "Symétrique des honorifiques irréguliers, mais pour abaisser sa propre action.",
    explanation: "する→いたす, 行く/来る→参る, いる→おる, 言う→申す, 食べる/飲む→いただく, 見る→拝見する.",
    examples: [
      { base: "行く", reading: "いく", conjugated: "参る", meaning: "aller/venir (humble)" },
      { base: "見る", reading: "みる", conjugated: "拝見する", meaning: "voir/regarder (humble)" },
    ],
  },

  // ---------------------------------------------------------------- N1
  {
    id: "n1-literary-negative",
    level: "N1",
    category: "Style littéraire",
    name: "Négation littéraire ~ぬ / ~ざる",
    formation: "Forme en ない : remplacer ない par ぬ (fin de phrase) ou par ざる (devant un nom).",
    explanation: "Un style à l'écrit, plutôt formel, ou des expressions toutes faites ; ぬ remplace ない tel quel, ざる s'utilise devant un nom ou を得ない.",
    examples: [
      { base: "知る", reading: "しる", conjugated: "知らぬ", meaning: "ne pas savoir (littéraire)" },
      { base: "行く", reading: "いく", conjugated: "行かざるを得ない", meaning: "être obligé d'y aller" },
    ],
  },
  {
    id: "n1-tsutsu-aru",
    level: "N1",
    category: "Style littéraire",
    name: "~つつある (être en train de, style écrit)",
    formation: "Base -i + つつある.",
    explanation: "Équivalent littéraire/formel de ~ている pour une évolution progressive, courant dans la presse ou les rapports.",
    examples: [
      { base: "増える", reading: "ふえる", conjugated: "増えつつある", meaning: "être en augmentation" },
    ],
  },
];

// Filtre les formes de conjugaison par niveau JLPT (ou toutes) et par texte
// libre, cherché dans le nom, la catégorie, la formation et l'explication
// (sans accents ni casse).
export function filterConjugationForms(
  forms: ConjugationForm[],
  level: GrammarLevel | "all",
  query: string,
): ConjugationForm[] {
  const normalize = (value: string) =>
    value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const normalizedQuery = normalize(query.trim());

  return forms.filter((form) => {
    if (level !== "all" && form.level !== level) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return [form.name, form.category, form.formation, form.explanation].some((field) =>
      normalize(field).includes(normalizedQuery),
    );
  });
}
