import { toRomaji } from "wanakana";

import type { KanaGroup } from "@/lib/kana/kana";

// Parcours débutant : 10 leçons courtes (5 à 10 minutes), gratuites, pour
// passer de zéro à la lecture d'une première réplique. Le contenu est écrit
// ici une fois pour toutes (aucun appel à Claude) ; les exercices réutilisent
// ceux du site. À faire relire par une personne de niveau N3 ou plus.

// romaji : écrit à la main pour les phrases (espaces entre les mots,
// particules は → wa, を → o) ; pour un mot seul, calculé par romajiOf.
export type LessonExample = { ja: string; reading?: string; romaji?: string; fr: string };

// Mise en forme légère dans les textes des leçons (cours N5…) :
// [は] = partie grammaticale en couleur, **mot** = mot clé en gras.
// formula : la règle en une ligne (encadré), tip : piège à éviter.
export type LessonSection = { title: string; paragraphs: string[]; examples?: LessonExample[]; formula?: string; tip?: string };

// Exercice écrit : la phrase française, à taper en japonais (kana ou kanji).
// answers : formes acceptées (au moins une en kana, tapable au clavier).
export type LessonWriteQuestion = { fr: string; answers: string[] };

// Question d'une leçon : phrase française, bonne réponse en japonais et
// pièges (erreurs typiques d'un débutant : mauvaise particule, mauvaise forme).
export type LessonQuestion = { fr: string; answer: string; wrong: string[] };

export type LessonExercise =
  | { kind: "kana"; script: "hiragana" | "katakana"; groups: KanaGroup[] }
  // QCM écrit pour la leçon, avec seulement le vocabulaire de la leçon (les
  // phrases générées pour les exercices du site étaient parfois trop dures).
  | { kind: "lesson-qcm"; questions: LessonQuestion[] }
  | { kind: "grammar"; patterns: string[] }
  | { kind: "conjugation"; forms: string[] }
  | { kind: "kanji"; kanji: string[] }
  // questions : compréhension du texte, en français (question et réponses).
  | { kind: "reading"; text: string; translation: string; questions?: LessonQuestion[] };

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
  // Vocabulaire de débutant de la leçon, présenté avant l'exercice.
  vocabulary?: LessonExample[];
  // Exercice du site sur le même sujet, pour aller plus loin.
  morePractice?: { href: string; label: string };
  // « À retenir » : 2 ou 3 points clés, en fin de leçon.
  keyPoints?: string[];
  // Kanji à apprendre dans la leçon (fenêtre : sens, lectures, tracé).
  kanji?: string[];
  // Deuxième étape après le QCM : la leçon est validée quand les deux le sont.
  writing?: { questions: LessonWriteQuestion[]; goal: number };
};

// Retire la mise en forme ([…], **…**) : pour l'écoute, les tests, la comparaison.
export function stripMarks(text: string): string {
  return text.replace(/\[([^\]]*)\]/g, "$1").replace(/\*\*([^*]*)\*\*/g, "$1");
}

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
    keyPoints: [
      "46 hiragana de base, chacun se lit toujours de la même façon.",
      "Pièges : し = shi, ち = chi, つ = tsu, ふ = fu, ん = n.",
      "Apprends-les par ligne (あいうえお, かきくけこ…), pas tous d'un coup.",
    ],
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
    keyPoints: [
      "Deux petits traits (゛) rendent le son voisé : か → が, さ → ざ.",
      "Un petit rond (゜) donne les sons en p : は → ぱ.",
      "Un petit ゃ, ゅ ou ょ se colle au kana d'avant (きゃ = kya), un petit っ double la consonne suivante (きって = kitte).",
    ],
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
    keyPoints: [
      "Les katakana servent surtout aux mots étrangers : コーヒー, テレビ.",
      "Le trait ー allonge la voyelle d'avant : コー = koo.",
      "Mêmes sons que les hiragana, seule l'écriture change.",
    ],
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
          { ja: "わたしは学生です。", reading: "わたしはがくせいです。", romaji: "watashi wa gakusei desu.", fr: "Je suis étudiant(e)." },
          { ja: "わたしはフランス人です。", reading: "わたしはフランスじんです。", romaji: "watashi wa furansujin desu.", fr: "Je suis français(e)." },
        ],
      },
      {
        title: "Les phrases de présentation",
        paragraphs: [
          "はじめまして (« enchanté ») ouvre une première rencontre, et よろしくおねがいします la conclut : quelque chose comme « je compte sur vous, ravi de faire votre connaissance ».",
          "Pour poser une question, il suffit d'ajouter か à la fin : 学生ですか。 « Êtes-vous étudiant ? ».",
        ],
        examples: [
          { ja: "はじめまして。レアです。", romaji: "hajimemashite. Rea desu.", fr: "Enchantée. Je suis Léa." },
          { ja: "よろしくおねがいします。", romaji: "yoroshiku onegaishimasu.", fr: "Ravie de faire ta connaissance." },
          { ja: "学生ですか。", reading: "がくせいですか。", romaji: "gakusei desu ka.", fr: "Tu es étudiant(e) ?" },
        ],
      },
    ],
    vocabulary: [
      { ja: "わたし", fr: "je, moi" },
      { ja: "あなた", fr: "tu, toi (à éviter avec un inconnu)" },
      { ja: "がくせい", fr: "étudiant(e)" },
      { ja: "せんせい", fr: "professeur" },
      { ja: "ともだち", fr: "ami(e)" },
      { ja: "日本人", reading: "にほんじん", fr: "Japonais(e)" },
      { ja: "フランス人", reading: "フランスじん", fr: "Français(e)" },
      { ja: "これ", fr: "ceci, ça (près de moi)" },
      { ja: "それ", fr: "cela, ça (près de toi)" },
      { ja: "ほん", fr: "livre" },
      { ja: "ねこ", fr: "chat" },
      { ja: "いぬ", fr: "chien" },
      { ja: "はい", fr: "oui" },
      { ja: "いいえ", fr: "non" },
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
      { fr: "Je suis étudiant(e).", answer: "わたしはがくせいです。", wrong: ["わたしはせんせいです。","わたしをがくせいです。"] },
      { fr: "Je suis professeur.", answer: "わたしはせんせいです。", wrong: ["わたしはがくせいです。","あなたはせんせいです。"] },
      { fr: "Je suis français(e).", answer: "わたしはフランス人です。", wrong: ["わたしは日本人です。","わたしがフランス人ですか。"] },
      { fr: "Tu es japonais(e) ?", answer: "あなたは日本人ですか。", wrong: ["あなたは日本人です。","わたしは日本人ですか。"] },
      { fr: "C'est un livre.", answer: "これはほんです。", wrong: ["これはねこです。","それはほんですか。"] },
      { fr: "Ça, c'est un chat.", answer: "それはねこです。", wrong: ["それはいぬです。","これはねこですか。"] },
      { fr: "C'est un chien ?", answer: "これはいぬですか。", wrong: ["これはいぬです。","これはねこですか。"] },
      { fr: "Le professeur est japonais.", answer: "せんせいは日本人です。", wrong: ["せんせいはフランス人です。","がくせいは日本人です。"] },
      { fr: "Mon ami est étudiant.", answer: "ともだちはがくせいです。", wrong: ["ともだちはせんせいです。","わたしはがくせいです。"] },
      { fr: "Oui, je suis étudiant(e).", answer: "はい、がくせいです。", wrong: ["いいえ、がくせいです。","はい、せんせいです。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-wa-desu", label: "Plus de phrases sur AはBです" },
    keyPoints: [
      "A は B です = « A est B » (は se prononce « wa »).",
      "か à la fin transforme la phrase en question.",
      "はじめまして pour se présenter, よろしくおねがいします pour finir.",
    ],
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
          { ja: "アニメが好きです。", reading: "アニメがすきです。", romaji: "anime ga suki desu.", fr: "J'aime les anime." },
          { ja: "ねこが好きです。", reading: "ねこがすきです。", romaji: "neko ga suki desu.", fr: "J'aime les chats." },
        ],
      },
      {
        title: "Je veux faire : ～たいです",
        paragraphs: [
          "On prend le verbe à la forme en ます, on enlève ます et on ajoute たいです : 食べます (manger) devient 食べたいです (je veux manger).",
        ],
        examples: [
          { ja: "日本に行きたいです。", reading: "にほんにいきたいです。", romaji: "nihon ni ikitai desu.", fr: "Je veux aller au Japon." },
          { ja: "すしを食べたいです。", reading: "すしをたべたいです。", romaji: "sushi o tabetai desu.", fr: "Je veux manger des sushis." },
        ],
      },
    ],
    vocabulary: [
      { ja: "すき", fr: "aimer (すきです : j'aime)" },
      { ja: "たべます", fr: "manger" },
      { ja: "のみます", fr: "boire" },
      { ja: "いきます", fr: "aller" },
      { ja: "みます", fr: "regarder, voir" },
      { ja: "アニメ", fr: "anime" },
      { ja: "えいが", fr: "film" },
      { ja: "すし", fr: "sushi" },
      { ja: "コーヒー", fr: "café" },
      { ja: "おちゃ", fr: "thé" },
      { ja: "みず", fr: "eau" },
      { ja: "日本", reading: "にほん", fr: "le Japon" },
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
      { fr: "J'aime les chats.", answer: "ねこがすきです。", wrong: ["ねこをすきです。","いぬがすきです。"] },
      { fr: "J'aime les anime.", answer: "アニメがすきです。", wrong: ["アニメをすきです。","アニメがみたいです。"] },
      { fr: "J'aime le café.", answer: "コーヒーがすきです。", wrong: ["コーヒーをのみたいです。","おちゃがすきです。"] },
      { fr: "Tu aimes les chiens ?", answer: "いぬがすきですか。", wrong: ["いぬがすきです。","いぬをみたいですか。"] },
      { fr: "Je veux manger des sushis.", answer: "すしをたべたいです。", wrong: ["すしがすきです。","すしをのみたいです。"] },
      { fr: "Je veux boire un café.", answer: "コーヒーをのみたいです。", wrong: ["コーヒーをたべたいです。","コーヒーがすきです。"] },
      { fr: "Je veux boire de l'eau.", answer: "みずをのみたいです。", wrong: ["みずをのみます。","みずがすきです。"] },
      { fr: "Je veux voir un film.", answer: "えいがをみたいです。", wrong: ["えいがをたべたいです。","えいがをみます。"] },
      { fr: "Je veux aller au Japon.", answer: "日本にいきたいです。", wrong: ["日本をいきたいです。","日本がすきです。"] },
      { fr: "J'aime le thé.", answer: "おちゃがすきです。", wrong: ["おちゃをすきです。","おちゃをのみたいです。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-ga-suki", label: "Plus de phrases sur ～が好きです" },
    keyPoints: [
      "Ce qu'on aime : A が好きです.",
      "Ce qu'on veut faire : forme en ます sans ます + たいです (食べます → 食べたいです).",
    ],
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
          { ja: "パンを食べます。", reading: "パンをたべます。", romaji: "pan o tabemasu.", fr: "Je mange du pain." },
          { ja: "学校に行きます。", reading: "がっこうにいきます。", romaji: "gakkou ni ikimasu.", fr: "Je vais à l'école." },
          { ja: "家で本を読みます。", reading: "いえでほんをよみます。", romaji: "ie de hon o yomimasu.", fr: "Je lis un livre à la maison." },
          { ja: "バスで行きます。", reading: "バスでいきます。", romaji: "basu de ikimasu.", fr: "J'y vais en bus." },
        ],
      },
    ],
    vocabulary: [
      { ja: "たべます", fr: "manger" },
      { ja: "のみます", fr: "boire" },
      { ja: "よみます", fr: "lire" },
      { ja: "いきます", fr: "aller" },
      { ja: "かえります", fr: "rentrer (chez soi)" },
      { ja: "パン", fr: "pain" },
      { ja: "ほん", fr: "livre" },
      { ja: "みず", fr: "eau" },
      { ja: "がっこう", fr: "école" },
      { ja: "いえ", fr: "maison" },
      { ja: "こうえん", fr: "parc" },
      { ja: "としょかん", fr: "bibliothèque" },
      { ja: "レストラン", fr: "restaurant" },
      { ja: "バス", fr: "bus" },
      { ja: "でんしゃ", fr: "train" },
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
      { fr: "Je mange du pain.", answer: "パンをたべます。", wrong: ["パンでたべます。","パンにたべます。"] },
      { fr: "Je lis un livre.", answer: "ほんをよみます。", wrong: ["ほんによみます。","ほんでよみます。"] },
      { fr: "Je vais à l'école.", answer: "がっこうにいきます。", wrong: ["がっこうをいきます。","がっこうでいきます。"] },
      { fr: "Je rentre à la maison.", answer: "いえにかえります。", wrong: ["いえをかえります。","いえでかえります。"] },
      { fr: "Je vais au parc.", answer: "こうえんへいきます。", wrong: ["こうえんをいきます。","こうえんでいきます。"] },
      { fr: "Je mange au restaurant.", answer: "レストランでたべます。", wrong: ["レストランをたべます。","レストランにたべます。"] },
      { fr: "J'y vais en bus.", answer: "バスでいきます。", wrong: ["バスをいきます。","バスはいきます。"] },
      { fr: "Je lis un livre à la bibliothèque.", answer: "としょかんでほんをよみます。", wrong: ["としょかんにほんをよみます。","としょかんでほんによみます。"] },
      { fr: "Je bois de l'eau à l'école.", answer: "がっこうでみずをのみます。", wrong: ["がっこうにみずをのみます。","がっこうでみずにのみます。"] },
      { fr: "Je vais à l'école en train.", answer: "でんしゃでがっこうにいきます。", wrong: ["でんしゃをがっこうにいきます。","でんしゃでがっこうをいきます。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-wo", label: "Plus de phrases sur les particules" },
    keyPoints: [
      "を marque l'objet (パンを食べます), に et へ la destination (学校に行きます).",
      "で marque le lieu de l'action ou le moyen (バスで行きます).",
      "La particule se place juste après le mot qu'elle concerne.",
    ],
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
    vocabulary: [
      { ja: "たべます", fr: "manger" },
      { ja: "のみます", fr: "boire" },
      { ja: "いきます", fr: "aller" },
      { ja: "みます", fr: "regarder" },
      { ja: "よみます", fr: "lire" },
      { ja: "かきます", fr: "écrire" },
      { ja: "ねます", fr: "dormir, se coucher" },
      { ja: "おきます", fr: "se lever" },
      { ja: "きのう", fr: "hier" },
      { ja: "きょう", fr: "aujourd'hui" },
      { ja: "あした", fr: "demain" },
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
      { fr: "Je mange.", answer: "たべます。", wrong: ["たべません。","たべました。"] },
      { fr: "Je ne bois pas.", answer: "のみません。", wrong: ["のみます。","のみませんでした。"] },
      { fr: "Je suis allé(e).", answer: "いきました。", wrong: ["いきます。","いきませんでした。"] },
      { fr: "Je n'ai pas regardé.", answer: "みませんでした。", wrong: ["みません。","みました。"] },
      { fr: "J'écris.", answer: "かきます。", wrong: ["かきません。","かきました。"] },
      { fr: "Je n'ai pas lu.", answer: "よみませんでした。", wrong: ["よみました。","よみません。"] },
      { fr: "Je me couche.", answer: "ねます。", wrong: ["おきます。","ねません。"] },
      { fr: "Hier, j'ai mangé du pain.", answer: "きのうパンをたべました。", wrong: ["きのうパンをたべます。","きのうパンをたべませんでした。"] },
      { fr: "Demain, je vais à l'école.", answer: "あしたがっこうにいきます。", wrong: ["あしたがっこうにいきました。","あしたがっこうにいきません。"] },
      { fr: "Aujourd'hui, je ne bois pas de café.", answer: "きょうはコーヒーをのみません。", wrong: ["きょうはコーヒーをのみます。","きょうはコーヒーをのみませんでした。"] },
      ],
    },
    morePractice: { href: "/exercices/conjugaison?forme=n5-masu", label: "Plus d'exercices sur la forme en ます" },
    keyPoints: [
      "ます présent, ません négatif, ました passé, ませんでした passé négatif.",
      "Le verbe se place toujours à la fin de la phrase.",
    ],
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
          { ja: "高いです", reading: "たかいです", romaji: "takai desu", fr: "c'est cher" },
          { ja: "高くないです", reading: "たかくないです", romaji: "takakunai desu", fr: "ce n'est pas cher" },
          { ja: "高かったです", reading: "たかかったです", romaji: "takakatta desu", fr: "c'était cher" },
        ],
      },
      {
        title: "Les adjectifs en な",
        paragraphs: [
          "Ils prennent な devant un nom (静かな町, une ville calme) et se conjuguent comme un nom, avec です : じゃないです au négatif, でした au passé.",
        ],
        examples: [
          { ja: "静かです", reading: "しずかです", romaji: "shizuka desu", fr: "c'est calme" },
          { ja: "静かじゃないです", reading: "しずかじゃないです", romaji: "shizuka ja nai desu", fr: "ce n'est pas calme" },
          { ja: "静かでした", reading: "しずかでした", romaji: "shizuka deshita", fr: "c'était calme" },
        ],
      },
    ],
    vocabulary: [
      { ja: "たかい", fr: "cher, haut" },
      { ja: "やすい", fr: "bon marché" },
      { ja: "おいしい", fr: "bon (au goût)" },
      { ja: "おおきい", fr: "grand" },
      { ja: "ちいさい", fr: "petit" },
      { ja: "いい", fr: "bien, bon (よくない, よかった)" },
      { ja: "しずか", fr: "calme (adjectif en な)" },
      { ja: "きれい", fr: "joli, propre (adjectif en な, malgré son い)" },
      { ja: "げんき", fr: "en forme (adjectif en な)" },
      { ja: "この", fr: "ce, cette (+ nom)" },
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
      { fr: "C'est cher.", answer: "たかいです。", wrong: ["たかくないです。","たかかったです。"] },
      { fr: "Ce n'est pas cher.", answer: "たかくないです。", wrong: ["たかいじゃないです。","たかかったです。"] },
      { fr: "C'était bon (délicieux).", answer: "おいしかったです。", wrong: ["おいしいでした。","おいしくないです。"] },
      { fr: "Ce n'était pas grand.", answer: "おおきくなかったです。", wrong: ["おおきくないです。","おおきいじゃなかったです。"] },
      { fr: "C'était bien.", answer: "よかったです。", wrong: ["いかったです。","いいでした。"] },
      { fr: "C'est calme.", answer: "しずかです。", wrong: ["しずかいです。","しずかでした。"] },
      { fr: "Ce n'est pas calme.", answer: "しずかじゃないです。", wrong: ["しずかくないです。","しずかです。"] },
      { fr: "C'était joli.", answer: "きれいでした。", wrong: ["きれかったです。","きれいです。"] },
      { fr: "Je suis en forme.", answer: "げんきです。", wrong: ["げんきいです。","げんきでした。"] },
      { fr: "Ce chat est petit.", answer: "このねこはちいさいです。", wrong: ["このねこはおおきいです。","このねこはちいさかったです。"] },
      ],
    },
    morePractice: { href: "/exercices/conjugaison?forme=n5-i-adjective", label: "Plus d'exercices sur les adjectifs" },
    keyPoints: [
      "Adjectif en い : 高い → 高くない (négatif), 高かった (passé).",
      "Adjectif en な : 静か → 静かじゃない, 静かでした.",
      "Piège : いい devient よくない et よかった.",
    ],
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
    keyPoints: [
      "Un kanji a un sens et souvent plusieurs lectures.",
      "Les jours de la semaine : élément + 曜日 (月曜日 = lundi).",
      "人 après un pays donne la nationalité : フランス人.",
    ],
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
      questions: [
        { fr: "Comment s'appelle la personne qui écrit ?", answer: "Léa", wrong: ["Yuki", "Emma", "Sakura"] },
        { fr: "Quelle est sa nationalité ?", answer: "Française", wrong: ["Japonaise", "Anglaise", "Chinoise"] },
        {
          fr: "Qu'a-t-elle fait dimanche ?",
          answer: "Elle a vu un film avec des amis.",
          wrong: ["Elle a mangé des sushis avec des amis.", "Elle a lu un livre à la maison.", "Elle est allée au Japon."],
        },
        { fr: "Comment était le film ?", answer: "Très intéressant", wrong: ["Un peu ennuyeux", "Trop long", "Très triste"] },
        {
          fr: "Que veut-elle faire l'année prochaine ?",
          answer: "Aller au Japon",
          wrong: ["Apprendre le chinois", "Voir un film", "Aller en France"],
        },
      ],
    },
    keyPoints: [
      "Tu sais lire une présentation, des goûts, un souvenir et une envie.",
      "La suite : colle de vraies répliques dans l'analyse et révise tes mots chaque jour.",
    ],
    goal: 4,
  },
];

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.id === id);
}

export const LESSON_IDS = new Set(LESSONS.map((lesson) => lesson.id));

// Romaji d'un exemple ou d'un mot : celui écrit à la main, sinon converti
// depuis la lecture en kana (suffisant pour un mot seul).
export function romajiOf(example: LessonExample): string {
  return example.romaji ?? toRomaji(example.reading ?? example.ja);
}
