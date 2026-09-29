import type { KanaGroup } from "@/lib/kana/kana";

// Parcours débutant : 10 leçons courtes (5 à 10 minutes), gratuites, pour
// passer de zéro à la lecture d'une première réplique. Le contenu est écrit
// ici une fois pour toutes (aucun appel à Claude) ; les exercices réutilisent
// ceux du site. À faire relire par une personne de niveau N3 ou plus.

export type LessonExample = { ja: string; reading?: string; fr: string };

export type LessonSection = { title: string; paragraphs: string[]; examples?: LessonExample[] };

export type LessonExercise =
  | { kind: "kana"; script: "hiragana" | "katakana"; groups: KanaGroup[] }
  | { kind: "grammar"; patterns: string[] }
  | { kind: "conjugation"; forms: string[] }
  | { kind: "kanji"; kanji: string[] }
  | { kind: "reading"; text: string; translation: string };

export type Lesson = {
  id: string;
  number: number;
  title: string;
  minutes: number;
  summary: string;
  sections: LessonSection[];
  exercise: LessonExercise;
  // Bonnes réponses pour valider la leçon (0 : un bouton « J'ai lu »).
  goal: number;
};

export const LESSONS: Lesson[] = [
  {
    id: "hiragana-base",
    number: 1,
    title: "Les hiragana (1/2) : les 46 de base",
    minutes: 10,
    summary: "L'alphabet de base du japonais : chaque signe se lit toujours de la même façon.",
    sections: [
      {
        title: "Trois écritures",
        paragraphs: [
          "Le japonais mélange trois écritures : les hiragana (pour les mots japonais et la grammaire), les katakana (pour les mots étrangers) et les kanji (des caractères venus de Chine, qui portent le sens).",
          "On commence par les hiragana : avec eux, tu peux déjà écrire n'importe quel mot japonais, même ceux qu'on écrit d'habitude en kanji.",
        ],
      },
      {
        title: "Un signe, une syllabe",
        paragraphs: [
          "Chaque hiragana note une syllabe : une voyelle seule (あ a, い i, う u, え e, お o) ou une consonne suivie d'une voyelle (か ka, き ki, く ku…). Il y en a 46.",
          "Bonne nouvelle : un hiragana se prononce toujours pareil. Pas de lettres muettes, pas d'exceptions comme en français.",
          "Quelques pièges de lecture : し se lit « shi », ち « chi », つ « tsu », ふ « fu », et ん, le seul signe qui est une consonne seule, se lit « n ».",
        ],
        examples: [
          { ja: "あい", fr: "l'amour (a-i)" },
          { ja: "すし", fr: "sushi (su-shi)" },
          { ja: "ねこ", fr: "chat (ne-ko)" },
          { ja: "さかな", fr: "poisson (sa-ka-na)" },
        ],
      },
      {
        title: "Comment les apprendre",
        paragraphs: [
          "Ligne par ligne (a, ka, sa, ta…), 5 signes à la fois. Lis-les à voix haute, puis écris-les dans le bon ordre des traits : la page Kana montre l'animation de chaque signe.",
          "Pas besoin de tout savoir aujourd'hui : fais l'exercice ci-dessous, puis refais-le demain.",
        ],
      },
    ],
    exercise: { kind: "kana", script: "hiragana", groups: ["base"] },
    goal: 15,
  },
  {
    id: "hiragana-avances",
    number: 2,
    title: "Les hiragana (2/2) : sons voisés et combinés",
    minutes: 8,
    summary: "Deux petits traits ou un rond changent le son ; un petit や, ゆ, よ se combine.",
    sections: [
      {
        title: "Les sons voisés (ten-ten et maru)",
        paragraphs: [
          "Deux petits traits en haut à droite (appelés ten-ten, ゛) rendent la consonne plus « sonore » : か ka devient が ga, さ sa devient ざ za, た ta devient だ da, は ha devient ば ba.",
          "Un petit rond (maru, ゜) transforme la ligne h en p : は ha devient ぱ pa, ひ hi devient ぴ pi.",
        ],
        examples: [
          { ja: "がっこう", fr: "école (ga-k-kō)" },
          { ja: "ぱん", fr: "pain (pa-n)" },
          { ja: "でんわ", fr: "téléphone (de-n-wa)" },
        ],
      },
      {
        title: "Les combinaisons avec ゃ, ゅ, ょ",
        paragraphs: [
          "Écrits en petit après un signe en « i », や, ゆ et よ forment une seule syllabe : き + ゃ = きゃ (kya), し + ょ = しょ (sho), ち + ゅ = ちゅ (chu).",
          "Un petit っ double la consonne suivante : on marque une courte pause avant elle, comme dans きって (kitte, timbre).",
        ],
        examples: [
          { ja: "きょう", fr: "aujourd'hui (kyō)" },
          { ja: "しゃしん", fr: "photo (sha-shin)" },
          { ja: "きって", fr: "timbre (ki-t-te)" },
        ],
      },
    ],
    exercise: { kind: "kana", script: "hiragana", groups: ["dakuten", "combo"] },
    goal: 15,
  },
  {
    id: "katakana",
    number: 3,
    title: "Les katakana et les mots étrangers",
    minutes: 10,
    summary: "La même liste de sons, dessinée autrement : pour les mots venus d'ailleurs.",
    sections: [
      {
        title: "À quoi servent les katakana",
        paragraphs: [
          "Les katakana notent les mêmes sons que les hiragana, avec des traits plus droits. On les utilise surtout pour les mots empruntés à d'autres langues, les noms étrangers et parfois pour faire ressortir un mot, comme on mettrait des italiques.",
          "Dans les katakana, un trait horizontal ー allonge la voyelle d'avant : コーヒー se lit « kōhī ».",
        ],
        examples: [
          { ja: "コーヒー", fr: "café (de l'anglais coffee)" },
          { ja: "テレビ", fr: "télévision" },
          { ja: "フランス", fr: "France" },
          { ja: "アニメ", fr: "anime, dessin animé" },
        ],
      },
      {
        title: "Les signes qui se ressemblent",
        paragraphs: [
          "Attention aux paires faciles à confondre : シ (shi) et ツ (tsu), ソ (so) et ン (n). Regarde le sens du dernier trait : il monte de bas en haut pour シ et ン, et descend de haut en bas pour ツ et ソ. L'animation de la page Kana le montre bien.",
        ],
      },
    ],
    exercise: { kind: "kana", script: "katakana", groups: ["base"] },
    goal: 15,
  },
  {
    id: "se-presenter",
    number: 4,
    title: "Se présenter : AはBです",
    minutes: 8,
    summary: "La phrase la plus utile du japonais : « A est B ».",
    sections: [
      {
        title: "La structure",
        paragraphs: [
          "AはBです veut dire « A est B ». は se prononce « wa » quand il sert de particule : il annonce le sujet dont on parle. です termine la phrase de façon polie.",
          "Le japonais n'a ni article (le, un) ni pluriel à marquer : 学生 veut dire « étudiant », « un étudiant » ou « des étudiants » selon le contexte.",
        ],
        examples: [
          { ja: "わたしは学生です。", reading: "わたしはがくせいです。", fr: "Je suis étudiant(e)." },
          { ja: "わたしはフランス人です。", reading: "わたしはフランスじんです。", fr: "Je suis français(e)." },
        ],
      },
      {
        title: "Les phrases de présentation",
        paragraphs: [
          "はじめまして (« enchanté ») ouvre une première rencontre, et よろしくおねがいします la conclut : quelque chose comme « je compte sur vous, ravi de faire votre connaissance ».",
          "Pour poser une question, il suffit d'ajouter か à la fin : 学生ですか。 « Êtes-vous étudiant ? ».",
        ],
        examples: [
          { ja: "はじめまして。レアです。", fr: "Enchantée. Je suis Léa." },
          { ja: "よろしくおねがいします。", fr: "Ravie de faire ta connaissance." },
          { ja: "学生ですか。", reading: "がくせいですか。", fr: "Tu es étudiant(e) ?" },
        ],
      },
    ],
    exercise: { kind: "grammar", patterns: ["AはBです"] },
    goal: 8,
  },
  {
    id: "gouts-envies",
    number: 5,
    title: "Ce que tu aimes, ce que tu veux faire",
    minutes: 8,
    summary: "～が好きです (j'aime…) et ～たいです (je veux faire…).",
    sections: [
      {
        title: "J'aime : ～が好きです",
        paragraphs: [
          "Pour dire que tu aimes quelque chose, on met la chose aimée devant が, puis 好きです (suki desu). Attention, c'est bien が et pas を.",
        ],
        examples: [
          { ja: "アニメが好きです。", reading: "アニメがすきです。", fr: "J'aime les anime." },
          { ja: "ねこが好きです。", reading: "ねこがすきです。", fr: "J'aime les chats." },
        ],
      },
      {
        title: "Je veux faire : ～たいです",
        paragraphs: [
          "On prend le verbe à la forme en ます, on enlève ます et on ajoute たいです : 食べます (manger) devient 食べたいです (je veux manger).",
        ],
        examples: [
          { ja: "日本に行きたいです。", reading: "にほんにいきたいです。", fr: "Je veux aller au Japon." },
          { ja: "すしを食べたいです。", reading: "すしをたべたいです。", fr: "Je veux manger des sushis." },
        ],
      },
    ],
    exercise: { kind: "grammar", patterns: ["～が好きです", "～たいです"] },
    goal: 8,
  },
  {
    id: "particules",
    number: 6,
    title: "Les particules essentielles : を, に, へ, で",
    minutes: 10,
    summary: "De petits mots placés après un nom pour dire son rôle dans la phrase.",
    sections: [
      {
        title: "Le principe",
        paragraphs: [
          "En japonais, le verbe arrive à la fin, et chaque nom est suivi d'une particule qui dit son rôle : ce qu'on fait, où on va, où on le fait. Grâce à elles, l'ordre des mots est assez libre.",
        ],
      },
      {
        title: "を, に et へ, で",
        paragraphs: [
          "を (prononcé « o ») marque ce sur quoi porte l'action : l'objet. に et へ (prononcé « e ») marquent la destination. で marque le lieu où l'action se passe, ou le moyen utilisé.",
        ],
        examples: [
          { ja: "パンを食べます。", reading: "パンをたべます。", fr: "Je mange du pain." },
          { ja: "学校に行きます。", reading: "がっこうにいきます。", fr: "Je vais à l'école." },
          { ja: "家で本を読みます。", reading: "いえでほんをよみます。", fr: "Je lis un livre à la maison." },
          { ja: "バスで行きます。", reading: "バスでいきます。", fr: "J'y vais en bus." },
        ],
      },
    ],
    exercise: { kind: "grammar", patterns: ["～を", "～に／へ", "～で"] },
    goal: 8,
  },
  {
    id: "verbes-masu",
    number: 7,
    title: "Les verbes en ます : présent, négatif, passé",
    minutes: 10,
    summary: "La forme polie des verbes, celle qu'on utilise avec des inconnus.",
    sections: [
      {
        title: "Quatre terminaisons à connaître",
        paragraphs: [
          "À la forme polie, un verbe se termine par ます au présent (et au futur : le japonais ne les distingue pas), ません au négatif, ました au passé et ませんでした au passé négatif.",
        ],
        examples: [
          { ja: "食べます", reading: "たべます", fr: "je mange / je mangerai" },
          { ja: "食べません", reading: "たべません", fr: "je ne mange pas" },
          { ja: "食べました", reading: "たべました", fr: "j'ai mangé" },
          { ja: "食べませんでした", reading: "たべませんでした", fr: "je n'ai pas mangé" },
        ],
      },
      {
        title: "Pas de sujet obligatoire",
        paragraphs: [
          "Quand on comprend de qui on parle, on ne dit pas le sujet : 行きます peut vouloir dire « je vais », « il va » ou « nous allons ». C'est le contexte qui décide.",
        ],
      },
    ],
    exercise: { kind: "conjugation", forms: ["Forme en ます (présent poli)", "Forme en ません (présent poli négatif)", "Forme en ました / ませんでした (passé poli)"] },
    goal: 8,
  },
  {
    id: "adjectifs",
    number: 8,
    title: "Les adjectifs en い et en な",
    minutes: 8,
    summary: "Deux familles d'adjectifs, qui ne se conjuguent pas de la même façon.",
    sections: [
      {
        title: "Les adjectifs en い",
        paragraphs: [
          "Ils finissent par い (高い, cher ; おいしい, bon) et se conjuguent eux-mêmes : on remplace le い final par くない pour le négatif et par かった pour le passé.",
          "Exception à retenir : いい (bien) devient よくない et よかった.",
        ],
        examples: [
          { ja: "高いです", reading: "たかいです", fr: "c'est cher" },
          { ja: "高くないです", reading: "たかくないです", fr: "ce n'est pas cher" },
          { ja: "高かったです", reading: "たかかったです", fr: "c'était cher" },
        ],
      },
      {
        title: "Les adjectifs en な",
        paragraphs: [
          "Ils prennent な devant un nom (静かな町, une ville calme) et se conjuguent comme un nom, avec です : じゃないです au négatif, でした au passé.",
        ],
        examples: [
          { ja: "静かです", reading: "しずかです", fr: "c'est calme" },
          { ja: "静かじゃないです", reading: "しずかじゃないです", fr: "ce n'est pas calme" },
          { ja: "静かでした", reading: "しずかでした", fr: "c'était calme" },
        ],
      },
    ],
    exercise: { kind: "conjugation", forms: ["Conjugaison des adjectifs en い", "Conjugaison des adjectifs en な"] },
    goal: 8,
  },
  {
    id: "premiers-kanji",
    number: 9,
    title: "Les 20 premiers kanji",
    minutes: 10,
    summary: "Les chiffres, les jours de la semaine et « personne » : les kanji les plus fréquents.",
    sections: [
      {
        title: "Un kanji, un sens",
        paragraphs: [
          "Un kanji porte un sens, et souvent plusieurs lectures : une lecture d'origine chinoise (on'yomi, notée en katakana dans les dictionnaires) et une lecture japonaise (kun'yomi, en hiragana). Pas de panique : on les apprend mot par mot, pas en liste.",
        ],
      },
      {
        title: "Les chiffres",
        paragraphs: ["Les chiffres de un à dix, puis cent et mille, se combinent comme en français : 二十 = deux-dix = vingt."],
        examples: [
          { ja: "一 二 三 四 五", reading: "いち に さん よん ご", fr: "1 2 3 4 5" },
          { ja: "六 七 八 九 十", reading: "ろく なな はち きゅう じゅう", fr: "6 7 8 9 10" },
          { ja: "百 千", reading: "ひゃく せん", fr: "100, 1 000" },
        ],
      },
      {
        title: "Les jours de la semaine",
        paragraphs: [
          "Chaque jour porte le nom d'un élément : 月 lune (lundi), 火 feu (mardi), 水 eau (mercredi), 木 arbre (jeudi), 金 or (vendredi), 土 terre (samedi), 日 soleil (dimanche). On ajoute 曜日 : 月曜日 = lundi.",
          "Et 人 veut dire « personne » : フランス人, un(e) Français(e).",
        ],
        examples: [
          { ja: "月曜日", reading: "げつようび", fr: "lundi" },
          { ja: "日曜日", reading: "にちようび", fr: "dimanche" },
        ],
      },
    ],
    exercise: {
      kind: "kanji",
      kanji: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "日", "月", "火", "水", "木", "金", "土", "人"],
    },
    goal: 12,
  },
  {
    id: "bilan",
    number: 10,
    title: "Bilan : ton premier texte",
    minutes: 8,
    summary: "Un petit texte qui réutilise tout le parcours, avec la lecture au-dessus des kanji.",
    sections: [
      {
        title: "Tu sais déjà lire ça",
        paragraphs: [
          "Voici un court texte écrit uniquement avec ce que tu as vu : AはBです, les particules, les verbes en ます, un adjectif et des kanji du parcours. Touche un mot pour voir son sens, écoute la phrase, puis essaie de tout comprendre avant de regarder la traduction.",
        ],
      },
    ],
    exercise: {
      kind: "reading",
      text: "はじめまして。わたしはレアです。フランス人です。アニメが好きです。日曜日にともだちとえいがを見ました。とてもおもしろかったです。らいねん、日本に行きたいです。",
      translation:
        "Enchantée. Je suis Léa. Je suis française. J'aime les anime. Dimanche, j'ai vu un film avec des amis. C'était très intéressant. L'année prochaine, je veux aller au Japon.",
    },
    goal: 0,
  },
];

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export const LESSON_IDS = new Set(LESSONS.map((lesson) => lesson.id));
