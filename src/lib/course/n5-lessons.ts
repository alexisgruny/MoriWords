import type { Lesson } from "@/lib/course/lessons";
import { N5_EXTRA_LESSONS } from "@/lib/course/n5-lessons-extra";

// Cours N5 : après le parcours débutant, la grammaire N5 en profondeur.
// Chaque leçon : règle en encadré (formula), exemples où la partie étudiée
// est en couleur ([…]), pièges (tip), vocabulaire, kanji, puis deux
// étapes d'exercice : QCM, puis phrases à écrire en japonais. Tout est
// écrit à la main (aucun appel à Claude) et vérifié par courses.test.ts.
const CORE_LESSONS: Omit<Lesson, "number">[] = [
  {
    id: "n5-il-y-a",
    title: "Il y a… : あります et います",
    minutes: 12,
    summary: "Dire qu'une chose ou une personne se trouve quelque part, et situer avec dessus, dessous, dedans, devant, derrière.",
    sections: [
      {
        title: "Objets ou êtres vivants",
        formula: "Nom + が + [あります] (objet)　／　Nom + が + [います] (personne, animal)",
        paragraphs: [
          "Pour dire qu'une chose **existe** ou se trouve quelque part, le japonais a deux verbes : [あります] pour les objets et les plantes, [います] pour les personnes et les animaux.",
          "Ce qui existe est marqué par [が]. Au négatif : [ありません] et [いません] (souvent avec [は] : 猫はいません).",
        ],
        examples: [
          { ja: "机の上に本[があります]。", reading: "つくえのうえにほん[があります]。", romaji: "Tsukue no ue ni hon [ga arimasu].", fr: "Il y a un livre sur le bureau." },
          { ja: "公園に子ども[がいます]。", reading: "こうえんにこども[がいます]。", romaji: "Kouen ni kodomo [ga imasu].", fr: "Il y a des enfants dans le parc." },
          { ja: "部屋に猫は[いません]。", reading: "へやにねこは[いません]。", romaji: "Heya ni neko wa [imasen].", fr: "Il n'y a pas de chat dans la chambre." },
        ],
        tip: "Une personne ou un animal prend toujours [います], même immobile : 犬がいます, jamais 犬があります.",
      },
      {
        title: "Situer : dessus, dessous, dedans…",
        formula: "Lieu + [の上・の下・の中・の前・の後ろ] + に + chose + が あります",
        paragraphs: [
          "Pour situer, on dit littéralement « le dessus **de** A » : A [の上] (sur), A [の下] (sous), A [の中] (dans), A [の前] (devant), A [の後ろ] (derrière).",
          "Le lieu vient en premier, suivi de [に], puis ce qui s'y trouve.",
        ],
        examples: [
          { ja: "かばん[の中に]財布があります。", reading: "かばん[のなかに]さいふがあります。", romaji: "Kaban [no naka ni] saifu ga arimasu.", fr: "Il y a un portefeuille dans le sac." },
          { ja: "駅[の前に]銀行があります。", reading: "えき[のまえに]ぎんこうがあります。", romaji: "Eki [no mae ni] ginkou ga arimasu.", fr: "Il y a une banque devant la gare." },
          { ja: "椅子[の下に]犬がいます。", reading: "いす[のしたに]いぬがいます。", romaji: "Isu [no shita ni] inu ga imasu.", fr: "Il y a un chien sous la chaise." },
        ],
        tip: "L'ordre est inversé par rapport au français : on dit « la gare, son devant » (駅の前), pas « devant la gare ».",
      },
      {
        title: "À droite, à gauche, à côté — et poser la question",
        formula: "[右・左・隣・近く]　／　X は[どこにありますか]　／　lieu に[何がありますか]",
        paragraphs: [
          "On situe de la même façon avec [右] (みぎ, droite), [左] (ひだり, gauche), [隣] (となり, juste à côté) et [近く] (ちかく, près de) : 銀行の[隣]に.",
          "Deux questions à ne pas confondre : « où est X ? » → X は[どこにありますか] ; « qu'y a-t-il à tel endroit ? » → lieu に[何がありますか].",
        ],
        examples: [
          { ja: "駅の[右]に郵便局があります。", reading: "えきの[みぎ]にゆうびんきょくがあります。", romaji: "Eki no [migi] ni yuubinkyoku ga arimasu.", fr: "Il y a une poste à droite de la gare." },
          { ja: "トイレは[どこにありますか]。", reading: "トイレは[どこにありますか]。", romaji: "Toire wa [doko ni arimasu ka].", fr: "Où sont les toilettes ?" },
          { ja: "箱の中に[何がありますか]。", reading: "はこのなかに[なにがありますか]。", romaji: "Hako no naka ni [nani ga arimasu ka].", fr: "Qu'y a-t-il dans la boîte ?" },
          { ja: "大きい[木]の下で休みましょう。", reading: "おおきい[き]のしたでやすみましょう。", romaji: "Ookii [ki] no shita de yasumimashou.", fr: "Reposons-nous sous le grand arbre." },
        ],
        tip: "Pour une chose déjà connue, on la met en thème avec [は] : 本は机の上にあります (le livre, il est sur le bureau).",
      },
    ],
    vocabulary: [
      { ja: "上", reading: "うえ", fr: "dessus" },
      { ja: "下", reading: "した", fr: "dessous" },
      { ja: "中", reading: "なか", fr: "intérieur, dedans" },
      { ja: "前", reading: "まえ", fr: "devant, avant" },
      { ja: "後ろ", reading: "うしろ", fr: "derrière" },
      { ja: "机", reading: "つくえ", fr: "bureau (meuble)" },
      { ja: "右", reading: "みぎ", fr: "droite" },
      { ja: "左", reading: "ひだり", fr: "gauche" },
      { ja: "隣", reading: "となり", fr: "à côté, voisin" },
    ],
    kanji: ["上", "下", "中", "前", "後", "左", "右", "木"],
    keyPoints: [
      "Objet : [があります] ; personne ou animal : [がいます].",
      "Situer : lieu + [の上 / の下 / の中 / の前 / の後ろ] + に.",
      "Négatif : [ありません] / [いません].",
      "« Où est X ? » : X は[どこにありますか] ; « qu'y a-t-il ? » : [何がありますか].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Il y a un chat sous la table.", answer: "机の下に猫がいます。", wrong: ["机の下に猫があります。", "机の上に猫がいます。"] },
        { fr: "Il y a un livre dans le sac.", answer: "かばんの中に本があります。", wrong: ["かばんの中に本がいます。", "本の中にかばんがあります。"] },
        { fr: "Il y a une banque devant la gare.", answer: "駅の前に銀行があります。", wrong: ["駅の後ろに銀行があります。", "銀行の前に駅があります。"] },
        { fr: "Il y a des enfants dans le parc.", answer: "公園に子どもがいます。", wrong: ["公園に子どもがあります。", "子どもに公園がいます。"] },
        { fr: "Il n'y a pas d'argent dans le portefeuille.", answer: "財布の中にお金がありません。", wrong: ["財布の中にお金がいません。", "財布の中にお金があります。"] },
        { fr: "Il y a un chien derrière la maison.", answer: "家の後ろに犬がいます。", wrong: ["家の前に犬がいます。", "家の後ろに犬があります。"] },
        { fr: "Il y a une photo sur le bureau.", answer: "机の上に写真があります。", wrong: ["机の下に写真があります。", "机の上に写真がいます。"] },
        { fr: "Le professeur est dans la salle de classe.", answer: "先生は教室にいます。", wrong: ["先生は教室にあります。", "教室は先生にいます。"] },
        { fr: "Il y a une poste à gauche de la gare.", answer: "駅の左に郵便局があります。", wrong: ["駅の右に郵便局があります。", "郵便局の左に駅があります。"] },
        { fr: "Où est la gare ?", answer: "駅はどこにありますか。", wrong: ["駅はどこにいますか。", "駅に何がありますか。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Il y a un chat.", answers: ["猫がいます。", "ねこがいます。"] },
        { fr: "Il y a un livre sur le bureau.", answers: ["机の上に本があります。", "つくえのうえにほんがあります。"] },
        { fr: "Il n'y a pas de chien.", answers: ["犬はいません。", "いぬはいません。", "犬がいません。", "いぬがいません。"] },
        { fr: "Il y a une banque devant la gare.", answers: ["駅の前に銀行があります。", "えきのまえにぎんこうがあります。"] },
        { fr: "Il y a un portefeuille dans le sac.", answers: ["かばんの中に財布があります。", "かばんのなかにさいふがあります。"] },
        { fr: "Il y a des enfants dans le parc.", answers: ["公園に子どもがいます。", "こうえんにこどもがいます。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-aru-iru", label: "Plus de phrases avec あります / います" },
  },
  {
    id: "n5-forme-te",
    title: "La forme en て et ～てください",
    minutes: 15,
    summary: "La forme la plus utile du japonais : la fabriquer pour chaque verbe, puis demander poliment.",
    sections: [
      {
        title: "Fabriquer la forme en て",
        formula: "う・つ・る → [って]　む・ぶ・ぬ → [んで]　く → [いて]　ぐ → [いで]　す → [して]",
        paragraphs: [
          "La **forme en て** sert partout : demander, enchaîner deux actions, dire « en train de ». Elle se fabrique à partir du verbe au dictionnaire.",
          "Verbes en る du groupe 2 (食べる, 見る) : on remplace る par [て] → 食べて, 見て.",
          "Verbes du groupe 1 : tout dépend de la dernière syllabe. う・つ・る → [って] (買う → 買って), む・ぶ・ぬ → [んで] (読む → 読んで), く → [いて] (書く → 書いて), ぐ → [いで] (泳ぐ → 泳いで), す → [して] (話す → 話して).",
          "Irréguliers : する → [して], 来る → [来て].",
        ],
        examples: [
          { ja: "食べる → 食べ[て]", reading: "たべる → たべ[て]", romaji: "taberu → tabe[te]", fr: "manger" },
          { ja: "買う → 買[って]", reading: "かう → か[って]", romaji: "kau → ka[tte]", fr: "acheter" },
          { ja: "読む → 読[んで]", reading: "よむ → よ[んで]", romaji: "yomu → yo[nde]", fr: "lire" },
          { ja: "書く → 書[いて]", reading: "かく → か[いて]", romaji: "kaku → ka[ite]", fr: "écrire" },
          { ja: "話す → 話[して]", reading: "はなす → はな[して]", romaji: "hanasu → hana[shite]", fr: "parler" },
        ],
        tip: "行く est l'exception du groupe en く : [行って], jamais 行いて.",
      },
      {
        title: "Demander poliment : ～てください",
        formula: "Verbe en て + [ください]",
        paragraphs: ["Pour demander à quelqu'un de faire quelque chose : forme en て + [ください]. C'est poli, on peut l'utiliser avec un inconnu ou un professeur."],
        examples: [
          { ja: "ここに名前を書[いてください]。", reading: "ここになまえをか[いてください]。", romaji: "Koko ni namae o ka[ite kudasai].", fr: "Écrivez votre nom ici, s'il vous plaît." },
          { ja: "ゆっくり話[してください]。", reading: "ゆっくりはな[してください]。", romaji: "Yukkuri hana[shite kudasai].", fr: "Parlez lentement, s'il vous plaît." },
          { ja: "ちょっと待[ってください]。", reading: "ちょっとま[ってください]。", romaji: "Chotto ma[tte kudasai].", fr: "Attendez un instant, s'il vous plaît." },
        ],
        tip: "Ne confonds pas 待って (attendre) et 持って (tenir, porter) : seul le premier kanji change.",
      },
      {
        title: "Enchaîner des actions : ～て、～て",
        formula: "Verbe en [て]、verbe en [て]、… + dernier verbe (qui porte le temps)",
        paragraphs: [
          "La forme en て sert aussi à **enchaîner** des actions dans l'ordre : « je me lève, je mange, puis je sors ». Seul le **dernier** verbe porte le temps et la politesse.",
          "Ainsi, 起き[て]、食べ[て]、出かけました = je me suis levé·e, j'ai mangé, puis je suis sorti·e.",
        ],
        examples: [
          { ja: "朝起き[て]、シャワーを浴び[て]、会社に行きます。", reading: "あさおき[て]、シャワーをあび[て]、かいしゃにいきます。", romaji: "Asa oki[te], shawaa o abi[te], kaisha ni ikimasu.", fr: "Le matin, je me lève, je prends une douche et je vais au travail." },
          { ja: "デパートに行[って]、靴を買いました。", reading: "デパートにい[って]、くつをかいました。", romaji: "Depaato ni i[tte], kutsu o kaimashita.", fr: "Je suis allé·e au grand magasin et j'ai acheté des chaussures." },
        ],
        tip: "Pas de passé au milieu : 行きました、買いました n'enchaîne pas ; on dit [行って]、買いました.",
      },
    ],
    vocabulary: [
      { ja: "名前", reading: "なまえ", fr: "nom" },
      { ja: "窓", reading: "まど", fr: "fenêtre" },
      { ja: "開ける", reading: "あける", fr: "ouvrir" },
      { ja: "閉める", reading: "しめる", fr: "fermer" },
      { ja: "待つ", reading: "まつ", fr: "attendre" },
      { ja: "教える", reading: "おしえる", fr: "enseigner, indiquer" },
    ],
    kanji: ["名", "書", "話", "読"],
    keyPoints: [
      "う・つ・る → [って], む・ぶ・ぬ → [んで], く → [いて], ぐ → [いで], す → [して].",
      "Groupe 2 : る → [て] ; する → [して], 来る → [来て], 行く → [行って].",
      "Demande polie : forme en て + [ください].",
      "Enchaîner : 起き[て]、食べ[て]、出かけます (le temps est à la fin).",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Attendez un instant, s'il vous plaît.", answer: "ちょっと待ってください。", wrong: ["ちょっと待ちてください。", "ちょっと待んでください。"] },
        { fr: "Écrivez votre nom ici.", answer: "ここに名前を書いてください。", wrong: ["ここに名前を書きてください。", "ここに名前を書ってください。"] },
        { fr: "Lisez ce livre.", answer: "この本を読んでください。", wrong: ["この本を読みてください。", "この本を読ってください。"] },
        { fr: "Ouvrez la fenêtre, s'il vous plaît.", answer: "窓を開けてください。", wrong: ["窓を開けってください。", "窓を開けんでください。"] },
        { fr: "Parlez lentement.", answer: "ゆっくり話してください。", wrong: ["ゆっくり話いてください。", "ゆっくり話ってください。"] },
        { fr: "Allez-y, s'il vous plaît.", answer: "行ってください。", wrong: ["行いてください。", "行んでください。"] },
        { fr: "Venez demain.", answer: "明日来てください。", wrong: ["明日来ってください。", "明日来りてください。"] },
        { fr: "Indiquez-moi le chemin, s'il vous plaît.", answer: "道を教えてください。", wrong: ["道を教えってください。", "道を教えいてください。"] },
        { fr: "Je suis allé·e à la gare et j'ai pris le train.", answer: "駅に行って、電車に乗りました。", wrong: ["駅に行きて、電車に乗りました。", "駅に行った、電車に乗りました。"] },
        { fr: "Je me lève et je bois un café.", answer: "起きて、コーヒーを飲みます。", wrong: ["起きって、コーヒーを飲みます。", "起きんで、コーヒーを飲みます。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Attendez, s'il vous plaît.", answers: ["待ってください。", "まってください。"] },
        { fr: "Écrivez ici, s'il vous plaît.", answers: ["ここに書いてください。", "ここにかいてください。"] },
        { fr: "Fermez la fenêtre, s'il vous plaît.", answers: ["窓を閉めてください。", "まどをしめてください。"] },
        { fr: "Lisez, s'il vous plaît.", answers: ["読んでください。", "よんでください。"] },
        { fr: "Venez, s'il vous plaît.", answers: ["来てください。", "きてください。"] },
        { fr: "Parlez lentement, s'il vous plaît.", answers: ["ゆっくり話してください。", "ゆっくりはなしてください。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-te-kudasai", label: "Plus de phrases avec ～てください" },
  },
  {
    id: "n5-en-cours",
    title: "En ce moment, et pour durer : ～ている",
    minutes: 12,
    summary: "Dire ce qu'on est en train de faire, et décrire un état qui dure (habiter, savoir, être marié).",
    sections: [
      {
        title: "Une action en cours",
        formula: "Verbe en て + [います]",
        paragraphs: [
          "Forme en て + [います] : l'action est **en train de se faire**. 読んでいます = je suis en train de lire.",
          "À l'oral, le い disparaît souvent : 読んでる, 待ってる.",
        ],
        examples: [
          { ja: "今、本を読[んでいます]。", reading: "いま、ほんをよ[んでいます]。", romaji: "Ima, hon o yo[nde imasu].", fr: "Je suis en train de lire un livre." },
          { ja: "雨が降[っています]。", reading: "あめがふ[っています]。", romaji: "Ame ga fu[tte imasu].", fr: "Il pleut (en ce moment)." },
          { ja: "友達を待[っています]。", reading: "ともだちをま[っています]。", romaji: "Tomodachi o ma[tte imasu].", fr: "J'attends un ami." },
        ],
      },
      {
        title: "Un état qui dure",
        formula: "住む → [住んでいます]　知る → [知っています]",
        paragraphs: ["Avec certains verbes, ～ています décrit un **état** et non une action : 住む (habiter) → 住んでいます (j'habite), 知る (savoir, connaître) → 知っています (je sais), 結婚する → 結婚しています (je suis marié·e)."],
        examples: [
          { ja: "東京に住[んでいます]。", reading: "とうきょうにす[んでいます]。", romaji: "Toukyou ni su[nde imasu].", fr: "J'habite à Tokyo." },
          { ja: "その人を知[っています]。", reading: "そのひとをし[っています]。", romaji: "Sono hito o shi[tte imasu].", fr: "Je connais cette personne." },
        ],
        tip: "Le négatif de 知っています est [知りません], pas 知っていません.",
      },
      {
        title: "Habitudes et métier",
        formula: "毎朝 + verbe en て + [います]　／　lieu + [で] + 働いています",
        paragraphs: [
          "～ています décrit aussi une **habitude** qui dure en ce moment de ta vie : 毎朝走[っています] (je cours tous les matins).",
          "Pour dire où l'on travaille ou ce qu'on étudie : 銀行[で]働いています, 大学[で]日本語を勉強しています.",
        ],
        examples: [
          { ja: "毎朝、公園を走[っています]。", reading: "まいあさ、こうえんをはし[っています]。", romaji: "Maiasa, kouen o hashi[tte imasu].", fr: "Je cours au parc tous les matins." },
          { ja: "姉は銀行[で]働いています。", reading: "あねはぎんこう[で]はたらいています。", romaji: "Ane wa ginkou [de] hataraite imasu.", fr: "Ma grande sœur travaille dans une banque." },
        ],
        tip: "Le lieu de travail prend [で] (on y fait une action), pas に : 銀行で働いています.",
      },
    ],
    vocabulary: [
      { ja: "今", reading: "いま", fr: "maintenant" },
      { ja: "知る", reading: "しる", fr: "savoir, connaître" },
      { ja: "住む", reading: "すむ", fr: "habiter" },
      { ja: "働く", reading: "はたらく", fr: "travailler" },
      { ja: "電話", reading: "でんわ", fr: "téléphone" },
      { ja: "結婚", reading: "けっこん", fr: "mariage" },
    ],
    kanji: ["今", "雨", "電", "車"],
    keyPoints: [
      "En train de : forme en て + [います] (読んでいます).",
      "État qui dure : [住んでいます], [知っています], [結婚しています].",
      "« Je ne sais pas » : [知りません].",
      "Habitude, métier : 毎朝走[っています], 銀行[で]働いています.",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Il neige (en ce moment).", answer: "雪が降っています。", wrong: ["雪が降ります。", "雪が降ってください。"] },
        { fr: "Je suis en train de manger.", answer: "今、食べています。", wrong: ["今、食べてください。", "今、食べました。"] },
        { fr: "J'habite à Osaka.", answer: "大阪に住んでいます。", wrong: ["大阪に住みます。", "大阪に住んでください。"] },
        { fr: "Je ne sais pas.", answer: "知りません。", wrong: ["知っていません。", "知らないています。"] },
        { fr: "Mon grand frère est en train de téléphoner.", answer: "兄は電話をしています。", wrong: ["兄は電話をします。", "兄は電話をしてください。"] },
        { fr: "Je connais ce restaurant.", answer: "そのレストランを知っています。", wrong: ["そのレストランを知ります。", "そのレストランを知っていません。"] },
        { fr: "Il pleut depuis ce matin.", answer: "朝から雨が降っています。", wrong: ["朝から雨が降ります。", "朝まで雨が降ってください。"] },
        { fr: "J'attends le bus.", answer: "バスを待っています。", wrong: ["バスを待ちています。", "バスを待んでいます。"] },
        { fr: "Mon père travaille dans une banque.", answer: "父は銀行で働いています。", wrong: ["父は銀行に働いています。", "父は銀行で働いてください。"] },
        { fr: "J'apprends le japonais à l'université.", answer: "大学で日本語を勉強しています。", wrong: ["大学に日本語を勉強しています。", "大学で日本語を勉強してもいいです。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Il pleut.", answers: ["雨が降っています。", "あめがふっています。"] },
        { fr: "Je suis en train de lire.", answers: ["読んでいます。", "よんでいます。"] },
        { fr: "J'habite à Paris.", answers: ["パリに住んでいます。", "パリにすんでいます。"] },
        { fr: "Je sais (je connais).", answers: ["知っています。", "しっています。"] },
        { fr: "Je ne sais pas.", answers: ["知りません。", "しりません。"] },
        { fr: "J'attends un ami.", answers: ["友達を待っています。", "ともだちをまっています。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-te-iru", label: "Plus de phrases avec ～ている" },
  },
  {
    id: "n5-permis-interdit",
    title: "Permis ou interdit : ～てもいい, ～ないでください",
    minutes: 12,
    summary: "Demander la permission (« je peux ? »), et demander de ne pas faire quelque chose.",
    sections: [
      {
        title: "Demander la permission",
        formula: "Verbe en て + [もいいです] (+ か pour demander)",
        paragraphs: [
          "Forme en て + [もいいです] : « on peut, c'est permis ». Avec か à la fin, c'est la question « est-ce que je peux… ? ».",
          "Pour dire oui : はい、いいですよ. Pour refuser poliment : すみません、ちょっと…",
        ],
        examples: [
          { ja: "ここで写真を撮[ってもいいですか]。", reading: "ここでしゃしんをと[ってもいいですか]。", romaji: "Koko de shashin o to[tte mo ii desu ka].", fr: "Est-ce que je peux prendre des photos ici ?" },
          { ja: "もう帰[ってもいいです]。", reading: "もうかえ[ってもいいです]。", romaji: "Mou kae[tte mo ii desu].", fr: "Tu peux rentrer maintenant." },
        ],
      },
      {
        title: "Demander de ne pas faire",
        formula: "Verbe en ない + [でください]",
        paragraphs: [
          "Forme en ない + [でください] : « ne… pas, s'il vous plaît ».",
          "La forme en ない : groupe 1, la dernière syllabe passe en -a puis ない (書く → 書かない, 走る → 走らない, 買う → 買わない) ; groupe 2, る → ない (食べる → 食べない) ; する → しない, 来る → 来ない.",
        ],
        examples: [
          { ja: "ここで走[らないでください]。", reading: "ここではし[らないでください]。", romaji: "Koko de hashi[ranaide kudasai].", fr: "Ne courez pas ici, s'il vous plaît." },
          { ja: "心配し[ないでください]。", reading: "しんぱいし[ないでください]。", romaji: "Shinpai shi[naide kudasai].", fr: "Ne vous inquiétez pas." },
        ],
        tip: "Les verbes en う donnent わない, pas あない : 買う → [買わない].",
      },
      {
        title: "Interdiction ferme : ～てはいけません",
        formula: "Verbe en て + [はいけません]",
        paragraphs: [
          "[～てはいけません] : « il est interdit de… ». C'est plus **ferme** que ないでください : on l'entend pour des règles, sur des panneaux, ou de la part d'un parent ou d'un professeur.",
          "À la question ～てもいいですか, on peut répondre いいえ、～てはいけません, mais c'est très direct ; entre adultes, on dit plutôt すみません、ちょっと…",
        ],
        examples: [
          { ja: "ここでたばこを吸[ってはいけません]。", reading: "ここでたばこをす[ってはいけません]。", romaji: "Koko de tabako o su[tte wa ikemasen].", fr: "Il est interdit de fumer ici." },
          { ja: "美術館で写真を撮[ってはいけません]。", reading: "びじゅつかんでしゃしんをと[ってはいけません]。", romaji: "Bijutsukan de shashin o to[tte wa ikemasen].", fr: "Il est interdit de prendre des photos dans le musée." },
        ],
        tip: "Dans ～てはいけません, le は se prononce « wa ».",
      },
    ],
    vocabulary: [
      { ja: "写真", reading: "しゃしん", fr: "photo" },
      { ja: "撮る", reading: "とる", fr: "prendre (une photo)" },
      { ja: "走る", reading: "はしる", fr: "courir" },
      { ja: "入る", reading: "はいる", fr: "entrer" },
      { ja: "休む", reading: "やすむ", fr: "se reposer" },
      { ja: "座る", reading: "すわる", fr: "s'asseoir" },
    ],
    kanji: ["休", "入", "出", "先", "生"],
    keyPoints: [
      "Permission : forme en て + [もいいですか].",
      "Interdiction polie : forme en ない + [でください].",
      "Forme en ない : 書く → [書かない], 買う → [買わない], 食べる → [食べない].",
      "Interdiction ferme : forme en て + [はいけません].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Est-ce que je peux m'asseoir ici ?", answer: "ここに座ってもいいですか。", wrong: ["ここに座らないでください。", "ここに座ってください。"] },
        { fr: "Ne fumez pas ici, s'il vous plaît.", answer: "ここでたばこを吸わないでください。", wrong: ["ここでたばこを吸ってもいいです。", "ここでたばこを吸あないでください。"] },
        { fr: "Tu peux manger.", answer: "食べてもいいです。", wrong: ["食べないでください。", "食べてもいいですか。"] },
        { fr: "N'entrez pas, s'il vous plaît.", answer: "入らないでください。", wrong: ["入ってください。", "入りないでください。"] },
        { fr: "Puis-je ouvrir la fenêtre ?", answer: "窓を開けてもいいですか。", wrong: ["窓を開けないでください。", "窓を開けってもいいですか。"] },
        { fr: "Ne vous inquiétez pas.", answer: "心配しないでください。", wrong: ["心配してください。", "心配しなくてください。"] },
        { fr: "Est-ce que je peux me reposer ?", answer: "休んでもいいですか。", wrong: ["休みてもいいですか。", "休まないでください。"] },
        { fr: "Ne parlez pas en classe, s'il vous plaît.", answer: "教室で話さないでください。", wrong: ["教室で話してもいいです。", "教室で話しないでください。"] },
        { fr: "Il est interdit d'entrer ici.", answer: "ここに入ってはいけません。", wrong: ["ここに入ってもいいです。", "ここに入りてはいけません。"] },
        { fr: "Il ne faut pas courir dans le couloir.", answer: "廊下で走ってはいけません。", wrong: ["廊下で走ってください。", "廊下で走ってはいいです。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Est-ce que je peux entrer ?", answers: ["入ってもいいですか。", "はいってもいいですか。"] },
        { fr: "N'entrez pas, s'il vous plaît.", answers: ["入らないでください。", "はいらないでください。"] },
        { fr: "Tu peux rentrer.", answers: ["帰ってもいいです。", "かえってもいいです。"] },
        { fr: "Ne courez pas, s'il vous plaît.", answers: ["走らないでください。", "はしらないでください。"] },
        { fr: "Est-ce que je peux prendre une photo ?", answers: ["写真を撮ってもいいですか。", "しゃしんをとってもいいですか。"] },
        { fr: "Ne vous inquiétez pas.", answers: ["心配しないでください。", "しんぱいしないでください。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-te-mo-ii", label: "Plus de phrases avec ～てもいい" },
  },
  {
    id: "n5-comparer",
    title: "Comparer : より, のほうが, いちばん",
    minutes: 12,
    summary: "Dire que B est plus… que A, demander lequel on préfère, et dire « le plus ».",
    sections: [
      {
        title: "Plus… que : より et のほうが",
        formula: "A [より] B [のほうが] + adjectif",
        paragraphs: [
          "A [より] B [のほうが] + adjectif = « B est plus … que A ». より se place juste après ce qui est **moins** fort.",
          "Pour demander lequel des deux : A と B と、[どちらが] + adjectif + ですか.",
        ],
        examples: [
          { ja: "電車[より]バス[のほうが]安いです。", reading: "でんしゃ[より]バス[のほうが]やすいです。", romaji: "Densha [yori] basu [no hou ga] yasui desu.", fr: "Le bus est moins cher que le train." },
          { ja: "夏[より]冬[のほうが]好きです。", reading: "なつ[より]ふゆ[のほうが]すきです。", romaji: "Natsu [yori] fuyu [no hou ga] suki desu.", fr: "Je préfère l'hiver à l'été." },
          { ja: "犬と猫と、[どちらが]好きですか。", reading: "いぬとねこと、[どちらが]すきですか。", romaji: "Inu to neko to, [dochira ga] suki desu ka.", fr: "Tu préfères les chiens ou les chats ?" },
        ],
        tip: "より suit ce qui est le **moins** : 電車より安い = « moins cher que le train ».",
      },
      {
        title: "Le plus : いちばん",
        formula: "Groupe + の中で + A が [いちばん] + adjectif",
        paragraphs: ["[いちばん] (一番, « numéro un ») veut dire « le plus ». Le groupe dans lequel on compare se dit avec の中で (« parmi ») ou で (« dans »)."],
        examples: [
          { ja: "果物の中で、りんごが[いちばん]好きです。", reading: "くだもののなかで、りんごが[いちばん]すきです。", romaji: "Kudamono no naka de, ringo ga [ichiban] suki desu.", fr: "Parmi les fruits, c'est la pomme que je préfère." },
          { ja: "富士山は日本で[いちばん]高い山です。", reading: "ふじさんはにほんで[いちばん]たかいやまです。", romaji: "Fujisan wa Nihon de [ichiban] takai yama desu.", fr: "Le mont Fuji est la plus haute montagne du Japon." },
        ],
      },
      {
        title: "Nord, sud, est, ouest : comparer des lieux",
        formula: "[北] nord　[南] sud　[東] est　[西] ouest",
        paragraphs: [
          "Les quatre points cardinaux sont des kanji N5 très fréquents : [北] (きた), [南] (みなみ), [東] (ひがし), [西] (にし). On les retrouve dans les noms : 東京 (la capitale de l'**est**), ou 南口 (la sortie sud d'une gare).",
          "Ils servent à situer et à comparer : [北]より[南]のほうが暖かいです.",
        ],
        examples: [
          { ja: "駅の[南口]で会いましょう。", reading: "えきの[みなみぐち]であいましょう。", romaji: "Eki no [minamiguchi] de aimashou.", fr: "Retrouvons-nous à la sortie sud de la gare." },
          { ja: "[北]より[南]のほうが暖かいです。", reading: "[きた]より[みなみ]のほうがあたたかいです。", romaji: "[Kita] yori [minami] no hou ga atatakai desu.", fr: "Il fait plus doux au sud qu'au nord." },
          { ja: "東京は日本の[東]にあります。", reading: "とうきょうはにほんの[ひがし]にあります。", romaji: "Toukyou wa Nihon no [higashi] ni arimasu.", fr: "Tokyo se trouve dans l'est du Japon." },
        ],
        tip: "Dans 東京, 東 se lit [とう] et non ひがし : un kanji a souvent plusieurs lectures selon le mot.",
      },
    ],
    vocabulary: [
      { ja: "夏", reading: "なつ", fr: "été" },
      { ja: "冬", reading: "ふゆ", fr: "hiver" },
      { ja: "果物", reading: "くだもの", fr: "fruit" },
      { ja: "高い", reading: "たかい", fr: "cher, haut" },
      { ja: "安い", reading: "やすい", fr: "bon marché" },
      { ja: "一番", reading: "いちばん", fr: "le plus, numéro un" },
      { ja: "北", reading: "きた", fr: "nord" },
      { ja: "南", reading: "みなみ", fr: "sud" },
      { ja: "東", reading: "ひがし", fr: "est" },
      { ja: "西", reading: "にし", fr: "ouest" },
    ],
    kanji: ["東", "西", "南", "北"],
    keyPoints: [
      "B est plus … que A : A [より] B [のほうが] + adjectif.",
      "Lequel des deux ? A と B と、[どちらが]… ですか.",
      "Le plus : [いちばん] + adjectif.",
      "Points cardinaux : [北] nord, [南] sud, [東] est, [西] ouest.",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Le bus est moins cher que le train.", answer: "電車よりバスのほうが安いです。", wrong: ["バスより電車のほうが安いです。", "電車よりバスのほうが高いです。"] },
        { fr: "Je préfère l'été à l'hiver.", answer: "冬より夏のほうが好きです。", wrong: ["夏より冬のほうが好きです。", "冬のほうが夏より好きです。"] },
        { fr: "Tu préfères le thé ou le café ?", answer: "お茶とコーヒーと、どちらが好きですか。", wrong: ["お茶よりコーヒーが好きですか。", "お茶とコーヒーと、どこが好きですか。"] },
        { fr: "De toute l'année, c'est le printemps que je préfère.", answer: "一年で、春がいちばん好きです。", wrong: ["一年で、春より好きです。", "一年で、春のほうが好きです。"] },
        { fr: "Tokyo est plus grand qu'Osaka.", answer: "大阪より東京のほうが大きいです。", wrong: ["東京より大阪のほうが大きいです。", "大阪より東京のほうが小さいです。"] },
        { fr: "Le mont Fuji est la plus haute montagne du Japon.", answer: "富士山は日本でいちばん高い山です。", wrong: ["富士山は日本より高い山です。", "富士山は日本のほうが高い山です。"] },
        { fr: "Le japonais est plus difficile que l'anglais.", answer: "英語より日本語のほうが難しいです。", wrong: ["日本語より英語のほうが難しいです。", "英語のほうが日本語より難しいです。"] },
        { fr: "Lequel est le plus cher ?", answer: "どちらが高いですか。", wrong: ["どちらより高いですか。", "どこが高いですか。"] },
        { fr: "Retrouvons-nous à la sortie est.", answer: "東口で会いましょう。", wrong: ["西口で会いましょう。", "東口を会いましょう。"] },
        { fr: "Il fait plus doux au sud qu'au nord.", answer: "北より南のほうが暖かいです。", wrong: ["南より北のほうが暖かいです。", "北より南のほうが寒いです。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Le bus est moins cher que le train.", answers: ["電車よりバスのほうが安いです。", "でんしゃよりバスのほうがやすいです。"] },
        { fr: "Je préfère les chats aux chiens.", answers: ["犬より猫のほうが好きです。", "いぬよりねこのほうがすきです。"] },
        { fr: "C'est le plus cher.", answers: ["いちばん高いです。", "一番高いです。", "いちばんたかいです。"] },
        { fr: "Tu préfères l'été ou l'hiver ?", answers: ["夏と冬と、どちらが好きですか。", "なつとふゆと、どちらがすきですか。"] },
        { fr: "Le japonais est plus difficile que le français.", answers: ["フランス語より日本語のほうが難しいです。", "フランスごよりにほんごのほうがむずかしいです。"] },
        { fr: "Je préfère l'hiver à l'été.", answers: ["夏より冬のほうが好きです。", "なつよりふゆのほうがすきです。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-yori-hou-ga", label: "Plus de phrases avec より / のほうが" },
  },
  {
    id: "n5-raison-proposer",
    title: "Donner une raison, proposer : から, ～ましょう, ～ませんか",
    minutes: 12,
    summary: "Expliquer pourquoi (« parce que »), proposer de faire quelque chose ensemble, inviter.",
    sections: [
      {
        title: "Parce que : から",
        formula: "Raison + [から]、conséquence",
        paragraphs: [
          "[から] après une phrase = « parce que ». La raison vient **avant**, la conséquence après : 忙しいですから、行きません (je suis occupé·e, donc je n'y vais pas).",
          "Pour répondre à « pourquoi ? » (どうして), on peut s'arrêter sur から : 忙しいですから.",
        ],
        examples: [
          { ja: "忙しいです[から]、行きません。", reading: "いそがしいです[から]、いきません。", romaji: "Isogashii desu [kara], ikimasen.", fr: "Je n'y vais pas parce que je suis occupé·e." },
          { ja: "雨です[から]、タクシーで帰ります。", reading: "あめです[から]、タクシーでかえります。", romaji: "Ame desu [kara], takushii de kaerimasu.", fr: "Comme il pleut, je rentre en taxi." },
        ],
        tip: "L'ordre est inverse du français « parce que » : la raison d'abord, puis から, puis ce qu'on fait.",
      },
      {
        title: "Proposer : ～ましょう et ～ませんか",
        formula: "Verbe en ます sans ます + [ましょう] / [ませんか]",
        paragraphs: [
          "[～ましょう] : « faisons… ! », quand on est d'accord pour le faire ensemble. [～ませんか] : « et si on… ? », une invitation plus douce qui laisse le choix.",
          "Pour accepter : いいですね ! Pour refuser poliment : すみません、ちょっと…",
        ],
        examples: [
          { ja: "一緒に食べ[ましょう]。", reading: "いっしょにたべ[ましょう]。", romaji: "Issho ni tabe[mashou].", fr: "Mangeons ensemble." },
          { ja: "映画を見に行き[ませんか]。", reading: "えいがをみにいき[ませんか]。", romaji: "Eiga o mi ni iki[masen ka].", fr: "Et si on allait voir un film ?" },
          { ja: "そろそろ帰り[ましょう]。", reading: "そろそろかえり[ましょう]。", romaji: "Sorosoro kaeri[mashou].", fr: "Rentrons, il est temps." },
        ],
        tip: "～ませんか ressemble à une négation, mais c'est une **invitation** : « tu ne voudrais pas… ? » = « et si on… ? ».",
      },
      {
        title: "Proposer son aide : ～ましょうか",
        formula: "Verbe en ます sans ます + [ましょうか]",
        paragraphs: [
          "[～ましょうか] : « voulez-vous que je… ? ». On **propose de faire soi-même** quelque chose pour l'autre : 窓を開け[ましょうか] (je vous ouvre la fenêtre ?).",
          "Il sert aussi à décider ensemble : 何時に会い[ましょうか] (à quelle heure on se voit ?).",
        ],
        examples: [
          { ja: "荷物を持ち[ましょうか]。", reading: "にもつをもち[ましょうか]。", romaji: "Nimotsu o mochi[mashou ka].", fr: "Je vous porte vos bagages ?" },
          { ja: "天気がいいですから、散歩し[ましょうか]。", reading: "てんきがいいですから、さんぽし[ましょうか]。", romaji: "Tenki ga ii desu kara, sanpo shi[mashou ka].", fr: "Il fait beau, on va se promener ?" },
        ],
        tip: "[ましょうか] (je le fais pour toi ?) n'est pas [ませんか] (et si tu venais avec moi ?).",
      },
    ],
    vocabulary: [
      { ja: "忙しい", reading: "いそがしい", fr: "occupé" },
      { ja: "一緒", reading: "いっしょ", fr: "ensemble (一緒に)" },
      { ja: "映画", reading: "えいが", fr: "film" },
      { ja: "暇", reading: "ひま", fr: "libre, disponible" },
      { ja: "どうして", reading: "どうして", fr: "pourquoi" },
      { ja: "病気", reading: "びょうき", fr: "malade, maladie" },
      { ja: "天気", reading: "てんき", fr: "temps (météo)" },
      { ja: "散歩", reading: "さんぽ", fr: "promenade" },
    ],
    kanji: ["天", "気"],
    keyPoints: [
      "Parce que : raison + [から]、conséquence.",
      "Faisons… ! : verbe sans ます + [ましょう].",
      "Et si on… ? : verbe sans ます + [ませんか] (une invitation, pas une négation).",
      "Je le fais pour toi ? : verbe sans ます + [ましょうか].",
    ],
    exercise: {
      kind: "lesson-qcm",
      questions: [
        { fr: "Comme il fait froid, je ferme la fenêtre.", answer: "寒いですから、窓を閉めます。", wrong: ["窓を閉めますから、寒いです。", "寒いですから、窓を開けます。"] },
        { fr: "Mangeons ensemble !", answer: "一緒に食べましょう。", wrong: ["一緒に食べませんでした。", "一緒に食べてもいいです。"] },
        { fr: "Et si on allait au café ?", answer: "喫茶店に行きませんか。", wrong: ["喫茶店に行きません。", "喫茶店に行ってください。"] },
        { fr: "Je ne bois pas d'alcool parce que je suis malade.", answer: "病気ですから、お酒を飲みません。", wrong: ["お酒を飲みませんから、病気です。", "病気ですから、お酒を飲みましょう。"] },
        { fr: "Et si on faisait une pause ?", answer: "休みませんか。", wrong: ["休みません。", "休みましたか。"] },
        { fr: "Allons-y, il est temps.", answer: "そろそろ行きましょう。", wrong: ["そろそろ行きました。", "そろそろ行きませんでした。"] },
        { fr: "Parce que je suis occupé·e.", answer: "忙しいですから。", wrong: ["忙しいですか。", "忙しくないです。"] },
        { fr: "Et si on regardait un film ce soir ?", answer: "今晩、映画を見ませんか。", wrong: ["今晩、映画を見ません。", "今晩、映画を見ましたか。"] },
        { fr: "Je vous aide ?", answer: "手伝いましょうか。", wrong: ["手伝いませんか。", "手伝いましたか。"] },
        { fr: "Il fait beau, allons nous promener.", answer: "天気がいいですから、散歩しましょう。", wrong: ["散歩しましょうから、天気がいいです。", "天気がいいですから、散歩しませんでした。"] },
      ],
    },
    goal: 7,
    writing: {
      goal: 4,
      questions: [
        { fr: "Mangeons !", answers: ["食べましょう。", "たべましょう。"] },
        { fr: "Et si on y allait ?", answers: ["行きませんか。", "いきませんか。"] },
        { fr: "Je suis occupé·e, donc je n'y vais pas.", answers: ["忙しいですから、行きません。", "いそがしいですから、いきません。"] },
        { fr: "Rentrons.", answers: ["帰りましょう。", "かえりましょう。"] },
        { fr: "Et si on buvait un thé ?", answers: ["お茶を飲みませんか。", "おちゃをのみませんか。"] },
        { fr: "Comme il pleut, je reste à la maison.", answers: ["雨ですから、家にいます。", "あめですから、いえにいます。"] },
      ],
    },
    morePractice: { href: "/exercices/grammaire?point=n5-mashou", label: "Plus de phrases avec ～ましょう" },
  },
  {
    id: "n5-bilan",
    title: "Bilan N5 : une semaine à Tokyo",
    minutes: 15,
    summary: "Un récit qui réutilise tout le cours N5, avec huit questions de compréhension, avant l'examen blanc.",
    sections: [
      { title: "Tu sais déjà lire ça", paragraphs: ["Ce récit reprend tout le cours : nombres et prix, heures et jours, particules, adjectifs, forme en て, ～ている, ～てから, ～たり, から, ～ませんか… Touche un mot pour voir son sens, écoute le texte, puis réponds aux questions.", "Ensuite, l'**examen blanc N5** (palier) te dira si tu es prêt·e pour le JLPT N5."] },
    ],
    keyPoints: [
      "Tu as vu l'essentiel de la grammaire du JLPT N5 et ses 79 kanji.",
      "Dernière étape : l'examen blanc N5 pour vérifier ton niveau, puis le cours N4.",
    ],
    exercise: {
      kind: "reading",
      text: "私の名前はエマです。フランス人で、今、東京の大学で日本語を勉強しています。毎朝七時半に起きて、朝ごはんを食べてから、電車で学校に行きます。学校は駅の北口の前にあります。クラスには学生が十二人います。先生はとても親切で、おもしろい人です。金曜日の午後、友達のゆきさんと買い物に行きました。デパートで白いかばんを見ました。三千八百円でした。ゆきさんは「高くないですね。買いませんか。」と言いました。でも、私はお金があまりありませんから、買いませんでした。そのあとで、二人で喫茶店に入って、ケーキを食べたり、写真を撮ったりしました。日曜日は天気が悪かったです。雨が降っていましたから、どこへも行きませんでした。家で本を読んだり、母に電話をかけたりしました。来月、両親が日本に来ます。早く会いたいです。",
      translation:
        "Je m'appelle Emma. Je suis française, et en ce moment j'étudie le japonais dans une université de Tokyo. Tous les matins, je me lève à 7 h 30, je prends mon petit-déjeuner, puis je vais à l'école en train. L'école se trouve devant la sortie nord de la gare. Il y a douze étudiants dans la classe. Le professeur est très gentil, et c'est quelqu'un d'amusant. Vendredi après-midi, je suis allée faire les courses avec mon amie Yuki. Au grand magasin, nous avons vu un sac blanc. Il coûtait 3 800 yens. Yuki a dit : « Ce n'est pas cher, hein. Et si tu l'achetais ? » Mais comme je n'avais pas beaucoup d'argent, je ne l'ai pas acheté. Après, nous sommes entrées toutes les deux dans un café, nous avons mangé des gâteaux, pris des photos, etc. Dimanche, il faisait mauvais. Comme il pleuvait, je ne suis allée nulle part. À la maison, j'ai lu, j'ai téléphoné à ma mère, etc. Le mois prochain, mes parents viennent au Japon. J'ai hâte de les voir.",
      questions: [
        { fr: "Que fait Emma à Tokyo ?", answer: "Elle étudie le japonais à l'université.", wrong: ["Elle travaille dans une banque.", "Elle enseigne le français.", "Elle est en vacances."] },
        { fr: "À quelle heure se lève-t-elle ?", answer: "À 7 h 30", wrong: ["À 7 h", "À 8 h 30", "À 6 h 30"] },
        { fr: "Où se trouve l'école ?", answer: "Devant la sortie nord de la gare", wrong: ["Derrière la sortie sud de la gare", "À côté de la poste", "Loin de la gare"] },
        { fr: "Combien d'étudiants y a-t-il dans la classe ?", answer: "Douze", wrong: ["Dix", "Vingt", "Deux"] },
        { fr: "Combien coûtait le sac blanc ?", answer: "3 800 yens", wrong: ["8 300 yens", "3 080 yens", "38 000 yens"] },
        { fr: "Pourquoi Emma n'a-t-elle pas acheté le sac ?", answer: "Elle n'avait pas beaucoup d'argent.", wrong: ["Il était trop cher pour Yuki.", "Il n'était pas joli.", "Le magasin était fermé."] },
        { fr: "Qu'a fait Emma dimanche ?", answer: "Elle a lu et téléphoné à sa mère.", wrong: ["Elle est allée au parc.", "Elle a fait les courses avec Yuki.", "Elle est allée au cinéma."] },
        { fr: "Qui vient au Japon le mois prochain ?", answer: "Ses parents", wrong: ["Yuki", "Son professeur", "Sa sœur"] },
      ],
    },
    goal: 6,
  },
];

// Le cours en quatre parties : des fondations (nombres, heure, particules)
// jusqu'au bilan. Ensemble, les leçons couvrent les 79 kanji N5.
export const N5_PARTS: { title: string; lessonIds: string[] }[] = [
  { title: "Les fondations", lessonIds: ["n5-nombres", "n5-heure-dates", "n5-questions", "n5-particules", "n5-il-y-a"] },
  { title: "Décrire et conjuguer", lessonIds: ["n5-adjectifs", "n5-forme-te", "n5-formes-simples", "n5-en-cours"] },
  { title: "Agir et interagir", lessonIds: ["n5-permis-interdit", "n5-avant-apres", "n5-envies", "n5-raison-proposer"] },
  { title: "Comparer, compter, lire", lessonIds: ["n5-comparer", "n5-compteurs", "n5-bilan"] },
];

const LESSONS_BY_ID = new Map([...CORE_LESSONS, ...N5_EXTRA_LESSONS].map((lesson) => [lesson.id, lesson]));

export const N5_LESSONS: Lesson[] = N5_PARTS.flatMap((part) => part.lessonIds).map((id, index) => {
  const lesson = LESSONS_BY_ID.get(id);
  if (!lesson) {
    throw new Error(`Leçon N5 introuvable : ${id}`);
  }
  return { ...lesson, number: index + 1 };
});
